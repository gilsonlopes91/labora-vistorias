// Formulário de campo vinculado a uma vistoria (vistoria multi-item):
// o técnico preenche a ficha dentro do fluxo da vistoria, e o registro
// guarda a vistoria de origem para o relatório consolidar depois.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('formularios')
    if (!col.fields.getByName('vistoria_id')) {
      col.fields.add(
        new RelationField({
          name: 'vistoria_id',
          collectionId: app.findCollectionByNameOrId('vistorias').id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('formularios')
    col.fields.removeByName('vistoria_id')
    app.save(col)
  },
)
