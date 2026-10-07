// Anexo (print da tela ou foto) nas sugestões. Arquivo protegido: só quem
// pode ver a sugestão (administrador da plataforma) abre a imagem.
migrate(
  (app) => {
    let collection
    try {
      collection = app.findCollectionByNameOrId('feedbacks')
    } catch (_) {
      return
    }
    if (collection.fields.getByName('anexo')) return
    collection.fields.add(
      new FileField({
        name: 'anexo',
        maxSelect: 1,
        maxSize: 8 * 1024 * 1024,
        mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
        protected: true,
      }),
    )
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('feedbacks')
      collection.fields.removeByName('anexo')
      app.save(collection)
    } catch (_) {
      // coleção inexistente: nada a desfazer
    }
  },
)
