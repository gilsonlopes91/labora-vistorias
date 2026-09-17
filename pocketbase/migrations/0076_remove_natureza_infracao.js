// Remove o campo natureza_infracao criado na 0075: a tabela oficial do Anexo II
// da NR-28 (Portaria MTE 104/2026) lista os itens da NR-31 SEM coluna de
// natureza/grau — a sanção deles segue o art. 18 da Lei 5.889/1973 (multa por
// empregado irregular), calculada nos hooks. O campo não tem uso.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('itens_checklist')
    if (col.fields.getByName('natureza_infracao')) {
      col.fields.removeByName('natureza_infracao')
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('itens_checklist')
    if (!col.fields.getByName('natureza_infracao')) {
      col.fields.add(
        new SelectField({
          name: 'natureza_infracao',
          values: ['leve', 'media', 'grave', 'gravissima'],
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(col)
    }
  },
)
