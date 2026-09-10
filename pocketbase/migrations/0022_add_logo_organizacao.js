// Logo da organização — usado nos relatórios e na marca d'água das fotos de
// vistoria. Cada organização (empresa que usa o sistema) pode ter o seu.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('organizacoes')
    if (!col.fields.getByName('logo')) {
      col.fields.add(
        new FileField({
          name: 'logo',
          maxSelect: 1,
          maxSize: 3145728,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('organizacoes')
    col.fields.removeByName('logo')
    app.save(col)
  },
)
