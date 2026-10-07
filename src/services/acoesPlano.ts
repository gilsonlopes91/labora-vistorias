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
  /** Plano de ação nomeado ao qual esta ação pertence (opcional —
   *  compatibilidade com ações cadastradas antes de existir "planos_acao"). */
  plano_id?: string
  medida: string
  /** 5W2H — o quê (medida), por quê (justificativa), onde (local), quando
   *  (prazo), quem (responsavel), como (como), quanto custa (custo_estimado). */
  justificativa?: string
  local?: string
  como?: string
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

/** Só as ações de um ou mais planos (usado na emissão de documentos, quando
 *  o técnico escolhe quais planos de ação entram naquele PDF). */
export const getAcoesDosPlanos = (empresaId: string, planoIds: string[]) => {
  if (planoIds.length === 0) return getAcoesPlano(empresaId)
  const filtroPlanos = planoIds.map((id) => `plano_id = "${id}"`).join(' || ')
  return pb
    .collection('acoes_plano')
    .getFullList<AcaoPlano>({
      filter: `empresa_id = "${empresaId}" && (${filtroPlanos})`,
      sort: '-created',
      expand: 'avaliacao_id',
    })
    .then((acoes) =>
      acoes.sort((a, b) => {
        const pa = PRIORIDADE_ORDEM[a.prioridade || ''] ?? 9
        const pb2 = PRIORIDADE_ORDEM[b.prioridade || ''] ?? 9
        if (pa !== pb2) return pa - pb2
        return (b.numero_expostos || 0) - (a.numero_expostos || 0)
      }),
    )
}

/** Ações vinculadas a uma avaliação de risco específica (usado no formulário de risco). */
export const getAcoesDaAvaliacao = (avaliacaoId: string) =>
  pb.collection('acoes_plano').getFullList<AcaoPlano>({
    filter: `avaliacao_id = "${avaliacaoId}"`,
    sort: '-created',
  })

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
