// P1 do desenho de processo (ver doc "desenho-processo-pgr.md" / Projeto
// claude.ai "APP SST"): alinha o motor de avaliação de risco ao Manual de
// Interpretação do capítulo 1.5 da NR-1 (MTE):
//
// 1) NR não atendida = probabilidade máxima (manual, item 11.4 — exemplo dos
//    assentos da NR-17): novos campos nr_especifica_aplicavel/referencia/
//    atendida/justificativa em avaliacoes_risco. Quando aplicável e não
//    atendida, o motor (matrizRisco.ts) força P no teto da dimensão.
// 2) Levantamento preliminar (manual, item 9): risco evidente exige ação
//    imediata ANTES da avaliação formal pela matriz. Campos risco_evidente,
//    risco_evidente_acao_imediata, perigo_externo, atividade_nao_rotineira.
// 3) Separação entre "avaliação qualitativa" (há controle, foi julgado) e
//    "sem dados suficientes" (ainda não há base para avaliar): nova opção na
//    trilha de probabilidade, que força a maior incerteza e não permite
//    reduzir a probabilidade sugerida.
// 4) A trilha "Psicossocial" fica visível na coleção e na UI, mas desligada
//    (ver InventarioRiscosTab.tsx) — a análise psicossocial em si não é
//    feita nesta fase, só sinalizada como próximo passo.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('avaliacoes_risco')

    const add = (f) => {
      if (!col.fields.getByName(f.name)) col.fields.add(f)
    }

    // -- Levantamento preliminar (item 9 do manual) --
    add(new BoolField({ name: 'risco_evidente' }))
    add(
      new TextField({
        name: 'risco_evidente_acao_imediata',
        max: 1000,
      }),
    )
    add(new BoolField({ name: 'perigo_externo' }))
    add(new BoolField({ name: 'atividade_nao_rotineira' }))

    // -- Requisito específico de NR (item 11.4 do manual) --
    add(new BoolField({ name: 'nr_especifica_aplicavel' }))
    add(new TextField({ name: 'nr_especifica_referencia', max: 200 }))
    add(new BoolField({ name: 'nr_especifica_atendida' }))
    add(new TextField({ name: 'nr_especifica_justificativa', max: 1000 }))

    app.save(col)

    // -- Nova opção na trilha de probabilidade --
    const trilha = col.fields.getByName('trilha_probabilidade')
    if (trilha && trilha.values.indexOf('Sem dados suficientes') === -1) {
      trilha.values = trilha.values.concat(['Sem dados suficientes'])
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('avaliacoes_risco')
    for (const n of [
      'risco_evidente',
      'risco_evidente_acao_imediata',
      'perigo_externo',
      'atividade_nao_rotineira',
      'nr_especifica_aplicavel',
      'nr_especifica_referencia',
      'nr_especifica_atendida',
      'nr_especifica_justificativa',
    ]) {
      const f = col.fields.getByName(n)
      if (f) col.fields.removeById(f.id)
    }
    const trilha = col.fields.getByName('trilha_probabilidade')
    if (trilha) trilha.values = trilha.values.filter((v) => v !== 'Sem dados suficientes')
    app.save(col)
  },
)
