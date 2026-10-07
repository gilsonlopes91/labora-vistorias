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
    // Cadastro direto pelo titular: todos entram com a senha padrão e são
    // obrigados a trocá-la no primeiro acesso (users.trocar_senha = true).
    const SENHA_PADRAO = 'laboravistoria123'
    const usarSenhaPadrao = body.senha_padrao === true
    const senha = usarSenhaPadrao ? SENHA_PADRAO : senhaInformada || $security.randomString(32)
    if (!['gerente', 'executor', 'administrativo'].includes(papel)) {
      return e.badRequestError('papel deve ser gerente, executor ou administrativo')
    }

    const orgId = auth.getString('organizacao_id')
    if (!orgId) return e.json(404, { error: 'organização do usuário não encontrada' })
    const org = $app.findRecordById('organizacoes', orgId)

    // Só o titular da conta (organizacoes.dono_id) convida — é quem cuida do
    // plano e das vagas. Gestor não titular não convida nem remove.
    if (auth.id !== org.getString('dono_id')) {
      return e.json(403, { error: 'apenas o titular da conta convida' })
    }

    // Vaga disponível? O titular não conta no limite do plano.
    const limite = org.getInt('limite_usuarios')
    const emUso = $app.findRecordsByFilter(
      'users',
      'organizacao_id = {:o} && id != {:d}',
      '',
      0,
      0,
      { o: orgId, d: org.getString('dono_id') },
    ).length
    if (emUso >= limite) {
      return e.json(409, {
        error: `Seu plano (${org.getString('plano') || 'individual'}) tem ${limite} vaga(s) e todas estão em uso. Remova alguém ou mude de plano.`,
      })
    }

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
      // Conta sem organização e sem papel: é alguém que foi removido de uma
      // equipe (equipe_remover.js). Não tem dados próprios a perder, então pode
      // voltar por convite.
      if (!user.getString('organizacao_id') && !user.getString('papel')) {
        user.set('organizacao_id', orgId)
        user.set('papel', papel)
        if (nome) user.set('name', nome)
        if (usarSenhaPadrao) {
          user.setPassword(SENHA_PADRAO)
          user.set('trocar_senha', true)
        }
        $app.save(user)
        if (papel === 'executor' || papel === 'gerente') {
          let temRt = false
          try {
            $app.findFirstRecordByFilter(
              'responsaveis_tecnicos',
              'organizacao_id = {:o} && usuario_id = {:u}',
              { o: orgId, u: user.id },
            )
            temRt = true
          } catch (_) {
            temRt = false
          }
          // Ao sair da equipe, o responsável técnico ficou cadastrado sem
          // login. Se houver um com o mesmo nome, religa em vez de duplicar.
          if (!temRt) {
            try {
              const antigo = $app.findFirstRecordByFilter(
                'responsaveis_tecnicos',
                "organizacao_id = {:o} && usuario_id = '' && nome = {:n}",
                { o: orgId, n: nome || user.getString('name') },
              )
              antigo.set('usuario_id', user.id)
              $app.save(antigo)
              temRt = true
            } catch (_) {
              temRt = false
            }
          }
          if (!temRt) {
            const rt = new Record($app.findCollectionByNameOrId('responsaveis_tecnicos'))
            rt.set('organizacao_id', orgId)
            rt.set('nome', nome || user.getString('name'))
            rt.set('tipo_registro', 'Outro')
            rt.set('numero_registro', '—')
            rt.set('usuario_id', user.id)
            $app.save(rt)
          }
        }
        return e.json(200, { ok: true, id: user.id, reativado: true })
      }
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
    if (usarSenhaPadrao) novo.set('trocar_senha', true)
    $app.save(novo)

    // Executor e gerente ganham um responsável técnico vinculado ao login
    // (o gerente pode ser RT das próprias vistorias); administrativo não tem
    // registro profissional.
    if (papel === 'executor' || papel === 'gerente') {
      const rtCol = $app.findCollectionByNameOrId('responsaveis_tecnicos')
      const rt = new Record(rtCol)
      rt.set('organizacao_id', orgId)
      rt.set('nome', nome)
      rt.set('tipo_registro', 'Outro')
      rt.set('numero_registro', '—')
      rt.set('usuario_id', novo.id)
      $app.save(rt)
    }

    return e.json(200, {
      ok: true,
      id: novo.id,
      comSenha: !!senhaInformada || usarSenhaPadrao,
      senhaPadrao: usarSenhaPadrao,
    })
  },
  $apis.requireAuth(),
)
