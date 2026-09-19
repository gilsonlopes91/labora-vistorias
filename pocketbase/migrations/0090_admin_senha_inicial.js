// Onda 1 — garante o admin total com senha conhecida.
// A 0089 só promoveu o papel (o usuário já existia, senha mantida). Esta
// migration REDEFINE a senha de gilsonlopes2991@gmail.com para uma inicial
// conhecida (o dono troca no primeiro login). Se o usuário não existir, cria.
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('users')
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
    }
    admin.setPassword('Labora@2026')
    admin.setVerified(true)
    admin.set('papel', 'admin_plataforma')
    app.save(admin)
  },
  (app) => {
    // down: nada a desfazer (não dá para restaurar a senha anterior).
  },
)
