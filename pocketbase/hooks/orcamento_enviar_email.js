// A6: envio real de proposta por e-mail, pelo backend (não é mailto:, que só
// abre o cliente de e-mail do usuário). Usa o relay de e-mail já configurado
// no projeto (compartilhado da Skip ou SMTP próprio, ver skip_cloud_emails_guide)
// via $app.newMailClient(). O corpo já traz o link público da proposta
// (gerado antes, no diálogo de envio, reaproveitando publicarLinkProposta) —
// não anexamos o binário do PDF para não depender de uma API de anexo não
// documentada neste ambiente; o link é a mesma forma de acesso já usada no
// WhatsApp e no mailto: atuais.
routerAdd(
  'POST',
  '/backend/v1/orcamentos/enviar-email',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')

    const body = e.requestInfo().body || {}
    const orcamentoId = String(body.orcamento_id || '')
    const destinatario = String(body.destinatario || '')
      .trim()
      .toLowerCase()
    const assunto = String(body.assunto || '').trim()
    const mensagem = String(body.mensagem || '').trim()

    if (!orcamentoId) return e.badRequestError('orcamento é obrigatório')
    if (!destinatario || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinatario)) {
      return e.badRequestError('e-mail do destinatário inválido')
    }
    if (!assunto) return e.badRequestError('assunto é obrigatório')
    if (!mensagem) return e.badRequestError('mensagem é obrigatória')

    let orcamento = null
    try {
      orcamento = $app.findRecordById('orcamentos', orcamentoId)
    } catch (_) {
      orcamento = null
    }
    if (!orcamento) return e.notFoundError('orçamento não encontrado')

    const orgId = orcamento.getString('organizacao_id')
    const papelAuth = auth.getString('papel') || ''
    let org = null
    try {
      org = $app.findRecordById('organizacoes', orgId)
    } catch (_) {
      org = null
    }
    const ehStaff = org && org.get('staff_ids') && org.get('staff_ids').includes(auth.id)
    const podeEnviar =
      auth.getString('organizacao_id') === orgId || ehStaff || papelAuth === 'admin_plataforma'
    if (!podeEnviar) return e.forbiddenError('orçamento fora da sua organização')

    const htmlEscapado = mensagem
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
    const html =
      '<div style="font-family: Arial, sans-serif; font-size: 14px; color: #1a1a1a; white-space: pre-line;">' +
      htmlEscapado +
      '</div>'

    try {
      const mailClient = $app.newMailClient()
      mailClient.send({
        to: [{ address: destinatario }],
        subject: assunto,
        html: html,
        text: mensagem,
      })
    } catch (err) {
      $app
        .logger()
        .error(
          'falha ao enviar e-mail de orçamento',
          'error',
          String(err),
          'orcamentoId',
          orcamentoId,
        )
      return e.internalServerError(
        'não foi possível enviar o e-mail agora, tente de novo em instantes',
      )
    }

    return e.json(200, { ok: true })
  },
  $apis.requireAuth(),
)
