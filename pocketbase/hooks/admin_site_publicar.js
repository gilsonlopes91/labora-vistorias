// Publica o rascunho de uma página do site: copia rascunho -> publicado, guarda
// uma versão no histórico (mantém as 30 mais recentes por página).
// POST /backend/v1/admin/site/publicar  { chave }
// Acesso: admin_plataforma OU staff_labora com acesso_console.
// (reenviado para forçar o backend a recarregar este hook)
routerAdd(
  'POST',
  '/backend/v1/admin/site/publicar',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')
    const papel = auth.getString('papel')
    const permitido =
      papel === 'admin_plataforma' || (papel === 'staff_labora' && auth.getBool('acesso_console'))
    if (!permitido) return e.forbiddenError('acesso restrito')

    const body = e.requestInfo().body || {}
    const chave = String(body.chave || '')
    if (['home', 'rodape'].indexOf(chave) < 0) return e.badRequestError('página inválida')

    let pagina
    try {
      pagina = $app.findFirstRecordByData('site_paginas', 'chave', chave)
    } catch (_) {
      return e.notFoundError('Salve um rascunho antes de publicar.')
    }

    const raw = pagina.get('rascunho')
    const txt = raw ? toString(raw) : ''
    if (!txt || txt === 'null') return e.badRequestError('Não há rascunho para publicar.')

    let conteudo
    try {
      conteudo = JSON.parse(txt)
    } catch (_) {
      return e.badRequestError('Rascunho inválido.')
    }

    const agora = new Date().toISOString().replace('T', ' ')
    const nome = auth.getString('name') || auth.getString('email')

    pagina.set('publicado', conteudo)
    pagina.set('publicado_em', agora)
    pagina.set('publicado_por', nome)
    $app.save(pagina)

    const versao = new Record($app.findCollectionByNameOrId('site_versoes'))
    versao.set('chave', chave)
    versao.set('conteudo', conteudo)
    versao.set('usuario_nome', nome)
    $app.save(versao)

    // Poda: mantém só as 30 mais recentes desta página.
    try {
      const antigas = $app.findRecordsByFilter(
        'site_versoes',
        'chave = {:c}',
        '-created',
        100,
        30,
        {
          c: chave,
        },
      )
      for (const v of antigas) $app.delete(v)
    } catch (_) {
      // sem versões antigas
    }

    return e.json(200, { ok: true, publicado_em: agora, publicado_por: nome })
  },
  $apis.requireAuth(),
)
