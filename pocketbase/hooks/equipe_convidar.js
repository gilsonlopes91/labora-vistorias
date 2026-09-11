// Fase A — convite de membro da equipe: o dono/gerente cria o usuário
// (e-mail + senha temporária + papel) e o liga à organização.
// Papéis: gerente (tudo operacional, sem cobrança) e executor (técnico de campo).
routerAdd(
  'POST',
  '/backend/v1/equipe/convidar',
  (e) => {
    const body = e.requestInfo().body || {}
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')

    const email = String(body.email || '')
      .trim()
      .toLowerCase()
    const nome = String(body.nome || '').trim()
    const senha = String(body.senha || '')
    const papel = String(body.papel || 'executor')
    if (!email) return e.badRequestError('e-mail é obrigatório')
    if (!nome) return e.badRequestError('nome é obrigatório')
    if (senha.length < 8) return e.badRequestError('senha deve ter ao menos 8 caracteres')
    if (!['gerente', 'executor'].includes(papel)) {
      return e.badRequestError('papel deve ser gerente ou executor')
    }

    // Descobre a organização do usuário logado (dono ou membro).
    let org = null
    try {
      org = $app.findFirstRecordByFilter(
        'organizacoes',
        "dono_id = '" + auth.id + "' || membros ?= '" + auth.id + "'",
      )
    } catch (_) {
      return e.json(404, { error: 'organização não encontrada' })
    }

    // Apenas dono ou gerente convidam.
    const papelAuth = auth.getString('papel') || 'dono'
    if (papelAuth === 'executor') {
      return e.json(403, { error: 'apenas dono ou gerente podem convidar' })
    }

    // Usuário já existe?
    let user = null
    try {
      user = $app.findAuthRecordByEmail('users', email)
    } catch (_) {
      user = null
    }
    if (user) {
      // Já é membro? Nada a fazer além de informar.
      const membros = org.get('membros')
      const jaMembro =
        org.getString('dono_id') === user.id ||
        (Array.isArray(membros) && membros.indexOf(user.id) >= 0)
      if (jaMembro) return e.json(409, { error: 'este e-mail já faz parte da sua equipe' })
      if (papelAuth === 'gerente') {
        return e.json(403, { error: 'apenas o dono pode vincular um usuário existente' })
      }
      // Dono vincula usuário existente à organização.
      const membrosAtuais = org.get('membros') || []
      membrosAtuais.push(user.id)
      org.set('membros', membrosAtuais)
      if (!user.getString('papel')) user.set('papel', papel)
      $app.save(org)
      $app.save(user)
      return e.json(200, { ok: true, vinculado: true })
    }

    // Cria o usuário novo.
    const usersCol = $app.findCollectionByNameOrId('users')
    const novo = new Record(usersCol)
    novo.set('email', email)
    novo.set('name', nome)
    novo.set('password', senha)
    novo.set('passwordConfirm', senha)
    novo.set('papel', papel)
    novo.set('verified', true)
    $app.save(novo)

    // Se for executor, cria o responsável técnico vinculado ao login.
    if (papel === 'executor') {
      const rtCol = $app.findCollectionByNameOrId('responsaveis_tecnicos')
      const rt = new Record(rtCol)
      rt.set('organizacao_id', org.id)
      rt.set('nome', nome)
      rt.set('tipo_registro', 'Outro')
      rt.set('numero_registro', '—')
      rt.set('usuario_id', novo.id)
      $app.save(rt)
    }

    // Liga à organização.
    const membrosAtuais = org.get('membros') || []
    membrosAtuais.push(novo.id)
    org.set('membros', membrosAtuais)
    $app.save(org)

    return e.json(200, { ok: true, id: novo.id })
  },
  $apis.requireAuth(),
)
