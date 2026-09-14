// ROTA TEMPORÁRIA DE DEBUG — remover depois de usada.
// GET /backend/v1/debug/catalogo            -> lista todos os tipos_vistoria globais + contagem de itens
// GET /backend/v1/debug/catalogo?nr=NR-35    -> lista os itens completos dos tipos daquela NR
routerAdd('GET', '/backend/v1/debug/catalogo', (e) => {
  try {
    const nr = e.requestInfo().query.nr || ''
    const tipos = $app.findRecordsByFilter(
      'tipos_vistoria',
      nr ? "organizacao_id = '' && nr_referencia = '" + nr + "'" : "organizacao_id = ''",
      'nr_referencia',
      0,
      0,
    )

    const out = []
    for (const t of tipos) {
      let itens = []
      try {
        itens = $app.findRecordsByFilter(
          'itens_checklist',
          "tipo_vistoria_id = '" + t.id + "'",
          'ordem',
          0,
          0,
        )
      } catch (_) {
        itens = []
      }
      out.push({
        id: t.id,
        nr_referencia: t.getString('nr_referencia'),
        nome: t.getString('nome'),
        qtd_itens: itens.length,
        itens: nr
          ? itens.map((it) => ({
              item_ref: it.getString('item_ref'),
              codigo: it.getString('codigo'),
              grau: it.get('grau'),
              tipo: it.getString('tipo'),
              descricao: it.getString('descricao'),
              observacao: it.getString('observacao'),
            }))
          : undefined,
      })
    }

    return e.json(200, { total_tipos: tipos.length, tipos: out })
  } catch (err) {
    return e.json(500, { error: err && err.message ? err.message : String(err) })
  }
})
