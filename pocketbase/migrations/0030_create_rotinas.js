migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const empresaId = app.findCollectionByNameOrId('empresas').id
    const tipoId = app.findCollectionByNameOrId('tipos_vistoria').id
    const vistoriaId = app.findCollectionByNameOrId('vistorias').id
    const collection = new Collection({
      name: 'rotinas',
      type: 'base',
      // Rotina recorrente de vistoria por empresa + tipo (ex.: cliente visitado
      // a cada 3 meses, outro semanalmente). Quando a vistoria vinculada é
      // concluída, o hook rotina_recorrencia.js cria a próxima automaticamente.
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
          name: 'frequencia',
          type: 'select',
          values: ['semanal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual'],
          required: true,
          maxSelect: 1,
        },
        { name: 'ativo', type: 'bool' },
        { name: 'proxima_data', type: 'date', required: true },
        {
          name: 'ultima_vistoria_id',
          type: 'relation',
          required: false,
          collectionId: vistoriaId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_rotinas_organizacao ON rotinas (organizacao_id)',
        'CREATE INDEX idx_rotinas_empresa ON rotinas (empresa_id)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('rotinas'))
  },
)
