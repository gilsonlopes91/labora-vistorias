import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import type { Empresa } from '@/services/empresas'
import type { TipoVistoria } from '@/services/tiposVistoria'

export type FrequenciaRotina =
  | 'semanal'
  | 'mensal'
  | 'bimestral'
  | 'trimestral'
  | 'semestral'
  | 'anual'

export interface Rotina extends RecordModel {
  id: string
  organizacao_id: string
  empresa_id: string
  tipo_vistoria_id: string
  frequencia: FrequenciaRotina
  ativo: boolean
  proxima_data: string
  ultima_vistoria_id?: string
  created: string
  updated: string
  expand?: {
    empresa_id?: Empresa
    tipo_vistoria_id?: TipoVistoria
  }
}

export interface RotinaInput {
  organizacao_id: string
  empresa_id: string
  tipo_vistoria_id: string
  frequencia: FrequenciaRotina
  ativo?: boolean
  proxima_data: string
}

export const getRotinas = () =>
  pb.collection('rotinas').getFullList<Rotina>({
    sort: 'proxima_data',
    expand: 'empresa_id,tipo_vistoria_id',
  })

export const createRotina = (data: RotinaInput) => pb.collection('rotinas').create<Rotina>(data)

export const updateRotina = (id: string, data: Partial<RotinaInput>) =>
  pb.collection('rotinas').update<Rotina>(id, data)

export const toggleRotina = (id: string, ativo: boolean) =>
  pb.collection('rotinas').update<Rotina>(id, { ativo })

export const deleteRotina = (id: string) => pb.collection('rotinas').delete(id)
