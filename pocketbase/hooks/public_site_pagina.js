// Rota pública (sem login): devolve o conteúdo PUBLICADO de uma página do site
// (home, rodapé). Nunca devolve o rascunho. Se nada foi publicado, devolve
// conteudo null e o site usa os textos originais que estão no código.
// GET /backend/v1/public/site/{chave}
routerAdd('GET', '/backend/v1/public/site/{chave}', (e) => {
  const chave = e.request.pathValue('chave')
  if (['home', 'rodape'].indexOf(chave) < 0) return e.notFoundError('página não encontrada')

  let conteudo = null
  let publicadoEm = ''
  try {
    const pagina = $app.findFirstRecordByData('site_paginas', 'chave', chave)
    const raw = pagina.get('publicado')
    const txt = raw ? toString(raw) : ''
    if (txt && txt !== 'null') {
      conteudo = JSON.parse(txt)
      publicadoEm = pagina.getString('publicado_em')
    }
  } catch (_) {
    conteudo = null
  }
  return e.json(200, { conteudo: conteudo, publicado_em: publicadoEm })
})
