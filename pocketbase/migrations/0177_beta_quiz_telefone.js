// Questionário do beta: telefone (só dígitos, com DDD) para contato dos selecionados.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('beta_quiz_respostas')
    if (!col.fields.getByName('telefone')) {
      col.fields.add(new TextField({ name: 'telefone', required: false, max: 20 }))
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('beta_quiz_respostas')
      if (col.fields.getByName('telefone')) {
        col.fields.removeByName('telefone')
        app.save(col)
      }
    } catch (_) {}
  },
)
