import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import type { Setor } from '@/services/setores'

export interface Ghe extends RecordModel {
  id: string
  organizacao_id: string
  empresa_id: string
  setor_id?: string
  codigo?: string
  nome: string
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
