// Rota pública (sem login): lista os itens de uma NR (tipos_vistoria) com
// ref, descrição, grau e tipo. Usada pela calculadora pública para o usuário
// escolher o item da norma. Somente leitura, dados públicos.
routerAdd('GET', '/backend/v1/public/nr/:id/itens', (e) => {
  const nrId = e.request.pathValue('id')
  if (!nrId) return e.badRequestError('id da NR obrigatório')

  const itens = $app.findRecordsByFilter(
    'itens_checklist',
    'tipo_vistoria_id = "' + nrId + '"',
    'ordem',
    0,
    0,
    { id: nrId },
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
