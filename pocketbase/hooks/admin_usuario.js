// Rota admin: ações de gestão de contas — nova senha com troca obrigatória,
// pacotes (módulos) da organização e acesso ao console para staff.
// Acesso: admin_plataforma OU staff_labora com acesso_console.
routerAdd(
  'POST',
  '/backend/v1/admin/usuario',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')
    const papel = auth.getString('papel')
    const ehAdmin = papel === 'admin_plataforma'
    const ehStaffConsole = papel === 'staff_labora' && auth.getBool('acesso_console')
    if (!ehAdmin && !ehStaffConsole) return e.forbiddenError('acesso restrito')

    const body = e.requestInfo().body || {}
    const acao = body.acao

    // Histórico do console (coleção admin_atividades). Falha silenciosa se a
    // coleção ainda não existir, para nunca travar a ação em si.
    const registrar = (orgId, acaoNome, descricao, detalhes) => {
      try {
        const col = $app.findCollectionByNameOrId('admin_atividades')
        const rec = new Record(col)
        rec.set('organizacao_id', orgId || '')
        rec.set('usuario_id', auth.id)
        rec.set('usuario_nome', auth.getString('name') || auth.getString('email'))
        rec.set('acao', acaoNome)
        rec.set('descricao', descricao || '')
        rec.set('detalhes', detalhes || {})
        $app.saveNoValidate(rec)
      } catch (_) {
        // sem histórico
      }
    }

    // Cria uma conta de cliente: usuário novo + organização própria (a
    // organização nasce pelo hook auto_create_organizacao, com a pessoa como
    // titular). Todos entram com a senha padrão e são obrigados a trocá-la
    // no primeiro acesso (users.trocar_senha = true).
    if (acao === 'nova_conta') {
      if (!ehAdmin) return e.forbiddenError('Só o administrador cria contas.')
      const SENHA_PADRAO = 'laboravistoria123'
      const email = String(body.email || '')
        .trim()
        .toLowerCase()
      const nome = String(body.nome || '').trim()
      const nomeOrg = String(body.org_nome || '').trim()
      const plano = String(body.plano || 'individual')
      if (!nome) return e.badRequestError('nome é obrigatório')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return e.badRequestError('e-mail inválido')
      if (['individual', 'equipe', 'escritorio', 'empresa'].indexOf(plano) < 0) {
        return e.badRequestError('plano inválido')
      }
      let existe = true
      try {
        $app.findAuthRecordByEmail('users', email)
      } catch (_) {
        existe = false
      }
      if (existe) return e.json(409, { error: 'já existe uma conta com este e-mail' })

      // Sem senha padrão: a conta nasce com uma senha aleatória que ninguém
      // conhece; a pessoa define a própria pelo link enviado por e-mail.
      const semSenha = body.sem_senha === true
      const senhaInicial = semSenha ? $security.randomString(32) : SENHA_PADRAO
      const novo = new Record($app.findCollectionByNameOrId('users'))
      novo.set('email', email)
      novo.set('name', nome)
      novo.set('password', senhaInicial)
      novo.set('passwordConfirm', senhaInicial)
      novo.set('verified', true)
      novo.set('trocar_senha', !semSenha)
      $app.save(novo)

      let org
      try {
        org = $app.findFirstRecordByFilter('organizacoes', 'dono_id = {:u}', { u: novo.id })
      } catch (_) {
        return e.json(500, { error: 'conta criada, mas a organização não foi encontrada' })
      }
      if (nomeOrg) org.set('nome', nomeOrg)
      const limite = plano === 'equipe' ? 3 : plano === 'escritorio' ? 8 : 0
      org.set('plano', plano)
      org.set('limite_usuarios', limite)
      $app.save(org)
      registrar(org.id, 'nova_conta', 'Conta criada para ' + nome + ' (' + email + ')', {
        user_id: novo.id,
        plano: plano,
      })
      return e.json(200, { ok: true, user_id: novo.id, org_id: org.id })
    }

    if (acao === 'bloqueio') {
      if (!ehAdmin) return e.forbiddenError('Só o administrador bloqueia organizações.')
      const orgId = String(body.org_id || '')
      if (!orgId) return e.badRequestError('org_id obrigatório')
      let org
      try {
        org = $app.findRecordById('organizacoes', orgId)
      } catch (_) {
        return e.notFoundError('organização não encontrada')
      }
      const anterior = org.getString('status') || 'ativa'
      const novo = anterior === 'bloqueada' ? 'ativa' : 'bloqueada'
      org.set('status', novo)
      $app.save(org)
      registrar(
        orgId,
        novo === 'bloqueada' ? 'bloqueio' : 'desbloqueio',
        novo === 'bloqueada' ? 'Organização bloqueada' : 'Organização desbloqueada',
        { de: anterior, para: novo },
      )
      return e.json(200, { ok: true, status: novo })
    }

    if (acao === 'plano') {
      if (!ehAdmin) return e.forbiddenError('Só o administrador altera o plano.')
      const orgId = String(body.org_id || '')
      if (!orgId) return e.badRequestError('org_id obrigatório')
      let org
      try {
        org = $app.findRecordById('organizacoes', orgId)
      } catch (_) {
        return e.notFoundError('organização não encontrada')
      }
      const antes = {
        plano: org.getString('plano'),
        limite_usuarios: org.getInt('limite_usuarios'),
        vencimento: org.getString('vencimento'),
      }
      const plano = String(body.plano || '')
      if (['individual', 'equipe', 'escritorio', 'empresa'].indexOf(plano) < 0) {
        return e.badRequestError('plano inválido')
      }
      // Limite padrão por plano; sobrescreve o que o front enviou para evitar erro de digitação.
      let limite = parseInt(String(body.limite_usuarios || '0'), 10) || 0
      if (plano === 'individual') limite = 0
      else if (plano === 'equipe') limite = 3
      else if (plano === 'escritorio') limite = 8
      const venc = body.vencimento ? String(body.vencimento) : ''
      org.set('plano', plano)
      org.set('limite_usuarios', limite)
      org.set('vencimento', venc || null)
      $app.save(org)
      const depois = { plano: plano, limite_usuarios: limite, vencimento: venc }
      registrar(
        orgId,
        'plano',
        'Plano alterado para ' +
          plano +
          ' (' +
          limite +
          ' vagas' +
          (venc ? ', vence ' + venc.slice(0, 10) : '') +
          ')',
        { antes: antes, depois: depois },
      )
      return e.json(200, { ok: true })
    }

    if (acao === 'nova_senha') {
      const userId = String(body.user_id || '')
      if (!userId) return e.badRequestError('user_id obrigatório')
      const senha = String(body.senha || '')
      if (senha.length < 8) return e.badRequestError('senha deve ter ao menos 8 caracteres')
      let alvo
      try {
        alvo = $app.findRecordById('users', userId)
      } catch (_) {
        return e.notFoundError('usuário não encontrado')
      }
      // Staff só troca a senha de usuários das organizações que atende, e
      // nunca de admin ou de outro staff.
      if (!ehAdmin) {
        const papelAlvo = alvo.getString('papel')
        if (papelAlvo === 'admin_plataforma' || papelAlvo === 'staff_labora') {
          return e.forbiddenError('Só o administrador troca a senha desta conta.')
        }
        let atende = false
        try {
          const orgAlvo = $app.findRecordById('organizacoes', alvo.getString('organizacao_id'))
          atende = orgAlvo.getStringSlice('staff_ids').indexOf(auth.id) >= 0
        } catch (_) {
          atende = false
        }
        if (!atende) return e.forbiddenError('Esta conta não é de uma organização que você atende.')
      }
      alvo.setPassword(senha)
      alvo.set('trocar_senha', true)
      $app.save(alvo)
      registrar(
        alvo.getString('organizacao_id'),
        'nova_senha',
        'Senha temporária definida para ' + (alvo.getString('name') || alvo.getString('email')),
        { user_id: alvo.id },
      )
      return e.json(200, { ok: true })
    }

    if (acao === 'pacotes') {
      if (!ehAdmin) return e.forbiddenError('Só o administrador muda o pacote.')
      const orgId = String(body.org_id || '')
      if (!orgId) return e.badRequestError('org_id obrigatório')
      let org
      try {
        org = $app.findRecordById('organizacoes', orgId)
      } catch (_) {
        return e.notFoundError('organização não encontrada')
      }
      const m = body.modulos || {}
      // Mantém os módulos que o console não mandou (ex.: orçamentos). Antes o
      // objeto era montado só com quatro chaves, e salvar os pacotes apagava o
      // módulo de orçamentos da organização.
      let atuais = {}
      try {
        const raw = org.get('modulos')
        const txt = raw ? toString(raw) : ''
        let lido = txt ? JSON.parse(txt) : {}
        if (typeof lido === 'string') lido = JSON.parse(lido)
        if (lido && typeof lido === 'object') atuais = lido
      } catch (_) {
        atuais = {}
      }
      const CHAVES = ['auditoria', 'relatorios', 'formularios', 'ia', 'orcamentos', 'documentos']
      for (const chave of CHAVES) {
        if (Object.prototype.hasOwnProperty.call(m, chave)) atuais[chave] = !!m[chave]
      }
      org.set('modulos', JSON.stringify(atuais))
      $app.save(org)
      const ligados = CHAVES.filter((k) => atuais[k] !== false)
      registrar(orgId, 'pacote', 'Pacote atualizado: ' + ligados.join(', '), { modulos: atuais })
      return e.json(200, { ok: true, modulos: org.getString('modulos') })
    }

    if (acao === 'staff_console') {
      if (!ehAdmin) return e.forbiddenError('Só o administrador libera o console.')
      const userId = String(body.user_id || '')
      if (!userId) return e.badRequestError('user_id obrigatório')
      let alvo
      try {
        alvo = $app.findRecordById('users', userId)
        alvo.set('acesso_console', !!body.acesso)
        $app.save(alvo)
        registrar(
          '',
          'staff_console',
          (body.acesso ? 'Acesso ao console concedido a ' : 'Acesso ao console removido de ') +
            (alvo.getString('name') || alvo.getString('email')),
          { user_id: alvo.id, acesso: !!body.acesso },
        )
        return e.json(200, { ok: true, acesso_console: alvo.getBool('acesso_console') })
      } catch (_) {
        return e.notFoundError('usuário não encontrado')
      }
    }

    return e.badRequestError('ação inválida')
  },
  $apis.requireAuth(),
)
