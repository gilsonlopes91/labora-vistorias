// Campo "escopo" no catálogo de agentes — pedido do Gilson: além do nome e
// dos exemplos técnicos (que já existiam, ver 0149/0150/0167), cada agente
// também classifica para que serve (Geral, Aposentadoria Especial,
// Insalubridade), com a pessoa podendo digitar qualquer outro valor —
// por isso o campo é texto livre, não select fechado.
//
// Os registros oficiais já existentes são preenchidos automaticamente com
// um escopo derivado dos campos que já existiam:
//   - anos_aposentadoria_especial preenchido -> "Aposentadoria Especial"
//   - senão, anexo_nr15 com grau de insalubridade caracterizado -> "Insalubridade"
//   - senão -> "Geral"
// Também completa medidas_controle_tipicas de "Cádmio e seus compostos"
// (0150), que ficou sem esse campo por descuido.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('agentes_catalogo')

    col.fields.add(
      new TextField({
        name: 'escopo',
        max: 60,
      }),
    )
    app.save(col)

    const registros = app.findRecordsByFilter(col, "organizacao_id = ''", '', 0, 0)
    registros.forEach((r) => {
      const anos = r.get('anos_aposentadoria_especial')
      const grauInsalubridade = r.get('grau_insalubridade_nr15')
      let escopo = 'Geral'
      if (anos) {
        escopo = 'Aposentadoria Especial'
      } else if (grauInsalubridade && grauInsalubridade !== 'Não caracteriza') {
        escopo = 'Insalubridade'
      }
      r.set('escopo', escopo)
      app.save(r)
    })

    const cadmio = app.findRecordsByFilter(
      col,
      "organizacao_id = '' && nome = 'Cádmio e seus compostos'",
      '',
      1,
      0,
    )[0]
    if (cadmio && !cadmio.get('medidas_controle_tipicas')) {
      cadmio.set(
        'medidas_controle_tipicas',
        'Sistema fechado, exaustão local, EPI respiratório, monitoramento biológico (cádmio urinário)',
      )
      app.save(cadmio)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('agentes_catalogo')
    const field = col.fields.getByName('escopo')
    if (field) col.fields.removeById(field.id)
    app.save(col)
  },
)
