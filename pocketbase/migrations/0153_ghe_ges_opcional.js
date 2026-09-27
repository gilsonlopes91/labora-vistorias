// P2 do desenho de processo: dá ao profissional a escolha de organizar o
// PGR por GHE/GES (ferramenta da NR-09) OU por atividade, posto de trabalho,
// função ou setor — todas formas aceitas pelo NR-1, item 13.3.1. Em vez de
// criar uma coleção nova, a coleção "ghes" ganha um campo que diz que TIPO de
// unidade aquele registro representa; o resto do sistema (avaliacoes_risco,
// funcoes_sst) continua se relacionando com "ghes" sem mudança nenhuma —
// só passa a exibir/rotular o registro pelo tipo escolhido.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('ghes')
    if (!col.fields.getByName('tipo_agrupamento')) {
      col.fields.add(
        new SelectField({
          name: 'tipo_agrupamento',
          values: ['GHE', 'Atividade', 'Posto de trabalho', 'Função', 'Setor'],
          maxSelect: 1,
        }),
      )
    }
    app.save(col)

    // Registros já existentes foram todos criados como GHE.
    const existentes = app.findRecordsByFilter(col, "tipo_agrupamento = ''", '', 0, 0)
    for (const r of existentes) {
      r.set('tipo_agrupamento', 'GHE')
      app.save(r)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('ghes')
    const f = col.fields.getByName('tipo_agrupamento')
    if (f) col.fields.removeById(f.id)
    app.save(col)
  },
)
