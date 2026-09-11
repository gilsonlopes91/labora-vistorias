// Liga a vistoria ao responsável técnico que vai executá-la ("quem vai fazer").
// Snapshot de nome/registro (0024) continua existindo para o laudo; este campo
// é a relação viva, usada pela agenda para filtrar e exibir por pessoa.
migrate(
  (app) => {
    const rtId = app.findCollectionByNameOrId('responsaveis_tecnicos').id
    const col = app.findCollectionByNameOrId('vistorias')
    if (!col.fields.getByName('responsavel_tecnico_id')) {
      col.fields.add(
        new RelationField({
          name: 'responsavel_tecnico_id',
          collectionId: rtId,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vistorias')
    col.fields.removeByName('responsavel_tecnico_id')
    app.save(col)
  },
)
