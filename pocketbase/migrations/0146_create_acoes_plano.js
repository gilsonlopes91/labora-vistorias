// Plano de ação do PGR (NR-01, 1.5.5.2.1/1.5.5.2.2), ligado à exposição
// avaliada (não ao agente genérico).
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const empresaId = app.findCollectionByNameOrId('empresas').id
    const avaliacaoId = app.findCollectionByNameOrId('avaliacoes_risco').id
    const respostaId = app.findCollectionByNameOrId('respostas_vistoria').id

    const regra =
      "@request.auth.id != '' && ((organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id) || @request.auth.papel = 'admin_plataforma')"
    const regraGestor = regra + " && @request.auth.papel != 'executor'"

    const collection = new Collection({
      name: 'acoes_plano',
      type: 'base',
      listRule: regra,
      viewRule: regra,
      createRule: regra, // executor pode marcar evidência/conclusão; criação de ação nova só pelo hook ou por gestor (ver update)
      updateRule: regra,
      deleteRule: regraGestor,
      fields: [
        {
          name: 'organizacao_id',
          type: 'relation',
          required: true,
          collectionId: orgId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresaId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'avaliacao_id',
          type: 'relation',
          required: false,
          collectionId: avaliacaoId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'resposta_vistoria_origem_id',
          type: 'relation',
          required: false,
          collectionId: respostaId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'medida', type: 'text', required: true, max: 1000 },
        {
          name: 'nivel_hierarquia',
          type: 'select',
          values: ['Eliminação', 'Substituição', 'Engenharia', 'Administrativa', 'EPI'],
          maxSelect: 1,
        },
        { name: 'responsavel', type: 'text', max: 200 },
        { name: 'prazo', type: 'date' },
        { name: 'forma_acompanhamento', type: 'text', max: 500 },
        { name: 'forma_afericao_resultado', type: 'text', max: 500 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Pendente', 'Em andamento', 'Concluída', 'Cancelada'],
          maxSelect: 1,
        },
        {
          name: 'prioridade',
          type: 'select',
          values: ['Trivial', 'Tolerável', 'Moderado', 'Substancial', 'Intolerável'],
          maxSelect: 1,
        },
        { name: 'numero_expostos', type: 'number', min: 0, onlyInt: true },
        {
          name: 'origem',
          type: 'select',
          values: ['Sugerida', 'Manual', 'Vistoria'],
          maxSelect: 1,
        },
        { name: 'data_conclusao', type: 'date' },
        {
          name: 'evidencia',
          type: 'file',
          maxSelect: 10,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
          protected: true,
        },
        { name: 'custo_estimado', type: 'number', min: 0 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_acoes_plano_organizacao ON acoes_plano (organizacao_id)',
        'CREATE INDEX idx_acoes_plano_empresa ON acoes_plano (empresa_id)',
        'CREATE INDEX idx_acoes_plano_avaliacao ON acoes_plano (avaliacao_id)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('acoes_plano'))
  },
)
