// O cliente (empresa vistoriada) atualiza o status e a data de conclusão de
// uma ação do plano — nunca os outros campos (medida, prioridade etc., que só
// a organização edita). Como o PocketBase não restringe update por campo na
// regra de acesso, isso só é possível por aqui (rota de servidor), não por
// update direto na coleção (acoes_plano.updateRule continua só para a
// organização). Evidência (foto) fica para uma revisão futura.
routerAdd(
  'POST',
  '/backend/v1/cliente/acao',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')

    const body = e.requestInfo().body || {}
    const id = String(body.id || '')
    if (!id) return e.badRequestError('informe a ação')

    let acao = null
    try {
      acao = $app.findRecordById('acoes_plano', id)
    } catch (_) {
      acao = null
    }
    if (!acao) return e.notFoundError('ação não encontrada')

    let acesso = null
    try {
      acesso = $app.findFirstRecordByFilter(
        'acessos_cliente',
        'usuario_id = {:u} && empresa_id = {:e} && ativo = true',
        { u: auth.id, e: acao.getString('empresa_id') },
      )
    } catch (_) {
      acesso = null
    }
    if (!acesso) return e.json(403, { error: 'você não tem acesso a esta ação' })

    const STATUS_VALIDOS = ['Pendente', 'Em andamento', 'Concluída', 'Cancelada']
    if (body.status !== undefined) {
      const status = String(body.status || '')
      if (!STATUS_VALIDOS.includes(status)) return e.badRequestError('status inválido')
      acao.set('status', status)
    }
    if (body.data_conclusao !== undefined) {
      acao.set('data_conclusao', String(body.data_conclusao || ''))
    }
    $app.save(acao)
    return e.json(200, { ok: true })
  },
  $apis.requireAuth(),
)
