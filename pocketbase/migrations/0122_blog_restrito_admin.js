// Migração 0122: o blog é da Labora. Só a administração da plataforma
// (admin_plataforma, ou staff_labora com acesso ao console) cria, edita,
// publica ou apaga artigos e autores. Visitantes e clientes veem só os
// artigos publicados; rascunhos ficam restritos à administração.
migrate(
  (app) => {
    const ADMIN =
      "(@request.auth.papel = 'admin_plataforma' || (@request.auth.papel = 'staff_labora' && @request.auth.acesso_console = true))"

    const artigos = app.findCollectionByNameOrId('artigos')
    artigos.listRule = "status = 'publicado' || " + ADMIN
    artigos.viewRule = "status = 'publicado' || " + ADMIN
    artigos.createRule = ADMIN
    artigos.updateRule = ADMIN
    artigos.deleteRule = ADMIN
    app.save(artigos)

    const autores = app.findCollectionByNameOrId('blog_autores')
    autores.listRule = ''
    autores.viewRule = ''
    autores.createRule = ADMIN
    autores.updateRule = ADMIN
    autores.deleteRule = ADMIN
    app.save(autores)
  },
  (app) => {
    const AUT = "@request.auth.id != ''"
    const artigos = app.findCollectionByNameOrId('artigos')
    artigos.listRule = "status = 'publicado' || " + AUT
    artigos.viewRule = "status = 'publicado' || " + AUT
    artigos.createRule = AUT
    artigos.updateRule = AUT
    artigos.deleteRule = AUT
    app.save(artigos)

    const autores = app.findCollectionByNameOrId('blog_autores')
    autores.createRule = AUT
    autores.updateRule = AUT
    autores.deleteRule = AUT
    app.save(autores)
  },
)
