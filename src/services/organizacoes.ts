import pb from '@/lib/pocketbase/client'

/** Dados da organização que saem nos documentos (propostas e relatórios). */
export interface DadosDocumentos {
  razao_social?: string
  cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
  site?: string
  cidade_emissao?: string
  /** Texto de metodologia que abre o relatório de vistoria. Vazio = texto padrão. */
  metodologia_relatorio?: string
  banco?: {
    favorecido?: string
    instituicao?: string
    agencia?: string
    conta?: string
    pix?: string
  }
}

export interface Organizacao {
  id: string
  nome: string
  dono_id: string
  logo?: string
  cor_primaria?: string
  cor_secundaria?: string
  dados_documentos?: DadosDocumentos | null
  created: string
  updated: string
}

/**
 * Toda conta nova ganha automaticamente uma organização (hook auto_create_organizacao).
 * Como as regras de acesso já restringem a listagem a dono_id = usuário logado,
 * basta pegar o primeiro (e único) registro.
 */
export const getMinhaOrganizacao = () =>
  pb.collection('organizacoes').getFirstListItem<Organizacao>('')

export const atualizarNomeOrganizacao = (id: string, nome: string) =>
  pb.collection('organizacoes').update<Organizacao>(id, { nome })

export const atualizarLogoOrganizacao = (id: string, logo: File) => {
  const fd = new FormData()
  fd.append('logo', logo)
  return pb.collection('organizacoes').update<Organizacao>(id, fd)
}

export const atualizarCoresOrganizacao = (
  id: string,
  cores: { cor_primaria: string; cor_secundaria: string },
) => pb.collection('organizacoes').update<Organizacao>(id, cores)

export const atualizarDadosDocumentos = (id: string, dados: DadosDocumentos) =>
  pb.collection('organizacoes').update<Organizacao>(id, { dados_documentos: dados })

export const removerLogoOrganizacao = (id: string) =>
  pb.collection('organizacoes').update<Organizacao>(id, { logo: null })

export const urlLogoOrganizacao = (org: Organizacao) =>
  org.logo ? pb.files.getURL(org, org.logo) : null
