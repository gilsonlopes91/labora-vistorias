import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import type { Ghe } from '@/services/ghes'
import type { Setor } from '@/services/setores'

export interface FuncaoSst extends RecordModel {
  id: string
  organizacao_id: string
  empresa_id: string
  ghe_id: string
  setor_id?: string
  nome: string
  cbo?: string
  descricao_atividades?: string
  numero_empregados?: number
  expand?: { ghe_id?: Ghe; setor_id?: Setor }
  created: string
  updated: string
}

export type FuncaoSstInput = Partial<Omit<FuncaoSst, 'id' | 'created' | 'updated' | 'expand'>> & {
  organizacao_id: string
  empresa_id: string
  ghe_id: string
  nome: string
}

export const getFuncoesSst = (empresaId: string) =>
  pb.collection('funcoes_sst').getFullList<FuncaoSst>({
    filter: `empresa_id = "${empresaId}"`,
    sort: 'nome',
    expand: 'ghe_id,setor_id',
  })

export const createFuncaoSst = (data: FuncaoSstInput) =>
  pb.collection('funcoes_sst').create<FuncaoSst>(data)

export const updateFuncaoSst = (id: string, data: Partial<FuncaoSstInput>) =>
  pb.collection('funcoes_sst').update<FuncaoSst>(id, data)

export const deleteFuncaoSst = (id: string) => pb.collection('funcoes_sst').delete(id)
