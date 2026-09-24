import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import type { Empresa } from '@/services/empresas'
import type { TipoVistoria } from '@/services/tiposVistoria'
import type { ResponsavelTecnico } from '@/services/responsaveisTecnicos'
import type { ModeloFormulario } from '@/services/formularios'

export type StatusVistoria = 'agendada' | 'em_andamento' | 'concluida' | 'cancelada'

export interface Vistoria extends RecordModel {
  id: string
  organizacao_id: string
  empresa_id: string
  tipo_vistoria_id?: string
  formularios?: string[]
  checklists?: string[]
  tecnico_id?: string
  responsavel_tecnico_id?: string
  data_agendada: string
  data_realizada?: string
  status?: StatusVistoria
  observacoes_gerais?: string
  fotos_georreferenciadas?: boolean
  responsavel_tecnico_nome?: string
  responsavel_tecnico_registro?: string
  nr31_base_legal?: 'lei_380' | 'portaria_392'
  hora_inicio?: string
  duracao_min?: number
  local_vistoria?: string
  contato_local_nome?: string
  contato_local_telefone?: string
  equipe_apoio?: string
  equipamentos?: string
  orientacoes_equipe?: string
  client_uuid: string
  created: string
  updated: string
  expand?: {
    empresa_id?: Empresa
    tipo_vistoria_id?: TipoVistoria
    responsavel_tecnico_id?: ResponsavelTecnico
    formularios?: ModeloFormulario[]
    checklists?: TipoVistoria[]
  }
}

export interface VistoriaInput {
  organizacao_id: string
  empresa_id: string
  tipo_vistoria_id?: string
  formularios?: string[]
  checklists?: string[]
  tecnico_id?: string
  responsavel_tecnico_id?: string
  data_agendada: string
  status?: StatusVistoria
  observacoes_gerais?: string
  fotos_georreferenciadas?: boolean
  responsavel_tecnico_nome?: string
  responsavel_tecnico_registro?: string
  nr31_base_legal?: 'lei_380' | 'portaria_392'
  hora_inicio?: string
  duracao_min?: number
  local_vistoria?: string
  contato_local_nome?: string
  contato_local_telefone?: string
  equipe_apoio?: string
  equipamentos?: string
  orientacoes_equipe?: string
  client_uuid: string
}

export const getVistorias = () =>
  pb.collection('vistorias').getFullList<Vistoria>({
    sort: '-data_agendada',
    expand: 'empresa_id,tipo_vistoria_id,responsavel_tecnico_id,formularios,checklists',
  })

export const getVistoria = (id: string) =>
  pb.collection('vistorias').getOne<Vistoria>(id, {
    expand: 'empresa_id,tipo_vistoria_id,responsavel_tecnico_id,formularios,checklists',
  })

export const createVistoria = (data: VistoriaInput) =>
  pb.collection('vistorias').create<Vistoria>(data)

export const updateVistoria = (id: string, data: Partial<VistoriaInput>) =>
  pb.collection('vistorias').update<Vistoria>(id, data)

export const deleteVistoria = (id: string) => pb.collection('vistorias').delete(id)
