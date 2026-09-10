import pb from '@/lib/pocketbase/client'

export interface Organizacao {
  id: string
  nome: string
  dono_id: string
  logo?: string
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

export const removerLogoOrganizacao = (id: string) =>
  pb.collection('organizacoes').update<Organizacao>(id, { logo: null })

export const urlLogoOrganizacao = (org: Organizacao) =>
  org.logo ? pb.files.getURL(org, org.logo) : null
