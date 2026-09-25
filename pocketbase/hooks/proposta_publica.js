// Página pública da proposta (item 38): o cliente abre o link sem login.
// GET /backend/v1/proposta-publica/{token} devolve só o resumo da proposta e
// os contatos da organização; o PDF sai pela rota .../{token}/pdf.
// Cada abertura por quem não é da organização conta como visualização.
routerAdd('GET', '/backend/v1/proposta-publica/{token}', (e) => {
  const token = String(e.request.pathValue('token') || '')
  if (!/^[A-Za-z0-9]{32,64}$/.test(token)) return e.notFoundError('Proposta não encontrada')

  let o = null
  try {
    o = $app.findFirstRecordByFilter('orcamentos', 'link_token = {:t}', { t: token })
  } catch (_) {
    o = null
  }
  if (!o || !o.getString('link_pdf')) return e.notFoundError('Proposta não encontrada')

  const orgId = o.getString('organizacao_id')
  let org = null
  try {
    org = $app.findRecordById('organizacoes', orgId)
  } catch (_) {
    org = null
  }
  let empresa = null
  try {
    empresa = $app.findRecordById('empresas', o.getString('empresa_id'))
  } catch (_) {
    empresa = null
  }

  // Quem é da própria organização (testando o link) não conta.
  let daOrganizacao = false
  const auth = e.auth
  if (auth) {
    daOrganizacao =
      auth.getString('organizacao_id') === orgId || (org && org.getString('dono_id') === auth.id)
  }
  if (!daOrganizacao) {
    try {
      const agora = new Date().toISOString().replace('T', ' ')
      o.set('link_visualizacoes', (o.getInt('link_visualizacoes') || 0) + 1)
      if (!o.getString('link_primeira_visualizacao')) o.set('link_primeira_visualizacao', agora)
      o.set('link_ultima_visualizacao', agora)
      $app.saveNoValidate(o)
    } catch (err) {
      $app.logger().warn('proposta pública: não contou a visualização', 'erro', String(err))
    }
  }

  let dados = {}
  try {
    dados = org ? JSON.parse(org.getString('dados_documentos') || '{}') : {}
  } catch (_) {
    dados = {}
  }
  if (typeof dados !== 'object' || dados === null) dados = {}

  const data = (campo) => {
    const s = o.getString(campo)
    return s ? s.slice(0, 10) : ''
  }

  return e.json(200, {
    numero: o.getString('numero'),
    versao: o.getString('versao'),
    titulo: o.getString('titulo'),
    tipo: o.getString('tipo'),
    valor_total: o.getFloat('valor_total'),
    valor_entrada: o.getFloat('valor_entrada'),
    data_proposta: data('data_proposta'),
    validade_dias: o.getInt('validade_dias'),
    status: o.getString('status'),
    atualizado_em: o.getString('link_gerado_em'),
    cliente: empresa ? empresa.getString('nome_fantasia') || empresa.getString('razao_social') : '',
    organizacao: {
      nome: (org && org.getString('nome')) || dados.razao_social || '',
      telefone: dados.telefone || '',
      email: dados.email || '',
      site: dados.site || '',
    },
  })
})
