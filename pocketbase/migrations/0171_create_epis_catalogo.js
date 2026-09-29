// Catálogo de EPIs — cadastrado pelo próprio profissional (não é catálogo
// da plataforma, é sempre da organização). empresa_id vazio = catálogo
// "global" do escritório (vale pra todas as empresas clientes); preenchido =
// exclusivo daquela empresa. Vincula a agentes de risco do catálogo
// (proteção contra ruído, poeira etc.) e, quando é exclusivo de uma empresa,
// também a funções específicas dela — a UI só habilita esse segundo vínculo
// depois que uma empresa é escolhida (função pertence a uma empresa).
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const empresaId = app.findCollectionByNameOrId('empresas').id
    const agenteId = app.findCollectionByNameOrId('agentes_catalogo').id
    const funcaoId = app.findCollectionByNameOrId('funcoes_sst').id

    const regraLeitura =
      "@request.auth.id != '' && (organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id || @request.auth.papel = 'admin_plataforma')"
    const regraEscrita =
      "@request.auth.id != '' && ((organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id) && @request.auth.papel != 'executor' || @request.auth.papel = 'admin_plataforma')"

    const collection = new Collection({
      name: 'epis_catalogo',
      type: 'base',
      listRule: regraLeitura,
      viewRule: regraLeitura,
      createRule: regraEscrita,
      updateRule: regraEscrita,
      deleteRule: regraEscrita,
      fields: [
        {
          name: 'organizacao_id',
          type: 'relation',
          required: true,
          collectionId: orgId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        // Vazio = catálogo global da organização (todas as empresas dela).
        {
          name: 'empresa_id',
          type: 'relation',
          required: false,
          collectionId: empresaId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'numero_ca', type: 'text', required: true, max: 20 },
        { name: 'validade_ca', type: 'date' },
        { name: 'fabricante', type: 'text', max: 200 },
        { name: 'especificacoes', type: 'text', max: 2000 },
        // Proteção contra quais agentes/perigos do catálogo (físico, químico...).
        {
          name: 'agentes_protegidos_ids',
          type: 'relation',
          required: false,
          collectionId: agenteId,
          cascadeDelete: false,
          maxSelect: 50,
        },
        // Só faz sentido quando empresa_id está preenchido (função é da empresa).
        {
          name: 'funcoes_ids',
          type: 'relation',
          required: false,
          collectionId: funcaoId,
          cascadeDelete: false,
          maxSelect: 200,
        },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_epis_catalogo_organizacao ON epis_catalogo (organizacao_id)',
        'CREATE INDEX idx_epis_catalogo_empresa ON epis_catalogo (empresa_id)',
        'CREATE INDEX idx_epis_catalogo_numero_ca ON epis_catalogo (numero_ca)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('epis_catalogo'))
  },
)
