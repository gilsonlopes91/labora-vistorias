// Torna o campo tipo_vistoria_id opcional (required: false) na coleção vistorias.
// Agora todas as vistorias podem ser criadas sem checklist principal obrigatório,
// tendo apenas checklists adicionais e/ou formulários de campo vinculados.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vistorias')
    const field = col.fields.getByName('tipo_vistoria_id')
    if (field) {
      field.required = false
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vistorias')
    const field = col.fields.getByName('tipo_vistoria_id')
    if (field) {
      field.required = true
      app.save(col)
    }
  },
)
