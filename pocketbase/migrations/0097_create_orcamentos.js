// Controle de orçamentos — núcleo, portado do módulo de fundadores do projeto
// "Labora SST" (que roda em Supabase/Postgres) para o Skip Cloud/PocketBase.
//
// Decisões desta versão:
// - O cliente do orçamento é a própria coleção "empresas" do Vistorias, e não
//   uma lista de clientes separada. Cadastro único: a empresa que você vistoria
//   é a mesma que você orça.
// - Escopo por organização, e visível só para gestor (papel != 'executor') —
//   técnico de campo não vê valor de proposta.
// - Os itens da proposta ficam num campo JSON, porque o formato muda conforme o
//   tipo: "servico" usa descrição/quantidade/unidade/valor unitário, e
//   "treinamento" usa nome/carga horária/nº de pessoas/turmas/valor unitário.
//
// Fora deste núcleo (fases seguintes): recebimentos, anexos, follow-up,
// histórico de auditoria, versionamento, arquivamento e PDF da proposta.
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const empresaId = app.findCollectionByNameOrId('empresas').id

    // Gestor = dono ou gerente. Usuários antigos sem papel contam como gestor.
    const regra =
      "@request.auth.id != '' && organizacao_id = @request.auth.organizacao_id && @request.auth.papel != 'executor'"

    const collection = new Collection({
      name: 'orcamentos',
      type: 'base',
      listRule: regra,
      viewRule: regra,
      createRule: regra,
      updateRule: regra,
      deleteRule: regra,
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
          cascadeDelete: false,
          maxSelect: 1,
        },
        // Preenchido pelo hook orcamento_numero no momento da criação, no
        // formato NNN/AAAA, sequencial por organização e por ano.
        { name: 'numero', type: 'text', max: 20 },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['servico', 'treinamento'],
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true, max: 200 },
        { name: 'descricao', type: 'text', max: 5000 },
        // Lista de itens da proposta. Formato conforme o tipo — ver comentário
        // no topo e os tipos em src/services/orcamentos.ts.
        { name: 'itens', type: 'json', maxSize: 200000 },
        { name: 'valor_total', type: 'number' },
        { name: 'valor_entrada', type: 'number' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: [
            'rascunho',
            'enviado',
            'em_negociacao',
            'aprovado',
            'recusado',
            'cancelado',
            'em_execucao',
            'concluido',
          ],
          maxSelect: 1,
        },
        { name: 'data_proposta', type: 'date' },
        { name: 'validade_dias', type: 'number', min: 0, onlyInt: true },
        { name: 'condicao_pagamento', type: 'text', max: 300 },
        { name: 'forma_pagamento', type: 'text', max: 200 },
        { name: 'prazo_entrega', type: 'text', max: 200 },
        // Listas simples de texto, uma entrada por posição.
        { name: 'normas_referencia', type: 'json', maxSize: 20000 },
        { name: 'itens_inclusos', type: 'json', maxSize: 50000 },
        { name: 'itens_exclusos', type: 'json', maxSize: 50000 },
        { name: 'responsavel_engenheiro', type: 'text', max: 200 },
        { name: 'crea', type: 'text', max: 60 },
        { name: 'observacoes', type: 'text', max: 3000 },
        {
          name: 'criado_por',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_orcamentos_organizacao ON orcamentos (organizacao_id)',
        'CREATE INDEX idx_orcamentos_empresa ON orcamentos (empresa_id)',
        'CREATE INDEX idx_orcamentos_status ON orcamentos (status)',
        'CREATE UNIQUE INDEX idx_orcamentos_numero_org ON orcamentos (organizacao_id, numero)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('orcamentos'))
  },
)
