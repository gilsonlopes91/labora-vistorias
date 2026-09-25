// Marca como N/A (não se aplica) todos os itens ainda sem resposta de uma
// vistoria. Usado ao finalizar, quando o técnico confirma que os itens que
// sobraram não se aplicam àquele estabelecimento. Roda no servidor numa única
// transação, em vez de centenas de chamadas do celular.
// Com { itens: [ids] } no corpo, marca só esses itens (botão "marcar seção
// como N/A"); itens que já têm resposta não são alterados.
// Mesmas permissões de responder o checklist: organização da vistoria (ou
// staff vinculado / admin) e, para executor, só a vistoria atribuída a ele.
routerAdd(
  'POST',
  '/backend/v1/vistorias/{id}/marcar-na',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')
    const id = e.request.pathValue('id')

    let v
    try {
      v = $app.findRecordById('vistorias', id)
    } catch (_) {
      return e.json(404, { error: 'Vistoria não encontrada.' })
    }

    const papel = auth.getString('papel') || 'dono'
    const ehAdmin = papel === 'admin_plataforma'
    const orgId = v.getString('organizacao_id')
    let ehStaff = false
    try {
      const org = $app.findRecordById('organizacoes', orgId)
      const staff = org.getStringSlice('staff_ids')
      for (let i = 0; i < staff.length; i++) if (staff[i] === auth.id) ehStaff = true
    } catch (_) {
      ehStaff = false
    }
    if (!ehAdmin && !ehStaff && orgId !== auth.getString('organizacao_id')) {
      return e.json(404, { error: 'Vistoria não encontrada.' })
    }
    if (v.getString('status') === 'concluida') {
      return e.json(409, { error: 'Esta vistoria já está concluída.' })
    }
    if (papel === 'executor') {
      let ehDele = false
      try {
        const rt = $app.findRecordById(
          'responsaveis_tecnicos',
          v.getString('responsavel_tecnico_id'),
        )
        ehDele = rt.getString('usuario_id') === auth.id
      } catch (_) {
        ehDele = false
      }
      if (!ehDele) {
        return e.json(403, {
          error: 'Só o técnico responsável por esta vistoria pode responder os itens.',
        })
      }
    }

    const tipos = []
    if (v.getString('tipo_vistoria_id')) tipos.push(v.getString('tipo_vistoria_id'))
    const extras = v.getStringSlice('checklists')
    for (let i = 0; i < extras.length; i++) {
      if (tipos.indexOf(extras[i]) < 0) tipos.push(extras[i])
    }

    const corpo = e.requestInfo().body || {}
    const soItens =
      Array.isArray(corpo.itens) && corpo.itens.length > 0
        ? corpo.itens.map((x) => String(x))
        : null

    let criados = 0
    let atualizados = 0
    $app.runInTransaction((txApp) => {
      const existentes = txApp.findRecordsByFilter(
        'respostas_vistoria',
        'vistoria_id = {:id}',
        '',
        0,
        0,
        { id: id },
      )
      const porItem = {}
      for (const r of existentes) porItem[r.getString('item_checklist_id')] = r

      const col = txApp.findCollectionByNameOrId('respostas_vistoria')
      for (const tid of tipos) {
        const itens = txApp.findRecordsByFilter(
          'itens_checklist',
          'tipo_vistoria_id = {:t} && revogado != true',
          '',
          0,
          0,
          { t: tid },
        )
        for (const it of itens) {
          if (soItens && soItens.indexOf(it.id) < 0) continue
          const r = porItem[it.id]
          if (r) {
            if (!r.getString('situacao')) {
              r.set('situacao', 'N/A')
              txApp.save(r)
              atualizados++
            }
            continue
          }
          const novo = new Record(col)
          novo.set('vistoria_id', id)
          novo.set('item_checklist_id', it.id)
          novo.set('situacao', 'N/A')
          novo.set('client_uuid', $security.randomString(32))
          txApp.save(novo)
          criados++
        }
      }
    })

    return e.json(200, { ok: true, criados: criados, atualizados: atualizados })
  },
  $apis.requireAuth(),
)
