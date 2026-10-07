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
  /** Logo da empresa (PNG), usada na capa dos documentos SST ao lado do logo
   *  da organização que presta o serviço (migration 0166). */
  logo?: string
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
  /** Planejamento do PGR (E0 — ver P3 do desenho de processo). */
  pgr_data_inicio_levantamento?: string
  pgr_modo_organizacao?: 'GHE/GES' | 'Atividade, posto, função ou setor' | 'Misto'
  pgr_matriz_padrao_metodologia?: 'AIHA' | 'ISO45002' | 'LABORA'
  pgr_matriz_padrao_dimensao?: '3' | '5'
  pgr_participantes?: string
  pgr_observacoes_planejamento?: string
  /** Dados do estabelecimento usados nos Modelos Gerais (migration 0181). */
  nome_estabelecimento?: string
  representante_legal_nome?: string
  representante_legal_cargo?: string
  gestao_sst?: 'SESMT' | 'CIPA' | 'Designado de CIPA' | 'Dispensado'
  jornada_trabalho?: string
  horario_trabalho?: string
  turnos_trabalho?: string
  descricao_processo_produtivo?: string
  canal_comunicacao?: string
  responsavel_plano_nome?: string
  responsavel_plano_cargo?: string
  periodicidade_acompanhamento?: string
  forma_acesso_documento?: string
  local_guarda?: string
  convencao_coletiva_insalubridade?: boolean
  convencao_coletiva_clausula?: string
  area_construida_pavimentos?: string
  numero_cno?: string
  avcb_clcb?: string
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

export const atualizarLogoEmpresa = (id: string, logo: File) => {
  const fd = new FormData()
  fd.append('logo', logo)
  return pb.collection('empresas').update<Empresa>(id, fd)
}

export const removerLogoEmpresa = (id: string) =>
  pb.collection('empresas').update<Empresa>(id, { logo: null })

/** URL do logo da empresa cliente, usado na capa dos documentos SST junto
 *  com o logo da organização (identidadeVisual.ts / urlLogoOrganizacao). */
export const urlLogoEmpresa = (empresa: Empresa) =>
  empresa.logo ? pb.files.getURL(empresa, empresa.logo) : null
