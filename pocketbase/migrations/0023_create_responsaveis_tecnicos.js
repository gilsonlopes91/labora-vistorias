// Responsáveis técnicos cadastrados por organização — usados para assinar o
// laudo/vistoria ao finalizar (um marcado como padrão, mas é possível ter
// mais de um e escolher na hora de finalizar).
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const collection = new Collection({
      name: 'responsaveis_tecnicos',
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
        { name: 'nome', type: 'text', required: true, max: 200 },
        {
          name: 'tipo_registro',
          type: 'select',
          required: true,
          values: ['CREA', 'CRM', 'CRQ', 'CRBio', 'CRP', 'COREN', 'MTE', 'Outro'],
          maxSelect: 1,
        },
        { name: 'numero_registro', type: 'text', required: true, max: 50 },
        { name: 'uf', type: 'text', max: 2 },
        { name: 'padrao', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_responsaveis_tecnicos_organizacao ON responsaveis_tecnicos (organizacao_id)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('responsaveis_tecnicos'))
  },
)
