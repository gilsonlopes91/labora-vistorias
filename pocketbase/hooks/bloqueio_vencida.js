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
// PocketBase executa cada callback em uma VM separada do pool: nada de
// função auxiliar no topo do arquivo, a lógica fica inteira dentro de cada
// callback (senão dá ReferenceError em runtime).

onRecordCreateRequest((e) => {
  if (e.collection && e.collection.name === 'users') return e.next()
  const auth = e.auth
  if (auth) {
    const papel = auth.getString('papel')
    if (papel !== 'admin_plataforma' && papel !== 'staff_labora') {
      const body = e.requestInfo().body || {}
      const orgId = String(body.organizacao_id || '')
      if (orgId) {
        let vencida = false
        try {
          vencida = $app.findRecordById('organizacoes', orgId).getString('status') === 'vencida'
        } catch (_) {
          vencida = false
        }
        if (vencida) {
          throw new BadRequestError(
            'Organização com plano vencido: somente leitura. Regularize para voltar a editar.',
          )
        }
      }
    }
  }
  return e.next()
})

onRecordUpdateRequest((e) => {
  if (e.collection && e.collection.name === 'users') return e.next()
  const auth = e.auth
  if (auth) {
    const papel = auth.getString('papel')
    if (papel !== 'admin_plataforma' && papel !== 'staff_labora') {
      let orgId = ''
      try {
        orgId = e.record.getString('organizacao_id')
      } catch (_) {
        orgId = ''
      }
      if (orgId) {
        let vencida = false
        try {
          vencida = $app.findRecordById('organizacoes', orgId).getString('status') === 'vencida'
        } catch (_) {
          vencida = false
        }
        if (vencida) {
          throw new BadRequestError(
            'Organização com plano vencido: somente leitura. Regularize para voltar a editar.',
          )
        }
      }
    }
  }
  return e.next()
})

onRecordDeleteRequest((e) => {
  if (e.collection && e.collection.name === 'users') return e.next()
  const auth = e.auth
  if (auth) {
    const papel = auth.getString('papel')
    if (papel !== 'admin_plataforma' && papel !== 'staff_labora') {
      let orgId = ''
      try {
        orgId = e.record.getString('organizacao_id')
      } catch (_) {
        orgId = ''
      }
      if (orgId) {
        let vencida = false
        try {
          vencida = $app.findRecordById('organizacoes', orgId).getString('status') === 'vencida'
        } catch (_) {
          vencida = false
        }
        if (vencida) {
          throw new BadRequestError(
            'Organização com plano vencido: somente leitura. Regularize para voltar a editar.',
          )
        }
      }
    }
  }
  return e.next()
})
