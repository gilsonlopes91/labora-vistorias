// Migração 0135: Adiciona 'gestor' aos valores permitidos de papel em users
// e promove o usuário eng.amaury.sousa@gmail.com a gestor, mantendo organização
// ("Metalúrgica Exemplo Ltda"), nome ("Amaury Sousa") e conta verificada.
// Também atualiza as regras de organizacoes para que o papel gestor possa atualizar
// a própria organização (logo, cores etc.), assim como gerente/dono.
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('users')
    const papel = usersCol.fields.getByName('papel')
    if (papel && !papel.values.includes('gestor')) {
      papel.values = [...papel.values, 'gestor']
      app.save(usersCol)
    }

    // Permite que gestor também edite organizacao se for da mesma organização
    try {
      const orgCol = app.findCollectionByNameOrId('organizacoes')
      orgCol.updateRule =
        "@request.auth.id != '' && (dono_id = @request.auth.id || @request.auth.papel = 'admin_plataforma' || (@request.auth.organizacao_id = id && (@request.auth.papel = 'gerente' || @request.auth.papel = 'gestor')))"
      app.save(orgCol)
    } catch (_) {}

    // Promove eng.amaury.sousa@gmail.com
    const emailTarget = 'eng.amaury.sousa@gmail.com'
    try {
      const user = app.findAuthRecordByEmail('users', emailTarget)
      user.set('papel', 'gestor')
      app.save(user)
    } catch (err) {
      console.log(
        '0135: Usuário eng.amaury.sousa@gmail.com não encontrado:',
        err && err.message ? err.message : String(err),
      )
    }
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('users', 'eng.amaury.sousa@gmail.com')
      user.set('papel', 'executor')
      app.save(user)
    } catch (_) {}

    try {
      const orgCol = app.findCollectionByNameOrId('organizacoes')
      orgCol.updateRule =
        "@request.auth.id != '' && (dono_id = @request.auth.id || @request.auth.papel = 'admin_plataforma' || (@request.auth.organizacao_id = id && @request.auth.papel = 'gerente'))"
      app.save(orgCol)
    } catch (_) {}

    try {
      const usersCol = app.findCollectionByNameOrId('users')
      const papel = usersCol.fields.getByName('papel')
      if (papel && papel.values.includes('gestor')) {
        papel.values = papel.values.filter((v) => v !== 'gestor')
        app.save(usersCol)
      }
    } catch (_) {}
  },
)
