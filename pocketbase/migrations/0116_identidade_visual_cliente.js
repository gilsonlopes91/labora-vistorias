// A identidade visual (logo e cores) é do cliente: além do dono da organização
// e do admin da plataforma, o gerente da organização também pode alterar.
migrate(
  (app) => {
    const org = app.findCollectionByNameOrId('organizacoes')
    org.updateRule =
      "@request.auth.id != '' && (dono_id = @request.auth.id || @request.auth.papel = 'admin_plataforma' || (@request.auth.organizacao_id = id && @request.auth.papel = 'gerente'))"
    app.save(org)
  },
  (app) => {
    const org = app.findCollectionByNameOrId('organizacoes')
    org.updateRule =
      "@request.auth.id != '' && (dono_id = @request.auth.id || @request.auth.papel = 'admin_plataforma')"
    app.save(org)
  },
)
