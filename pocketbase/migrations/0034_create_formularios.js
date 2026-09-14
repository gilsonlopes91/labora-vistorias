// Formulários customizáveis — registro de campo SEPARADO das vistorias NR-28.
// modelos_formulario: o desenho da ficha criado no builder (campos em JSON).
//   organizacao_id vazio = modelo FIXO global (Ruído, Vibração, NR-12, NR-10) —
//   entra só via seed/migration, ninguém edita pela API.
//   organizacao_id preenchido = modelo próprio da organização (builder).
// formularios: o registro preenchido em campo (dados em JSON + anexos).
// Regras no padrão da 0033: todos da org veem; gestor gerencia modelos;
// executor preenche formulários (é o trabalho de campo dele).
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const empresaId = app.findCollectionByNameOrId('empresas').id
    const usersId = app.findCollectionByNameOrId('users').id

    const AUTENTICADO = "@request.auth.id != ''"
    const MESMA_ORG = 'organizacao_id = @request.auth.organizacao_id'
    const GESTOR = "@request.auth.papel != 'executor'"

    const modelos = new Collection({
      name: 'modelos_formulario',
      type: 'base',
      listRule: AUTENTICADO + " && (organizacao_id = '' || " + MESMA_ORG + ')',
      viewRule: AUTENTICADO + " && (organizacao_id = '' || " + MESMA_ORG + ')',
      createRule: AUTENTICADO + " && organizacao_id != '' && " + MESMA_ORG + ' && ' + GESTOR,
      updateRule: AUTENTICADO + " && organizacao_id != '' && " + MESMA_ORG + ' && ' + GESTOR,
      deleteRule: AUTENTICADO + " && organizacao_id != '' && " + MESMA_ORG + ' && ' + GESTOR,
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
        { name: 'descricao', type: 'text', max: 500 },
        // nome do ícone (lucide) que representa o modelo no catálogo
        { name: 'icone', type: 'text', max: 50 },
        // true = modelo pronto do catálogo (seed) — nunca editável pela API
        { name: 'fixo', type: 'bool' },
        // desenho da ficha: [{id, tipo, nome, unidade?, opcoes?, obrigatorio?, subcampos?}]
        { name: 'campos', type: 'json', maxSize: 500000 },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_modelos_formulario_org ON modelos_formulario (organizacao_id)'],
    })
    app.save(modelos)

    const formularios = new Collection({
      name: 'formularios',
      type: 'base',
      listRule: AUTENTICADO + ' && ' + MESMA_ORG,
      viewRule: AUTENTICADO + ' && ' + MESMA_ORG,
      // executor também cria/preenche — é o registro de campo dele
      createRule: AUTENTICADO + ' && ' + MESMA_ORG,
      updateRule: AUTENTICADO + ' && ' + MESMA_ORG,
      deleteRule: AUTENTICADO + ' && ' + MESMA_ORG + ' && ' + GESTOR,
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
          required: false,
          collectionId: empresaId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'modelo_formulario_id',
          type: 'relation',
          required: true,
          collectionId: modelos.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        // respostas: [{campo_id, valor}] — valor pode ser texto, número, bool,
        // lista de opções ou lista de nomes de arquivo de anexos
        { name: 'dados', type: 'json', maxSize: 500000 },
        // fotos/assinatura/pdf anexados ao preenchimento
        {
          name: 'anexos',
          type: 'file',
          maxSelect: 30,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        },
        {
          name: 'status',
          type: 'select',
          values: ['rascunho', 'concluido'],
          maxSelect: 1,
        },
        { name: 'data_campo', type: 'date' },
        {
          name: 'criado_por',
          type: 'relation',
          required: false,
          collectionId: usersId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        // gerado no dispositivo no momento da criação — evita duplicar quando
        // a sincronização offline reenvia (mesmo padrão das vistorias).
        { name: 'client_uuid', type: 'text', required: true, max: 100 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_formularios_client_uuid ON formularios (client_uuid)',
        'CREATE INDEX idx_formularios_organizacao ON formularios (organizacao_id)',
        'CREATE INDEX idx_formularios_empresa ON formularios (empresa_id)',
        'CREATE INDEX idx_formularios_modelo ON formularios (modelo_formulario_id)',
      ],
    })
    app.save(formularios)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('formularios'))
    app.delete(app.findCollectionByNameOrId('modelos_formulario'))
  },
)
