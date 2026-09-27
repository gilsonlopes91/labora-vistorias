// O cliente aceita uma proposta pelo portal (autenticado — diferente do link
// público de proposta_publica.js, que é só visualização). Só quando a
// proposta ainda está em aberto; vira "aprovado" e segue o financeiro normal.
routerAdd(
  'POST',
  '/backend/v1/cliente/orcamento/{id}/aceitar',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')
    const id = String(e.request.pathValue('id') || '')

    let orcamento = null
    try {
      orcamento = $app.findRecordById('orcamentos', id)
    } catch (_) {
      orcamento = null
    }
    if (!orcamento) return e.notFoundError('proposta não encontrada')

    let acesso = null
    try {
      acesso = $app.findFirstRecordByFilter(
        'acessos_cliente',
        'usuario_id = {:u} && empresa_id = {:e} && ativo = true',
        { u: auth.id, e: orcamento.getString('empresa_id') },
      )
    } catch (_) {
      acesso = null
    }
    if (!acesso) return e.json(403, { error: 'você não tem acesso a esta proposta' })

    const status = orcamento.getString('status')
    const ABERTOS = ['enviado', 'aguardando_retorno', 'em_negociacao']
    if (!ABERTOS.includes(status)) {
      return e.json(400, { error: 'esta proposta não está mais disponível para aceite' })
    }

    orcamento.set('status', 'aprovado')
    if (!orcamento.getString('data_aprovacao')) {
      orcamento.set('data_aprovacao', new Date().toISOString())
    }
    const finAtual = orcamento.getString('status_financeiro')
    if (!finAtual || finAtual === 'nao_faturado') {
      orcamento.set('status_financeiro', 'aguardando_pagamento')
    }
    $app.save(orcamento)
    return e.json(200, { ok: true, status: orcamento.getString('status') })
  },
  $apis.requireAuth(),
)
