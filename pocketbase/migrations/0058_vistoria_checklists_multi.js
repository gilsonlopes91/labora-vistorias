// Vistoria multi-NR: além do checklist principal (tipo_vistoria_id), a vistoria
// pode ter N checklists de NR adicionais (ex.: NR-33 + NR-35 na mesma visita).
// Cada NR adicional é um item de relação multi com modelos de tipos_vistoria.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vistorias')
    if (!col.fields.getByName('checklists')) {
      col.fields.add(
        new RelationField({
          name: 'checklists',
          collectionId: app.findCollectionByNameOrId('tipos_vistoria').id,
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
    col.fields.removeByName('checklists')
    app.save(col)
  },
)
