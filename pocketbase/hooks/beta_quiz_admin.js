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
          acertos =
            (typeof bruto === 'string' ? JSON.parse(bruto) : JSON.parse(JSON.stringify(bruto))) ||
            {}
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
          nota: r.getInt('nota'),
          acertos: acertos,
          convidado: r.getBool('convidado'),
          email_enviado: r.getBool('email_enviado'),
          created: r.getString('created'),
        })
      }
    } catch (_) {}

    return e.json(200, {
      total: respostas.length,
      questoes: questoes,
      acertos_por_questao: acertosPorQuestao,
      respostas: respostas,
    })
  },
  $apis.requireAuth(),
)
