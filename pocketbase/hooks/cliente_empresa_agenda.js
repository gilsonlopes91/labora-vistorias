// Agenda do portal do cliente. Devolve só as vistorias marcadas (agendada ou em
// andamento) da empresa do cliente, com data, hora, situação e nome — sem
// equipe de apoio, equipamentos, orientações nem contatos internos, que ficam
// de fora da regra de leitura da coleção vistorias (o cliente só lê as concluídas).
routerAdd(
  'GET',
  '/backend/v1/cliente/empresa/{empresa}/agenda',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')
    const empresaId = String(e.request.pathValue('empresa') || '')
    if (!empresaId) return e.badRequestError('empresa é obrigatória')

    let acesso = null
    try {
      acesso = $app.findFirstRecordByFilter(
        'acessos_cliente',
        'usuario_id = {:u} && empresa_id = {:e} && ativo = true',
        { u: auth.id, e: empresaId },
      )
    } catch (_) {
      acesso = null
    }
    if (!acesso) return e.json(403, { error: 'você não tem acesso a esta empresa' })

    let lista = []
    try {
      lista = $app.findRecordsByFilter(
        'vistorias',
        "empresa_id = {:e} && (status = 'agendada' || status = 'em_andamento')",
        'data_agendada',
        200,
        0,
        { e: empresaId },
      )
    } catch (_) {
      lista = []
    }

    const nomesPorTipo = {}
    const nomeDoTipo = (id) => {
      if (!id) return ''
      if (nomesPorTipo[id] === undefined) {
        try {
          nomesPorTipo[id] = $app.findRecordById('tipos_vistoria', id).getString('nome')
        } catch (_) {
          nomesPorTipo[id] = ''
        }
      }
      return nomesPorTipo[id]
    }

    const items = lista.map((v) => {
      const ids = []
      const principal = v.getString('tipo_vistoria_id')
      if (principal) ids.push(principal)
      const extras = v.getStringSlice('checklists') || []
      for (const x of extras) {
        if (x && !ids.includes(x)) ids.push(x)
      }
      const nomes = ids.map((id) => nomeDoTipo(id)).filter((n) => n)
      return {
        id: v.id,
        data_agendada: v.getString('data_agendada'),
        hora_inicio: v.getString('hora_inicio'),
        status: v.getString('status'),
        nome: nomes.join(', ') || 'Vistoria',
      }
    })

    return e.json(200, { items })
  },
  $apis.requireAuth(),
)
