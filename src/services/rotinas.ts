import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import type { Empresa } from '@/services/empresas'
import type { TipoVistoria } from '@/services/tiposVistoria'
import type { ResponsavelTecnico } from '@/services/responsaveisTecnicos'
import type { ModeloFormulario } from '@/services/formularios'

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
  /** Checklist principal; os demais ficam em `checklists`, como na vistoria. */
  tipo_vistoria_id: string
  checklists?: string[]
  formularios?: string[]
  responsavel_tecnico_id?: string
  hora_inicio?: string
  duracao_min?: number
  frequencia: FrequenciaRotina
  ativo: boolean
  proxima_data: string
  ultima_vistoria_id?: string
  created: string
  updated: string
  expand?: {
    empresa_id?: Empresa
    tipo_vistoria_id?: TipoVistoria
    checklists?: TipoVistoria[]
    formularios?: ModeloFormulario[]
    responsavel_tecnico_id?: ResponsavelTecnico
  }
}

export interface RotinaInput {
  organizacao_id: string
  empresa_id: string
  tipo_vistoria_id: string
  checklists?: string[]
  formularios?: string[]
  responsavel_tecnico_id?: string
  hora_inicio?: string
  duracao_min?: number
  frequencia: FrequenciaRotina
  ativo?: boolean
  proxima_data: string
  ultima_vistoria_id?: string
}

export const getRotinas = () =>
  pb.collection('rotinas').getFullList<Rotina>({
    sort: 'proxima_data',
    expand: 'empresa_id,tipo_vistoria_id,checklists,formularios,responsavel_tecnico_id',
  })

export const createRotina = (data: RotinaInput) => pb.collection('rotinas').create<Rotina>(data)

export const updateRotina = (id: string, data: Partial<RotinaInput>) =>
  pb.collection('rotinas').update<Rotina>(id, data)

export const toggleRotina = (id: string, ativo: boolean) =>
  pb.collection('rotinas').update<Rotina>(id, { ativo })

export const deleteRotina = (id: string) => pb.collection('rotinas').delete(id)
