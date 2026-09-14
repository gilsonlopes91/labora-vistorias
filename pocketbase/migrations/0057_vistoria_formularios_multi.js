// Vistoria multi-item: uma vistoria pode ter N formulários de campo anexos
// (ex.: NR-09 + Ruído + Calor numa visita só). O checklist principal continua
// em tipo_vistoria_id; o campo novo guarda os modelos de formulário adicionais.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vistorias')
    if (!col.fields.getByName('formularios')) {
      col.fields.add(
        new RelationField({
          name: 'formularios',
          collectionId: app.findCollectionByNameOrId('modelos_formulario').id,
          cascadeDelete: false,
          maxSelect: 20,
          required: false,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vistorias')
    col.fields.removeByName('formularios')
    app.save(col)
  },
)
