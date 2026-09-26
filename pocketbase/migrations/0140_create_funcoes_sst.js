// "funcoes_sst" — nome distinto de uma futura tabela de cargos genérica, e
// para não colidir com nenhuma coleção existente. Uma função pertence a um
// único GHE (unidade de avaliação); setor_id é redundante (herdado do GHE)
// mas gravado para facilitar filtros e relatórios.
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const empresaId = app.findCollectionByNameOrId('empresas').id
    const setorId = app.findCollectionByNameOrId('setores').id
    const gheId = app.findCollectionByNameOrId('ghes').id

    const regra =
      "@request.auth.id != '' && ((organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id) || @request.auth.papel = 'admin_plataforma')"
    const regraGestor = regra + " && @request.auth.papel != 'executor'"

    const collection = new Collection({
      name: 'funcoes_sst',
      type: 'base',
      listRule: regra,
      viewRule: regra,
      createRule: regraGestor,
      updateRule: regraGestor,
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
          name: 'ghe_id',
          type: 'relation',
          required: true,
          collectionId: gheId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'setor_id',
          type: 'relation',
          required: false,
          collectionId: setorId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true, max: 150 },
        { name: 'cbo', type: 'text', max: 20 },
        { name: 'descricao_atividades', type: 'text', max: 3000 },
        { name: 'numero_empregados', type: 'number', min: 0, onlyInt: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_funcoes_sst_organizacao ON funcoes_sst (organizacao_id)',
        'CREATE INDEX idx_funcoes_sst_empresa ON funcoes_sst (empresa_id)',
        'CREATE INDEX idx_funcoes_sst_ghe ON funcoes_sst (ghe_id)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('funcoes_sst'))
  },
)
