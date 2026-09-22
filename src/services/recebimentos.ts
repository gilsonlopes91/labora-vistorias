import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export type SituacaoRecebimento = 'previsto' | 'recebido' | 'atrasado' | 'cancelado'

export const SITUACAO_RECEBIMENTO_LABEL: Record<SituacaoRecebimento, string> = {
  previsto: 'Previsto',
  recebido: 'Recebido',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
}

/**
 * Parcela de recebimento de um orçamento. Só a parcela com situação
 * "recebido" entra no valor recebido do orçamento; o hook do backend
 * recalcula esse total a cada alteração aqui.
 */
export interface Recebimento extends RecordModel {
  id: string
  orcamento_id: string
  valor: number
  data_recebimento?: string
  data_vencimento?: string
  forma_pagamento?: string
  descricao?: string
  situacao?: SituacaoRecebimento
  comprovante?: string
  created: string
  updated: string
}

export interface RecebimentoInput {
  orcamento_id: string
  valor: number
  data_recebimento?: string
  data_vencimento?: string
  forma_pagamento?: string
  descricao?: string
  situacao?: SituacaoRecebimento
}

export const getRecebimentos = (orcamentoId: string) =>
  pb.collection('orcamento_recebimentos').getFullList<Recebimento>({
    filter: pb.filter('orcamento_id = {:id}', { id: orcamentoId }),
    sort: '-data_recebimento,-created',
  })

export const criarRecebimento = (dados: RecebimentoInput) =>
  pb.collection('orcamento_recebimentos').create<Recebimento>(dados)

export const atualizarRecebimento = (id: string, dados: Partial<RecebimentoInput>) =>
  pb.collection('orcamento_recebimentos').update<Recebimento>(id, dados)

export const excluirRecebimento = (id: string) => pb.collection('orcamento_recebimentos').delete(id)
