// Migration 0173 — deduplica respostas_vistoria e adiciona UNIQUE INDEX
// em (vistoria_id, item_checklist_id) para impedir duplicatas futuras.
migrate(
  (app) => {
    // Remove duplicatas: mantém a linha com maior id (mais recente) por par.
    app
      .db()
      .newQuery(
        `DELETE FROM respostas_vistoria
         WHERE id NOT IN (
           SELECT MAX(id)
           FROM respostas_vistoria
           GROUP BY vistoria_id, item_checklist_id
         )`,
      )
      .execute()

    // Cria o índice único para garantir que não entrem mais duplicatas.
    app
      .db()
      .newQuery(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_respostas_vistoria_item
         ON respostas_vistoria (vistoria_id, item_checklist_id)`,
      )
      .execute()
  },
  (app) => {
    // Rollback: remove o índice (não é possível restaurar duplicatas apagadas).
    app.db().newQuery(`DROP INDEX IF EXISTS idx_respostas_vistoria_item`).execute()
  },
)
