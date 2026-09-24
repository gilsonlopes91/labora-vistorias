// Mantém o valor recebido e o status financeiro do orçamento em dia a partir
// dos recebimentos lançados. Roda em qualquer alteração da coleção
// orcamento_recebimentos, inclusive exclusão.
//
// Só entra na soma o recebimento com situação "recebido". Previsto e atrasado
// contam como a receber; cancelado não conta.
//
// Status financeiro derivado:
//   nada recebido e negócio não fechado → nao_faturado
//   nada recebido e negócio fechado (aprovado, em execução ou concluído)
//                                       → aguardando_pagamento
//   recebido menor que o total          → parcial
//   recebido cobre o total              → recebido
// Marcação manual de "em_atraso" ou "cancelado" é preservada enquanto nada
// tiver sido recebido.
//
// A lógica está repetida nos três callbacks de propósito: o JSVM do PocketBase
// roda cada callback numa VM separada, então função declarada no topo do
// arquivo não existe lá dentro.
onRecordAfterCreateSuccess((e) => {
  try {
    const orcamentoId = e.record.get('orcamento_id')
    if (orcamentoId) {
      const orcamento = $app.findRecordById('orcamentos', orcamentoId)
      let recebido = 0
      const parcelas = $app.findRecordsByFilter(
        'orcamento_recebimentos',
        "orcamento_id = '" + orcamentoId + "'",
        '',
        0,
        0,
      )
      for (const parcela of parcelas) {
        if (parcela.getString('situacao') === 'recebido') recebido += parcela.getFloat('valor') || 0
      }
      recebido = Math.round(recebido * 100) / 100
      const total = orcamento.getFloat('valor_total') || 0
      const statusAtual = orcamento.getString('status_financeiro')
      const ganho =
        ['aprovado', 'em_execucao', 'concluido'].indexOf(orcamento.getString('status')) >= 0
      let novoStatus
      if (recebido <= 0) {
        novoStatus = ganho ? 'aguardando_pagamento' : 'nao_faturado'
        if (statusAtual === 'em_atraso' || statusAtual === 'cancelado') novoStatus = statusAtual
      } else if (total > 0 && recebido >= total) {
        novoStatus = 'recebido'
      } else {
        novoStatus = 'parcial'
      }
      orcamento.set('valor_recebido', recebido)
      orcamento.set('status_financeiro', novoStatus)
      $app.save(orcamento)
    }
  } catch (err) {
    $app.logger().error('falha ao recalcular recebido (create)', 'error', String(err))
  }
  e.next()
}, 'orcamento_recebimentos')

onRecordAfterUpdateSuccess((e) => {
  try {
    const orcamentoId = e.record.get('orcamento_id')
    if (orcamentoId) {
      const orcamento = $app.findRecordById('orcamentos', orcamentoId)
      let recebido = 0
      const parcelas = $app.findRecordsByFilter(
        'orcamento_recebimentos',
        "orcamento_id = '" + orcamentoId + "'",
        '',
        0,
        0,
      )
      for (const parcela of parcelas) {
        if (parcela.getString('situacao') === 'recebido') recebido += parcela.getFloat('valor') || 0
      }
      recebido = Math.round(recebido * 100) / 100
      const total = orcamento.getFloat('valor_total') || 0
      const statusAtual = orcamento.getString('status_financeiro')
      const ganho =
        ['aprovado', 'em_execucao', 'concluido'].indexOf(orcamento.getString('status')) >= 0
      let novoStatus
      if (recebido <= 0) {
        novoStatus = ganho ? 'aguardando_pagamento' : 'nao_faturado'
        if (statusAtual === 'em_atraso' || statusAtual === 'cancelado') novoStatus = statusAtual
      } else if (total > 0 && recebido >= total) {
        novoStatus = 'recebido'
      } else {
        novoStatus = 'parcial'
      }
      orcamento.set('valor_recebido', recebido)
      orcamento.set('status_financeiro', novoStatus)
      $app.save(orcamento)
    }
  } catch (err) {
    $app.logger().error('falha ao recalcular recebido (update)', 'error', String(err))
  }
  e.next()
}, 'orcamento_recebimentos')

onRecordAfterDeleteSuccess((e) => {
  try {
    const orcamentoId = e.record.get('orcamento_id')
    if (orcamentoId) {
      const orcamento = $app.findRecordById('orcamentos', orcamentoId)
      let recebido = 0
      const parcelas = $app.findRecordsByFilter(
        'orcamento_recebimentos',
        "orcamento_id = '" + orcamentoId + "'",
        '',
        0,
        0,
      )
      for (const parcela of parcelas) {
        if (parcela.getString('situacao') === 'recebido') recebido += parcela.getFloat('valor') || 0
      }
      recebido = Math.round(recebido * 100) / 100
      const total = orcamento.getFloat('valor_total') || 0
      const statusAtual = orcamento.getString('status_financeiro')
      const ganho =
        ['aprovado', 'em_execucao', 'concluido'].indexOf(orcamento.getString('status')) >= 0
      let novoStatus
      if (recebido <= 0) {
        novoStatus = ganho ? 'aguardando_pagamento' : 'nao_faturado'
        if (statusAtual === 'em_atraso' || statusAtual === 'cancelado') novoStatus = statusAtual
      } else if (total > 0 && recebido >= total) {
        novoStatus = 'recebido'
      } else {
        novoStatus = 'parcial'
      }
      orcamento.set('valor_recebido', recebido)
      orcamento.set('status_financeiro', novoStatus)
      $app.save(orcamento)
    }
  } catch (err) {
    $app.logger().error('falha ao recalcular recebido (delete)', 'error', String(err))
  }
  e.next()
}, 'orcamento_recebimentos')
