// Orçamento com serviços e treinamentos na mesma proposta: novo tipo "misto".
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('orcamentos')
    const campo = collection.fields.getByName('tipo')
    campo.values = ['servico', 'treinamento', 'misto']
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('orcamentos')
    const campo = collection.fields.getByName('tipo')
    campo.values = ['servico', 'treinamento']
    app.save(collection)
  },
)
