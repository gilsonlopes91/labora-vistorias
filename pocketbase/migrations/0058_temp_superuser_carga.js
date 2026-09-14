migrate(
  (app) => {
    // TEMPORÁRIA — carga dos itens de checklist das NRs via API (remover após a carga).
    // Cria superusuário de serviço idempotente (upsert por e-mail).
    const col = app.findCollectionByNameOrId('_superusers')
    let rec
    try {
      rec = app.findAuthRecordByEmail('_superusers', 'seed-temp@labora.dev')
    } catch (_) {
      rec = new Record(col)
      rec.setEmail('seed-temp@labora.dev')
    }
    rec.setPassword('LvSeed!2026#Temp')
    app.save(rec)
  },
  (app) => {
    try {
      app.delete(app.findAuthRecordByEmail('_superusers', 'seed-temp@labora.dev'))
    } catch (_) {}
  },
)
