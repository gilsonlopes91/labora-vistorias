// Fase 2 dos orçamentos: dinheiro e acompanhamento.
//
// Acrescenta ao orçamento o lado financeiro (status próprio, valor recebido e
// a receber), as datas do ciclo comercial, os motivos de recusa e
// cancelamento, o follow-up e o versionamento/arquivamento. Cria também a
// coleção de recebimentos, que é a origem do valor recebido.
//
// Os KPIs da tela dependem destes campos: "Recebido" vem da soma dos
// recebimentos, "A Receber" é o aprovado menos o recebido, e "Aguardando
// Retorno" é um status próprio do ciclo.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('orcamentos')

    // Status comercial ganha os dois estados que faltavam para fechar o ciclo.
    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = [
        'rascunho',
        'enviado',
        'aguardando_retorno',
        'em_negociacao',
        'aprovado',
        'recusado',
        'cancelado',
        'expirado',
        'em_execucao',
        'concluido',
      ]
    }

    const novos = [
      new SelectField({
        name: 'status_financeiro',
        values: [
          'nao_faturado',
          'aguardando_pagamento',
          'parcial',
          'recebido',
          'em_atraso',
          'cancelado',
        ],
        maxSelect: 1,
        required: false,
      }),
      // Mantido pelo hook orcamento_recebimento a partir da coleção de recebimentos.
      new NumberField({ name: 'valor_recebido' }),
      new DateField({ name: 'data_envio' }),
      new DateField({ name: 'data_aprovacao' }),
      new DateField({ name: 'data_prevista_recebimento' }),
      new TextField({ name: 'motivo_recusa', max: 1000 }),
      new TextField({ name: 'motivo_cancelamento', max: 1000 }),
      // Follow-up comercial
      new DateField({ name: 'ultimo_contato' }),
      new DateField({ name: 'proximo_contato' }),
      new TextField({ name: 'forma_ultimo_contato', max: 60 }),
      new TextField({ name: 'resumo_ultimo_contato', max: 2000 }),
      new TextField({ name: 'proxima_acao', max: 500 }),
      new TextField({ name: 'responsavel_followup', max: 200 }),
      // Versionamento e arquivo
      new TextField({ name: 'versao', max: 20 }),
      new BoolField({ name: 'arquivado' }),
    ]

    for (const campo of novos) {
      if (!col.fields.getByName(campo.name)) col.fields.add(campo)
    }
    app.save(col)

    // Relação de versão: aponta para o orçamento que deu origem a esta versão.
    if (!col.fields.getByName('orcamento_origem_id')) {
      col.fields.add(
        new RelationField({
          name: 'orcamento_origem_id',
          collectionId: col.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(col)
    }

    // Recebimentos: cada parcela registrada de um orçamento.
    const regra =
      "@request.auth.id != '' && orcamento_id.organizacao_id = @request.auth.organizacao_id && @request.auth.papel != 'executor'"

    const recebimentos = new Collection({
      name: 'orcamento_recebimentos',
      type: 'base',
      listRule: regra,
      viewRule: regra,
      createRule: regra,
      updateRule: regra,
      deleteRule: regra,
      fields: [
        {
          name: 'orcamento_id',
          type: 'relation',
          required: true,
          collectionId: col.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'valor', type: 'number', required: true },
        { name: 'data_recebimento', type: 'date' },
        { name: 'data_vencimento', type: 'date' },
        { name: 'forma_pagamento', type: 'text', max: 100 },
        { name: 'descricao', type: 'text', max: 500 },
        {
          name: 'situacao',
          type: 'select',
          values: ['previsto', 'recebido', 'atrasado', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'comprovante', type: 'file', maxSelect: 1, maxSize: 10485760 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_recebimentos_orcamento ON orcamento_recebimentos (orcamento_id)'],
    })
    app.save(recebimentos)

    // Orçamentos já existentes entram como não faturados e sem recebimento.
    try {
      const existentes = app.findRecordsByFilter('orcamentos', "id != ''", '', 0, 0)
      for (const rec of existentes) {
        if (!rec.getString('status_financeiro')) {
          rec.set('status_financeiro', 'nao_faturado')
          rec.set('valor_recebido', 0)
          app.save(rec)
        }
      }
    } catch (_) {}
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('orcamento_recebimentos'))
    } catch (_) {}
    const col = app.findCollectionByNameOrId('orcamentos')
    for (const nome of [
      'status_financeiro',
      'valor_recebido',
      'data_envio',
      'data_aprovacao',
      'data_prevista_recebimento',
      'motivo_recusa',
      'motivo_cancelamento',
      'ultimo_contato',
      'proximo_contato',
      'forma_ultimo_contato',
      'resumo_ultimo_contato',
      'proxima_acao',
      'responsavel_followup',
      'versao',
      'arquivado',
      'orcamento_origem_id',
    ]) {
      col.fields.removeByName(nome)
    }
    app.save(col)
  },
)
