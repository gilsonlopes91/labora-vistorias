// Organização com plano vencido vira somente-leitura: ninguém da equipe cria,
// altera ou apaga registros da organização — só lê e baixa. admin_plataforma
// e staff_labora nunca são bloqueados. A coleção users fica de fora (cada um
// continua editando a própria conta, ex.: trocar a senha).
// Cobre coleções com campo organizacao_id direto (a maioria do app: empresas,
// vistorias, orcamentos, documentos_sst, responsaveis_tecnicos, acoes_plano,
// etc.). Coleções ligadas por caminho indireto (ex.: respostas_vistoria via
// vistoria_id) não são travadas aqui, e as rotas de servidor que gravam com
// $app.save direto (convite/remoção de equipe, aceite de proposta do
// cliente, atualização de ação pelo cliente) também não passam por este
// hook — ver a limitação anotada no changelog da etapa 6.
function orgVencida(orgId) {
  if (!orgId) return false
  try {
    return $app.findRecordById('organizacoes', orgId).getString('status') === 'vencida'
  } catch (_) {
    return false
  }
}

function bloquear(e, orgId) {
  const auth = e.auth
  if (!auth) return
  const papel = auth.getString('papel')
  if (papel === 'admin_plataforma' || papel === 'staff_labora') return
  if (orgVencida(orgId)) {
    throw new BadRequestError(
      'Organização com plano vencido: somente leitura. Regularize para voltar a editar.',
    )
  }
}

onRecordCreateRequest((e) => {
  if (e.collection && e.collection.name === 'users') return e.next()
  const body = e.requestInfo().body || {}
  bloquear(e, String(body.organizacao_id || ''))
  return e.next()
})

onRecordUpdateRequest((e) => {
  if (e.collection && e.collection.name === 'users') return e.next()
  let orgId = ''
  try {
    orgId = e.record.getString('organizacao_id')
  } catch (_) {
    orgId = ''
  }
  bloquear(e, orgId)
  return e.next()
})

onRecordDeleteRequest((e) => {
  if (e.collection && e.collection.name === 'users') return e.next()
  let orgId = ''
  try {
    orgId = e.record.getString('organizacao_id')
  } catch (_) {
    orgId = ''
  }
  bloquear(e, orgId)
  return e.next()
})
