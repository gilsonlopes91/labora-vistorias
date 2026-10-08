// A hospedagem recusa uploads grandes (erro 413 já em arquivos de 2 MB), então
// os vídeos passam a ser links do YouTube. O campo de arquivo deixa de ser
// obrigatório e ganha o campo "url".
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('videos')
    const arquivo = collection.fields.getByName('arquivo')
    if (arquivo) arquivo.required = false
    if (!collection.fields.getByName('url')) {
      collection.fields.add(new TextField({ name: 'url', max: 500 }))
    }
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('videos')
    collection.fields.removeByName('url')
    const arquivo = collection.fields.getByName('arquivo')
    if (arquivo) arquivo.required = true
    app.save(collection)
  },
)
