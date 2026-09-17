// NR-31 (trabalho rural): adiciona campo "natureza_infracao" (leve/media/grave/
// gravissima) nos itens de checklist e popula os 624 itens da NR-31 com o grau
// de infração da Portaria MTE 104/2026 (Anexo II da NR-28), que lista os itens
// da NR-31 sem coluna de grau I1-I4 — a sanção deles segue o art. 18 da Lei
// 5.889/1973 (multa por empregado irregular), via art. 634-A da CLT.
//
// O campo é opcional e não afeta as outras NRs (continuam usando grau 1-4).
migrate(
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
  (app) => {
    const col = app.findCollectionByNameOrId('itens_checklist')
    col.fields.removeByName('natureza_infracao')
    app.save(col)
  },
)
