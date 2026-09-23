// Registro do aceite dos Termos de Uso e da Política de Privacidade
// (versão aceita e data), na lista de espera e na conta do usuário.
migrate(
  (app) => {
    for (const nome of ['lista_espera', 'users']) {
      const col = app.findCollectionByNameOrId(nome)
      if (!col.fields.getByName('termos_versao'))
        col.fields.add(new TextField({ name: 'termos_versao', max: 20 }))
      if (!col.fields.getByName('termos_aceitos_em'))
        col.fields.add(new DateField({ name: 'termos_aceitos_em' }))
      app.save(col)
    }
  },
  (app) => {
    for (const nome of ['lista_espera', 'users']) {
      const col = app.findCollectionByNameOrId(nome)
      for (const n of ['termos_versao', 'termos_aceitos_em']) {
        const f = col.fields.getByName(n)
        if (f) col.fields.removeById(f.id)
      }
      app.save(col)
    }
  },
)
