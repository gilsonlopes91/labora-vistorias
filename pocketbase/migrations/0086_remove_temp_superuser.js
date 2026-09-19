// Remove o superusuário temporário criado pela migration 0074
// (auditoria.temp@labora.com) — usado só na auditoria manual das multas.
// Fechamento do achado crítico da auditoria de segurança de 17/09.
migrate(
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_superusers', 'auditoria.temp@labora.com')
      if (record) app.delete(record)
    } catch (_) {}
  },
  (app) => {
    // down: não recria — o superusuário temporário não deve voltar.
  },
)
