// Migração 0121: promove a conta de teste do cliente a dono da organização
// "Metalúrgica Exemplo Ltda", para testar o app como um cliente pagante veria
// (acesso a Equipe, Modelos de proposta, Configurações completas etc.).
// A conta já é dono_id da organização; só o papel estava como 'executor'.
migrate(
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('users', 'cliente@empresaexemplo.com.br')
      user.set('papel', 'dono')
      app.save(user)
    } catch (e) {
      console.log('0121: conta de teste não encontrada:', e && e.message ? e.message : String(e))
    }
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('users', 'cliente@empresaexemplo.com.br')
      user.set('papel', 'executor')
      app.save(user)
    } catch (_) {}
  },
)
