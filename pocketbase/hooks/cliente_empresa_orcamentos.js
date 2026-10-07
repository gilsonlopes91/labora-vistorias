// Orçamentos do portal do cliente. Devolve só as propostas que a consultoria já
// mandou para a empresa (nada de rascunho, cancelada ou arquivada) e só os
// campos que o cliente precisa ver: número, título, valor, data, validade e
// situação. Anotações de follow-up, motivo de recusa, financeiro e valores
// recebidos não saem daqui — a coleção orcamentos não é mais lida pelo cliente.
routerAdd(
  'GET',
  '/backend/v1/cliente/empresa/{empresa}/orcamentos',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')
    const empresaId = String(e.request.pathValue('empresa') || '')
    if (!empresaId) return e.badRequestError('empresa é obrigatória')

    let acesso = null
    try {
      acesso = $app.findFirstRecordByFilter(
        'acessos_cliente',
        'usuario_id = {:u} && empresa_id = {:e} && ativo = true',
        { u: auth.id, e: empresaId },
      )
    } catch (_) {
      acesso = null
    }
    if (!acesso) return e.json(403, { error: 'você não tem acesso a esta empresa' })

    let lista = []
    try {
      lista = $app.findRecordsByFilter(
        'orcamentos',
        "empresa_id = {:e} && status != 'rascunho' && status != 'cancelado' && arquivado != true",
        '-created',
        200,
        0,
        { e: empresaId },
      )
    } catch (_) {
      lista = []
    }

    const items = lista.map((o) => {
      let total = o.getFloat('valor_total')
      if (!total) {
        try {
          const itens = JSON.parse(o.getString('itens') || '[]')
          if (Array.isArray(itens)) {
            total = itens.reduce((soma, it) => {
              const unitario = Number(it.valor_unitario) || 0
              if (it.pessoas !== undefined) {
                if (it.valor_fixo) return soma + unitario
                return soma + (Number(it.pessoas) || 0) * (Number(it.turmas) || 0) * unitario
              }
              return soma + (Number(it.quantidade) || 0) * unitario
            }, 0)
          }
        } catch (_) {
          total = 0
        }
      }
      const dataProposta = o.getString('data_proposta')
      return {
        id: o.id,
        empresa_id: o.getString('empresa_id'),
        numero: o.getString('numero'),
        versao: o.getString('versao'),
        titulo: o.getString('titulo'),
        tipo: o.getString('tipo'),
        status: o.getString('status'),
        valor_total: total || 0,
        data_proposta: dataProposta ? dataProposta.slice(0, 10) : '',
        validade_dias: o.getInt('validade_dias'),
      }
    })

    return e.json(200, { items })
  },
  $apis.requireAuth(),
)
