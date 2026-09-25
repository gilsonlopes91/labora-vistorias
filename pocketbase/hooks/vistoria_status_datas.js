// Status e datas automáticos da vistoria.
// 1) Primeira resposta gravada numa vistoria "agendada" → "em andamento".
//    Vale também para respostas que chegam depois pela fila offline.
// 2) Ao concluir, se a data de realização ainda não foi gravada, grava a data
//    de hoje (horário de Brasília). O app já manda essa data ao finalizar;
//    aqui é só a garantia. Reabrir e concluir de novo não muda a data original.
// Obs.: usa e.app (e não $app) para funcionar dentro de transações, como a da
// rota que marca itens como N/A.

onRecordCreate((e) => {
  e.next()
  try {
    const v = e.app.findRecordById('vistorias', e.record.getString('vistoria_id'))
    if (v.getString('status') === 'agendada') {
      v.set('status', 'em_andamento')
      e.app.save(v)
    }
  } catch (err) {
    e.app.logger().error('falha ao marcar vistoria em andamento', 'error', String(err))
  }
}, 'respostas_vistoria')

onRecordUpdate((e) => {
  const v = e.record
  const virouConcluida =
    v.getString('status') === 'concluida' && v.original().getString('status') !== 'concluida'
  if (virouConcluida && !v.getString('data_realizada')) {
    // Data de hoje no fuso de Brasília (UTC-3), gravada como dia de calendário.
    const agoraBrasilia = new Date(Date.now() - 3 * 60 * 60 * 1000)
    v.set('data_realizada', agoraBrasilia.toISOString().slice(0, 10) + ' 00:00:00.000Z')
  }
  e.next()
}, 'vistorias')
