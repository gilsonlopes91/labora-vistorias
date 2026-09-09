// Ao criar um novo usuário, cria automaticamente a organização dele.
// Isso deixa o app pronto para múltiplos usuários/organizações no futuro
// (ex.: se o Labora Vistoria virar um produto por assinatura) sem exigir
// nenhuma tela extra de "criar organização" hoje.
onRecordAfterCreateSuccess((e) => {
  try {
    let jaTem = true
    try {
      $app.findFirstRecordByFilter('organizacoes', "dono_id = '" + e.record.id + "'")
    } catch (_) {
      jaTem = false
    }

    if (!jaTem) {
      const orgCol = $app.findCollectionByNameOrId('organizacoes')
      const nomeUsuario = e.record.getString('name')
      const org = new Record(orgCol)
      org.set('dono_id', e.record.id)
      org.set('nome', nomeUsuario ? nomeUsuario + ' — Organização' : 'Minha organização')
      $app.save(org)
    }
  } catch (err) {
    $app
      .logger()
      .error(
        'falha ao auto-criar organizacao',
        'error',
        err && err.message ? err.message : String(err),
        'userId',
        e.record.id,
      )
  }

  e.next()
}, 'users')
