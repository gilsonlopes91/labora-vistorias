// Adiciona o campo de opção "fotos georreferenciadas" na vistoria e o campo
// de localização (lat/lon) nas respostas do checklist, para o recurso de
// captura de foto com geolocalização.
migrate(
  (app) => {
    const vistorias = app.findCollectionByNameOrId('vistorias')
    if (!vistorias.fields.getByName('fotos_georreferenciadas')) {
      vistorias.fields.add(new BoolField({ name: 'fotos_georreferenciadas' }))
    }
    app.save(vistorias)

    const respostas = app.findCollectionByNameOrId('respostas_vistoria')
    if (!respostas.fields.getByName('localizacao')) {
      respostas.fields.add(new GeoPointField({ name: 'localizacao' }))
    }
    app.save(respostas)
  },
  (app) => {
    const vistorias = app.findCollectionByNameOrId('vistorias')
    vistorias.fields.removeByName('fotos_georreferenciadas')
    app.save(vistorias)

    const respostas = app.findCollectionByNameOrId('respostas_vistoria')
    respostas.fields.removeByName('localizacao')
    app.save(respostas)
  },
)
