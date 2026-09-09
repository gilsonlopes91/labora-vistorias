import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export interface Empresa extends RecordModel {
  id: string
  organizacao_id: string
  razao_social: string
  nome_fantasia?: string
  cnpj?: string
  porte?: string
  grau_risco?: number
  numero_funcionarios?: number
  endereco?: string
  contato_nome?: string
  contato_telefone?: string
  contato_email?: string
  created: string
  updated: string
}

export type EmpresaInput = Partial<
  Omit<Empresa, 'id' | 'organizacao_id' | 'created' | 'updated'>
> & {
  organizacao_id: string
}

export const getEmpresas = () =>
  pb.collection('empresas').getFullList<Empresa>({ sort: '-created' })

export const createEmpresa = (data: EmpresaInput) => pb.collection('empresas').create<Empresa>(data)

export const updateEmpresa = (id: string, data: Partial<EmpresaInput>) =>
  pb.collection('empresas').update<Empresa>(id, data)

export const deleteEmpresa = (id: string) => pb.collection('empresas').delete(id)
