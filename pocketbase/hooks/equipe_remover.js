// Remove uma pessoa da equipe (dono ou gerente). A conta não é apagada, para
// não perder o histórico (vistorias e orçamentos continuam com o nome dela),
// mas perde o acesso na hora: sai da organização, a senha vira uma aleatória e
// as sessões abertas caem. O responsável técnico ligado ao login continua
// cadastrado, só sem o vínculo com a conta.
// Se precisar voltar, basta convidar o mesmo e-mail de novo.
routerAdd(
  'POST',
  '/backend/v1/equipe/remover',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')
    const papelAuth = auth.getString('papel') || 'dono'
    if (papelAuth === 'executor') {
      return e.json(403, { error: 'Só o dono e o gerente removem pessoas da equipe.' })
    }
    const orgId = auth.getString('organizacao_id')
    if (!orgId) return e.json(403, { error: 'Organização não encontrada.' })

    const body = e.requestInfo().body || {}
    const id = String(body.id || '')
    if (!id) return e.badRequestError('Informe quem remover.')
    if (id === auth.id) return e.badRequestError('Você não pode remover a si mesmo.')

    let alvo = null
    try {
      alvo = $app.findRecordById('users', id)
    } catch (_) {
      alvo = null
    }
    if (!alvo || alvo.getString('organizacao_id') !== orgId) {
      return e.notFoundError('Pessoa não encontrada na sua equipe.')
    }

    let donoId = ''
    try {
      donoId = $app.findRecordById('organizacoes', orgId).getString('dono_id')
    } catch (_) {
      donoId = ''
    }
    const papelAlvo = alvo.getString('papel')
    if (alvo.id === donoId || papelAlvo === 'dono') {
      return e.json(403, { error: 'O dono da conta não pode ser removido.' })
    }
    if (papelAuth === 'gerente' && papelAlvo === 'gerente') {
      return e.json(403, { error: 'Só o dono remove um gerente.' })
    }

    $app.runInTransaction((txApp) => {
      alvo.set('organizacao_id', '')
      alvo.set('papel', '')
      alvo.setPassword($security.randomString(32))
      alvo.refreshTokenKey()
      txApp.save(alvo)

      const rts = txApp.findRecordsByFilter(
        'responsaveis_tecnicos',
        'usuario_id = {:u}',
        '',
        0,
        0,
        { u: alvo.id },
      )
      for (const rt of rts) {
        rt.set('usuario_id', '')
        txApp.save(rt)
      }
    })

    $app.logger().info('equipe: membro removido', 'org', orgId, 'membro', id, 'por', auth.id)
    return e.json(200, { ok: true })
  },
  $apis.requireAuth(),
)
