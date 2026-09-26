// Matrizes de risco (metodologia AIHA adaptada), 3x3 ou 5x5.
// organizacao_id vazio = oficial (as duas matrizes AIHA, seed na próxima
// migration); preenchido = cópia/ajuste da organização (prazos e textos).
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id

    const regraLeitura =
      "@request.auth.id != '' && (organizacao_id = '' || organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id || @request.auth.papel = 'admin_plataforma')"
    const regraEscrita =
      "@request.auth.id != '' && ((organizacao_id != '' && (organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id) && @request.auth.papel != 'executor') || @request.auth.papel = 'admin_plataforma')"

    const collection = new Collection({
      name: 'matrizes_risco',
      type: 'base',
      listRule: regraLeitura,
      viewRule: regraLeitura,
      createRule: regraEscrita,
      updateRule: regraEscrita,
      deleteRule: regraEscrita,
      fields: [
        {
          name: 'organizacao_id',
          type: 'relation',
          required: false,
          collectionId: orgId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true, max: 150 },
        { name: 'metodologia', type: 'text', max: 100 }, // ex.: "AIHA"
        {
          name: 'dimensao',
          type: 'select',
          required: true,
          values: ['3', '5'],
          maxSelect: 1,
        },
        // Cada array tem `dimensao` entradas: [{nivel, nome, quantitativo, qualitativo}]
        { name: 'criterios_probabilidade', type: 'json', maxSize: 50000, required: true },
        // [{nivel, nome, descricao, dias_afastamento, aiha_efeito}]
        { name: 'criterios_severidade', type: 'json', maxSize: 50000, required: true },
        // [{categoria, cor, acao, prazo_dias}]
        { name: 'categorias', type: 'json', maxSize: 20000, required: true },
        // matriz P x S -> categoria: [{p, s, categoria}]
        { name: 'celulas', type: 'json', maxSize: 20000, required: true },
        { name: 'versao', type: 'text', max: 20 },
        { name: 'somente_leitura', type: 'bool' }, // true nas duas matrizes oficiais
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_matrizes_risco_organizacao ON matrizes_risco (organizacao_id)'],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('matrizes_risco'))
  },
)
