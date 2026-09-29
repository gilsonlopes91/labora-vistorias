// Rota pública (sem login): devolve as 10 questões do questionário do beta
// SEM gabarito nem explicação, com as alternativas embaralhadas a cada
// chamada. O gabarito só existe no servidor (coleção fechada).
routerAdd('GET', '/backend/v1/public/beta-quiz/perguntas', (e) => {
  const regs = $app.findRecordsByFilter('beta_quiz_questoes', "id != ''", 'ordem', 50, 0)
  const questoes = []
  for (const r of regs) {
    let alternativas = []
    try {
      const bruto = r.get('alternativas')
      const txt = bruto ? toString(bruto) : ''
      let lido = txt ? JSON.parse(txt) : []
      if (typeof lido === 'string') lido = JSON.parse(lido)
      alternativas = Array.isArray(lido) ? lido : []
    } catch (_) {
      alternativas = []
    }
    // Fisher-Yates
    for (let i = alternativas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = alternativas[i]
      alternativas[i] = alternativas[j]
      alternativas[j] = tmp
    }
    questoes.push({
      ordem: r.getInt('ordem'),
      tema: r.getString('tema'),
      enunciado: r.getString('enunciado'),
      alternativas: alternativas.map((a) => ({ id: String(a.id), texto: String(a.texto) })),
    })
  }
  return e.json(200, { questoes: questoes })
})
