import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export type TipoAgente =
  | 'Físico'
  | 'Químico'
  | 'Biológico'
  | 'Ergonômico'
  | 'Acidente'
  | 'Psicossocial'

export interface AgenteCatalogo extends RecordModel {
  id: string
  organizacao_id?: string
  nome: string
  tipo: TipoAgente
  cas?: string
  sinonimos?: string
  codigo_esocial?: string
  codigo_anexo_iv?: string
  anos_aposentadoria_especial?: '15' | '20' | '25'
  grupo_linach?: string
  anexo_nr15?: string
  tipo_avaliacao_nr15?: 'Quantitativa' | 'Qualitativa' | 'Não se aplica'
  grau_insalubridade_nr15?: 'Não caracteriza' | 'Mínimo (10%)' | 'Médio (20%)' | 'Máximo (40%)'
  limite_tolerancia_valor?: number
  limite_tolerancia_unidade?: string
  valor_teto?: number
  fator_desvio?: number
  via_absorcao_pele?: boolean
  nivel_acao_formula?: string
  tlv_acgih_valor?: number
  tlv_acgih_unidade?: string
  tlv_acgih_ano?: number
  anexo_nr16?: string
  item_nr16?: string
  fonte_geradora_tipica?: string
  meio_propagacao?: string
  danos_saude_tipicos?: string
  efeito_saude_aiha?: '0' | '1' | '2' | '3' | '4'
  medidas_controle_tipicas?: string
  ativo?: boolean
  created: string
  updated: string
}

/** Catálogo oficial (organizacao_id vazio) + o customizado da própria organização — a regra de acesso do PocketBase já filtra isso. */
export const getAgentesCatalogo = () =>
  pb.collection('agentes_catalogo').getFullList<AgenteCatalogo>({
    filter: 'ativo = true',
    sort: 'tipo,nome',
  })
