// Console de contas — envia um e-mail (assunto + mensagem em texto) para quem
// respondeu ao questionário do beta: todos, só os marcados como convidados ou
// só os não convidados. Vai um e-mail por pessoa, então ninguém vê o endereço
// dos outros. "{nome}" no assunto ou na mensagem vira o primeiro nome.
// Com teste = true, manda só para o e-mail do próprio admin.
// POST /backend/v1/admin/beta-quiz/email
//   { assunto, mensagem, destinatarios: 'todos'|'convidados'|'nao_convidados', teste? }
routerAdd(
  'POST',
  '/backend/v1/admin/beta-quiz/email',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')
    if (auth.getString('papel') !== 'admin_plataforma') return e.forbiddenError('acesso restrito')

    const body = e.requestInfo().body || {}
    const assunto = String(body.assunto || '').trim()
    const mensagem = String(body.mensagem || '').trim()
    const destinatarios = String(body.destinatarios || 'todos')
    const teste = body.teste === true
    if (!assunto) return e.badRequestError('Informe o assunto.')
    if (!mensagem) return e.badRequestError('Escreva a mensagem.')

    const alvos = []
    if (teste) {
      alvos.push({ email: auth.getString('email'), nome: auth.getString('name') || 'Teste' })
    } else {
      let filtro = "id != ''"
      if (destinatarios === 'convidados') filtro = 'convidado = true'
      else if (destinatarios === 'nao_convidados') filtro = 'convidado = false'
      else if (destinatarios !== 'todos') return e.badRequestError('Destinatários inválidos.')
      const regs = $app.findRecordsByFilter('beta_quiz_respostas', filtro, 'created', 2000, 0)
      for (const r of regs) alvos.push({ email: r.getString('email'), nome: r.getString('nome') })
    }
    if (alvos.length === 0) return e.badRequestError('Não há ninguém para receber este e-mail.')

    const esc = (s) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    const mailClient = $app.newMailClient()
    let enviados = 0
    const falhas = []
    for (const a of alvos) {
      const primeiroNome = a.nome.trim().split(' ')[0]
      const texto = mensagem.split('{nome}').join(primeiroNome)
      try {
        mailClient.send({
          to: [{ address: a.email, name: a.nome }],
          subject: (teste ? '[TESTE] ' : '') + assunto.split('{nome}').join(primeiroNome),
          html:
            '<div style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;">' +
            esc(texto).replace(/\n/g, '<br>') +
            '</div>',
          text: texto,
        })
        enviados++
      } catch (err) {
        falhas.push(a.email)
        $app
          .logger()
          .error('falha ao enviar e-mail aos respondentes do quiz beta', 'error', String(err))
      }
    }

    return e.json(200, { enviados: enviados, falhas: falhas })
  },
  $apis.requireAuth(),
)
