import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import type { AgenteCatalogo } from '@/services/agentesCatalogo'
import type { Ghe } from '@/services/ghes'

export type TrilhaProbabilidade =
  | 'Quantitativa (medição)'
  | 'Qualitativa (controle)'
  | 'Acidente/mecânico'
  | 'Ergonômica (AEP/AET)'
  | 'Psicossocial'
  | 'Sem dados suficientes'

export interface AvaliacaoRisco extends RecordModel {
  id: string
  organizacao_id: string
  ghe_id: string
  agente_id?: string
  perigo_descricao?: string
  fonte_geradora?: string
  atividades_relacionadas?: string
  meio_propagacao?: string
  via_absorcao?: string
  frequencia_exposicao?: string
  tempo_exposicao_min_jornada?: number
  numero_expostos?: number
  danos_possiveis?: string
  efeito_saude_aiha?: '0' | '1' | '2' | '3' | '4'
  trilha_probabilidade: TrilhaProbabilidade
  controle_descricao?: string
  controle_nivel?: string
  resultado_aep_aet?: 'Baixo' | 'Médio' | 'Alto' | 'Não avaliado'
  observacoes_aep_aet?: string
  categoria_aiha_exposicao?: '0' | '1' | '2' | '3' | '4'
  incerteza?: '0' | '1' | '2' | '3'
  epc_lista?: string
  epc_eficaz?: boolean
  epc_plano_manutencao?: boolean
  medidas_administrativas?: string
  epis_utilizados?: string
  epi_condicao_funcionamento?: boolean
  epi_uso_ininterrupto?: boolean
  epi_validade_ca_ok?: boolean
  epi_periodicidade_troca_ok?: boolean
  epi_higienizacao_ok?: boolean
  probabilidade_sugerida?: number
  probabilidade_final?: number
  severidade_sugerida?: number
  severidade_final?: number
  justificativa_ajuste?: string
  insalubridade_sugerida?: string
  insalubridade_final?: string
  insalubridade_justificativa?: string
  periculosidade_sugerida?: boolean
  periculosidade_final?: boolean
  periculosidade_anexo?: string
  periculosidade_justificativa?: string
  ltcat_enquadra_sugerido?: string
  ltcat_enquadra_final?: string
  ltcat_justificativa?: string
  origem?: 'Manual' | 'Formulário de campo' | 'Item N/C de vistoria'
  formulario_origem_id?: string
  resposta_vistoria_origem_id?: string
  risco_evidente?: boolean
  risco_evidente_acao_imediata?: string
  perigo_externo?: boolean
  atividade_nao_rotineira?: boolean
  nr_especifica_aplicavel?: boolean
  nr_especifica_referencia?: string
  nr_especifica_atendida?: boolean
  nr_especifica_justificativa?: string
  ativo?: boolean
  expand?: { ghe_id?: Ghe; agente_id?: AgenteCatalogo }
  created: string
  updated: string
}

export type AvaliacaoRiscoInput = Partial<
  Omit<AvaliacaoRisco, 'id' | 'created' | 'updated' | 'expand'>
> & {
  organizacao_id: string
  ghe_id: string
  trilha_probabilidade: TrilhaProbabilidade
}

/** Todas as avaliações dos GHE informados (uma empresa = todos os GHE dela). */
export const getAvaliacoesRiscoPorGhes = (gheIds: string[]) => {
  if (gheIds.length === 0) return Promise.resolve<AvaliacaoRisco[]>([])
  const filtro = gheIds.map((id) => `ghe_id = "${id}"`).join(' || ')
  return pb.collection('avaliacoes_risco').getFullList<AvaliacaoRisco>({
    filter: `(${filtro}) && ativo = true`,
    sort: '-created',
    expand: 'ghe_id,agente_id',
  })
}

export const createAvaliacaoRisco = (data: AvaliacaoRiscoInput) =>
  pb.collection('avaliacoes_risco').create<AvaliacaoRisco>(data)

export const updateAvaliacaoRisco = (id: string, data: Partial<AvaliacaoRiscoInput>) =>
  pb.collection('avaliacoes_risco').update<AvaliacaoRisco>(id, data)

export const deleteAvaliacaoRisco = (id: string) =>
  pb.collection('avaliacoes_risco').update(id, { ativo: false })
