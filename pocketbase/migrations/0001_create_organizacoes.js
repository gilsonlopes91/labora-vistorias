migrate(
  (app) => {
    const collection = new Collection({
      name: 'organizacoes',
      type: 'base',
      listRule: "@request.auth.id != '' && dono_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && dono_id = @request.auth.id",
      createRule: null,
      updateRule: "@request.auth.id != '' && dono_id = @request.auth.id",
      deleteRule: null,
      fields: [
        {
          name: 'nome',
          type: 'text',
          required: true,
          max: 200,
        },
        {
          name: 'dono_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_organizacoes_dono ON organizacoes (dono_id)'],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('organizacoes'))
  },
)
