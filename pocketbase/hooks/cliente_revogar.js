// Revoga o acesso do cliente a uma empresa (não apaga a conta — ela pode ter
// acesso a outras empresas). Só um gestor da organização da empresa.
// O registro de acesso é apagado, em vez de ficar marcado como inativo: as
// regras de leitura do portal olham todos os acessos da empresa, então um
// acesso inativo parado ali tirava o acesso dos outros usuários da mesma
// empresa. Para dar o acesso de novo, basta convidar a pessoa outra vez.
routerAdd(
  'POST',
  '/backend/v1/cliente/revogar',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')
    const papelAuth = auth.getString('papel') || 'dono'
    if (papelAuth === 'executor') {
      return e.json(403, { error: 'apenas gestores podem revogar o acesso do cliente' })
    }

    const body = e.requestInfo().body || {}
    const acessoId = String(body.acesso_id || '')
    if (!acessoId) return e.badRequestError('informe o acesso a revogar')

    let acesso = null
    try {
      acesso = $app.findRecordById('acessos_cliente', acessoId)
    } catch (_) {
      acesso = null
    }
    if (!acesso) return e.notFoundError('acesso não encontrado')

    const orgId = acesso.getString('organizacao_id')
    let org = null
    try {
      org = $app.findRecordById('organizacoes', orgId)
    } catch (_) {
      org = null
    }
    const ehStaff = org && org.get('staff_ids') && org.get('staff_ids').includes(auth.id)
    const podeGerenciar =
      auth.getString('organizacao_id') === orgId || ehStaff || papelAuth === 'admin_plataforma'
    if (!podeGerenciar) return e.json(403, { error: 'acesso fora da sua organização' })

    $app.delete(acesso)
    return e.json(200, { ok: true })
  },
  $apis.requireAuth(),
)
