// Migração 0091: Redefine a senha de gilsonlopes2991@gmail.com para 'labora123'
// (mesma credencial de teste usada por admin@labora.com), garantindo hash válido
// e limpando tokens residuais de reset de senha se existirem.
migrate(
  (app) => {
    const emailAlvo = 'gilsonlopes2991@gmail.com'
    const usersCol = app.findCollectionByNameOrId('users')

    let user = null
    try {
      user = app.findAuthRecordByEmail('users', emailAlvo)
    } catch (_) {
      try {
        user = app.findAuthRecordByEmail('_pb_users_auth_', emailAlvo)
      } catch (_) {
        user = null
      }
    }

    if (!user) {
      user = new Record(usersCol)
      user.setEmail(emailAlvo)
      user.set('name', 'Gilson Lopes de Souza Junior')
    }

    // Define senha 'labora123' com hash válido do PocketBase
    user.setPassword('labora123')
    user.setVerified(true)
    user.set('papel', 'admin_plataforma')

    // Salva o registro atualizado
    app.save(user)

    // Limpa tokens residuais ou reseta tokenKey se aplicável via raw SQL
    try {
      app
        .db()
        .newQuery("UPDATE users SET resetPasswordToken = '' WHERE id = {:id}")
        .bind({ id: user.id })
        .execute()
    } catch (_) {
      // campo resetPasswordToken pode ser gerenciado internamente pelo core
    }
  },
  (app) => {
    // down: irreversível restaurar hash antigo da senha
  },
)
