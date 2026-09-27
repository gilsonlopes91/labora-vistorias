import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import type { AvaliacaoRisco } from '@/services/avaliacoesRisco'

export type StatusAcaoPlano = 'Pendente' | 'Em andamento' | 'Concluída' | 'Cancelada'
export type PrioridadeAcaoPlano =
  | 'Trivial'
  | 'Tolerável'
  | 'Moderado'
  | 'Substancial'
  | 'Intolerável'

export interface AcaoPlano extends RecordModel {
  id: string
  organizacao_id: string
  empresa_id: string
  avaliacao_id?: string
  resposta_vistoria_origem_id?: string
  medida: string
  nivel_hierarquia?: 'Eliminação' | 'Substituição' | 'Engenharia' | 'Administrativa' | 'EPI'
  responsavel?: string
  prazo?: string
  forma_acompanhamento?: string
  forma_afericao_resultado?: string
  status: StatusAcaoPlano
  prioridade?: PrioridadeAcaoPlano
  numero_expostos?: number
  origem?: 'Sugerida' | 'Manual' | 'Vistoria'
  data_conclusao?: string
  evidencia?: string[]
  custo_estimado?: number
  expand?: { avaliacao_id?: AvaliacaoRisco }
  created: string
  updated: string
}

export type AcaoPlanoInput = Partial<Omit<AcaoPlano, 'id' | 'created' | 'updated' | 'expand'>> & {
  organizacao_id: string
  empresa_id: string
  medida: string
  status: StatusAcaoPlano
}

const PRIORIDADE_ORDEM: Record<string, number> = {
  Intolerável: 0,
  Substancial: 1,
  Moderado: 2,
  Tolerável: 3,
  Trivial: 4,
}

export const getAcoesPlano = async (empresaId: string) => {
  const acoes = await pb.collection('acoes_plano').getFullList<AcaoPlano>({
    filter: `empresa_id = "${empresaId}"`,
    sort: '-created',
    expand: 'avaliacao_id',
  })
  // Prioridade (categoria de risco), depois nº de expostos — NR-01 1.5.5.2.1.1
  return acoes.sort((a, b) => {
    const pa = PRIORIDADE_ORDEM[a.prioridade || ''] ?? 9
    const pb2 = PRIORIDADE_ORDEM[b.prioridade || ''] ?? 9
    if (pa !== pb2) return pa - pb2
    return (b.numero_expostos || 0) - (a.numero_expostos || 0)
  })
}

export const createAcaoPlano = (data: AcaoPlanoInput) =>
  pb.collection('acoes_plano').create<AcaoPlano>(data)

export const updateAcaoPlano = (id: string, data: Partial<AcaoPlanoInput>) =>
  pb.collection('acoes_plano').update<AcaoPlano>(id, data)

export const deleteAcaoPlano = (id: string) => pb.collection('acoes_plano').delete(id)

/** Atualização feita pelo cliente (portal): só status e data de conclusão,
 *  por rota de servidor — a regra de acesso da coleção não restringe campo. */
export const atualizarAcaoCliente = (
  id: string,
  data: { status?: StatusAcaoPlano; data_conclusao?: string },
) =>
  pb.send<{ ok: boolean }>('/backend/v1/cliente/acao', {
    method: 'POST',
    body: JSON.stringify({ id, ...data }),
  })
