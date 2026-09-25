// Convite de membro da equipe: dono/gerente cria o usuário (nome, e-mail e
// papel) e o vincula à organização. Sem senha no convite: a conta nasce com
// uma senha aleatória que ninguém conhece, e o app pede em seguida o e-mail de
// "criar senha" (o mesmo fluxo do "Esqueci minha senha"). O campo senha
// continua aceito para quem ainda usa a versão antiga da tela.
// users.organizacao_id = organização do convidante; papel = gerente|executor.
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
    const senhaInformada = String(body.senha || '')
    const papel = String(body.papel || 'executor')
    if (!email) return e.badRequestError('e-mail é obrigatório')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return e.badRequestError('e-mail inválido')
    if (!nome) return e.badRequestError('nome é obrigatório')
    if (senhaInformada && senhaInformada.length < 8) {
      return e.badRequestError('senha deve ter ao menos 8 caracteres')
    }
    const senha = senhaInformada || $security.randomString(32)
    if (!['gerente', 'executor'].includes(papel)) {
      return e.badRequestError('papel deve ser gerente ou executor')
    }

    // Apenas dono ou gerente convidam.
    const papelAuth = auth.getString('papel') || 'dono'
    if (papelAuth === 'executor') {
      return e.json(403, { error: 'apenas dono ou gerente podem convidar' })
    }

    const orgId = auth.getString('organizacao_id')
    if (!orgId) return e.json(404, { error: 'organização do usuário não encontrada' })
    const org = $app.findRecordById('organizacoes', orgId)

    // Usuário já existe?
    let user = null
    try {
      user = $app.findAuthRecordByEmail('users', email)
    } catch (_) {
      user = null
    }
    if (user) {
      const jaMembro = user.getString('organizacao_id') === orgId
      if (jaMembro) return e.json(409, { error: 'este e-mail já faz parte da sua equipe' })
      // Conta já existente nunca é movida de organização por convite: isso
      // permitiria a qualquer dono "puxar" a conta de outra pessoa (e os
      // acessos dela) só digitando o e-mail. Se a pessoa precisar mudar de
      // organização, a administração da plataforma faz a troca pelo console.
      return e.json(409, {
        error:
          'este e-mail já tem uma conta no Labora Vistorias e não pode ser adicionado por convite. Peça para a pessoa entrar em contato com o suporte, ou use outro e-mail.',
      })
    }

    // Cria o usuário novo.
    const usersCol = $app.findCollectionByNameOrId('users')
    const novo = new Record(usersCol)
    novo.set('email', email)
    novo.set('name', nome)
    novo.set('password', senha)
    novo.set('passwordConfirm', senha)
    novo.set('papel', papel)
    novo.set('organizacao_id', orgId)
    novo.set('verified', true)
    $app.save(novo)

    // Se for executor, cria o responsável técnico vinculado ao login.
    if (papel === 'executor') {
      const rtCol = $app.findCollectionByNameOrId('responsaveis_tecnicos')
      const rt = new Record(rtCol)
      rt.set('organizacao_id', orgId)
      rt.set('nome', nome)
      rt.set('tipo_registro', 'Outro')
      rt.set('numero_registro', '—')
      rt.set('usuario_id', novo.id)
      $app.save(rt)
    }

    return e.json(200, { ok: true, id: novo.id, comSenha: !!senhaInformada })
  },
  $apis.requireAuth(),
)
