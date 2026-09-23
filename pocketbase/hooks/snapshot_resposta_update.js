// Ao atualizar uma resposta: enquanto a vistoria NÃO está concluída, a cópia do
// item acompanha o catálogo atual. Depois de concluída, a cópia fica congelada
// (não é mais sobrescrita), preservando o laudo emitido. Ver migration 0110.
onRecordUpdate((e) => {
  try {
    const r = e.record
    const vistoria = $app.findRecordById('vistorias', r.getString('vistoria_id'))
    const concluida = vistoria.getString('status') === 'concluida'
    const jaTemCopia = !!r.getString('descricao_snapshot')
    if (!(concluida && jaTemCopia)) {
      const item = $app.findRecordById('itens_checklist', r.getString('item_checklist_id'))
      r.set('item_ref_snapshot', item.getString('item_ref'))
      r.set('codigo_snapshot', item.getString('codigo'))
      r.set('grau_snapshot', item.getInt('grau') || null)
      r.set('tipo_snapshot', item.getString('tipo'))
      r.set('descricao_snapshot', item.getString('descricao'))
      r.set('secao_snapshot', item.getString('secao'))
      r.set('snapshot_em', new Date().toISOString())
    }
  } catch (err) {
    $app.logger().error('falha ao congelar item na resposta (update)', 'error', String(err))
  }
  e.next()
}, 'respostas_vistoria')
