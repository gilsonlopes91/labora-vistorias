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
      alvo.setPassword(senha)      alvo.set('trocar_senha', true)
      $app.save(alvo)
      return e.json(200, { ok: true })
    }

    if (acao === 'pacotes') {
      if (!ehAdmin) return e.forbiddenError('Só o administrador muda o pacote.')
      const orgId = String(body.org_id || '')      if (!orgId) return e.badRequestError('org_id obrigatório')
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
      const CHAVES = ['auditoria', 'relatorios', 'formularios', 'ia', 'orcamentos']
      for (const chave of CHAVES) {
        if (Object.prototype.hasOwnProperty.call(m, chave)) atuais[chave] = !!m[chave]
      }
      org.set('modulos', JSON.stringify(atuais))
      $app.save(org)
      return e.json(200, { ok: true, modulos: org.getString('modulos') })
    }

    if (acao === 'staff_console') {
      if (!ehAdmin) return e.forbiddenError('Só o administrador libera o console.')
      const userId = String(body.user_id || '')      if (!userId) return e.badRequestError('user_id obrigatório')
      let alvo
      try {
        alvo = $app.findRecordById('users', userId)
        alvo.set('acesso_console', !!body.acesso)
        $app.save(alvo)
        return e.json(200, { ok: true, acesso_console: alvo.getBool('acesso_console') })
      } catch (_) {
        return e.notFoundError('usuário não encontrado')
      }
    }

    return e.badRequestError('ação inválida')
  },
  $apis.requireAuth(),
)
