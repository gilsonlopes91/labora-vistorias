// Caixa de sugestões do app: qualquer usuário logado envia (melhoria, bug,
// dica, elogio ou outro) pelo botão flutuante; só o administrador da
// plataforma lê, marca como lido/resolvido e apaga.
migrate(
  (app) => {
    const usersId = app.findCollectionByNameOrId('users').id
    const orgId = app.findCollectionByNameOrId('organizacoes').id

    const soAdmin = "@request.auth.id != '' && @request.auth.papel = 'admin_plataforma'"
    // Quem envia só pode registrar em seu próprio nome e não mexe no status.
    const regraCriar =
      "@request.auth.id != '' && @request.body.usuario_id = @request.auth.id && @request.body.status:isset = false"

    const collection = new Collection({
      name: 'feedbacks',
      type: 'base',
      listRule: soAdmin,
      viewRule: soAdmin,
      createRule: regraCriar,
      updateRule: soAdmin,
      deleteRule: soAdmin,
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: usersId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'organizacao_id',
          type: 'relation',
          required: false,
          collectionId: orgId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'usuario_nome', type: 'text', max: 200 },
        { name: 'usuario_email', type: 'text', max: 200 },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['melhoria', 'bug', 'dica', 'elogio', 'outro'],
          maxSelect: 1,
        },
        { name: 'mensagem', type: 'text', required: true, max: 4000 },
        { name: 'pagina', type: 'text', max: 500 },
        { name: 'navegador', type: 'text', max: 300 },
        {
          name: 'status',
          type: 'select',
          values: ['novo', 'lido', 'resolvido'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_feedbacks_created ON feedbacks (created)'],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('feedbacks'))
  },
)
