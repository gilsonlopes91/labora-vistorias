// Migration 0174 — corrige limite_usuarios da organização Horizonte de 4 → 3.
// O plano equipe permite 3 vagas além do titular; o valor 4 foi inserido
// por engano e contradiz a regra de negócio.
migrate(
  (app) => {
    app
      .db()
      .newQuery(
        `UPDATE organizacoes
         SET limite_usuarios = 3
         WHERE nome = 'Horizonte'
           AND limite_usuarios = 4`,
      )
      .execute()
  },
  (app) => {
    app
      .db()
      .newQuery(
        `UPDATE organizacoes
         SET limite_usuarios = 4
         WHERE nome = 'Horizonte'
           AND limite_usuarios = 3`,
      )
      .execute()
  },
)
