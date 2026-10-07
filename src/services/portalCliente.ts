import pb from '@/lib/pocketbase/client'
import type { StatusOrcamento, TipoOrcamento } from '@/services/orcamentos'

/* Portal do cliente: o servidor entrega só o que o cliente pode ver, com
   os campos já filtrados (sem equipe, valores internos nem anotações). */

export interface VistoriaAgendaCliente {
  id: string
  data_agendada: string
  hora_inicio?: string
  status: 'agendada' | 'em_andamento'
  nome: string
}

export interface OrcamentoCliente {
  id: string
  empresa_id: string
  numero?: string
  versao?: string
  titulo: string
  tipo: TipoOrcamento
  status: StatusOrcamento
  valor_total: number
  data_proposta?: string
  validade_dias?: number
}

/** Vistorias marcadas (agendada ou em andamento) da empresa. */
export const getAgendaCliente = (empresaId: string) =>
  pb
    .send<{ items: VistoriaAgendaCliente[] }>(`/backend/v1/cliente/empresa/${empresaId}/agenda`, {
      method: 'GET',
    })
    .then((r) => r.items)

/** Propostas enviadas para a empresa, só com os campos que o cliente vê. */
export const getOrcamentosCliente = (empresaId: string) =>
  pb
    .send<{ items: OrcamentoCliente[] }>(`/backend/v1/cliente/empresa/${empresaId}/orcamentos`, {
      method: 'GET',
    })
    .then((r) => r.items)
