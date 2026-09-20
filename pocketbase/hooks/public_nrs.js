// Rota pública (sem login): lista o catálogo fixo de NRs (organizacao_id vazio)
// para a calculadora pública. Somente leitura, dados públicos.
routerAdd('GET', '/backend/v1/public/nrs', (e) => {
  const nrs = $app.findRecordsByFilter(
    'tipos_vistoria',
    "organizacao_id = '' && ativo = true",
    'nome',
    0,
    0,
  )
  const lista = nrs.map((nr) => ({
    id: nr.id,
    nome: nr.getString('nome'),
    nr_referencia: nr.getString('nr_referencia'),
  }))
  return e.json(200, { nrs: lista })
})
