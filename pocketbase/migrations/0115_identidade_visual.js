// Identidade visual da organização: logo e cores usados em todos os documentos
// (proposta, laudo de vistoria e o que vier depois).
// - organizacoes.cor_primaria / cor_secundaria (hex, ex.: #6C8845);
// - organizacoes.logo passa a aceitar só PNG (logo com fundo transparente);
// - modelos_proposta.usar_identidade_org: o modelo usa logo e cores da
//   organização (padrão). Desligado, o modelo usa logo e cores próprios.
migrate(
  (app) => {
    const org = app.findCollectionByNameOrId('organizacoes')
    if (!org.fields.getByName('cor_primaria'))
      org.fields.add(new TextField({ name: 'cor_primaria', max: 7 }))
    if (!org.fields.getByName('cor_secundaria'))
      org.fields.add(new TextField({ name: 'cor_secundaria', max: 7 }))
    const logoOrg = org.fields.getByName('logo')
    if (logoOrg) logoOrg.mimeTypes = ['image/png']
    app.save(org)

    const modelos = app.findCollectionByNameOrId('modelos_proposta')
    if (!modelos.fields.getByName('usar_identidade_org'))
      modelos.fields.add(new BoolField({ name: 'usar_identidade_org' }))
    const logoModelo = modelos.fields.getByName('logo')
    if (logoModelo) logoModelo.mimeTypes = ['image/png']
    app.save(modelos)

    app.db().newQuery('UPDATE modelos_proposta SET usar_identidade_org = 1').execute()
  },
  (app) => {
    const org = app.findCollectionByNameOrId('organizacoes')
    for (const n of ['cor_primaria', 'cor_secundaria']) {
      const f = org.fields.getByName(n)
      if (f) org.fields.removeById(f.id)
    }
    app.save(org)
    const modelos = app.findCollectionByNameOrId('modelos_proposta')
    const f = modelos.fields.getByName('usar_identidade_org')
    if (f) modelos.fields.removeById(f.id)
    app.save(modelos)
  },
)
