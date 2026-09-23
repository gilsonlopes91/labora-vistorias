// Quando a vistoria passa para "concluida", atualiza pela última vez a cópia do
// item em todas as respostas, com o catálogo vigente no dia da conclusão. A
// partir daí a cópia não muda mais (ver snapshot_resposta_update.js).
onRecordUpdate((e) => {
  const v = e.record
  const virouConcluida =
    v.getString('status') === 'concluida' && v.original().getString('status') !== 'concluida'

  e.next()

  if (!virouConcluida) return
  try {
    const app = e.app
    const respostas = app.findRecordsByFilter(
      'respostas_vistoria',
      'vistoria_id = {:id}',
      '',
      0,
      0,
      { id: v.id },
    )
    const quando = new Date().toISOString()
    for (const r of respostas) {
      try {
        const item = app.findRecordById('itens_checklist', r.getString('item_checklist_id'))
        r.set('item_ref_snapshot', item.getString('item_ref'))
        r.set('codigo_snapshot', item.getString('codigo'))
        r.set('grau_snapshot', item.getInt('grau') || null)
        r.set('tipo_snapshot', item.getString('tipo'))
        r.set('descricao_snapshot', item.getString('descricao'))
        r.set('secao_snapshot', item.getString('secao'))
        r.set('snapshot_em', quando)
        app.saveNoValidate(r)
      } catch (err) {
        app.logger().error('falha ao congelar resposta', 'resposta', r.id, 'error', String(err))
      }
    }
  } catch (err) {
    $app.logger().error('falha ao congelar itens da vistoria concluída', 'error', String(err))
  }
}, 'vistorias')
