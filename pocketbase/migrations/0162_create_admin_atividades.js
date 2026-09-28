// Histórico do console de contas: quem fez o quê em cada organização
// (bloqueio, plano, pacote, nova senha, futuramente cobrança). Só o admin da
// plataforma e staff com acesso ao console leem; a escrita é feita apenas
// pelos hooks (regras de create/update/delete fechadas).
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const usersId = app.findCollectionByNameOrId('users').id

    const regraLeitura =
      "@request.auth.id != '' && (@request.auth.papel = 'admin_plataforma' || (@request.auth.papel = 'staff_labora' && @request.auth.acesso_console = true))"

    const collection = new Collection({
      name: 'admin_atividades',
      type: 'base',
      listRule: regraLeitura,
      viewRule: regraLeitura,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'organizacao_id',
          type: 'relation',
          required: false,
          collectionId: orgId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'usuario_id',
          type: 'relation',
          required: false,
          collectionId: usersId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'usuario_nome', type: 'text', max: 200 },
        { name: 'acao', type: 'text', required: true, max: 60 },
        { name: 'descricao', type: 'text', max: 500 },
        { name: 'detalhes', type: 'json', maxSize: 20000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      ],
      indexes: [
        'CREATE INDEX idx_admin_atividades_org ON admin_atividades (organizacao_id)',
        'CREATE INDEX idx_admin_atividades_created ON admin_atividades (created)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('admin_atividades'))
  },
)
