// Rota pública (sem login): itens de uma NR — query ?nr_id=. Somente leitura.
routerAdd('GET', '/backend/v1/public/itens', (e) => {
  const nrId = String(e.requestInfo().query.nr_id || '')
  if (!nrId) return e.badRequestError('nr_id obrigatório')

  const itens = $app.findRecordsByFilter(
    'itens_checklist',
    'tipo_vistoria_id = "' + nrId + '"',
    'ordem',
    0,
    0,
  )

  const lista = itens.map((it) => ({
    id: it.id,
    item_ref: it.getString('item_ref'),
    descricao: it.getString('descricao'),
    codigo: it.getString('codigo'),
    grau: it.getInt('grau'),
    tipo: it.getString('tipo'),
    secao: it.getString('secao'),
  }))

  return e.json(200, { itens: lista })
})
