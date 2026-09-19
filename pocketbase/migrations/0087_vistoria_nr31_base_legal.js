// NR-31: escolha do valor da multa rural na vistoria. O texto da lei (art. 18
// da Lei 5.889/1973, redação da MP 2.164-41/2001) fixa R$ 380,00; a Portaria
// MTE 1.131/2025 (o item 28.3.3 da NR-28 manda reajustar anualmente) aplica
// R$ 392,89. O usuário escolhe qual base usar ao preencher a vistoria.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vistorias')
    if (!col.fields.getByName('nr31_base_legal')) {
      col.fields.add(
        new SelectField({
          name: 'nr31_base_legal',
          values: ['lei_380', 'portaria_392'],
          maxSelect: 1,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vistorias')
    col.fields.removeByName('nr31_base_legal')
    app.save(col)
  },
)
