migrate(
  (app) => {
    try {
      const tipos = app.findRecordsByFilter(
        'tipos_vistoria',
        "organizacao_id = ''",
        'nr_referencia',
        0,
        0,
      )
      const linhas = []
      for (const t of tipos) {
        let qtdItens = 0
        try {
          const itens = app.findRecordsByFilter(
            'itens_checklist',
            "tipo_vistoria_id = '" + t.id + "'",
            '',
            0,
            0,
          )
          qtdItens = itens.length
        } catch (_) {
          qtdItens = 0
        }
        linhas.push(t.get('nr_referencia') + ' | ' + t.get('nome') + ' | itens=' + qtdItens)
      }
      console.log('=== DEBUG CATALOGO NRs (total tipos: ' + tipos.length + ') ===')
      for (const l of linhas) console.log(l)

      // Detalha alguns itens da NR-35 (se existir) pra ver se a descrição é
      // literal do texto oficial ou o placeholder REVISAR que usamos.
      try {
        const nr35s = app.findRecordsByFilter(
          'tipos_vistoria',
          "nr_referencia = 'NR-35' && organizacao_id = ''",
          '',
          0,
          0,
        )
        for (const t of nr35s) {
          console.log('--- NR-35 tipo: ' + t.get('nome') + ' (id ' + t.id + ') ---')
          const itens = app.findRecordsByFilter(
            'itens_checklist',
            "tipo_vistoria_id = '" + t.id + "'",
            'ordem',
            3,
            0,
          )
          for (const it of itens) {
            console.log(
              'item_ref=' +
                it.get('item_ref') +
                ' codigo=' +
                it.get('codigo') +
                ' descricao=' +
                it.get('descricao') +
                ' observacao=' +
                it.get('observacao'),
            )
          }
        }
      } catch (e) {
        console.log('NR-35 lookup error: ' + e)
      }
    } catch (e) {
      console.log('DEBUG ERROR: ' + e)
    }
  },
  (_app) => {},
)
