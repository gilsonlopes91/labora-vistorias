// Console de contas — ranking do questionário do beta e acertos por questão.
// GET /backend/v1/admin/beta-quiz
routerAdd(
  'GET',
  '/backend/v1/admin/beta-quiz',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')
    if (auth.getString('papel') !== 'admin_plataforma') return e.forbiddenError('acesso restrito')

    const questoes = []
    const acertosPorQuestao = {}
    try {
      const qs = $app.findRecordsByFilter('beta_quiz_questoes', "id != ''", 'ordem', 50, 0)
      for (const q of qs) {
        const chave = 'q' + q.getInt('ordem')
        questoes.push({
          chave: chave,
          ordem: q.getInt('ordem'),
          tema: q.getString('tema'),
          enunciado: q.getString('enunciado'),
        })
        acertosPorQuestao[chave] = 0
      }
    } catch (_) {}

    const respostas = []
    try {
      const regs = $app.findRecordsByFilter(
        'beta_quiz_respostas',
        "id != ''",
        '-nota,created',
        2000,
        0,
      )
      for (const r of regs) {
        let acertos = {}
        try {
          const bruto = r.get('acertos')
          const txt = bruto ? toString(bruto) : ''
          let lido = txt ? JSON.parse(txt) : {}
          if (typeof lido === 'string') lido = JSON.parse(lido)
          acertos = lido && typeof lido === 'object' ? lido : {}
        } catch (_) {
          acertos = {}
        }
        for (const k in acertos) {
          if (acertos[k] === true && acertosPorQuestao[k] !== undefined) acertosPorQuestao[k]++
        }
        respostas.push({
          id: r.id,
          nome: r.getString('nome'),
          email: r.getString('email'),
          telefone: r.getString('telefone'),
          nota: r.getInt('nota'),
          acertos: acertos,
          convidado: r.getBool('convidado'),
          email_enviado: r.getBool('email_enviado'),
          saidas: r.getInt('saidas'),
          segundos_fora: r.getInt('segundos_fora'),
          created: r.getString('created'),
        })
      }
    } catch (_) {}

    let aceitando = true
    try {
      const p = $app.findFirstRecordByData(
        'parametros_sistema',
        'chave',
        'beta_quiz_aceitando_respostas',
      )
      aceitando = p.getInt('valor_numero') !== 0
    } catch (_) {}

    return e.json(200, {
      total: respostas.length,
      aceitando_respostas: aceitando,
      questoes: questoes,
      acertos_por_questao: acertosPorQuestao,
      respostas: respostas,
    })
  },
  $apis.requireAuth(),
)
