// Questionário do beta: registra quantas vezes a pessoa saiu da página
// durante a prova e por quantos segundos ficou fora.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('beta_quiz_respostas')
    if (!col.fields.getByName('saidas')) {
      col.fields.add(new NumberField({ name: 'saidas', required: false, min: 0 }))
    }
    if (!col.fields.getByName('segundos_fora')) {
      col.fields.add(new NumberField({ name: 'segundos_fora', required: false, min: 0 }))
    }
    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('beta_quiz_respostas')
      if (col.fields.getByName('saidas')) col.fields.removeByName('saidas')
      if (col.fields.getByName('segundos_fora')) col.fields.removeByName('segundos_fora')
      app.save(col)
    } catch (_) {}
  },
)
