// P3 do desenho de processo — E0 "Planejamento e preparação" (manual do
// MTE): antes de começar o levantamento, o profissional registra como vai
// organizar o PGR desta empresa (GHE/GES ou atividade/posto/função/setor —
// ver P2), qual matriz de risco vai usar por padrão, quem participa e a
// data de início. Guardado em "empresas" por ser uma decisão por empresa,
// tomada uma vez (o técnico pode reabrir e mudar depois).
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('empresas')
    const add = (f) => {
      if (!col.fields.getByName(f.name)) col.fields.add(f)
    }
    add(new DateField({ name: 'pgr_data_inicio_levantamento' }))
    add(
      new SelectField({
        name: 'pgr_modo_organizacao',
        values: ['GHE/GES', 'Atividade, posto, função ou setor', 'Misto'],
        maxSelect: 1,
      }),
    )
    add(
      new SelectField({
        name: 'pgr_matriz_padrao_metodologia',
        values: ['AIHA', 'ISO45002'],
        maxSelect: 1,
      }),
    )
    add(
      new SelectField({
        name: 'pgr_matriz_padrao_dimensao',
        values: ['3', '5'],
        maxSelect: 1,
      }),
    )
    add(new TextField({ name: 'pgr_participantes', max: 1000 }))
    add(new TextField({ name: 'pgr_observacoes_planejamento', max: 2000 }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('empresas')
    for (const n of [
      'pgr_data_inicio_levantamento',
      'pgr_modo_organizacao',
      'pgr_matriz_padrao_metodologia',
      'pgr_matriz_padrao_dimensao',
      'pgr_participantes',
      'pgr_observacoes_planejamento',
    ]) {
      const f = col.fields.getByName(n)
      if (f) col.fields.removeById(f.id)
    }
    app.save(col)
  },
)
