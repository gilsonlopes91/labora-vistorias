// PDF da proposta pelo link público (item 38). O arquivo é protegido: só sai
// por esta rota, e só com a chave certa. Desativar o link (apagar a chave)
// corta o acesso na hora.
routerAdd('GET', '/backend/v1/proposta-publica/{token}/pdf', (e) => {
  const token = String(e.request.pathValue('token') || '')
  if (!/^[A-Za-z0-9]{32,64}$/.test(token)) return e.notFoundError('Proposta não encontrada')

  let o = null
  try {
    o = $app.findFirstRecordByFilter('orcamentos', 'link_token = {:t}', { t: token })
  } catch (_) {
    o = null
  }
  const arquivo = o ? o.getString('link_pdf') : ''
  if (!o || !arquivo) return e.notFoundError('Proposta não encontrada')

  const numero = (o.getString('numero') || 's-n').replace(/[^A-Za-z0-9-]+/g, '-')
  const fsys = $app.newFilesystem()
  try {
    fsys.serve(
      e.response,
      e.request,
      o.baseFilesPath() + '/' + arquivo,
      'proposta-' + numero + '.pdf',
    )
  } finally {
    fsys.close()
  }
})
