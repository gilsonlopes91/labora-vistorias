migrate(
  (app) => {
    const vistoriaId = app.findCollectionByNameOrId('vistorias').id
    const itemId = app.findCollectionByNameOrId('itens_checklist').id
    const collection = new Collection({
      name: 'respostas_vistoria',
      type: 'base',
      listRule: "@request.auth.id != '' && vistoria_id.organizacao_id.dono_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && vistoria_id.organizacao_id.dono_id = @request.auth.id",
      createRule: "@request.auth.id != '' && vistoria_id.organizacao_id.dono_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && vistoria_id.organizacao_id.dono_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && vistoria_id.organizacao_id.dono_id = @request.auth.id",
      fields: [
        {
          name: 'vistoria_id',
          type: 'relation',
          required: true,
          collectionId: vistoriaId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'item_checklist_id',
          type: 'relation',
          required: true,
          collectionId: itemId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'situacao', type: 'select', values: ['C', 'N/C', 'N/A'], maxSelect: 1 },
        { name: 'observacao', type: 'text', max: 2000 },
        {
          name: 'foto',
          type: 'file',
          maxSelect: 5,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
        },
        // usado só por tipos de vistoria de multa fixa por empregado (ex.: futura NR-31)
        { name: 'numero_funcionarios_irregulares', type: 'number', min: 0, onlyInt: true },
        { name: 'valor_multa_min', type: 'number' },
        { name: 'valor_multa_max', type: 'number' },
        { name: 'client_uuid', type: 'text', required: true, max: 100 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_respostas_client_uuid ON respostas_vistoria (client_uuid)',
        'CREATE INDEX idx_respostas_vistoria ON respostas_vistoria (vistoria_id)',
        'CREATE INDEX idx_respostas_item ON respostas_vistoria (item_checklist_id)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('respostas_vistoria'))
  },
)
