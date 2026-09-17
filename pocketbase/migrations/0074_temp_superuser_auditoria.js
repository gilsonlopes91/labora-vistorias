// Superusuário TEMPORÁRIO para a auditoria manual das multas (carga via API
// de 4 empresas + ~20 mil respostas N/C). Removido pela própria down-migration
// após a auditoria — não usar em produção.
migrate(
  (app) => {
    const superusers = app.findCollectionByNameOrId('_superusers')
    const email = 'auditoria.temp@labora.com'

    // Idempotente: se já existir, apenas garante a senha
    let record
    try {
      record = app.findAuthRecordByEmail('_superusers', email)
    } catch (_) {
      record = new Record(superusers)
      record.setEmail(email)
    }

    record.setPassword('Auditoria@2026')
    record.setVerified(true)
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_superusers', 'auditoria.temp@labora.com')
      app.delete(record)
    } catch (_) {}
  },
)
