import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export type StatusPlanoAcao = 'Ativo' | 'Concluído' | 'Arquivado'

export interface PlanoAcao extends RecordModel {
  id: string
  organizacao_id: string
  empresa_id: string
  nome: string
  descricao?: string
  status: StatusPlanoAcao
  created: string
  updated: string
}

export type PlanoAcaoInput = Partial<Omit<PlanoAcao, 'id' | 'created' | 'updated'>> & {
  organizacao_id: string
  empresa_id: string
  nome: string
  status: StatusPlanoAcao
}

export const getPlanosAcao = (empresaId: string) =>
  pb.collection('planos_acao').getFullList<PlanoAcao>({
    filter: `empresa_id = "${empresaId}"`,
    sort: '-created',
  })

export const createPlanoAcao = (data: PlanoAcaoInput) =>
  pb.collection('planos_acao').create<PlanoAcao>(data)

export const updatePlanoAcao = (id: string, data: Partial<PlanoAcaoInput>) =>
  pb.collection('planos_acao').update<PlanoAcao>(id, data)

export const deletePlanoAcao = (id: string) => pb.collection('planos_acao').delete(id)
