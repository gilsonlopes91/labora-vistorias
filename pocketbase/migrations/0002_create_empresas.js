migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const collection = new Collection({
      name: 'empresas',
      type: 'base',
      listRule: "@request.auth.id != '' && organizacao_id.dono_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && organizacao_id.dono_id = @request.auth.id",
      createRule: "@request.auth.id != '' && organizacao_id.dono_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && organizacao_id.dono_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && organizacao_id.dono_id = @request.auth.id",
      fields: [
        {
          name: 'organizacao_id',
          type: 'relation',
          required: true,
          collectionId: orgId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'razao_social', type: 'text', required: true, max: 200 },
        { name: 'nome_fantasia', type: 'text', max: 200 },
        { name: 'cnpj', type: 'text', max: 30 },
        {
          name: 'porte',
          type: 'select',
          values: ['MEI', 'ME', 'EPP', 'Demais / Não se enquadra'],
          maxSelect: 1,
        },
        { name: 'grau_risco', type: 'number', min: 1, max: 4, onlyInt: true },
        { name: 'numero_funcionarios', type: 'number', required: true, min: 0, onlyInt: true },
        { name: 'endereco', type: 'text', max: 300 },
        { name: 'contato_nome', type: 'text', max: 150 },
        { name: 'contato_telefone', type: 'text', max: 30 },
        { name: 'contato_email', type: 'email' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_empresas_organizacao ON empresas (organizacao_id)'],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('empresas'))
  },
)
