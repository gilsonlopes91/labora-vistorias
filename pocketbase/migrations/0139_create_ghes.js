// GHE (Grupo Homogêneo de Exposição) — unidade de avaliação do PGR (metodologia
// AIHA: SEG/GES). Reúne funções com o mesmo perfil de exposição a perigos.
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const empresaId = app.findCollectionByNameOrId('empresas').id
    const setorId = app.findCollectionByNameOrId('setores').id

    const regra =
      "@request.auth.id != '' && ((organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id) || @request.auth.papel = 'admin_plataforma')"
    const regraGestor = regra + " && @request.auth.papel != 'executor'"

    const collection = new Collection({
      name: 'ghes',
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
          name: 'setor_id',
          type: 'relation',
          required: false,
          collectionId: setorId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'codigo', type: 'text', max: 30 },
        { name: 'nome', type: 'text', required: true, max: 150 },
        { name: 'descricao_atividades', type: 'text', max: 3000 },
        { name: 'criterio_agrupamento', type: 'text', max: 1000 },
        { name: 'jornada_trabalho', type: 'text', max: 200 },
        { name: 'turno', type: 'text', max: 100 },
        { name: 'numero_expostos', type: 'number', min: 0, onlyInt: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_ghes_organizacao ON ghes (organizacao_id)',
        'CREATE INDEX idx_ghes_empresa ON ghes (empresa_id)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('ghes'))
  },
)
