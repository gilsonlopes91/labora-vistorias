// Migração 0108 — fecha a criação de manual_imagens (só admin da plataforma)
// depois que as capturas do manual foram carregadas, e remove a captura
// duplicada de "vistoria_resumo" (a primeira, tirada antes do ajuste).
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('manual_imagens')
    col.createRule = "@request.auth.papel = 'admin_plataforma'"
    app.save(col)
    try {
      const velha = app.findRecordById('manual_imagens', 'vy0qiqfinav6to5')
      app.delete(velha)
    } catch (_) {}
  },
  (app) => {
    const col = app.findCollectionByNameOrId('manual_imagens')
    col.createRule = "@request.auth.id != ''"
    app.save(col)
  },
)
