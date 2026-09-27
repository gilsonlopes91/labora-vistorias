// 0159: registro profissional para todos os gestores (não só quem foi criado
// depois desta migration — backfill dos que já existem) e o novo papel
// "administrativo" (agenda, orçamentos e cadastro de empresas; não vistoria,
// não assina, sem registro profissional).
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('users')
    const papel = usersCol.fields.getByName('papel')
    if (papel && !papel.values.includes('administrativo')) {
      papel.values = [...papel.values, 'administrativo']
    }
    app.save(usersCol)

    // Backfill: gestores existentes (dono/gerente/gestor) sem responsável
    // técnico próprio ganham um, com o nome da conta — editável depois em
    // Configurações ("Meu registro profissional").
    const gestores = app.findRecordsByFilter(
      'users',
      "(papel = 'dono' || papel = 'gerente' || papel = 'gestor') && organizacao_id != ''",
      '',
      0,
      0,
    )
    for (const user of gestores) {
      const orgId = user.getString('organizacao_id')
      let temRt = false
      try {
        app.findFirstRecordByFilter(
          'responsaveis_tecnicos',
          'organizacao_id = {:o} && usuario_id = {:u}',
          {
            o: orgId,
            u: user.id,
          },
        )
        temRt = true
      } catch (_) {
        temRt = false
      }
      if (temRt) continue
      const rt = new Record(app.findCollectionByNameOrId('responsaveis_tecnicos'))
      rt.set('organizacao_id', orgId)
      rt.set('nome', user.getString('name') || user.getString('email'))
      rt.set('tipo_registro', 'Outro')
      rt.set('numero_registro', '—')
      rt.set('usuario_id', user.id)
      app.save(rt)
    }

    // vistorias e respostas_vistoria: o bypass de "não é executor" não vale
    // para administrativo (que nunca tem responsável técnico próprio) — sem
    // isso, administrativo poderia criar/editar vistoria de qualquer um.
    const AUTENTICADO = "@request.auth.id != ''"
    const ADMIN = "@request.auth.papel = 'admin_plataforma'"
    const NAO_EXECUTOR_NEM_ADMINISTRATIVO =
      "(@request.auth.papel != 'executor' && @request.auth.papel != 'administrativo')"

    const vistCol = app.findCollectionByNameOrId('vistorias')
    const VIST_ORG =
      'organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id'
    const vistCreate =
      AUTENTICADO +
      ' && (' +
      VIST_ORG +
      ' || ' +
      ADMIN +
      ') && (' +
      NAO_EXECUTOR_NEM_ADMINISTRATIVO +
      ' || responsavel_tecnico_id.usuario_id = @request.auth.id)'
    vistCol.createRule = vistCreate
    vistCol.updateRule = vistCreate
    vistCol.deleteRule = vistCreate
    app.save(vistCol)

    const respCol = app.findCollectionByNameOrId('respostas_vistoria')
    const RESP_ORG =
      'vistoria_id.organizacao_id = @request.auth.organizacao_id || vistoria_id.organizacao_id.staff_ids.id ?= @request.auth.id'
    const respCreate =
      AUTENTICADO +
      ' && (' +
      RESP_ORG +
      ' || ' +
      ADMIN +
      ') && (' +
      NAO_EXECUTOR_NEM_ADMINISTRATIVO +
      ' || vistoria_id.responsavel_tecnico_id.usuario_id = @request.auth.id)'
    respCol.createRule = respCreate
    respCol.updateRule = respCreate
    respCol.deleteRule = respCreate
    app.save(respCol)
  },
  (app) => {
    const AUTENTICADO = "@request.auth.id != ''"
    const ADMIN = "@request.auth.papel = 'admin_plataforma'"
    const NAO_EXECUTOR = "@request.auth.papel != 'executor'"

    const vistCol = app.findCollectionByNameOrId('vistorias')
    const VIST_ORG =
      'organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id'
    const vistCreate =
      AUTENTICADO +
      ' && (' +
      VIST_ORG +
      ' || ' +
      ADMIN +
      ') && (' +
      NAO_EXECUTOR +
      ' || responsavel_tecnico_id.usuario_id = @request.auth.id)'
    vistCol.createRule = vistCreate
    vistCol.updateRule = vistCreate
    vistCol.deleteRule = vistCreate
    app.save(vistCol)

    const respCol = app.findCollectionByNameOrId('respostas_vistoria')
    const RESP_ORG =
      'vistoria_id.organizacao_id = @request.auth.organizacao_id || vistoria_id.organizacao_id.staff_ids.id ?= @request.auth.id'
    const respCreate =
      AUTENTICADO +
      ' && (' +
      RESP_ORG +
      ' || ' +
      ADMIN +
      ') && (' +
      NAO_EXECUTOR +
      ' || vistoria_id.responsavel_tecnico_id.usuario_id = @request.auth.id)'
    respCol.createRule = respCreate
    respCol.updateRule = respCreate
    respCol.deleteRule = respCreate
    app.save(respCol)

    // Backfill de responsaveis_tecnicos não é revertido (dado criado, não
    // uma trava de acesso — apagar perderia registro profissional preenchido
    // depois pelo usuário).

    const usersCol = app.findCollectionByNameOrId('users')
    const papel = usersCol.fields.getByName('papel')
    if (papel) papel.values = papel.values.filter((v) => v !== 'administrativo')
    app.save(usersCol)
  },
)
