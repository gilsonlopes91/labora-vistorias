// Permite mais fotos por item de checklist (era 5, passa para 12).
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('respostas_vistoria')
    const fotoField = col.fields.getByName('foto')
    if (fotoField) {
      fotoField.maxSelect = 12
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('respostas_vistoria')
    const fotoField = col.fields.getByName('foto')
    if (fotoField) {
      fotoField.maxSelect = 5
    }
    app.save(col)
  },
)
