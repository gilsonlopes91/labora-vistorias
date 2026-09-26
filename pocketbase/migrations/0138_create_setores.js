// Módulo Documentos SST — Fase 1.
// "setores" são os ambientes/processos de trabalho da empresa (alínea a do
// inventário, NR-01 1.5.7.3.2): local físico ou de processo onde os GHE
// atuam. Uma empresa sem setor cadastrado ganha um setor "Geral" quando o
// primeiro GHE for criado (feito no hook, não aqui).
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const empresaId = app.findCollectionByNameOrId('empresas').id

    const regra =
      "@request.auth.id != '' && ((organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id) || @request.auth.papel = 'admin_plataforma')"
    const regraGestor = regra + " && @request.auth.papel != 'executor'"

    const collection = new Collection({
      name: 'setores',
      type: 'base',
      listRule: regra,
      viewRule: regra,
      createRule: regraGestor,
      updateRule: regraGestor,
      deleteRule: regraGestor,
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
        { name: 'nome', type: 'text', required: true, max: 150 },
        { name: 'descricao_processo', type: 'text', max: 2000 },
        {
          name: 'local',
          type: 'select',
          values: ['Próprio (dependências do empregador)', 'Terceiros'],
          maxSelect: 1,
        },
        { name: 'area_m2', type: 'number', min: 0 },
        { name: 'pe_direito_m', type: 'number', min: 0 },
        { name: 'cobertura', type: 'text', max: 200 },
        { name: 'piso', type: 'text', max: 200 },
        { name: 'paredes', type: 'text', max: 200 },
        { name: 'iluminacao', type: 'text', max: 200 },
        { name: 'ventilacao', type: 'text', max: 200 },
        {
          name: 'fotos',
          type: 'file',
          maxSelect: 20,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          protected: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_setores_organizacao ON setores (organizacao_id)',
        'CREATE INDEX idx_setores_empresa ON setores (empresa_id)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('setores'))
  },
)
