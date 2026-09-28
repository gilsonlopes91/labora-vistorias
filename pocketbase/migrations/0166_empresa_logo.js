// Logo da empresa cliente (a que está sendo prestado o serviço) — usado na
// capa dos documentos SST (PGR, LTCAT, laudos), ao lado do logo da
// organização que presta o serviço (organizacoes.logo, migration 0022/0115).
// Só PNG, como o logo da organização, para caber bem num fundo colorido.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('empresas')
    if (!col.fields.getByName('logo')) {
      col.fields.add(
        new FileField({
          name: 'logo',
          maxSelect: 1,
          maxSize: 3145728,
          mimeTypes: ['image/png'],
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('empresas')
    col.fields.removeByName('logo')
    app.save(col)
  },
)
