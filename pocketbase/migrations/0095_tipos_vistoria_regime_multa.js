// Define, por checklist, QUAL regime de cálculo de multa da NR-28 se aplica.
// Até aqui o hook decidia pelo prefixo do código do item ("231" = rural), o que
// não escala e não cobre o trabalho portuário. Agora o regime é um dado do
// próprio checklist:
//
//   anexo_i            → grade do Anexo I da NR-28, em UFIR (regra geral).
//   anexo_ia_portuario → grade do Anexo I-A, já em reais (NR-29, Portaria SIT 319/2012).
//   rural_art18        → art. 18 da Lei 5.889/1973, por empregado irregular
//                        (NR-31, via item 28.3.2 da NR-28).
//
// Checklists customizados criados pelo usuário nascem em anexo_i, que é a regra
// geral.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tipos_vistoria')
    if (!col.fields.getByName('regime_multa')) {
      col.fields.add(
        new SelectField({
          name: 'regime_multa',
          values: ['anexo_i', 'anexo_ia_portuario', 'rural_art18'],
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(col)
    }

    // Backfill: classifica o catálogo existente pela NR de referência.
    const tipos = app.findRecordsByFilter('tipos_vistoria', "id != ''", '', 0, 0)
    for (const tipo of tipos) {
      if (tipo.getString('regime_multa')) continue
      const ref = (tipo.getString('nr_referencia') || '') + ' ' + (tipo.getString('nome') || '')
      let regime = 'anexo_i'
      if (ref.indexOf('NR-29') !== -1) regime = 'anexo_ia_portuario'
      else if (ref.indexOf('NR-31') !== -1) regime = 'rural_art18'
      tipo.set('regime_multa', regime)
      app.save(tipo)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('tipos_vistoria')
    col.fields.removeByName('regime_multa')
    app.save(col)
  },
)
