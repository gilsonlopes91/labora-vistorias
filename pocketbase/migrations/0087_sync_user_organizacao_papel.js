// Migração 0087: sincroniza organizacao_id e papel 'dono' para usuários cadastrados
// que possuem organização criada mas não tiveram os campos preenchidos em users.
migrate(
  (app) => {
    // 1. Busca todos os usuários
    const users = app.findRecordsByFilter('users', 'id != ""', '-created', 0, 0)
    users.forEach((user) => {
      let needsSave = false

      // Se não tiver papel, define como dono por padrão
      if (!user.getString('papel')) {
        user.set('papel', 'dono')
        needsSave = true
      }

      // Se não tiver organizacao_id, procura a organização cujo dono é este usuário
      if (!user.getString('organizacao_id')) {
        try {
          const org = app.findFirstRecordByFilter('organizacoes', "dono_id = '" + user.id + "'")
          if (org) {
            user.set('organizacao_id', org.id)
            needsSave = true
          }
        } catch (_) {
          // Usuário não é dono de nenhuma organização existente
        }
      }

      if (needsSave) {
        app.save(user)
      }
    })
  },
  (app) => {
    // Rollback no-op
  },
)
