import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import type { Empresa } from '@/services/empresas'
import type { ModeloProposta } from '@/services/modelosProposta'

export type TipoOrcamento = 'servico' | 'treinamento'

export type StatusOrcamento =
  | 'rascunho'
  | 'enviado'
  | 'aguardando_retorno'
  | 'em_negociacao'
  | 'aprovado'
  | 'recusado'
  | 'cancelado'
  | 'expirado'
  | 'em_execucao'
  | 'concluido'

export const STATUS_LABEL: Record<StatusOrcamento, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aguardando_retorno: 'Aguardando retorno',
  em_negociacao: 'Em negociação',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  cancelado: 'Cancelado',
  expirado: 'Expirado',
  em_execucao: 'Em execução',
  concluido: 'Concluído',
}

export const STATUS_ORDEM: StatusOrcamento[] = [
  'rascunho',
  'enviado',
  'aguardando_retorno',
  'em_negociacao',
  'aprovado',
  'recusado',
  'cancelado',
  'expirado',
  'em_execucao',
  'concluido',
]

/** Status que contam como negócio fechado, para KPI e para o valor aprovado. */
export const STATUS_GANHOS: StatusOrcamento[] = ['aprovado', 'em_execucao', 'concluido']

export type StatusFinanceiro =
  | 'nao_faturado'
  | 'aguardando_pagamento'
  | 'parcial'
  | 'recebido'
  | 'em_atraso'
  | 'cancelado'

export const STATUS_FINANCEIRO_LABEL: Record<StatusFinanceiro, string> = {
  nao_faturado: 'Não faturado',
  aguardando_pagamento: 'Aguardando pagamento',
  parcial: 'Pago parcial',
  recebido: 'Recebido',
  em_atraso: 'Em atraso',
  cancelado: 'Cancelado',
}

export const STATUS_FINANCEIRO_ORDEM: StatusFinanceiro[] = [
  'nao_faturado',
  'aguardando_pagamento',
  'parcial',
  'recebido',
  'em_atraso',
  'cancelado',
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
  valor_recebido?: number
  status: StatusOrcamento
  status_financeiro?: StatusFinanceiro
  data_proposta?: string
  validade_dias?: number
  data_envio?: string
  data_aprovacao?: string
  data_prevista_recebimento?: string
  motivo_recusa?: string
  motivo_cancelamento?: string
  ultimo_contato?: string
  proximo_contato?: string
  forma_ultimo_contato?: string
  resumo_ultimo_contato?: string
  proxima_acao?: string
  responsavel_followup?: string
  versao?: string
  arquivado?: boolean
  orcamento_origem_id?: string
  modelo_proposta_id?: string
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
    modelo_proposta_id?: ModeloProposta
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
    expand: 'empresa_id,modelo_proposta_id',
  })

export const getOrcamento = (id: string) =>
  pb.collection('orcamentos').getOne<Orcamento>(id, { expand: 'empresa_id,modelo_proposta_id' })

export const createOrcamento = (data: OrcamentoInput) =>
  pb.collection('orcamentos').create<Orcamento>(data)

export const updateOrcamento = (id: string, data: Partial<OrcamentoInput>) =>
  pb.collection('orcamentos').update<Orcamento>(id, data)

export const deleteOrcamento = (id: string) => pb.collection('orcamentos').delete(id)

/**
 * Duplica o orçamento como uma nova versão, mantendo o vínculo com o original.
 * O número novo sai do hook do backend; a versão vira v2, v3 e assim por diante.
 */
export const criarVersaoOrcamento = async (origem: Orcamento) => {
  const versaoAtual = parseInt((origem.versao || 'v1').replace(/\D/g, ''), 10) || 1
  const copia: Record<string, unknown> = {
    organizacao_id: origem.organizacao_id,
    empresa_id: origem.empresa_id,
    tipo: origem.tipo,
    titulo: origem.titulo,
    descricao: origem.descricao,
    itens: origem.itens,
    valor_total: origem.valor_total,
    valor_entrada: origem.valor_entrada,
    status: 'rascunho',
    status_financeiro: 'nao_faturado',
    data_proposta: new Date().toISOString().slice(0, 10),
    validade_dias: origem.validade_dias,
    condicao_pagamento: origem.condicao_pagamento,
    forma_pagamento: origem.forma_pagamento,
    prazo_entrega: origem.prazo_entrega,
    normas_referencia: origem.normas_referencia,
    itens_inclusos: origem.itens_inclusos,
    itens_exclusos: origem.itens_exclusos,
    responsavel_engenheiro: origem.responsavel_engenheiro,
    crea: origem.crea,
    observacoes: origem.observacoes,
    modelo_proposta_id: origem.modelo_proposta_id,
    versao: `v${versaoAtual + 1}`,
    orcamento_origem_id: origem.orcamento_origem_id || origem.id,
  }
  return pb.collection('orcamentos').create<Orcamento>(copia)
}

/** Indicadores da carteira, calculados no cliente sobre a lista já filtrada. */
export interface IndicadoresOrcamento {
  quantidade: number
  valorOrcado: number
  valorAprovado: number
  valorRecebido: number
  valorAReceber: number
  enviados: number
  emNegociacao: number
  aguardandoRetorno: number
  aprovados: number
  recusados: number
  ticketMedio: number
  taxaConversao: number
  vencendoEm7Dias: number
  emAtraso: number
}

export const calcularIndicadores = (orcamentos: Orcamento[]): IndicadoresOrcamento => {
  const ganhos = orcamentos.filter((o) => STATUS_GANHOS.includes(o.status))
  const valorOrcado = orcamentos.reduce((soma, o) => soma + (o.valor_total || 0), 0)
  const valorAprovado = ganhos.reduce((soma, o) => soma + (o.valor_total || 0), 0)
  const valorRecebido = orcamentos.reduce((soma, o) => soma + (o.valor_recebido || 0), 0)

  const hoje = new Date()
  const limite = new Date()
  limite.setDate(limite.getDate() + 7)

  // Proposta que vence nos próximos sete dias e ainda está em aberto.
  const emAberto: StatusOrcamento[] = ['enviado', 'aguardando_retorno', 'em_negociacao']
  const vencendoEm7Dias = orcamentos.filter((o) => {
    if (!emAberto.includes(o.status) || !o.data_proposta || !o.validade_dias) return false
    const vencimento = new Date(o.data_proposta)
    vencimento.setDate(vencimento.getDate() + o.validade_dias)
    return vencimento >= hoje && vencimento <= limite
  }).length

  const contarStatus = (status: StatusOrcamento) =>
    orcamentos.filter((o) => o.status === status).length

  return {
    quantidade: orcamentos.length,
    valorOrcado,
    valorAprovado,
    valorRecebido,
    valorAReceber: Math.max(valorAprovado - valorRecebido, 0),
    enviados: contarStatus('enviado'),
    emNegociacao: contarStatus('em_negociacao'),
    aguardandoRetorno: contarStatus('aguardando_retorno'),
    aprovados: ganhos.length,
    recusados: contarStatus('recusado'),
    ticketMedio: orcamentos.length ? valorOrcado / orcamentos.length : 0,
    // Conversão por valor: quanto do que foi orçado virou negócio fechado.
    taxaConversao: valorOrcado ? (valorAprovado / valorOrcado) * 100 : 0,
    emAtraso: orcamentos.filter((o) => o.status_financeiro === 'em_atraso').length,
    vencendoEm7Dias,
  }
}
