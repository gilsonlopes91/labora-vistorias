import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export interface Setor extends RecordModel {
  id: string
  organizacao_id: string
  empresa_id: string
  nome: string
  descricao_processo?: string
  local?: string
  area_m2?: number
  pe_direito_m?: number
  cobertura?: string
  piso?: string
  paredes?: string
  iluminacao?: string
  ventilacao?: string
  fotos?: string[]
  created: string
  updated: string
}

export type SetorInput = Partial<Omit<Setor, 'id' | 'created' | 'updated'>> & {
  organizacao_id: string
  empresa_id: string
  nome: string
}

export const getSetores = (empresaId: string) =>
  pb
    .collection('setores')
    .getFullList<Setor>({ filter: `empresa_id = "${empresaId}"`, sort: 'nome' })

export const createSetor = (data: SetorInput) => pb.collection('setores').create<Setor>(data)

export const updateSetor = (id: string, data: Partial<SetorInput>) =>
  pb.collection('setores').update<Setor>(id, data)

export const deleteSetor = (id: string) => pb.collection('setores').delete(id)
