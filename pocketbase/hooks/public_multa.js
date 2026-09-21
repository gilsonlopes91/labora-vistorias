// Rota pública (sem login): calcula a multa de um item da NR-28 para uma
// quantidade de trabalhadores. Somente leitura de dados públicos.
routerAdd('POST', '/backend/v1/public/multa', (e) => {
  const body = e.requestInfo().body || {}
  const itemId = String(body.item_id || '')
  const trabalhadores = parseInt(String(body.trabalhadores || '0'), 10)

  if (!itemId) return e.badRequestError('item_id obrigatório')
  if (!(trabalhadores > 0)) return e.badRequestError('informe o número de trabalhadores')

  let item
  try {
    item = $app.findRecordById('itens_checklist', itemId)
  } catch (_) {
    return e.notFoundError('item não encontrado')
  }

  const grau = item.getInt('grau')
  const tipo = item.getString('tipo')
  const codigo = item.getString('codigo')

  // Regime de cálculo declarado no checklist (ver migration 0095). Fallback
  // para bases antigas: código 231xxx do Anexo II = NR-31 (rural).
  let regime = ''
  try {
    const tipoVistoria = $app.findRecordById('tipos_vistoria', item.get('tipo_vistoria_id'))
    regime = tipoVistoria.getString('regime_multa')
  } catch (_) {}
  if (!regime) regime = codigo && codigo.indexOf('231') === 0 ? 'rural_art18' : 'anexo_i'

  let vmin = 0
  let vmax = 0
  let explicacaoExtra = ''

  if (regime === 'rural_art18') {
    let multaRural = 392.89
    try {
      const paramRow = $app.findFirstRecordByFilter(
        'parametros_sistema',
        "chave = 'multa_rural_por_empregado'",
      )
      multaRural = paramRow.getFloat('valor_numero') || 392.89
    } catch (_) {}
    vmin = Math.round(multaRural * trabalhadores * 100) / 100
    vmax = Math.round(multaRural * 2 * trabalhadores * 100) / 100
    explicacaoExtra =
      'Infração da NR-31 (trabalho rural): multa POR TRABALHADOR atingido (art. 18 da Lei 5.889/1973).'
  } else if (grau && (tipo === 'S' || tipo === 'M')) {
    const limites = [10, 25, 50, 100, 250, 500, 1000]
    let ordem = 7
    for (let i = 0; i < limites.length; i++) {
      if (trabalhadores <= limites[i]) {
        ordem = i
        break
      }
    }
    const filtro = 'faixa_ordem = ' + ordem + ' && grau = ' + grau + " && tipo = '" + tipo + "'"

    if (regime === 'anexo_ia_portuario') {
      // NR-29: Anexo I-A da NR-28 (Portaria SIT 319/2012) — valores já em
      // reais, sem conversão de UFIR.
      const tabelaRow = $app.findFirstRecordByFilter('tabela_multas_portuario', filtro)
      vmin = Math.round(tabelaRow.getFloat('valor_min_reais') * 100) / 100
      vmax = Math.round(tabelaRow.getFloat('valor_max_reais') * 100) / 100
      explicacaoExtra =
        'Infração da NR-29 (trabalho portuário): a gradação vem do Anexo I-A da NR-28, cujos valores já são fixados em reais — não se aplica a conversão da UFIR.'
    } else {
      const tabelaRow = $app.findFirstRecordByFilter('tabela_multas_nr28', filtro)
      let ufirReais = 1.0641
      try {
        const paramRow = $app.findFirstRecordByFilter(
          'parametros_sistema',
          "chave = 'valor_ufir_reais'",
        )
        ufirReais = paramRow.getFloat('valor_numero') || 1.0641
      } catch (_) {}
      vmin = Math.round(tabelaRow.getFloat('valor_min_ufir') * ufirReais * 100) / 100
      vmax = Math.round(tabelaRow.getFloat('valor_max_ufir') * ufirReais * 100) / 100
    }
  }

  return e.json(200, {
    item: {
      id: item.id,
      item_ref: item.getString('item_ref'),
      descricao: item.getString('descricao'),
      codigo: codigo,
      grau: grau,
      tipo: tipo,
    },
    regime: regime,
    multa: { min: vmin, max: vmax },
    explicacao_extra: explicacaoExtra,
  })
})
