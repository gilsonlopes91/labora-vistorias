// Etapa 4 da atualização de NRs: verificação semanal no gov.br.
// Uma linha por NR com o que foi visto na página oficial (data "Atualizado em",
// arquivo PDF, última portaria listada) e a situação:
//   em_dia  — nada mudou desde a última conferência;
//   mudou   — a página, o PDF ou a portaria mudou (aparece no selo do menu e
//             na faixa da aba Normas até o admin atualizar ou marcar como visto);
//   erro    — a página não pôde ser lida.
// Só admin_plataforma lê e edita; quem cria as linhas é a rotina do servidor.
migrate(
  (app) => {
    let col
    try {
      col = app.findCollectionByNameOrId('normas_monitor')
    } catch (_) {
      col = null
    }
    if (col) return
    const admin = "@request.auth.papel = 'admin_plataforma'"
    col = new Collection({
      type: 'base',
      name: 'normas_monitor',
      listRule: admin,
      viewRule: admin,
      createRule: null,
      updateRule: admin,
      deleteRule: null,
      fields: [
        { type: 'text', name: 'nr', required: true, max: 10 },
        { type: 'url', name: 'url' },
        { type: 'text', name: 'pdf_url', max: 500 },
        { type: 'text', name: 'pagina_atualizada', max: 40 },
        { type: 'text', name: 'portaria_site', max: 300 },
        { type: 'date', name: 'portaria_site_data' },
        { type: 'text', name: 'portaria_ignorada', max: 300 },
        {
          type: 'select',
          name: 'status',
          maxSelect: 1,
          values: ['em_dia', 'mudou', 'erro'],
        },
        { type: 'text', name: 'mudancas', max: 2000 },
        { type: 'date', name: 'detectado_em' },
        { type: 'date', name: 'verificado_em' },
        { type: 'bool', name: 'avisado' },
        { type: 'text', name: 'erro', max: 500 },
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_normas_monitor_nr ON normas_monitor (nr)'],
    })
    app.save(col)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('normas_monitor'))
    } catch (_) {
      // já removida
    }
  },
)
