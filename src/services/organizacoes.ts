import pb from '@/lib/pocketbase/client'

export interface Organizacao {
  id: string
  nome: string
  dono_id: string
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
