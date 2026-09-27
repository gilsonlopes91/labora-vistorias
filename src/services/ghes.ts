import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import type { Setor } from '@/services/setores'

/** NR-1, item 13.3.1: o PGR pode ser organizado por GHE/GES (ferramenta da
 *  NR-09) ou por atividade, posto de trabalho, função ou setor — a escolha
 *  é do profissional. */
export type TipoAgrupamento = 'GHE' | 'Atividade' | 'Posto de trabalho' | 'Função' | 'Setor'
export const TIPOS_AGRUPAMENTO: TipoAgrupamento[] = [
  'GHE',
  'Atividade',
  'Posto de trabalho',
  'Função',
  'Setor',
]

export interface Ghe extends RecordModel {
  id: string
  organizacao_id: string
  empresa_id: string
  setor_id?: string
  codigo?: string
  nome: string
  tipo_agrupamento?: TipoAgrupamento
  descricao_atividades?: string
  criterio_agrupamento?: string
  jornada_trabalho?: string
  turno?: string
  numero_expostos?: number
  expand?: { setor_id?: Setor }
  created: string
  updated: string
}

export type GheInput = Partial<Omit<Ghe, 'id' | 'created' | 'updated' | 'expand'>> & {
  organizacao_id: string
  empresa_id: string
  nome: string
}

export const getGhes = (empresaId: string) =>
  pb.collection('ghes').getFullList<Ghe>({
    filter: `empresa_id = "${empresaId}"`,
    sort: 'nome',
    expand: 'setor_id',
  })

export const createGhe = (data: GheInput) => pb.collection('ghes').create<Ghe>(data)

export const updateGhe = (id: string, data: Partial<GheInput>) =>
  pb.collection('ghes').update<Ghe>(id, data)

export const deleteGhe = (id: string) => pb.collection('ghes').delete(id)
