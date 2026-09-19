// Pacotes por organização + senha com troca obrigatória + acesso ao console
// para staff + textos editáveis do site.
// 1) organizacoes.modulos (JSON): {auditoria, relatorios, formularios} — o que
//    o cliente contratou. Ausente/false = módulo desligado no app.
// 2) users.trocar_senha: quando true, o próximo login cai na tela de
//    redefinição obrigatória.
// 3) users.acesso_console: staff_labora com true também gerencia contas.
// 4) coleção conteudo_site: textos do site (login) editáveis no console.
migrate(
  (app) => {
    // --- organizacoes.modulos ---
    const orgCol = app.findCollectionByNameOrId('organizacoes')
    if (!orgCol.fields.getByName('modulos')) {
      orgCol.fields.add(new JSONField({ name: 'modulos', maxSize: 2000 }))
    }
    app.save(orgCol)

    const orgs = app.findRecordsByFilter('organizacoes', 'id != ""', '-created', 0, 0)
    orgs.forEach((org) => {
      if (!org.getString('modulos')) {
        org.set('modulos', JSON.stringify({ auditoria: true, relatorios: true, formularios: true }))
        app.save(org)
      }
    })

    // --- users: trocar_senha + acesso_console ---
    const usersCol = app.findCollectionByNameOrId('users')
    if (!usersCol.fields.getByName('trocar_senha')) {
      usersCol.fields.add(new BoolField({ name: 'trocar_senha' }))
    }
    if (!usersCol.fields.getByName('acesso_console')) {
      usersCol.fields.add(new BoolField({ name: 'acesso_console' }))
    }
    app.save(usersCol)

    // staff com acesso ao console também pode editar a própria org (pacote).
    // DEPOIS de users ter os campos — a regra referencia @request.auth.acesso_console.
    orgCol.updateRule =
      "@request.auth.id != '' && (dono_id = @request.auth.id || @request.auth.papel = 'admin_plataforma' || (@request.auth.papel = 'staff_labora' && @request.auth.acesso_console))"
    app.save(orgCol)

    // --- conteudo_site ---
    let col = null
    try {
      col = app.findCollectionByNameOrId('conteudo_site')
    } catch (_) {
      col = null
    }
    if (!col) {
      col = new Collection({
        name: 'conteudo_site',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule:
          "@request.auth.papel = 'admin_plataforma' || @request.auth.papel = 'staff_labora'",
        updateRule:
          "@request.auth.papel = 'admin_plataforma' || @request.auth.papel = 'staff_labora'",
        deleteRule: "@request.auth.papel = 'admin_plataforma'",
        fields: [
          { name: 'chave', type: 'text', required: true, min: 2, max: 60 },
          { name: 'valor', type: 'text', maxSize: 3000 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_conteudo_chave ON conteudo_site (chave)'],
      })
      app.save(col)

      const seeds = [
        {
          k: 'login_badge',
          v: 'Gestão de vistorias e inspeções de SST',
        },
        {
          k: 'login_titulo_1',
          v: 'Sua operação de segurança do trabalho',
        },
        { k: 'login_titulo_destaque', v: 'organizada no automático' },
        {
          k: 'login_subtitulo',
          v: 'O que vai fazer, onde, quem vai fazer e quando — agenda que se renova sozinha, vistoria guiada com foto e GPS, e o relatório com multa NR-28 pronto antes de você sair do cliente.',
        },
      ]
      seeds.forEach((s) => {
        const r = new Record(col)
        r.set('chave', s.k)
        r.set('valor', s.v)
        app.save(r)
      })
    }
  },
  (app) => {
    try {
      const orgCol = app.findCollectionByNameOrId('organizacoes')
      if (orgCol.fields.getByName('modulos')) orgCol.fields.removeByName('modulos')
      orgCol.updateRule =
        "@request.auth.id != '' && (dono_id = @request.auth.id || @request.auth.papel = 'admin_plataforma')"
      app.save(orgCol)
    } catch (_) {}
    try {
      const usersCol = app.findCollectionByNameOrId('users')
      if (usersCol.fields.getByName('trocar_senha')) {
        usersCol.fields.removeByName('trocar_senha')
      }
      if (usersCol.fields.getByName('acesso_console')) {
        usersCol.fields.removeByName('acesso_console')
      }
      app.save(usersCol)
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('conteudo_site'))
    } catch (_) {}
  },
)
