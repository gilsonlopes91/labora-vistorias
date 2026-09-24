// Migração 0118: Cria usuário de teste Amaury Sousa (executor / cliente de teste)
// Email: eng.amaury.sousa@gmail.com
// Senha: labora123
// Papel: executor (mesmo papel de cliente@empresaexemplo.com.br)
// Organização: Mesma organização de cliente@empresaexemplo.com.br ("Metalúrgica Exemplo Ltda")
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const emailTarget = 'eng.amaury.sousa@gmail.com'
    const emailClienteRef = 'cliente@empresaexemplo.com.br'

    // 1. Obter a organização a partir do usuário cliente existente
    let organizacaoId = ''
    try {
      const clienteRef = app.findAuthRecordByEmail('_pb_users_auth_', emailClienteRef)
      organizacaoId = clienteRef.getString('organizacao_id')
    } catch (_) {
      organizacaoId = ''
    }

    // Se por acaso não achar pelo clienteRef, busca a organização "Metalúrgica Exemplo Ltda"
    if (!organizacaoId) {
      try {
        const org = app.findFirstRecordByData('organizacoes', 'nome', 'Metalúrgica Exemplo Ltda')
        if (org) {
          organizacaoId = org.id
        }
      } catch (_) {}
    }

    // 2. Criar ou atualizar o usuário eng.amaury.sousa@gmail.com (idempotente)
    let user = null
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', emailTarget)
    } catch (_) {
      user = null
    }

    if (!user) {
      user = new Record(usersCol)
      user.setEmail(emailTarget)
    }

    user.setPassword('labora123')
    user.setVerified(true)
    user.set('name', 'Amaury Sousa')
    user.set('papel', 'executor')
    user.set('trocar_senha', false)
    user.set('acesso_console', false)
    if (organizacaoId) {
      user.set('organizacao_id', organizacaoId)
    }

    app.save(user)
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'eng.amaury.sousa@gmail.com')
      app.delete(user)
    } catch (_) {}
  },
)
