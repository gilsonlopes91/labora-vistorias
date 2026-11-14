// Aumenta o limite do PDF dos documentos de SST de 20 MB para 50 MB.
// Um PDF de 45 MB (logo pesado repetido em todas as páginas) era recusado no
// envio e o app mostrava "sem conexão com o servidor".
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('documentos_sst')
    col.fields.getByName('pdf').maxSize = 52428800
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('documentos_sst')
    col.fields.getByName('pdf').maxSize = 20971520
    app.save(col)
  },
)
