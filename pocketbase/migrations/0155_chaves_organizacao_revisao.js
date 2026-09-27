// 0155: duas chaves por organização para o fluxo do técnico, e o status
// "aguardando_revisao" na vistoria.
// 1) tecnico_ve_todas_vistorias (default true = comportamento atual): quando
//    false, o técnico só vê/lista as vistorias em que é o responsável técnico
//    (ele continua podendo editar só as suas de qualquer forma — isso já era
//    regra de create/update desde a 0089; aqui é sobre visibilidade/list).
// 2) revisao_obrigatoria_tecnico (default false): quando true, ao finalizar
//    uma vistoria o técnico não conclui direto — ela vai para
//    "aguardando_revisao" até o gestor aprovar (rota /revisar).
migrate(
  (app) => {
    const orgs = app.findCollectionByNameOrId('organizacoes')
    const add = (f) => {
      if (!orgs.fields.getByName(f.name)) orgs.fields.add(f)
    }
    add(new BoolField({ name: 'tecnico_ve_todas_vistorias', required: false }))
    add(new BoolField({ name: 'revisao_obrigatoria_tecnico', required: false }))
    app.save(orgs)

    // Backfill: organizações existentes mantêm o comportamento de hoje —
    // técnico vê tudo, sem revisão obrigatória.
    const todas = app.findRecordsByFilter('organizacoes', '', '', 0, 0)
    for (const org of todas) {
      org.set('tecnico_ve_todas_vistorias', true)
      org.set('revisao_obrigatoria_tecnico', false)
      app.save(org)
    }

    // Status "aguardando_revisao" na vistoria, e o histórico de revisões
    // (mesmo padrão de vistorias.reaberturas, da migration 0124).
    const vistCol = app.findCollectionByNameOrId('vistorias')
    const status = vistCol.fields.getByName('status')
    if (status && !status.values.includes('aguardando_revisao')) {
      status.values = [...status.values, 'aguardando_revisao']
    }
    if (!vistCol.fields.getByName('revisoes')) {
      vistCol.fields.add(new JSONField({ name: 'revisoes', required: false, maxSize: 100000 }))
    }
    app.save(vistCol)

    // RLS de list/view: respeita tecnico_ve_todas_vistorias. Regra de
    // create/update/delete não muda (já restringia o técnico às vistorias
    // dele desde a 0089).
    const AUTENTICADO = "@request.auth.id != ''"
    const ADMIN = "@request.auth.papel = 'admin_plataforma'"
    const STAFF_OU_ADMIN = 'organizacao_id.staff_ids.id ?= @request.auth.id || ' + ADMIN
    const VIST_VISIBILIDADE =
      "(organizacao_id = @request.auth.organizacao_id && (@request.auth.papel != 'executor' || " +
      'organizacao_id.tecnico_ve_todas_vistorias = true || ' +
      'responsavel_tecnico_id.usuario_id = @request.auth.id))'
    const vBase = AUTENTICADO + ' && (' + VIST_VISIBILIDADE + ' || ' + STAFF_OU_ADMIN + ')'
    vistCol.listRule = vBase
    vistCol.viewRule = vBase
    app.save(vistCol)

    const respCol = app.findCollectionByNameOrId('respostas_vistoria')
    const RESP_VISIBILIDADE =
      "(vistoria_id.organizacao_id = @request.auth.organizacao_id && (@request.auth.papel != 'executor' || " +
      'vistoria_id.organizacao_id.tecnico_ve_todas_vistorias = true || ' +
      'vistoria_id.responsavel_tecnico_id.usuario_id = @request.auth.id))'
    const RESP_STAFF_OU_ADMIN =
      'vistoria_id.organizacao_id.staff_ids.id ?= @request.auth.id || ' + ADMIN
    const rBase = AUTENTICADO + ' && (' + RESP_VISIBILIDADE + ' || ' + RESP_STAFF_OU_ADMIN + ')'
    respCol.listRule = rBase
    respCol.viewRule = rBase
    app.save(respCol)
  },
  (app) => {
    const vistCol = app.findCollectionByNameOrId('vistorias')
    const VIST_ORG =
      'organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id'
    const vBase =
      "@request.auth.id != '' && (" + VIST_ORG + " || @request.auth.papel = 'admin_plataforma')"
    vistCol.listRule = vBase
    vistCol.viewRule = vBase
    const status = vistCol.fields.getByName('status')
    if (status) status.values = status.values.filter((v) => v !== 'aguardando_revisao')
    if (vistCol.fields.getByName('revisoes')) vistCol.fields.removeByName('revisoes')
    app.save(vistCol)

    const respCol = app.findCollectionByNameOrId('respostas_vistoria')
    const RESP_ORG =
      'vistoria_id.organizacao_id = @request.auth.organizacao_id || vistoria_id.organizacao_id.staff_ids.id ?= @request.auth.id'
    const rBase =
      "@request.auth.id != '' && (" + RESP_ORG + " || @request.auth.papel = 'admin_plataforma')"
    respCol.listRule = rBase
    respCol.viewRule = rBase
    app.save(respCol)

    const orgs = app.findCollectionByNameOrId('organizacoes')
    if (orgs.fields.getByName('tecnico_ve_todas_vistorias')) {
      orgs.fields.removeByName('tecnico_ve_todas_vistorias')
    }
    if (orgs.fields.getByName('revisao_obrigatoria_tecnico')) {
      orgs.fields.removeByName('revisao_obrigatoria_tecnico')
    }
    app.save(orgs)
  },
)
