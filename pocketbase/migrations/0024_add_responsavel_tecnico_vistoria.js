// Snapshot do responsável técnico no momento em que a vistoria é finalizada
// (texto puro, não relação) — pra o laudo não mudar retroativamente se o
// cadastro do responsável for editado ou removido depois.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vistorias')
    if (!col.fields.getByName('responsavel_tecnico_nome')) {
      col.fields.add(new TextField({ name: 'responsavel_tecnico_nome', max: 200 }))
    }
    if (!col.fields.getByName('responsavel_tecnico_registro')) {
      col.fields.add(new TextField({ name: 'responsavel_tecnico_registro', max: 100 }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vistorias')
    col.fields.removeByName('responsavel_tecnico_nome')
    col.fields.removeByName('responsavel_tecnico_registro')
    app.save(col)
  },
)
