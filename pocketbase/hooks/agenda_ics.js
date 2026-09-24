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
  // Dobra por bytes (acentos ocupam 2 bytes em UTF-8), sem quebrar caracteres.
  const bytes = (ch) => {
    const c = ch.codePointAt(0)
    return c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4
  }
  const dobrar = (linha) => {
    const partes = []
    let atual = ''
    let tam = 0
    for (const ch of linha) {
      const b = bytes(ch)
      if (tam + b > 73) {
        partes.push(atual)
        atual = ' '
        tam = 1
      }
      atual += ch
      tam += b
    }
    partes.push(atual)
    return partes.join('\r\n')
  }
  const utc = (dt) =>
    dt.getUTCFullYear() +
    pad(dt.getUTCMonth() + 1) +
    pad(dt.getUTCDate()) +
    'T' +
    pad(dt.getUTCHours()) +
    pad(dt.getUTCMinutes()) +
    '00Z'
  const fmtHora = (dt) => pad((dt.getUTCHours() + 21) % 24) + ':' + pad(dt.getUTCMinutes())

  // Endereço do app para o link "Abrir no app"
  let site = ''
  try {
    site = ($app.settings().meta.appURL || '').replace(/\/$/, '')
  } catch (_) {}
  if (!site || /localhost|127\.0\.0\.1/.test(site))
    site = (user.getString('agenda_app_url') || '').replace(/\/$/, '')

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
    ['empresa_id', 'tipo_vistoria_id', 'responsavel_tecnico_id', 'checklists', 'formularios'],
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
    const nomeNr = (c) => c.getString('nr_referencia') || c.getString('nome')
    const tipo = v.expandedOne('tipo_vistoria_id')
    const listaNormas = []
    if (tipo && nomeNr(tipo)) listaNormas.push(nomeNr(tipo))
    for (const c of v.expandedAll('checklists') || []) {
      const n = nomeNr(c)
      if (n && listaNormas.indexOf(n) < 0) listaNormas.push(n)
    }
    const normas = listaNormas.join(', ')
    const formularios = (v.expandedAll('formularios') || [])
      .map((f) => f.getString('nome'))
      .filter((x) => !!x)
      .join(', ')
    const rt = v.expandedOne('responsavel_tecnico_id')
    const nomeRt = rt ? rt.getString('nome') : v.getString('responsavel_tecnico_nome')
    const status = v.getString('status') || 'agendada'
    const local = v.getString('local_vistoria') || (empresa ? empresa.getString('endereco') : '')
    const contato = [v.getString('contato_local_nome'), v.getString('contato_local_telefone')]
      .filter((x) => !!x)
      .join(' · ')

    // Horário: "HH:MM" no fuso de Brasília (UTC-3). Sem horário = dia inteiro.
    const hora = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(v.getString('hora_inicio'))
    let ini = null
    let fimEv = null
    if (hora) {
      const [a, m, d] = data.split('-').map(Number)
      ini = new Date(Date.UTC(a, m - 1, d, Number(hora[1]) + 3, Number(hora[2])))
      const dur = v.getInt('duracao_min') || 120
      fimEv = new Date(ini.getTime() + dur * 60000)
    }

    const descricao = [
      ini ? 'Horário: ' + hora[0] + ' às ' + fmtHora(fimEv) : '',
      normas ? 'Checklists: ' + normas : '',
      formularios ? 'Formulários de campo: ' + formularios : '',
      nomeRt ? 'Responsável técnico: ' + nomeRt : '',
      v.getString('equipe_apoio') ? 'Equipe de apoio: ' + v.getString('equipe_apoio') : '',
      contato ? 'Contato no local: ' + contato : '',
      v.getString('equipamentos') ? 'Levar: ' + v.getString('equipamentos') : '',
      v.getString('orientacoes_equipe') ? 'Orientações: ' + v.getString('orientacoes_equipe') : '',
      local ? 'Local: ' + local : '',
      'Situação: ' + (STATUS[status] || status),
      site ? '\nAbrir no app: ' + site + '/vistorias/' + v.id : '',
    ]
      .filter((x) => !!x)
      .join('\n')

    linhas.push('BEGIN:VEVENT')
    linhas.push('UID:vistoria-' + v.id + '@laboravistorias')
    linhas.push('DTSTAMP:' + carimbo)
    if (ini) {
      linhas.push('DTSTART:' + utc(ini))
      linhas.push('DTEND:' + utc(fimEv))
    } else {
      linhas.push('DTSTART;VALUE=DATE:' + dia(d0))
      linhas.push('DTEND;VALUE=DATE:' + dia(d1))
    }
    linhas.push(
      dobrar('SUMMARY:' + esc('Vistoria · ' + nomeEmpresa + (normas ? ' (' + normas + ')' : ''))),
    )
    linhas.push(dobrar('DESCRIPTION:' + esc(descricao)))
    if (local) linhas.push(dobrar('LOCATION:' + esc(local)))
    if (site) linhas.push(dobrar('URL:' + site + '/vistorias/' + v.id))
    linhas.push('STATUS:' + (status === 'cancelada' ? 'CANCELLED' : 'CONFIRMED'))
    linhas.push('TRANSP:' + (ini ? 'OPAQUE' : 'TRANSPARENT'))
    if (status === 'agendada') {
      // Lembretes: com horário, 1 dia e 1 hora antes; dia inteiro, às 9h da véspera.
      const alarmes = ini ? ['-P1D', '-PT1H'] : ['-PT15H']
      for (const t of alarmes) {
        linhas.push('BEGIN:VALARM')
        linhas.push('ACTION:DISPLAY')
        linhas.push(dobrar('DESCRIPTION:' + esc('Vistoria · ' + nomeEmpresa)))
        linhas.push('TRIGGER:' + t)
        linhas.push('END:VALARM')
      }
    }
    linhas.push('END:VEVENT')
  }
  linhas.push('END:VCALENDAR')

  e.response.header().set('Content-Type', 'text/calendar; charset=utf-8')
  e.response.header().set('Cache-Control', 'no-cache')
  return e.string(200, linhas.join('\r\n') + '\r\n')
})
