migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const email = 'admin@labora.com'

    // Idempotente: se já existir, apenas atualiza a senha e garante verificado
    let record
    try {
      record = app.findAuthRecordByEmail('_pb_users_auth_', email)
    } catch (_) {
      record = new Record(users)
      record.setEmail(email)
    }

    record.setPassword('labora123')
    record.setVerified(true)
    record.set('name', 'Administrador Labora')
    app.save(record)

    // Garantir que a organização padrão existe para este usuário
    try {
      let jaTemOrg = true
      try {
        app.findFirstRecordByFilter('organizacoes', "dono_id = '" + record.id + "'")
      } catch (_) {
        jaTemOrg = false
      }

      if (!jaTemOrg) {
        const orgCol = app.findCollectionByNameOrId('organizacoes')
        const org = new Record(orgCol)
        org.set('dono_id', record.id)
        org.set('nome', 'Labora Vistoria — Matriz')
        app.save(org)
      }
    } catch (e) {
      console.log('Aviso ao associar organização do admin:', e && e.message ? e.message : String(e))
    }
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'admin@labora.com')
      app.delete(record)
    } catch (_) {}
  },
)
