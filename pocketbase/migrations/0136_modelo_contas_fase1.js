// 0136: modelo de contas, fase 1.
// 1. Amaury passa a ser dono da própria organização (a que já existia em nome
//    dele, criada no cadastro). Sai da organização de teste "Metalúrgica
//    Exemplo", e os responsáveis técnicos de lá deixam de apontar para ele.
// 2. Papel 'gestor' (criado pelo assistente do Skip) vira 'gerente', que é o
//    papel equivalente no modelo combinado: dono, gerente e executor.
// 3. Regras de acesso:
//    - admin da plataforma vê os usuários (o console mostrava "Dono: —" e 0
//      usuários); staff com acesso ao console vê só os das organizações dele;
//    - só o admin cria usuários pela API (staff não cria admin);
//    - ninguém exclui a própria conta pela API (excluir o dono apagava a
//      organização inteira em cascata), e a cascata foi desligada;
//    - dono e gerente continuam editando nome, logo, cores e dados da
//      organização, mas módulos, status, staff e dono só o admin muda.
migrate(
  (app) => {
    // ---------- 1. Amaury ----------
    let amaury = null
    try {
      amaury = app.findAuthRecordByEmail('users', 'eng.amaury.sousa@gmail.com')
    } catch (_) {
      amaury = null
    }
    if (amaury) {
      let org = null
      try {
        org = app.findFirstRecordByFilter('organizacoes', 'dono_id = {:u}', { u: amaury.id })
      } catch (_) {
        org = null
      }
      if (!org) {
        org = new Record(app.findCollectionByNameOrId('organizacoes'))
        org.set('dono_id', amaury.id)
        org.set('nome', 'Amaury Sousa')
        org.set('status', 'ativa')
        app.save(org)
      } else if (org.getString('nome') === 'Amaury Sousa — Organização') {
        org.set('nome', 'Amaury Sousa')
        app.save(org)
      }

      // Responsáveis técnicos de outras organizações ligados a ele ficam sem login.
      const rtsFora = app.findRecordsByFilter(
        'responsaveis_tecnicos',
        'usuario_id = {:u} && organizacao_id != {:o}',
        '',
        0,
        0,
        { u: amaury.id, o: org.id },
      )
      for (const rt of rtsFora) {
        rt.set('usuario_id', '')
        app.save(rt)
      }

      amaury.set('organizacao_id', org.id)
      amaury.set('papel', 'dono')
      app.save(amaury)
    }

    // ---------- 2. gestor -> gerente ----------
    const gestores = app.findRecordsByFilter('users', "papel = 'gestor'", '', 0, 0)
    for (const u of gestores) {
      u.set('papel', 'gerente')
      app.save(u)
    }

    // ---------- 3. Regras ----------
    const users = app.findCollectionByNameOrId('users')
    const verUsuarios =
      "id = @request.auth.id || @request.auth.papel = 'admin_plataforma' || " +
      "(@request.auth.papel = 'staff_labora' && @request.auth.acesso_console = true && " +
      'organizacao_id.staff_ids.id ?= @request.auth.id)'
    users.listRule = verUsuarios
    users.viewRule = verUsuarios
    users.createRule = "@request.auth.papel = 'admin_plataforma'"
    users.deleteRule = null
    app.save(users)

    const orgs = app.findCollectionByNameOrId('organizacoes')
    orgs.updateRule =
      "@request.auth.id != '' && (" +
      "@request.auth.papel = 'admin_plataforma' || (" +
      '(dono_id = @request.auth.id || (@request.auth.organizacao_id = id && ' +
      "(@request.auth.papel = 'gerente' || @request.auth.papel = 'gestor'))) && " +
      '@request.body.modulos:isset = false && @request.body.status:isset = false && ' +
      '@request.body.staff_ids:isset = false && @request.body.dono_id:isset = false))'
    const campoDono = orgs.fields.getByName('dono_id')
    if (campoDono) campoDono.cascadeDelete = false
    app.save(orgs)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.createRule =
      "@request.auth.papel = 'admin_plataforma' || (@request.auth.papel = 'staff_labora' && @request.auth.acesso_console = true)"
    users.deleteRule = 'id = @request.auth.id'
    app.save(users)

    const orgs = app.findCollectionByNameOrId('organizacoes')
    orgs.updateRule =
      "@request.auth.id != '' && (dono_id = @request.auth.id || @request.auth.papel = 'admin_plataforma' || (@request.auth.organizacao_id = id && (@request.auth.papel = 'gerente' || @request.auth.papel = 'gestor')))"
    const campoDono = orgs.fields.getByName('dono_id')
    if (campoDono) campoDono.cascadeDelete = true
    app.save(orgs)
  },
)
