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
  /** CNAE principal (dígitos da subclasse) e descrição (migration 0132). */
  cnae?: string
  cnae_descricao?: string
  /** Endereço em partes. "endereco" continua com a linha completa. */
  cep?: string
  logradouro?: string
  numero_endereco?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  created: string
  updated: string
}

export interface PartesEndereco {
  logradouro?: string
  numero_endereco?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  cep?: string
}

/** Linha única do endereço, usada no relatório, na agenda e na vistoria. */
export function montarEndereco(p: PartesEndereco): string {
  const t = (s?: string) => (s || '').trim()
  return [
    [t(p.logradouro), t(p.numero_endereco)].filter(Boolean).join(', '),
    t(p.complemento),
    t(p.bairro),
    [t(p.cidade), t(p.uf).toUpperCase()].filter(Boolean).join(' - '),
    t(p.cep) ? `CEP ${t(p.cep)}` : '',
  ]
    .filter(Boolean)
    .join(', ')
}

export const temEnderecoEmPartes = (p: PartesEndereco) =>
  !!(p.logradouro || p.numero_endereco || p.bairro || p.cidade || p.uf || p.cep)

export type EmpresaInput = Partial<
  Omit<Empresa, 'id' | 'organizacao_id' | 'created' | 'updated'>
> & {
  organizacao_id: string
}

export const getEmpresas = () =>
  pb.collection('empresas').getFullList<Empresa>({ sort: '-created' })

export const getEmpresa = (id: string) => pb.collection('empresas').getOne<Empresa>(id)

export const createEmpresa = (data: EmpresaInput) => pb.collection('empresas').create<Empresa>(data)

export const updateEmpresa = (id: string, data: Partial<EmpresaInput>) =>
  pb.collection('empresas').update<Empresa>(id, data)

export const deleteEmpresa = (id: string) => pb.collection('empresas').delete(id)
