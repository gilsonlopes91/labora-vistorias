// Plano de ação nomeado (Gilson pediu: poder criar um plano, dar nome, e
// colocar várias ações dentro dele usando a metodologia 5W2H). Até aqui
// "acoes_plano" era uma lista plana de ações soltas por empresa, sem
// nenhum agrupamento nomeado e sem vínculo com um documento específico.
//
// Mudanças:
// 1. Nova coleção "planos_acao": um plano nomeado por empresa (nome,
//    descrição, status). Ações passam a poder pertencer a um plano.
// 2. "acoes_plano" ganha:
//    - plano_id (opcional): a que plano esta ação pertence. Ações sem
//      plano continuam existindo (compatibilidade com o que já foi
//      cadastrado) e aparecem como "sem plano" na tela.
//    - justificativa (por quê), local (onde), como (como será feito):
//      completam o 5W2H — o quê (medida), quem (responsavel), quando
//      (prazo) e quanto custa (custo_estimado) já existiam.
// 3. "documentos_sst" ganha planos_acao_ids: na hora de editar/emitir um
//    documento, dá para escolher quais planos de ação entram nele. Vazio
//    = comportamento antigo (entram todas as ações da empresa).
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const empresaId = app.findCollectionByNameOrId('empresas').id

    const regra =
      "@request.auth.id != '' && ((organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id) || @request.auth.papel = 'admin_plataforma')"
    const regraGestor = regra + " && @request.auth.papel != 'executor'"

    const planosAcao = new Collection({
      name: 'planos_acao',
      type: 'base',
      listRule: regra,
      viewRule: regra,
      createRule: regra,
      updateRule: regra,
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
        { name: 'nome', type: 'text', required: true, max: 200 },
        { name: 'descricao', type: 'text', max: 1000 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Ativo', 'Concluído', 'Arquivado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_planos_acao_organizacao ON planos_acao (organizacao_id)',
        'CREATE INDEX idx_planos_acao_empresa ON planos_acao (empresa_id)',
      ],
    })
    app.save(planosAcao)

    const acoesPlanoCol = app.findCollectionByNameOrId('acoes_plano')
    if (!acoesPlanoCol.fields.getByName('plano_id')) {
      acoesPlanoCol.fields.add(
        new RelationField({
          name: 'plano_id',
          required: false,
          collectionId: planosAcao.id,
          cascadeDelete: true,
          maxSelect: 1,
        }),
      )
    }
    if (!acoesPlanoCol.fields.getByName('justificativa')) {
      acoesPlanoCol.fields.add(new TextField({ name: 'justificativa', max: 1000 }))
    }
    if (!acoesPlanoCol.fields.getByName('local')) {
      acoesPlanoCol.fields.add(new TextField({ name: 'local', max: 300 }))
    }
    if (!acoesPlanoCol.fields.getByName('como')) {
      acoesPlanoCol.fields.add(new TextField({ name: 'como', max: 1000 }))
    }
    const idxPlano = 'CREATE INDEX idx_acoes_plano_plano ON acoes_plano (plano_id)'
    if (!acoesPlanoCol.indexes.includes(idxPlano)) {
      acoesPlanoCol.indexes = [...acoesPlanoCol.indexes, idxPlano]
    }
    app.save(acoesPlanoCol)

    const documentosCol = app.findCollectionByNameOrId('documentos_sst')
    if (!documentosCol.fields.getByName('planos_acao_ids')) {
      documentosCol.fields.add(
        new RelationField({
          name: 'planos_acao_ids',
          required: false,
          collectionId: planosAcao.id,
          cascadeDelete: false,
          maxSelect: 50,
        }),
      )
      app.save(documentosCol)
    }
  },
  (app) => {
    const documentosCol = app.findCollectionByNameOrId('documentos_sst')
    const planosField = documentosCol.fields.getByName('planos_acao_ids')
    if (planosField) documentosCol.fields.removeById(planosField.id)
    app.save(documentosCol)

    const acoesPlanoCol = app.findCollectionByNameOrId('acoes_plano')
    for (const nome of ['plano_id', 'justificativa', 'local', 'como']) {
      const f = acoesPlanoCol.fields.getByName(nome)
      if (f) acoesPlanoCol.fields.removeById(f.id)
    }
    acoesPlanoCol.indexes = acoesPlanoCol.indexes.filter(
      (i) => !i.includes('idx_acoes_plano_plano'),
    )
    app.save(acoesPlanoCol)

    app.delete(app.findCollectionByNameOrId('planos_acao'))
  },
)
