// Recorrência de vistorias: quando uma vistoria vinculada a uma rotina ativa
// é concluída, cria automaticamente a próxima vistoria agendada e atualiza a
// rotina (proxima_data / ultima_vistoria_id). Frequência em dias:
// semanal 7, mensal 30, bimestral 60, trimestral 90, semestral 180, anual 365.
const DIAS_POR_FREQUENCIA = {
  semanal: 7,
  mensal: 30,
  bimestral: 60,
  trimestral: 90,
  semestral: 180,
  anual: 365,
}

function toJsDate(pbDateTime) {
  if (!pbDateTime) return null
  const s = typeof pbDateTime === 'string' ? pbDateTime : pbDateTime.string()
  const d = new Date(String(s).replace(' ', 'T'))
  return isNaN(d.getTime()) ? null : d
}

function toPbDate(jsDate) {
  return jsDate.toISOString().replace('T', ' ')
}

onRecordUpdate((e) => {
  try {
    const record = e.record
    if (record.getString('status') !== 'concluida') return e.next()

    // Só dispara na TRANSIÇÃO para concluída (evita recriar a próxima vistoria
    // em qualquer edição posterior de uma vistoria já concluída).
    const anterior = record.original()
    if (anterior && anterior.getString('status') === 'concluida') return e.next()

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
    if (!rotina || !rotina.getBool('ativo')) return e.next()

    const dias = DIAS_POR_FREQUENCIA[rotina.getString('frequencia')]
    if (!dias) return e.next()

    // Base: data agendada da vistoria concluída (fallback: proxima_data da rotina).
    const base =
      toJsDate(record.get('data_agendada')) || toJsDate(rotina.get('proxima_data')) || new Date()
    const proxima = new Date(base.getTime() + dias * 86400000)
    const proximaStr = toPbDate(proxima)

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
