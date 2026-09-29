// Rota pública (sem login): recebe nome, e-mail, aceite e as 10 respostas do
// questionário do beta. Valida tudo de novo no servidor, corrige contra o
// banco fechado, grava (um envio por e-mail), e manda ao aluno o e-mail com
// a nota, o gabarito e a explicação de cada questão. A nota NÃO volta na
// resposta HTTP — só no e-mail — para desestimular reenvio com outro e-mail.
routerAdd('POST', '/backend/v1/public/beta-quiz/enviar', (e) => {
  const body = e.requestInfo().body || {}
  const nome = String(body.nome || '').trim()
  const email = String(body.email || '')
    .trim()
    .toLowerCase()
  const aceite = body.aceite_lgpd === true
  const respostas = body.respostas && typeof body.respostas === 'object' ? body.respostas : {}
  // Honeypot: campo oculto que pessoas não preenchem.
  if (String(body.site || '').trim() !== '') return e.json(200, { ok: true })

  if (nome.length < 2) return e.badRequestError('Informe seu nome completo.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return e.badRequestError('E-mail inválido.')
  if (!aceite) return e.badRequestError('É preciso aceitar o uso dos dados para a seleção.')

  // Um envio por e-mail.
  let jaRespondeu = false
  try {
    $app.findFirstRecordByFilter('beta_quiz_respostas', 'email = {:email}', { email: email })
    jaRespondeu = true
  } catch (_) {
    jaRespondeu = false
  }
  if (jaRespondeu) return e.badRequestError('Este e-mail já respondeu ao questionário.')

  // Limite por IP: 5 envios por hora.
  const ip = String(e.request.remoteAddr || '').split(':')[0]
  if (ip) {
    try {
      const limite = new Date(Date.now() - 60 * 60 * 1000)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19)
      const recentes = $app.findRecordsByFilter(
        'beta_quiz_respostas',
        'ip = {:ip} && created >= {:limite}',
        '-created',
        10,
        0,
        { ip: ip, limite: limite },
      )
      if (recentes.length >= 5) {
        throw new TooManyRequestsError('Muitos envios deste endereço. Tente mais tarde.')
      }
    } catch (err) {
      if (err && String(err).indexOf('Muitos envios') >= 0) throw err
    }
  }

  const questoes = $app.findRecordsByFilter('beta_quiz_questoes', "id != ''", 'ordem', 50, 0)
  const acertos = {}
  const detalhe = []
  let nota = 0
  for (const q of questoes) {
    const chave = 'q' + q.getInt('ordem')
    const marcada = String(respostas[chave] || '')
    if (!marcada) return e.badRequestError('Responda todas as questões antes de enviar.')
    let alternativas = []
    try {
      const bruto = q.get('alternativas')
      const txt = bruto ? toString(bruto) : ''
      let lido = txt ? JSON.parse(txt) : []
      if (typeof lido === 'string') lido = JSON.parse(lido)
      alternativas = Array.isArray(lido) ? lido : []
    } catch (_) {
      alternativas = []
    }
    const ids = alternativas.map((a) => String(a.id))
    if (ids.indexOf(marcada) < 0) return e.badRequestError('Resposta inválida na questão ' + chave)
    const correta = q.getString('correta')
    const acertou = marcada === correta
    acertos[chave] = acertou
    if (acertou) nota++
    const textoDe = (id) => {
      for (const a of alternativas) if (String(a.id) === id) return String(a.texto)
      return ''
    }
    detalhe.push({
      ordem: q.getInt('ordem'),
      tema: q.getString('tema'),
      enunciado: q.getString('enunciado'),
      marcada: textoDe(marcada),
      correta: textoDe(correta),
      acertou: acertou,
      explicacao: q.getString('explicacao'),
    })
  }

  const col = $app.findCollectionByNameOrId('beta_quiz_respostas')
  const rec = new Record(col)
  rec.set('nome', nome)
  rec.set('email', email)
  rec.set('respostas', respostas)
  rec.set('acertos', acertos)
  rec.set('nota', nota)
  rec.set('ip', ip)
  rec.set('aceite_lgpd', true)
  rec.set('convidado', false)
  rec.set('email_enviado', false)
  try {
    $app.save(rec)
  } catch (err) {
    // Corrida entre dois envios do mesmo e-mail cai no índice único.
    return e.badRequestError('Este e-mail já respondeu ao questionário.')
  }

  const esc = (s) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  let linhas = ''
  let texto =
    'Olá, ' +
    nome +
    '.\n\nSua nota no questionário do beta Labora Vistorias: ' +
    nota +
    ' de 10.\n\n'
  for (const d of detalhe) {
    const cor = d.acertou ? '#1a7f37' : '#b42318'
    const rotulo = d.acertou ? 'Você acertou' : 'Você errou'
    linhas +=
      '<tr><td style="padding:12px 0;border-top:1px solid #e5e5e5;">' +
      '<div style="font-size:12px;color:#777;">Questão ' +
      d.ordem +
      ' · ' +
      esc(d.tema) +
      ' · <span style="color:' +
      cor +
      ';font-weight:bold;">' +
      rotulo +
      '</span></div>' +
      '<div style="margin-top:4px;font-weight:bold;">' +
      esc(d.enunciado) +
      '</div>' +
      '<div style="margin-top:6px;"><b>Sua resposta:</b> ' +
      esc(d.marcada) +
      '</div>' +
      (d.acertou
        ? ''
        : '<div style="margin-top:2px;"><b>Resposta correta:</b> ' + esc(d.correta) + '</div>') +
      '<div style="margin-top:6px;color:#444;">' +
      esc(d.explicacao) +
      '</div></td></tr>'
    texto +=
      'Questão ' +
      d.ordem +
      ' (' +
      d.tema +
      ') - ' +
      rotulo +
      '\n' +
      d.enunciado +
      '\nSua resposta: ' +
      d.marcada +
      '\n' +
      (d.acertou ? '' : 'Resposta correta: ' + d.correta + '\n') +
      d.explicacao +
      '\n\n'
  }
  texto +=
    'Os selecionados para o beta serão avisados por e-mail. Obrigado por participar.\n\nLabora Engenharia e SST'

  const html =
    '<div style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;max-width:640px;">' +
    '<p>Olá, ' +
    esc(nome) +
    '.</p>' +
    '<p>Sua nota no questionário de seleção do beta <b>Labora Vistorias</b>: ' +
    '<span style="font-size:22px;font-weight:bold;">' +
    nota +
    ' de 10</span>.</p>' +
    '<p>Abaixo estão as questões, o que você marcou e a explicação de cada uma.</p>' +
    '<table style="width:100%;border-collapse:collapse;">' +
    linhas +
    '</table>' +
    '<p style="margin-top:20px;">Os selecionados para o beta serão avisados por e-mail. Obrigado por participar.</p>' +
    '<p style="color:#777;font-size:12px;">Labora Engenharia e SST — Teresina, PI</p>' +
    '</div>'

  try {
    const mailClient = $app.newMailClient()
    mailClient.send({
      to: [{ address: email, name: nome }],
      subject: 'Seu resultado no questionário do beta Labora Vistorias',
      html: html,
      text: texto,
    })
    rec.set('email_enviado', true)
    $app.save(rec)
  } catch (err) {
    $app.logger().error('falha ao enviar e-mail do quiz beta', 'error', String(err), 'email', email)
  }

  return e.json(200, { ok: true })
})
