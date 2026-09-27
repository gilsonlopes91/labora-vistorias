// Etapa 6 do plano de perfis/assinatura/portal do cliente: planos (definem
// vagas) e vencimento. `plano`/`limite_usuarios`/`vencimento` só o admin da
// plataforma edita (mesmo tratamento que já existe para `modulos`/`status`).
// Organizações existentes recebem plano 'empresa' com vagas de sobra, para
// ninguém ficar travado por essa migration.
migrate(
  (app) => {
    const orgs = app.findCollectionByNameOrId('organizacoes')

    const add = (f) => {
      if (!orgs.fields.getByName(f.name)) orgs.fields.add(f)
    }
    add(
      new SelectField({
        name: 'plano',
        values: ['individual', 'equipe', 'escritorio', 'empresa'],
        maxSelect: 1,
      }),
    )
    add(new NumberField({ name: 'limite_usuarios', onlyInt: true, min: 0 }))
    add(new DateField({ name: 'vencimento' }))

    const status = orgs.fields.getByName('status')
    if (status && !status.values.includes('vencida')) {
      status.values = [...status.values, 'vencida']
    }

    orgs.updateRule =
      "@request.auth.id != '' && (@request.auth.papel = 'admin_plataforma' || ((dono_id = @request.auth.id || (@request.auth.organizacao_id = id && (@request.auth.papel = 'gerente' || @request.auth.papel = 'gestor'))) && @request.body.modulos:isset = false && @request.body.status:isset = false && @request.body.staff_ids:isset = false && @request.body.dono_id:isset = false && @request.body.plano:isset = false && @request.body.limite_usuarios:isset = false && @request.body.vencimento:isset = false))"
    app.save(orgs)

    const todas = app.findRecordsByFilter('organizacoes', "id != ''", '', 0, 0)
    for (const org of todas) {
      if (!org.getString('plano')) org.set('plano', 'empresa')
      if (!org.getInt('limite_usuarios')) org.set('limite_usuarios', 999)
      app.save(org)
    }
  },
  (app) => {
    const orgs = app.findCollectionByNameOrId('organizacoes')
    orgs.updateRule =
      "@request.auth.id != '' && (@request.auth.papel = 'admin_plataforma' || ((dono_id = @request.auth.id || (@request.auth.organizacao_id = id && (@request.auth.papel = 'gerente' || @request.auth.papel = 'gestor'))) && @request.body.modulos:isset = false && @request.body.status:isset = false && @request.body.staff_ids:isset = false && @request.body.dono_id:isset = false))"
    const status = orgs.fields.getByName('status')
    if (status) status.values = status.values.filter((v) => v !== 'vencida')
    orgs.fields.removeByName('plano')
    orgs.fields.removeByName('limite_usuarios')
    orgs.fields.removeByName('vencimento')
    app.save(orgs)
  },
)
