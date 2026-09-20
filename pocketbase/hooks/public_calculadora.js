// Rota pública (sem login) da calculadora de multas: recebe item_id e nº de
// trabalhadores; devolve valor min/max + dados do item. Somente leitura de
// dados públicos (itens das NRs oficiais + grade NR-28). O grau de risco da
// empresa NÃO entra no cálculo (a grade do Anexo I usa nº de empregados ×
// grau da infração); o campo fica na UI como contexto.
routerAdd('POST', '/backend/v1/public/calculadora', (e) => {
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

  let vmin = 0
  let vmax = 0
  let explicacaoExtra = ''

  if (grau && (tipo === 'S' || tipo === 'M')) {
    // faixa pela quantidade de trabalhadores (Anexo I da NR-28)
    const limites = [10, 25, 50, 100, 250, 500, 1000]
    let ordem = 7
    for (let i = 0; i < limites.length; i++) {
      if (trabalhadores <= limites[i]) {
        ordem = i
        break
      }
    }

    const filtro = 'faixa_ordem = ' + ordem + ' && grau = ' + grau + " && tipo = '" + tipo + "'"
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
  } else if (codigo && codigo.startsWith('231')) {
    // NR-31 — multa per capita (art. 18 da Lei 5.889/1973, via item 28.3.2)
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
    multa: { min: vmin, max: vmax },
    explicacao_extra: explicacaoExtra,
  })
})
