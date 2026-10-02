// Console de contas — liga/desliga o recebimento de respostas do questionário
// do beta. O estado fica em parametros_sistema, chave
// beta_quiz_aceitando_respostas (1 = recebendo, 0 = encerrado; sem registro =
// recebendo).
// POST /backend/v1/admin/beta-quiz/aceitando  { aceitando: boolean }
routerAdd(
  'POST',
  '/backend/v1/admin/beta-quiz/aceitando',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')
    if (auth.getString('papel') !== 'admin_plataforma') return e.forbiddenError('acesso restrito')

    const body = e.requestInfo().body || {}
    const aceitando = body.aceitando === true

    let rec = null
    try {
      rec = $app.findFirstRecordByData(
        'parametros_sistema',
        'chave',
        'beta_quiz_aceitando_respostas',
      )
    } catch (_) {
      rec = null
    }
    if (!rec) {
      rec = new Record($app.findCollectionByNameOrId('parametros_sistema'))
      rec.set('chave', 'beta_quiz_aceitando_respostas')
      rec.set('descricao', 'Questionário do beta: 1 = recebendo respostas, 0 = encerrado.')
    }
    rec.set('valor_numero', aceitando ? 1 : 0)
    $app.save(rec)

    return e.json(200, { aceitando_respostas: aceitando })
  },
  $apis.requireAuth(),
)
