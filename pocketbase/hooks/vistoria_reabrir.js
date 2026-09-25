// Reabertura de vistoria concluída (dono, gerente ou admin da plataforma).
// A vistoria volta para "em andamento", e fica registrado em
// vistorias.reaberturas quem reabriu, quando, por qual motivo e qual RT tinha
// assinado a versão anterior. Ao finalizar de novo, sai um relatório novo.
// Executor não reabre.
routerAdd(
  'POST',
  '/backend/v1/vistorias/{id}/reabrir',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')

    const id = e.request.pathValue('id')
    const body = e.requestInfo().body || {}
    const motivo = String(body.motivo || '').trim()
    if (motivo.length < 5) {
      return e.json(400, { error: 'Informe o motivo da reabertura (pelo menos 5 letras).' })
    }

    const papel = auth.getString('papel') || 'dono'
    const ehAdmin = papel === 'admin_plataforma'
    if (!ehAdmin && papel !== 'dono' && papel !== 'gerente' && papel !== 'gestor') {
      return e.json(403, {
        error: 'Só o dono ou o gestor da organização podem reabrir uma vistoria concluída.',
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
    if (v.getString('status') !== 'concluida') {
      return e.json(409, { error: 'Esta vistoria não está concluída.' })
    }

    let historico = []
    try {
      const raw = v.get('reaberturas')
      const txt = raw ? toString(raw) : ''
      if (txt && txt !== 'null') {
        const lido = JSON.parse(txt)
        if (Array.isArray(lido)) historico = lido
      }
    } catch (_) {
      historico = []
    }

    const rtAnterior = [
      v.getString('responsavel_tecnico_nome'),
      v.getString('responsavel_tecnico_registro'),
    ]
      .filter((s) => !!s)
      .join(' — ')

    historico.push({
      em: new Date().toISOString(),
      por_id: auth.id,
      por_nome: auth.getString('name') || auth.getString('email'),
      motivo: motivo.slice(0, 500),
      rt_anterior: rtAnterior,
    })

    v.set('reaberturas', historico)
    v.set('status', 'em_andamento')
    $app.save(v)

    return e.json(200, { ok: true, reaberturas: historico })
  },
  $apis.requireAuth(),
)
