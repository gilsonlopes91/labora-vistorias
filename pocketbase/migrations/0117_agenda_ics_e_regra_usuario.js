// 1) users.agenda_token: chave secreta do link de assinatura da agenda (.ics),
//    usada por Google Agenda, Outlook e iPhone para mostrar as vistorias.
// 2) Correção de segurança: o próprio usuário continua podendo editar o seu
//    cadastro (nome, senha, aceite dos termos, link da agenda), mas não pode
//    mais alterar papel, organização, acesso ao console nem "verificado".
//    Essas mudanças só acontecem pelas rotas de servidor (convite de equipe e
//    console do admin), que usam $app e não passam por esta regra.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('agenda_token'))
      users.fields.add(new TextField({ name: 'agenda_token', max: 80 }))
    users.updateRule =
      'id = @request.auth.id && @request.body.papel:isset = false && @request.body.organizacao_id:isset = false && @request.body.acesso_console:isset = false && @request.body.verified:isset = false'
    users.indexes = (users.indexes || []).concat([
      "CREATE UNIQUE INDEX idx_users_agenda_token ON users (agenda_token) WHERE agenda_token != ''",
    ])
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.updateRule = 'id = @request.auth.id'
    users.indexes = (users.indexes || []).filter((i) => i.indexOf('idx_users_agenda_token') < 0)
    const f = users.fields.getByName('agenda_token')
    if (f) users.fields.removeById(f.id)
    app.save(users)
  },
)
