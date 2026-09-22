// Mantém o valor recebido e o status financeiro do orçamento em dia a partir
// dos recebimentos lançados. Roda em qualquer alteração da coleção
// orcamento_recebimentos, inclusive exclusão.
//
// Só entra na soma o recebimento com situação "recebido". Previsto e atrasado
// contam como a receber; cancelado não conta.
//
// Status financeiro derivado:
//   nada recebido e orçamento não aprovado → nao_faturado
//   nada recebido e orçamento aprovado     → aguardando_pagamento
//   recebido menor que o total             → parcial
//   recebido cobre o total                 → recebido
// Quem marcou o status à mão como "em_atraso" ou "cancelado" não é
// sobrescrito enquanto não houver novo recebimento que mude o quadro.
function recalcularOrcamento(orcamentoId) {
  if (!orcamentoId) return
  let orcamento
  try {
    orcamento = $app.findRecordById('orcamentos', orcamentoId)
  } catch (_) {
    return // orçamento já excluído
  }

  let recebido = 0
  try {
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
  } catch (_) {}

  recebido = Math.round(recebido * 100) / 100
  const total = orcamento.getFloat('valor_total') || 0
  const statusAtual = orcamento.getString('status_financeiro')

  let novoStatus
  if (recebido <= 0) {
    novoStatus =
      orcamento.getString('status') === 'aprovado' ? 'aguardando_pagamento' : 'nao_faturado'
    // Preserva marcação manual de atraso ou cancelamento enquanto nada foi recebido.
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

onRecordAfterCreateSuccess((e) => {
  try {
    recalcularOrcamento(e.record.get('orcamento_id'))
  } catch (err) {
    $app.logger().error('falha ao recalcular recebido (create)', 'error', String(err))
  }
  e.next()
}, 'orcamento_recebimentos')

onRecordAfterUpdateSuccess((e) => {
  try {
    recalcularOrcamento(e.record.get('orcamento_id'))
  } catch (err) {
    $app.logger().error('falha ao recalcular recebido (update)', 'error', String(err))
  }
  e.next()
}, 'orcamento_recebimentos')

onRecordAfterDeleteSuccess((e) => {
  try {
    recalcularOrcamento(e.record.get('orcamento_id'))
  } catch (err) {
    $app.logger().error('falha ao recalcular recebido (delete)', 'error', String(err))
  }
  e.next()
}, 'orcamento_recebimentos')
