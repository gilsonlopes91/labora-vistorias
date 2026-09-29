// Ponto 1 do plano "Empresa → Ambiente → Cargo (GHE opcional)"
// (claude/labora-vistoria-plano-fluxo-cargos-ghe-os-epi-2026-09-28.md).
//
// Problema: até aqui, TODO risco (avaliacoes_risco) era obrigado a passar
// por um GHE, e TODA função (funcoes_sst) era obrigada a pertencer a um
// GHE. Isso força a criar um GHE artificial só para pendurar um risco que é
// individual do cargo (ex.: risco mecânico específico de um operador de
// máquina, diferente do auxiliar no mesmo ambiente), inflando a quantidade
// de GHEs sem necessidade real.
//
// Mudança: GHE passa a ser opcional dos dois lados.
// - funcoes_sst.ghe_id: obrigatório → opcional.
// - avaliacoes_risco.ghe_id: obrigatório → opcional.
// - avaliacoes_risco ganha funcao_id (opcional, relação com funcoes_sst):
//   permite vincular o risco direto ao cargo, sem passar por GHE.
//
// "Risco efetivo da função" = avaliações com funcao_id = esta função (risco
// próprio do cargo) ∪ avaliações do ghe_id desta função, quando ela tiver
// um GHE vinculado (risco ambiental herdado) — ver src/lib/riscoFuncao.ts.
// Uma avaliação de risco continua exigindo pelo menos um dos dois vínculos
// (ghe_id ou funcao_id) — ver pocketbase/hooks/valida_avaliacao_risco_alvo.js.
migrate(
  (app) => {
    const funcoesCol = app.findCollectionByNameOrId('funcoes_sst')
    const gheField = funcoesCol.fields.getByName('ghe_id')
    gheField.required = false
    app.save(funcoesCol)

    const avaliacoesCol = app.findCollectionByNameOrId('avaliacoes_risco')
    const avalGheField = avaliacoesCol.fields.getByName('ghe_id')
    avalGheField.required = false
    app.save(avaliacoesCol)

    if (!avaliacoesCol.fields.getByName('funcao_id')) {
      avaliacoesCol.fields.add(
        new RelationField({
          name: 'funcao_id',
          required: false,
          collectionId: funcoesCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        }),
      )
      app.save(avaliacoesCol)
    }

    const idx = 'CREATE INDEX idx_avaliacoes_risco_funcao ON avaliacoes_risco (funcao_id)'
    if (!avaliacoesCol.indexes.includes(idx)) {
      avaliacoesCol.indexes = [...avaliacoesCol.indexes, idx]
      app.save(avaliacoesCol)
    }
  },
  (app) => {
    const avaliacoesCol = app.findCollectionByNameOrId('avaliacoes_risco')
    const funcaoField = avaliacoesCol.fields.getByName('funcao_id')
    if (funcaoField) avaliacoesCol.fields.removeById(funcaoField.id)
    avaliacoesCol.indexes = avaliacoesCol.indexes.filter(
      (i) => !i.includes('idx_avaliacoes_risco_funcao'),
    )
    const avalGheField = avaliacoesCol.fields.getByName('ghe_id')
    avalGheField.required = true
    app.save(avaliacoesCol)

    const funcoesCol = app.findCollectionByNameOrId('funcoes_sst')
    const gheField = funcoesCol.fields.getByName('ghe_id')
    gheField.required = true
    app.save(funcoesCol)
  },
)
