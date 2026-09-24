// Link de assinatura da agenda (formato iCalendar .ics).
// GET /backend/v1/agenda/{chave}.ics — público, protegido pela chave secreta
// do usuário (users.agenda_token). Google Agenda, Outlook e o calendário do
// iPhone leem este endereço de tempos em tempos e mostram as vistorias da
// organização (de 6 meses atrás até 18 meses à frente).
// É só leitura: o que muda no Labora aparece no outro calendário na próxima
// atualização dele (o Google costuma levar algumas horas).
routerAdd('GET', '/backend/v1/agenda/{arquivo}', (e) => {
  const arquivo = String(e.request.pathValue('arquivo') || '')
  const chave = arquivo.replace(/\.ics$/i, '')
  if (chave.length < 32) return e.notFoundError('agenda não encontrada')

  let user = null
  try {
    user = $app.findFirstRecordByFilter('users', 'agenda_token = {:t}', { t: chave })
  } catch (_) {
    user = null
  }
  if (!user) return e.notFoundError('agenda não encontrada')

  let orgId = user.getString('organizacao_id')
  if (!orgId) {
    try {
      orgId = $app.findFirstRecordByFilter('organizacoes', 'dono_id = {:u}', { u: user.id }).id
    } catch (_) {
      orgId = ''
    }
  }
  if (!orgId) return e.notFoundError('agenda não encontrada')

  let nomeOrg = 'Labora Vistorias'
  try {
    nomeOrg = $app.findRecordById('organizacoes', orgId).getString('nome') || nomeOrg
  } catch (_) {}

  const pad = (n) => (n < 10 ? '0' + n : '' + n)
  const agora = new Date()
  const inicio = new Date(agora.getTime() - 183 * 86400000)
  const fim = new Date(agora.getTime() + 548 * 86400000)
  const iso = (d) => d.toISOString().replace('T', ' ')
  const carimbo =
    agora.getUTCFullYear() +
    pad(agora.getUTCMonth() + 1) +
    pad(agora.getUTCDate()) +
    'T' +
    pad(agora.getUTCHours()) +
    pad(agora.getUTCMinutes()) +
    pad(agora.getUTCSeconds()) +
    'Z'

  // Texto no padrão iCalendar: escapa \ ; , e quebra de linha; linhas até 75 bytes.
  const esc = (s) =>
    String(s || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n')
  const dobrar = (linha) => {
    const partes = []
    let resto = linha
    while (resto.length > 72) {
      partes.push(resto.slice(0, 72))
      resto = ' ' + resto.slice(72)
    }
    partes.push(resto)
    return partes.join('\r\n')
  }

  const vistorias = $app.findRecordsByFilter(
    'vistorias',
    'organizacao_id = {:o} && data_agendada >= {:i} && data_agendada <= {:f}',
    'data_agendada',
    2000,
    0,
    { o: orgId, i: iso(inicio), f: iso(fim) },
  )
  $app.expandRecords(
    vistorias,
    ['empresa_id', 'tipo_vistoria_id', 'responsavel_tecnico_id', 'checklists'],
    null,
  )

  const STATUS = {
    agendada: 'Agendada',
    em_andamento: 'Em andamento',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
  }

  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Labora Vistorias//Agenda//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:' + esc('Vistorias · ' + nomeOrg),
    'X-WR-TIMEZONE:America/Fortaleza',
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    'X-PUBLISHED-TTL:PT6H',
  ]

  for (const v of vistorias) {
    const data = v.getString('data_agendada').slice(0, 10) // AAAA-MM-DD
    if (data.length !== 10) continue
    const d0 = new Date(data + 'T12:00:00Z')
    const d1 = new Date(d0.getTime() + 86400000)
    const dia = (d) => d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate())

    const empresa = v.expandedOne('empresa_id')
    const nomeEmpresa = empresa
      ? empresa.getString('nome_fantasia') || empresa.getString('razao_social')
      : 'Empresa'
    const tipo = v.expandedOne('tipo_vistoria_id')
    let normas = tipo ? tipo.getString('nr_referencia') || tipo.getString('nome') : ''
    if (!normas) {
      const cks = v.expandedAll('checklists') || []
      normas = cks
        .map((c) => c.getString('nr_referencia') || c.getString('nome'))
        .filter((x) => !!x)
        .join(', ')
    }
    const rt = v.expandedOne('responsavel_tecnico_id')
    const nomeRt = rt ? rt.getString('nome') : v.getString('responsavel_tecnico_nome')
    const status = v.getString('status') || 'agendada'

    const descricao = [
      normas ? 'Normas: ' + normas : '',
      nomeRt ? 'Responsável técnico: ' + nomeRt : '',
      'Situação: ' + (STATUS[status] || status),
      empresa && empresa.getString('endereco') ? 'Endereço: ' + empresa.getString('endereco') : '',
    ]
      .filter((x) => !!x)
      .join('\n')

    linhas.push('BEGIN:VEVENT')
    linhas.push('UID:vistoria-' + v.id + '@laboravistorias')
    linhas.push('DTSTAMP:' + carimbo)
    linhas.push('DTSTART;VALUE=DATE:' + dia(d0))
    linhas.push('DTEND;VALUE=DATE:' + dia(d1))
    linhas.push(
      dobrar('SUMMARY:' + esc('Vistoria · ' + nomeEmpresa + (normas ? ' (' + normas + ')' : ''))),
    )
    linhas.push(dobrar('DESCRIPTION:' + esc(descricao)))
    if (empresa && empresa.getString('endereco'))
      linhas.push(dobrar('LOCATION:' + esc(empresa.getString('endereco'))))
    linhas.push('STATUS:' + (status === 'cancelada' ? 'CANCELLED' : 'CONFIRMED'))
    linhas.push('TRANSP:TRANSPARENT')
    linhas.push('END:VEVENT')
  }
  linhas.push('END:VCALENDAR')

  e.response.header().set('Content-Type', 'text/calendar; charset=utf-8')
  e.response.header().set('Cache-Control', 'no-cache')
  return e.string(200, linhas.join('\r\n') + '\r\n')
})
