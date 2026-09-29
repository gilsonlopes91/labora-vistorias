// Adiciona o campo epis_nr06 (JSON) na tabela epis_catalogo para suportar
// a vinculação estruturada de EPIs conforme o Anexo I da NR-06 (categorias A a I),
// mantendo compatibilidade com o campo agentes_protegidos_ids.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('epis_catalogo')
    if (!col.fields.getByName('epis_nr06')) {
      col.fields.add(
        new JSONField({
          name: 'epis_nr06',
          required: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('epis_catalogo')
      const campo = col.fields.getByName('epis_nr06')
      if (campo) {
        col.fields.removeByName('epis_nr06')
        app.save(col)
      }
    } catch (_) {}
  },
)
