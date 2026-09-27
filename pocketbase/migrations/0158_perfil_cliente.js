// 0158: perfil cliente (empresa vistoriada) — usuário fora da organização,
// gratuito e sem limite, ligado a empresas pela coleção acessos_cliente. Vê
// só o que está concluído/emitido da empresa dele: vistorias concluídas,
// documentos SST emitidos, plano de ação e orçamentos. Regras sempre
// ADITIVAS (|| no fim da regra vigente) — nunca reescrevem o que já existia.
migrate(
  (app) => {
    // 1) valor 'cliente' no select de users.papel.
    const usersCol = app.findCollectionByNameOrId('users')
    const papel = usersCol.fields.getByName('papel')
    if (papel && !papel.values.includes('cliente')) {
      papel.values = [...papel.values, 'cliente']
    }
    app.save(usersCol)

    // 2) coleção acessos_cliente.
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const empresaId = app.findCollectionByNameOrId('empresas').id
    const userColId = usersCol.id

    const regraGestor =
      "@request.auth.id != '' && (organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id || @request.auth.papel = 'admin_plataforma') && @request.auth.papel != 'executor'"
    const regraLeitura =
      "@request.auth.id != '' && ((organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id || @request.auth.papel = 'admin_plataforma') || usuario_id = @request.auth.id)"

    const acessos = new Collection({
      name: 'acessos_cliente',
      type: 'base',
      listRule: regraLeitura,
      viewRule: regraLeitura,
      createRule: regraGestor,
      updateRule: regraGestor,
      deleteRule: regraGestor,
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: userColId,
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
          name: 'organizacao_id',
          type: 'relation',
          required: true,
          collectionId: orgId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_acessos_cliente_usuario ON acessos_cliente (usuario_id)',
        'CREATE INDEX idx_acessos_cliente_empresa ON acessos_cliente (empresa_id)',
        'CREATE UNIQUE INDEX idx_acessos_cliente_par ON acessos_cliente (usuario_id, empresa_id)',
      ],
    })
    app.save(acessos)

    // 3) Regras de leitura aditivas — o cliente vê a empresa e o que está
    // concluído/emitido dela, via o back-relation acessos_cliente_via_empresa_id.
    const CLIENTE_EMPRESA =
      '(acessos_cliente_via_empresa_id.usuario_id ?= @request.auth.id && acessos_cliente_via_empresa_id.ativo = true)'
    const CLIENTE_VIA_EMPRESA =
      '(empresa_id.acessos_cliente_via_empresa_id.usuario_id ?= @request.auth.id && empresa_id.acessos_cliente_via_empresa_id.ativo = true'

    const empresasCol = app.findCollectionByNameOrId('empresas')
    empresasCol.listRule = '(' + empresasCol.listRule + ') || ' + CLIENTE_EMPRESA
    empresasCol.viewRule = '(' + empresasCol.viewRule + ') || ' + CLIENTE_EMPRESA
    app.save(empresasCol)

    const vistCol = app.findCollectionByNameOrId('vistorias')
    const CLIENTE_VISTORIA = CLIENTE_VIA_EMPRESA + " && status = 'concluida')"
    vistCol.listRule = '(' + vistCol.listRule + ') || ' + CLIENTE_VISTORIA
    vistCol.viewRule = '(' + vistCol.viewRule + ') || ' + CLIENTE_VISTORIA
    app.save(vistCol)

    const docsCol = app.findCollectionByNameOrId('documentos_sst')
    const CLIENTE_DOC = CLIENTE_VIA_EMPRESA + " && status = 'emitido')"
    docsCol.listRule = '(' + docsCol.listRule + ') || ' + CLIENTE_DOC
    docsCol.viewRule = '(' + docsCol.viewRule + ') || ' + CLIENTE_DOC
    app.save(docsCol)

    const acoesCol = app.findCollectionByNameOrId('acoes_plano')
    const CLIENTE_ACAO = CLIENTE_VIA_EMPRESA + ')'
    acoesCol.listRule = '(' + acoesCol.listRule + ') || ' + CLIENTE_ACAO
    acoesCol.viewRule = '(' + acoesCol.viewRule + ') || ' + CLIENTE_ACAO
    app.save(acoesCol)
    // updateRule não muda: o cliente atualiza status/evidência só pela rota
    // /backend/v1/cliente/acao (valida os campos permitidos).

    const orcCol = app.findCollectionByNameOrId('orcamentos')
    orcCol.listRule = '(' + orcCol.listRule + ') || ' + CLIENTE_ACAO
    orcCol.viewRule = '(' + orcCol.viewRule + ') || ' + CLIENTE_ACAO
    app.save(orcCol)
    // updateRule não muda: o cliente aceita proposta só pela rota
    // /backend/v1/cliente/orcamento/{id}/aceitar.
  },
  (app) => {
    const orcCol = app.findCollectionByNameOrId('orcamentos')
    const orcRegra = "@request.auth.id != '' && organizacao_id = @request.auth.organizacao_id"
    orcCol.listRule = orcRegra
    orcCol.viewRule = orcRegra
    app.save(orcCol)

    const acoesCol = app.findCollectionByNameOrId('acoes_plano')
    const regraOrg =
      "@request.auth.id != '' && ((organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id) || @request.auth.papel = 'admin_plataforma')"
    acoesCol.listRule = regraOrg
    acoesCol.viewRule = regraOrg
    app.save(acoesCol)

    const docsCol = app.findCollectionByNameOrId('documentos_sst')
    docsCol.listRule = regraOrg
    docsCol.viewRule = regraOrg
    app.save(docsCol)

    const vistCol = app.findCollectionByNameOrId('vistorias')
    const VIST_VISIBILIDADE =
      "(organizacao_id = @request.auth.organizacao_id && (@request.auth.papel != 'executor' || " +
      'organizacao_id.tecnico_ve_todas_vistorias = true || ' +
      'responsavel_tecnico_id.usuario_id = @request.auth.id))'
    const STAFF_OU_ADMIN =
      "organizacao_id.staff_ids.id ?= @request.auth.id || @request.auth.papel = 'admin_plataforma'"
    const vBase = "@request.auth.id != '' && (" + VIST_VISIBILIDADE + ' || ' + STAFF_OU_ADMIN + ')'
    vistCol.listRule = vBase
    vistCol.viewRule = vBase
    app.save(vistCol)

    const empresasCol = app.findCollectionByNameOrId('empresas')
    const empresasRegra =
      "@request.auth.id != '' && ((organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id || @request.auth.papel = 'admin_plataforma') || @request.auth.papel = 'admin_plataforma')"
    empresasCol.listRule = empresasRegra
    empresasCol.viewRule = empresasRegra
    app.save(empresasCol)

    const acessos = app.findCollectionByNameOrId('acessos_cliente')
    if (acessos) app.delete(acessos)

    const usersCol = app.findCollectionByNameOrId('users')
    const papel = usersCol.fields.getByName('papel')
    if (papel) papel.values = papel.values.filter((v) => v !== 'cliente')
    app.save(usersCol)
  },
)
