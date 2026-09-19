// Níveis de acesso — camada PLATAFORMA (Onda 1 do plano aprovado).
// 1) users.papel ganha 2 valores: admin_plataforma (Gilson, acesso total) e
//    staff_labora (equipe Labora, atua como executor nas orgs vinculadas).
// 2) gilsonlopes2991@gmail.com = primeiro admin total (cria o usuário se não
//    existir; se existir, só promove).
// 3) organizacoes: campo staff_ids (relation users, multi) = equipe Labora
//    vinculada à organização; e campo status (ativa/trial/bloqueada) p/ o
//    console bloquear acesso sem apagar dados.
// 4) RLS: admin_plataforma vê tudo; staff_labora vê as orgs em que é staff.
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('users')
    const orgCol = app.findCollectionByNameOrId('organizacoes')

    // 1) novos valores de papel
    const papel = usersCol.fields.getByName('papel')
    if (papel && !papel.values.includes('admin_plataforma')) {
      papel.values = [...papel.values, 'admin_plataforma', 'staff_labora']
      app.save(usersCol)
    }

    // 2) organizacoes: staff_ids + status
    if (!orgCol.fields.getByName('staff_ids')) {
      orgCol.fields.add(
        new RelationField({
          name: 'staff_ids',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 20,
          required: false,
        }),
      )
    }
    if (!orgCol.fields.getByName('status')) {
      orgCol.fields.add(
        new SelectField({
          name: 'status',
          values: ['ativa', 'trial', 'bloqueada'],
          maxSelect: 1,
        }),
      )
    }
    app.save(orgCol)

    // 3) primeiro admin total
    const emailAdmin = 'gilsonlopes2991@gmail.com'
    let admin = null
    try {
      admin = app.findAuthRecordByEmail('users', emailAdmin)
    } catch (_) {
      admin = null
    }
    if (!admin) {
      admin = new Record(usersCol)
      admin.setEmail(emailAdmin)
      admin.setName('Gilson Lopes')
      admin.setPassword('Admin@2026')
      admin.setVerified(true)
    }
    admin.set('papel', 'admin_plataforma')
    app.save(admin)

    // 4) RLS — admin_plataforma enxerga tudo; staff_labora vê as orgs dele.
    //    Formato: (regra original) || @request.auth.papel = 'admin_plataforma'
    //    Staff: adicionado nas orgs via campo staff_ids.
    const ADMIN = "@request.auth.papel = 'admin_plataforma'"
    const AUTENTICADO = "@request.auth.id != ''"

    // organizacoes: admin vê todas; staff vê as orgs em que está staff_ids
    orgCol.listRule =
      "@request.auth.id != '' && (dono_id = @request.auth.id || @request.auth.organizacao_id = id || @request.auth.papel = 'admin_plataforma' || staff_ids.id ?= @request.auth.id)"
    orgCol.viewRule = orgCol.listRule
    orgCol.updateRule =
      "@request.auth.id != '' && (dono_id = @request.auth.id || @request.auth.papel = 'admin_plataforma')"
    app.save(orgCol)

    const MESMA_ORG = 'organizacao_id = @request.auth.organizacao_id'
    // staff_ids vive em organizacoes — acessar via relação organizacao_id.
    const MESMA_ORG_STAFF =
      "(organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id || @request.auth.papel = 'admin_plataforma')"

    const regras = (nome, orgFiltro, gestorExtra) => {
      const col = app.findCollectionByNameOrId(nome)
      const base = AUTENTICADO + ' && (' + orgFiltro + ' || ' + ADMIN + ')'
      col.listRule = base
      col.viewRule = base
      if (gestorExtra) {
        const esc = AUTENTICADO + ' && (' + orgFiltro + ' || ' + ADMIN + ')'
        col.createRule = esc
        col.updateRule = esc
        col.deleteRule = esc
      } else {
        col.createRule = base
        col.updateRule = base
        col.deleteRule = base
      }
      app.save(col)
    }

    // empresas, rotinas: mesma org OU admin
    regras('empresas', MESMA_ORG_STAFF, true)
    regras('rotinas', MESMA_ORG_STAFF, true)

    // vistorias: executor só as atribuídas; admin vê/gerencia tudo
    const vistCol = app.findCollectionByNameOrId('vistorias')
    const VIST_ORG =
      'organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id'
    const vBase = AUTENTICADO + ' && (' + VIST_ORG + ' || ' + ADMIN + ')'
    vistCol.listRule = vBase
    vistCol.viewRule = vBase
    vistCol.createRule =
      AUTENTICADO +
      ' && (' +
      VIST_ORG +
      ' || ' +
      ADMIN +
      ") && (@request.auth.papel != 'executor' || responsavel_tecnico_id.usuario_id = @request.auth.id)"
    vistCol.updateRule = vistCol.createRule
    vistCol.deleteRule = vistCol.updateRule
    app.save(vistCol)

    // respostas: segue a vistoria
    const respCol = app.findCollectionByNameOrId('respostas_vistoria')
    const RESP_ORG =
      'vistoria_id.organizacao_id = @request.auth.organizacao_id || vistoria_id.organizacao_id.staff_ids.id ?= @request.auth.id'
    const rBase = AUTENTICADO + ' && (' + RESP_ORG + ' || ' + ADMIN + ')'
    respCol.listRule = rBase
    respCol.viewRule = rBase
    respCol.createRule =
      rBase +
      " && (@request.auth.papel != 'executor' || vistoria_id.responsavel_tecnico_id.usuario_id = @request.auth.id)"
    respCol.updateRule = respCol.createRule
    respCol.deleteRule = respCol.createRule
    app.save(respCol)

    // responsaveis_tecnicos
    regras('responsaveis_tecnicos', MESMA_ORG_STAFF, true)

    // tipos_vistoria e itens_checklist: catálogo global + org + admin
    const tipoCol = app.findCollectionByNameOrId('tipos_vistoria')
    const TIPO_ORG =
      "organizacao_id = '' || organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id"
    const tBase = AUTENTICADO + ' && (' + TIPO_ORG + ' || ' + ADMIN + ')'
    tipoCol.listRule = tBase
    tipoCol.viewRule = tBase
    tipoCol.createRule = tBase
    tipoCol.updateRule = tBase
    tipoCol.deleteRule = tBase
    app.save(tipoCol)

    const itemCol = app.findCollectionByNameOrId('itens_checklist')
    const ITEM_ORG =
      "(tipo_vistoria_id.organizacao_id = '' || tipo_vistoria_id.organizacao_id = @request.auth.organizacao_id || tipo_vistoria_id.organizacao_id.staff_ids.id ?= @request.auth.id)"
    const iBase = AUTENTICADO + ' && (' + ITEM_ORG + ' || ' + ADMIN + ')'
    itemCol.listRule = iBase
    itemCol.viewRule = iBase
    itemCol.createRule = iBase
    itemCol.updateRule = iBase
    itemCol.deleteRule = iBase
    app.save(itemCol)
  },
  (app) => {
    // down: remove os 2 valores de papel, campos staff_ids/status e o admin
    // criado pela migration (se sem organização — não apaga usuário real).
    try {
      const usersCol = app.findCollectionByNameOrId('users')
      const papel = usersCol.fields.getByName('papel')
      if (papel) {
        papel.values = papel.values.filter((v) => v !== 'admin_plataforma' && v !== 'staff_labora')
        app.save(usersCol)
      }
    } catch (_) {}
    try {
      const orgCol = app.findCollectionByNameOrId('organizacoes')
      if (orgCol.fields.getByName('staff_ids')) {
        orgCol.fields.removeByName('staff_ids')
      }
      if (orgCol.fields.getByName('status')) {
        orgCol.fields.removeByName('status')
      }
      app.save(orgCol)
    } catch (_) {}
    try {
      const admin = app.findAuthRecordByEmail('users', 'gilsonlopes2991@gmail.com')
      // só remove se foi criado por esta migration (sem organização própria)
      if (admin && !admin.getString('organizacao_id')) app.delete(admin)
    } catch (_) {}
  },
)
