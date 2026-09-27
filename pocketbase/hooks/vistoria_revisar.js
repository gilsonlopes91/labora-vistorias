// Revisão de vistoria enviada pelo técnico, quando a organização exige
// revisão obrigatória (organizacoes.revisao_obrigatoria_tecnico). Dono,
// gestor (gerente/gestor) ou admin da plataforma aprovam (vira "concluida",
// com relatório assinado) ou devolvem (volta para "em_andamento", com o
// motivo registrado para o técnico corrigir). Mesmo padrão de histórico da
// reabertura (vistoria_reabrir.js).
routerAdd(
  'POST',
  '/backend/v1/vistorias/{id}/revisar',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')

    const id = e.request.pathValue('id')
    const body = e.requestInfo().body || {}
    const aprovar = body.aprovar === true
    const motivo = String(body.motivo || '').trim()
    if (!aprovar && motivo.length < 5) {
      return e.json(400, { error: 'Para devolver, informe o motivo (pelo menos 5 letras).' })
    }

    const papel = auth.getString('papel') || 'dono'
    const ehAdmin = papel === 'admin_plataforma'
    if (!ehAdmin && papel !== 'dono' && papel !== 'gerente' && papel !== 'gestor') {
      return e.json(403, {
        error: 'Só o dono ou o gestor da organização podem revisar uma vistoria.',
      })
    }

    let v
    try {
      v = $app.findRecordById('vistorias', id)
    } catch (_) {
      return e.json(404, { error: 'Vistoria não encontrada.' })
    }
    if (!ehAdmin && v.getString('organizacao_id') !== auth.getString('organizacao_id')) {
      return e.json(404, { error: 'Vistoria não encontrada.' })
    }
    if (v.getString('status') !== 'aguardando_revisao') {
      return e.json(409, { error: 'Esta vistoria não está aguardando revisão.' })
    }

    let historico = []
    try {
      const raw = v.get('revisoes')
      const txt = raw ? toString(raw) : ''
      if (txt && txt !== 'null') {
        const lido = JSON.parse(txt)
        if (Array.isArray(lido)) historico = lido
      }
    } catch (_) {
      historico = []
    }

    historico.push({
      em: new Date().toISOString(),
      por_id: auth.id,
      por_nome: auth.getString('name') || auth.getString('email'),
      aprovado: aprovar,
      motivo: motivo.slice(0, 500),
    })

    v.set('revisoes', historico)
    v.set('status', aprovar ? 'concluida' : 'em_andamento')
    $app.save(v)

    return e.json(200, { ok: true, status: v.getString('status'), revisoes: historico })
  },
  $apis.requireAuth(),
)
