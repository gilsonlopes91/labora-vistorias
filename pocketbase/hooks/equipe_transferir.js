// Transfere a titularidade da conta (organizacoes.dono_id) para outro
// gestor da mesma equipe. Só o titular atual transfere; depois da troca,
// quem transferiu vira um gestor comum — sem convidar nem remover ninguém,
// até alguém transferir de volta para ele.
routerAdd(
  'POST',
  '/backend/v1/equipe/transferir',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')
    const orgId = auth.getString('organizacao_id')
    if (!orgId) return e.json(403, { error: 'Organização não encontrada.' })
    const org = $app.findRecordById('organizacoes', orgId)
    if (auth.id !== org.getString('dono_id')) {
      return e.json(403, { error: 'Só o titular da conta transfere a titularidade.' })
    }

    const body = e.requestInfo().body || {}
    const novoId = String(body.id || '')
    if (!novoId) return e.badRequestError('Informe para quem transferir.')
    if (novoId === auth.id) return e.badRequestError('Você já é o titular.')

    let alvo = null
    try {
      alvo = $app.findRecordById('users', novoId)
    } catch (_) {
      alvo = null
    }
    if (!alvo || alvo.getString('organizacao_id') !== orgId) {
      return e.notFoundError('Pessoa não encontrada na sua equipe.')
    }
    const papelAlvo = alvo.getString('papel')
    if (!['dono', 'gerente', 'gestor'].includes(papelAlvo)) {
      return e.badRequestError('Só um gestor pode virar titular.')
    }

    org.set('dono_id', novoId)
    $app.save(org)

    $app
      .logger()
      .info('equipe: titularidade transferida', 'org', orgId, 'de', auth.id, 'para', novoId)
    return e.json(200, { ok: true })
  },
  $apis.requireAuth(),
)
