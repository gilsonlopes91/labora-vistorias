// Dá acesso ao portal do cliente (empresa vistoriada) para uma pessoa, numa
// empresa específica. Mesmo espírito de equipe_convidar.js, mas o cliente
// fica FORA da organização (users.organizacao_id vazio) e ligado por
// acessos_cliente — uma pessoa pode ter acesso a mais de uma empresa/
// organização com a mesma conta.
routerAdd(
  'POST',
  '/backend/v1/cliente/convidar',
  (e) => {
    const body = e.requestInfo().body || {}
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')

    const email = String(body.email || '')
      .trim()
      .toLowerCase()
    const nome = String(body.nome || '').trim()
    const empresaId = String(body.empresa_id || '')
    if (!email) return e.badRequestError('e-mail é obrigatório')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return e.badRequestError('e-mail inválido')
    if (!nome) return e.badRequestError('nome é obrigatório')
    if (!empresaId) return e.badRequestError('empresa é obrigatória')

    const papelAuth = auth.getString('papel') || 'dono'
    if (papelAuth === 'executor') {
      return e.json(403, { error: 'apenas gestores podem dar acesso ao cliente' })
    }

    let empresa = null
    try {
      empresa = $app.findRecordById('empresas', empresaId)
    } catch (_) {
      empresa = null
    }
    if (!empresa) return e.notFoundError('empresa não encontrada')

    const orgId = empresa.getString('organizacao_id')
    let org = null
    try {
      org = $app.findRecordById('organizacoes', orgId)
    } catch (_) {
      org = null
    }
    const ehStaff = org && org.get('staff_ids') && org.get('staff_ids').includes(auth.id)
    const podeGerenciar =
      auth.getString('organizacao_id') === orgId || ehStaff || papelAuth === 'admin_plataforma'
    if (!podeGerenciar) return e.json(403, { error: 'empresa fora da sua organização' })

    // Usuário já existe?
    let user = null
    try {
      user = $app.findAuthRecordByEmail('users', email)
    } catch (_) {
      user = null
    }

    if (user) {
      const papelUser = user.getString('papel')
      if (papelUser && papelUser !== 'cliente') {
        return e.json(409, {
          error:
            'este e-mail já tem uma conta no Labora Vistorias com outro perfil e não pode virar acesso de cliente. Use outro e-mail.',
        })
      }
      if (!papelUser) {
        // Conta sem papel (removida de uma equipe antes) — vira cliente.
        user.set('papel', 'cliente')
        if (nome) user.set('name', nome)
        $app.save(user)
      }
    } else {
      const usersCol = $app.findCollectionByNameOrId('users')
      user = new Record(usersCol)
      user.set('email', email)
      user.set('name', nome)
      const senha = $security.randomString(32)
      user.set('password', senha)
      user.set('passwordConfirm', senha)
      user.set('papel', 'cliente')
      user.set('organizacao_id', '')
      user.set('verified', true)
      $app.save(user)
    }

    // Acesso já existe para essa empresa? Reativa; senão cria.
    let acesso = null
    try {
      acesso = $app.findFirstRecordByFilter(
        'acessos_cliente',
        'usuario_id = {:u} && empresa_id = {:e}',
        { u: user.id, e: empresaId },
      )
    } catch (_) {
      acesso = null
    }
    if (acesso) {
      acesso.set('ativo', true)
      $app.save(acesso)
      return e.json(200, { ok: true, id: user.id, acessoId: acesso.id, reativado: true })
    }

    const acessosCol = $app.findCollectionByNameOrId('acessos_cliente')
    const novoAcesso = new Record(acessosCol)
    novoAcesso.set('usuario_id', user.id)
    novoAcesso.set('empresa_id', empresaId)
    novoAcesso.set('organizacao_id', orgId)
    novoAcesso.set('ativo', true)
    $app.save(novoAcesso)

    return e.json(200, { ok: true, id: user.id, acessoId: novoAcesso.id, reativado: false })
  },
  $apis.requireAuth(),
)
