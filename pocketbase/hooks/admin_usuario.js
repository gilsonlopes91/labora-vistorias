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
      alvo.setPassword(senha)
      alvo.set('trocar_senha', true)
      $app.save(alvo)
      return e.json(200, { ok: true })
    }

    if (acao === 'pacotes') {
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
      const CHAVES = ['auditoria', 'relatorios', 'formularios', 'ia', 'orcamentos']
      for (const chave of CHAVES) {
        if (Object.prototype.hasOwnProperty.call(m, chave)) atuais[chave] = !!m[chave]
      }
      org.set('modulos', JSON.stringify(atuais))
      $app.save(org)
      return e.json(200, { ok: true, modulos: org.getString('modulos') })
    }

    if (acao === 'staff_console') {
      const userId = String(body.user_id || '')
      if (!userId) return e.badRequestError('user_id obrigatório')
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
