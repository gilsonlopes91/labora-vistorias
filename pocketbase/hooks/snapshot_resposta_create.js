// Ao criar uma resposta de vistoria, grava a cópia do item da norma como está
// agora (texto, referência, código, grau, tipo e seção). Ver migration 0110.
onRecordCreate((e) => {
  try {
    const r = e.record
    const item = $app.findRecordById('itens_checklist', r.getString('item_checklist_id'))
    r.set('item_ref_snapshot', item.getString('item_ref'))
    r.set('codigo_snapshot', item.getString('codigo'))
    r.set('grau_snapshot', item.getInt('grau') || null)
    r.set('tipo_snapshot', item.getString('tipo'))
    r.set('descricao_snapshot', item.getString('descricao'))
    r.set('secao_snapshot', item.getString('secao'))
    r.set('snapshot_em', new Date().toISOString())
  } catch (err) {
    $app.logger().error('falha ao congelar item na resposta (create)', 'error', String(err))
  }
  e.next()
}, 'respostas_vistoria')
