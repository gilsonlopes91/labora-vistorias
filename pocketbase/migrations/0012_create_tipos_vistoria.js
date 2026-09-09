migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const collection = new Collection({
      name: 'tipos_vistoria',
      type: 'base',
      // organizacao_id vazio ("") = modelo oficial global (catálogo NR), visível a todos.
      // organizacao_id preenchido = modelo customizado, visível/editável só pelo dono da organização.
      listRule:
        "@request.auth.id != '' && (organizacao_id = '' || organizacao_id.dono_id = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (organizacao_id = '' || organizacao_id.dono_id = @request.auth.id)",
      createRule:
        "@request.auth.id != '' && organizacao_id != '' && organizacao_id.dono_id = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && organizacao_id != '' && organizacao_id.dono_id = @request.auth.id",
      deleteRule:
        "@request.auth.id != '' && organizacao_id != '' && organizacao_id.dono_id = @request.auth.id",
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
        { name: 'nr_referencia', type: 'text', max: 30 },
        { name: 'descricao', type: 'text', max: 500 },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_tipos_vistoria_organizacao ON tipos_vistoria (organizacao_id)'],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('tipos_vistoria'))
  },
)
