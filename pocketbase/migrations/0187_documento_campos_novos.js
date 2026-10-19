// Campos que o documento SST novo (PGR, LTCAT e laudos) lê e que antes não existiam:
// - avaliacoes_risco.comentario_tecnico: a linha "Leitura" do card de risco.
// - avaliacoes_risco.medidas_faltantes: as medidas que ainda faltam (uma por linha).
// - avaliacoes_risco.aet_situacao: situação da análise ergonômica do trabalho (só risco ergonômico).
// - funcoes_sst.numero_homens e numero_mulheres: total da função por sexo, opcional.
// Todos opcionais: documento sem esses dados continua saindo, só sem a linha correspondente.
migrate(
  (app) => {
    const avaliacoes = app.findCollectionByNameOrId('avaliacoes_risco')
    for (const nome of ['comentario_tecnico', 'medidas_faltantes', 'aet_situacao']) {
      if (!avaliacoes.fields.getByName(nome)) {
        avaliacoes.fields.add(new TextField({ name: nome, required: false }))
      }
    }
    app.save(avaliacoes)

    const funcoes = app.findCollectionByNameOrId('funcoes_sst')
    for (const nome of ['numero_homens', 'numero_mulheres']) {
      if (!funcoes.fields.getByName(nome)) {
        funcoes.fields.add(new NumberField({ name: nome, required: false, min: 0, onlyInt: true }))
      }
    }
    app.save(funcoes)
  },
  (app) => {
    try {
      const avaliacoes = app.findCollectionByNameOrId('avaliacoes_risco')
      for (const nome of ['comentario_tecnico', 'medidas_faltantes', 'aet_situacao']) {
        if (avaliacoes.fields.getByName(nome)) avaliacoes.fields.removeByName(nome)
      }
      app.save(avaliacoes)
    } catch (_) {
      // coleção inexistente: nada a desfazer
    }
    try {
      const funcoes = app.findCollectionByNameOrId('funcoes_sst')
      for (const nome of ['numero_homens', 'numero_mulheres']) {
        if (funcoes.fields.getByName(nome)) funcoes.fields.removeByName(nome)
      }
      app.save(funcoes)
    } catch (_) {
      // coleção inexistente: nada a desfazer
    }
  },
)
