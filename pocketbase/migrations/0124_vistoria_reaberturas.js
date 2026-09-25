// Migração 0124: histórico de reaberturas da vistoria concluída
// (quem reabriu, quando, motivo e RT da versão anterior). Preenchido só pela
// rota /backend/v1/vistorias/{id}/reabrir.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vistorias')
    if (!col.fields.getByName('reaberturas')) {
      col.fields.add(new JSONField({ name: 'reaberturas', maxSize: 200000 }))
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vistorias')
    if (col.fields.getByName('reaberturas')) {
      col.fields.removeByName('reaberturas')
      app.save(col)
    }
  },
)
