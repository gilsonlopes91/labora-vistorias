migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const empresaId = app.findCollectionByNameOrId('empresas').id
    const tipoId = app.findCollectionByNameOrId('tipos_vistoria').id
    const collection = new Collection({
      name: 'vistorias',
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
        {
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresaId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tipo_vistoria_id',
          type: 'relation',
          required: true,
          collectionId: tipoId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'tecnico_id',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'data_agendada', type: 'date', required: true },
        { name: 'data_realizada', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['agendada', 'em_andamento', 'concluida', 'cancelada'],
          maxSelect: 1,
        },
        { name: 'observacoes_gerais', type: 'text', max: 3000 },
        // gerado no dispositivo (client) no momento da criação — usado para
        // evitar duplicar a vistoria quando a sincronização offline reenvia.
        { name: 'client_uuid', type: 'text', required: true, max: 100 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_vistorias_client_uuid ON vistorias (client_uuid)',
        'CREATE INDEX idx_vistorias_organizacao ON vistorias (organizacao_id)',
        'CREATE INDEX idx_vistorias_empresa ON vistorias (empresa_id)',
        'CREATE INDEX idx_vistorias_data_agendada ON vistorias (data_agendada)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('vistorias'))
  },
)
