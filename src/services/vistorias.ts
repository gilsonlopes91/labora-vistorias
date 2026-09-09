import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import type { Empresa } from '@/services/empresas'
import type { TipoVistoria } from '@/services/tiposVistoria'

export type StatusVistoria = 'agendada' | 'em_andamento' | 'concluida' | 'cancelada'

export interface Vistoria extends RecordModel {
  id: string
  organizacao_id: string
  empresa_id: string
  tipo_vistoria_id: string
  tecnico_id?: string
  data_agendada: string
  data_realizada?: string
  status?: StatusVistoria
  observacoes_gerais?: string
  fotos_georreferenciadas?: boolean
  client_uuid: string
  created: string
  updated: string
  expand?: {
    empresa_id?: Empresa
    tipo_vistoria_id?: TipoVistoria
  }
}

export interface VistoriaInput {
  organizacao_id: string
  empresa_id: string
  tipo_vistoria_id: string
  data_agendada: string
  status?: StatusVistoria
  observacoes_gerais?: string
  fotos_georreferenciadas?: boolean
  client_uuid: string
}

export const getVistorias = () =>
  pb.collection('vistorias').getFullList<Vistoria>({
    sort: '-data_agendada',
    expand: 'empresa_id,tipo_vistoria_id',
  })

export const getVistoria = (id: string) =>
  pb.collection('vistorias').getOne<Vistoria>(id, { expand: 'empresa_id,tipo_vistoria_id' })

export const createVistoria = (data: VistoriaInput) =>
  pb.collection('vistorias').create<Vistoria>(data)

export const updateVistoria = (id: string, data: Partial<VistoriaInput>) =>
  pb.collection('vistorias').update<Vistoria>(id, data)

export const deleteVistoria = (id: string) => pb.collection('vistorias').delete(id)
