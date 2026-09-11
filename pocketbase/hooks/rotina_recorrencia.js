// Recorrência de vistorias: quando uma vistoria vinculada a uma rotina ativa
// é concluída, cria automaticamente a próxima vistoria agendada e atualiza a
// rotina (proxima_data / ultima_vistoria_id).
// Toda a lógica vive DENTRO do callback — o JSVM do PocketBase não expõe
// declarações de topo aos callbacks.
onRecordUpdate((e) => {
  try {
    const record = e.record
    if (record.getString('status') !== 'concluida') {
      e.next()
      return
    }

    // Só dispara na TRANSIÇÃO para concluída (evita recriar a próxima vistoria
    // em qualquer edição posterior de uma vistoria já concluída).
    const anterior = record.original()
    if (anterior && anterior.getString('status') === 'concluida') {
      e.next()
      return
    }

    const diasPorFrequencia = {
      semanal: 7,
      mensal: 30,
      bimestral: 60,
      trimestral: 90,
      semestral: 180,
      anual: 365,
    }

    const filtro =
      "organizacao_id = '" +
      record.getString('organizacao_id') +
      "' && empresa_id = '" +
      record.getString('empresa_id') +
      "' && tipo_vistoria_id = '" +
      record.getString('tipo_vistoria_id') +
      "' && ativo = true"

    let rotina = null
    try {
      rotina = $app.findFirstRecordByFilter('rotinas', filtro)
    } catch (_) {
      rotina = null
    }
    if (!rotina || !rotina.getBool('ativo')) {
      e.next()
      return
    }

    const dias = diasPorFrequencia[rotina.getString('frequencia')]
    if (!dias) {
      e.next()
      return
    }

    // Base: data agendada da vistoria concluída (fallback: proxima_data da rotina).
    let baseMs = Date.now()
    const dataAgendada = record.get('data_agendada')
    const dataAgendadaStr = dataAgendada
      ? typeof dataAgendada === 'string'
        ? dataAgendada
        : dataAgendada.string()
      : ''
    const dataAgendadaDate = new Date(String(dataAgendadaStr).replace(' ', 'T'))
    if (!isNaN(dataAgendadaDate.getTime())) {
      baseMs = dataAgendadaDate.getTime()
    } else {
      const proximaData = rotina.get('proxima_data')
      const proximaStr = proximaData
        ? typeof proximaData === 'string'
          ? proximaData
          : proximaData.string()
        : ''
      const proximaDate = new Date(String(proximaStr).replace(' ', 'T'))
      if (!isNaN(proximaDate.getTime())) baseMs = proximaDate.getTime()
    }

    const proxima = new Date(baseMs + dias * 86400000)
    const proximaStr = proxima.toISOString().replace('T', ' ')

    const col = $app.findCollectionByNameOrId('vistorias')
    const nova = new Record(col)
    nova.set('organizacao_id', record.getString('organizacao_id'))
    nova.set('empresa_id', record.getString('empresa_id'))
    nova.set('tipo_vistoria_id', record.getString('tipo_vistoria_id'))
    nova.set('tecnico_id', record.getString('tecnico_id'))
    nova.set('data_agendada', proximaStr)
    nova.set('status', 'agendada')
    nova.set('client_uuid', 'rot-' + rotina.id + '-' + $security.randomString(16))
    $app.save(nova)

    rotina.set('proxima_data', proximaStr)
    rotina.set('ultima_vistoria_id', nova.id)
    $app.save(rotina)

    $app.logger().info('rotina: próxima vistoria criada', 'rotina', rotina.id, 'vistoria', nova.id)
  } catch (err) {
    $app
      .logger()
      .error(
        'falha ao processar recorrência da vistoria',
        'error',
        err && err.message ? err.message : String(err),
      )
  }

  e.next()
}, 'vistorias')
