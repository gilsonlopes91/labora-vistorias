migrate(
  (app) => {
    const tipoId = app.findCollectionByNameOrId('tipos_vistoria').id
    const collection = new Collection({
      name: 'itens_checklist',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (tipo_vistoria_id.organizacao_id = '' || tipo_vistoria_id.organizacao_id.dono_id = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (tipo_vistoria_id.organizacao_id = '' || tipo_vistoria_id.organizacao_id.dono_id = @request.auth.id)",
      createRule:
        "@request.auth.id != '' && tipo_vistoria_id.organizacao_id != '' && tipo_vistoria_id.organizacao_id.dono_id = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && tipo_vistoria_id.organizacao_id != '' && tipo_vistoria_id.organizacao_id.dono_id = @request.auth.id",
      deleteRule:
        "@request.auth.id != '' && tipo_vistoria_id.organizacao_id != '' && tipo_vistoria_id.organizacao_id.dono_id = @request.auth.id",
      fields: [
        {
          name: 'tipo_vistoria_id',
          type: 'relation',
          required: true,
          collectionId: tipoId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'ordem', type: 'number', onlyInt: true },
        { name: 'secao', type: 'text', max: 200 },
        { name: 'item_ref', type: 'text', required: true, max: 300 },
        { name: 'codigo', type: 'text', required: true, max: 20 },
        // grau/tipo ficam em branco para NRs de multa fixa por empregado (ex.: NR-31),
        // que não usam a tabela graduada do Anexo I da NR-28.
        { name: 'grau', type: 'number', min: 1, max: 4, onlyInt: true },
        { name: 'tipo', type: 'select', values: ['S', 'M'], maxSelect: 1 },
        { name: 'descricao', type: 'text', required: true, max: 2000 },
        { name: 'observacao', type: 'text', max: 1000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_itens_checklist_tipo ON itens_checklist (tipo_vistoria_id, ordem)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('itens_checklist'))
  },
)
