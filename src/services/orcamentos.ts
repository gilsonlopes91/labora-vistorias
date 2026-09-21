import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import type { Empresa } from '@/services/empresas'

export type TipoOrcamento = 'servico' | 'treinamento'

export type StatusOrcamento =
  | 'rascunho'
  | 'enviado'
  | 'em_negociacao'
  | 'aprovado'
  | 'recusado'
  | 'cancelado'
  | 'em_execucao'
  | 'concluido'

export const STATUS_LABEL: Record<StatusOrcamento, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  em_negociacao: 'Em negociação',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  cancelado: 'Cancelado',
  em_execucao: 'Em execução',
  concluido: 'Concluído',
}

export const STATUS_ORDEM: StatusOrcamento[] = [
  'rascunho',
  'enviado',
  'em_negociacao',
  'aprovado',
  'recusado',
  'cancelado',
  'em_execucao',
  'concluido',
]

/** Item de proposta do tipo Serviço: descrição, quantidade, unidade e valor. */
export interface ItemServico {
  descricao: string
  quantidade: number
  unidade: string
  valor_unitario: number
}

/** Item de proposta do tipo Treinamento: carga horária, pessoas e turmas. */
export interface ItemTreinamento {
  nome: string
  carga_horaria: string
  pessoas: number
  turmas: number
  valor_unitario: number
}

export type ItemOrcamento = ItemServico | ItemTreinamento

export const isItemTreinamento = (item: ItemOrcamento): item is ItemTreinamento =>
  (item as ItemTreinamento).pessoas !== undefined

/** Subtotal de um item: serviço é quantidade x valor; treinamento é pessoas x turmas x valor. */
export const subtotalItem = (item: ItemOrcamento): number => {
  if (isItemTreinamento(item)) {
    return (item.pessoas || 0) * (item.turmas || 0) * (item.valor_unitario || 0)
  }
  return (item.quantidade || 0) * (item.valor_unitario || 0)
}

export const totalItens = (itens: ItemOrcamento[]): number =>
  itens.reduce((soma, item) => soma + subtotalItem(item), 0)

export interface Orcamento extends RecordModel {
  id: string
  organizacao_id: string
  empresa_id: string
  numero?: string
  tipo: TipoOrcamento
  titulo: string
  descricao?: string
  itens?: ItemOrcamento[]
  valor_total?: number
  valor_entrada?: number
  status: StatusOrcamento
  data_proposta?: string
  validade_dias?: number
  condicao_pagamento?: string
  forma_pagamento?: string
  prazo_entrega?: string
  normas_referencia?: string[]
  itens_inclusos?: string[]
  itens_exclusos?: string[]
  responsavel_engenheiro?: string
  crea?: string
  observacoes?: string
  criado_por?: string
  created: string
  updated: string
  expand?: {
    empresa_id?: Empresa
  }
}

export type OrcamentoInput = Partial<
  Omit<Orcamento, 'id' | 'created' | 'updated' | 'expand' | 'numero'>
> & {
  organizacao_id: string
  empresa_id: string
  titulo: string
  tipo: TipoOrcamento
  status: StatusOrcamento
}

export const getOrcamentos = () =>
  pb.collection('orcamentos').getFullList<Orcamento>({
    sort: '-created',
    expand: 'empresa_id',
  })

export const getOrcamento = (id: string) =>
  pb.collection('orcamentos').getOne<Orcamento>(id, { expand: 'empresa_id' })

export const createOrcamento = (data: OrcamentoInput) =>
  pb.collection('orcamentos').create<Orcamento>(data)

export const updateOrcamento = (id: string, data: Partial<OrcamentoInput>) =>
  pb.collection('orcamentos').update<Orcamento>(id, data)

export const deleteOrcamento = (id: string) => pb.collection('orcamentos').delete(id)

/** Indicadores da carteira, calculados no cliente sobre a lista já carregada. */
export interface IndicadoresOrcamento {
  quantidade: number
  valorOrcado: number
  valorAprovado: number
  emNegociacao: number
  taxaConversao: number
}

export const calcularIndicadores = (orcamentos: Orcamento[]): IndicadoresOrcamento => {
  const valorOrcado = orcamentos.reduce((soma, o) => soma + (o.valor_total || 0), 0)
  const aprovados = orcamentos.filter(
    (o) => o.status === 'aprovado' || o.status === 'em_execucao' || o.status === 'concluido',
  )
  const valorAprovado = aprovados.reduce((soma, o) => soma + (o.valor_total || 0), 0)
  const emNegociacao = orcamentos
    .filter((o) => o.status === 'enviado' || o.status === 'em_negociacao')
    .reduce((soma, o) => soma + (o.valor_total || 0), 0)

  // Conversão considera só o que já teve desfecho — rascunho e em aberto não entram.
  const decididos = orcamentos.filter(
    (o) =>
      o.status === 'aprovado' ||
      o.status === 'em_execucao' ||
      o.status === 'concluido' ||
      o.status === 'recusado',
  )

  return {
    quantidade: orcamentos.length,
    valorOrcado,
    valorAprovado,
    emNegociacao,
    taxaConversao: decididos.length ? (aprovados.length / decididos.length) * 100 : 0,
  }
}
