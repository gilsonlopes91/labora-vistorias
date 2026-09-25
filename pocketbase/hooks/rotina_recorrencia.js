// Recorrência de vistorias: quando uma vistoria de uma rotina ativa é
// concluída, cria a próxima vistoria agendada e atualiza a rotina
// (proxima_data / ultima_vistoria_id).
// A vistoria nova leva da rotina os checklists, formulários, responsável e
// horário; local, contato e orientações vêm da vistoria que acabou de ser
// concluída (é o mesmo lugar).
// Toda a lógica vive DENTRO do callback — o JSVM do PocketBase não expõe
// declarações de topo aos callbacks.
onRecordUpdate((e) => {
  const record = e.record

  // Só interessa a TRANSIÇÃO para concluída. Olha o estado anterior antes de
  // gravar: depois do e.next() o "original" já é o registro novo.
  let concluiuAgora = false
  try {
    const anterior = record.original()
    concluiuAgora =
      record.getString('status') === 'concluida' &&
      !(anterior && anterior.getString('status') === 'concluida')
  } catch (_) {
    concluiuAgora = false
  }

  // Grava a vistoria primeiro. Se alguma validação recusar a conclusão, o
  // erro sobe daqui e a próxima vistoria não é criada.
  e.next()
  if (!concluiuAgora) return

  // e.app é a mesma transação da gravação acima.
  const app = e.app
  try {
    // 1) Vistoria criada pela rotina: o client_uuid começa com "rot-<id da rotina>-".
    let rotina = null
    const m = /^rot-([a-z0-9]{15})-/.exec(record.getString('client_uuid'))
    if (m) {
      try {
        rotina = app.findRecordById('rotinas', m[1])
      } catch (_) {
        rotina = null
      }
    }
    // 2) Vistoria avulsa da mesma empresa e do mesmo checklist principal.
    if (!rotina && record.getString('tipo_vistoria_id')) {
      try {
        rotina = app.findFirstRecordByFilter(
          'rotinas',
          'organizacao_id = {:org} && empresa_id = {:emp} && tipo_vistoria_id = {:tipo} && ativo = true',
          {
            org: record.getString('organizacao_id'),
            emp: record.getString('empresa_id'),
            tipo: record.getString('tipo_vistoria_id'),
          },
        )
      } catch (_) {
        rotina = null
      }
    }
    if (!rotina || !rotina.getBool('ativo')) return

    // Se a rotina já tem outra vistoria pendente (por exemplo, esta foi
    // reaberta e concluída de novo), não cria mais uma.
    const ultimaId = rotina.getString('ultima_vistoria_id')
    if (ultimaId && ultimaId !== record.id) {
      try {
        const ultima = app.findRecordById('vistorias', ultimaId)
        const st = ultima.getString('status')
        if (st === 'agendada' || st === 'em_andamento') return
      } catch (_) {
        // vistoria apagada: segue e cria a próxima
      }
    }

    const mesesPorFrequencia = {
      mensal: 1,
      bimestral: 2,
      trimestral: 3,
      semestral: 6,
      anual: 12,
    }
    const freq = rotina.getString('frequencia')
    if (freq !== 'semanal' && !mesesPorFrequencia[freq]) return

    // Base: data agendada da vistoria concluída (senão, proxima_data da rotina).
    const lerData = (v) => {
      const s = v ? (typeof v === 'string' ? v : v.string()) : ''
      const d = new Date(String(s).replace(' ', 'T'))
      return isNaN(d.getTime()) ? null : d
    }
    const base =
      lerData(record.get('data_agendada')) || lerData(rotina.get('proxima_data')) || new Date()

    // Datas são dias de calendário gravados às 00:00 UTC. Soma meses de
    // verdade (dia 5 continua dia 5); dia 31 num mês de 30 vira o último dia.
    const proxima = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()))
    if (freq === 'semanal') {
      proxima.setUTCDate(proxima.getUTCDate() + 7)
    } else {
      const dia = proxima.getUTCDate()
      proxima.setUTCDate(1)
      proxima.setUTCMonth(proxima.getUTCMonth() + mesesPorFrequencia[freq])
      const ultimoDia = new Date(
        Date.UTC(proxima.getUTCFullYear(), proxima.getUTCMonth() + 1, 0),
      ).getUTCDate()
      proxima.setUTCDate(Math.min(dia, ultimoDia))
    }
    const proximaStr = proxima.toISOString().replace('T', ' ')

    const lista = (r, campo) => {
      const v = r.getStringSlice(campo) || []
      const out = []
      for (let i = 0; i < v.length; i++) if (v[i]) out.push(String(v[i]))
      return out
    }

    const col = app.findCollectionByNameOrId('vistorias')
    const nova = new Record(col)
    nova.set('organizacao_id', record.getString('organizacao_id'))
    nova.set('empresa_id', rotina.getString('empresa_id'))
    nova.set('tipo_vistoria_id', rotina.getString('tipo_vistoria_id'))
    nova.set('checklists', lista(rotina, 'checklists'))
    const formsRotina = lista(rotina, 'formularios')
    nova.set('formularios', formsRotina.length ? formsRotina : lista(record, 'formularios'))
    nova.set(
      'responsavel_tecnico_id',
      rotina.getString('responsavel_tecnico_id') || record.getString('responsavel_tecnico_id'),
    )
    nova.set('tecnico_id', record.getString('tecnico_id'))
    const hora = rotina.getString('hora_inicio')
    nova.set('hora_inicio', hora)
    nova.set('duracao_min', hora ? rotina.getInt('duracao_min') || 120 : 0)
    for (const campo of [
      'local_vistoria',
      'contato_local_nome',
      'contato_local_telefone',
      'equipe_apoio',
      'equipamentos',
      'orientacoes_equipe',
    ]) {
      nova.set(campo, record.getString(campo))
    }
    nova.set('fotos_georreferenciadas', record.getBool('fotos_georreferenciadas'))
    nova.set('data_agendada', proximaStr)
    nova.set('status', 'agendada')
    nova.set('client_uuid', 'rot-' + rotina.id + '-' + $security.randomString(16))
    app.save(nova)

    rotina.set('proxima_data', proximaStr)
    rotina.set('ultima_vistoria_id', nova.id)
    app.save(rotina)

    app.logger().info('rotina: próxima vistoria criada', 'rotina', rotina.id, 'vistoria', nova.id)
  } catch (err) {
    app
      .logger()
      .error(
        'falha ao processar recorrência da vistoria',
        'error',
        err && err.message ? err.message : String(err),
      )
  }
}, 'vistorias')
