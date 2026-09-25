import pb from '@/lib/pocketbase/client'

export type TipoRegistroRT = 'CREA' | 'CRM' | 'CRQ' | 'CRBio' | 'CRP' | 'COREN' | 'MTE' | 'Outro'

export const TIPOS_REGISTRO_RT: TipoRegistroRT[] = [
  'CREA',
  'CRM',
  'CRQ',
  'CRBio',
  'CRP',
  'COREN',
  'MTE',
  'Outro',
]

export interface ResponsavelTecnico {
  id: string
  organizacao_id: string
  nome: string
  tipo_registro: TipoRegistroRT
  numero_registro: string
  uf?: string
  padrao?: boolean
  /** Imagem da assinatura (arquivo protegido, migration 0130). */
  assinatura?: string
  created: string
  updated: string
}

export interface ResponsavelTecnicoInput {
  organizacao_id: string
  nome: string
  tipo_registro: TipoRegistroRT
  numero_registro: string
  uf?: string
  padrao?: boolean
}

export const getResponsaveisTecnicos = (organizacaoId: string) =>
  pb.collection('responsaveis_tecnicos').getFullList<ResponsavelTecnico>({
    filter: pb.filter('organizacao_id = {:id}', { id: organizacaoId }),
    sort: '-padrao,nome',
  })

export const criarResponsavelTecnico = (data: ResponsavelTecnicoInput) =>
  pb.collection('responsaveis_tecnicos').create<ResponsavelTecnico>(data)

export const atualizarResponsavelTecnico = (id: string, data: Partial<ResponsavelTecnicoInput>) =>
  pb.collection('responsaveis_tecnicos').update<ResponsavelTecnico>(id, data)

export const excluirResponsavelTecnico = (id: string) =>
  pb.collection('responsaveis_tecnicos').delete(id)

/** Envia (ou troca) a imagem da assinatura do responsável técnico. */
export const enviarAssinaturaRT = (id: string, arquivo: File) => {
  const fd = new FormData()
  fd.append('assinatura', arquivo)
  return pb.collection('responsaveis_tecnicos').update<ResponsavelTecnico>(id, fd)
}

export const removerAssinaturaRT = (id: string) =>
  pb.collection('responsaveis_tecnicos').update<ResponsavelTecnico>(id, { assinatura: null })

/** Link da assinatura (arquivo protegido: precisa do token de pb.files.getToken()). */
export const urlAssinaturaRT = (rt: ResponsavelTecnico, token: string) =>
  rt.assinatura ? pb.files.getURL(rt, rt.assinatura, { token }) : ''

// Marca um responsável como padrão da organização e desmarca os demais.
export const definirComoPadrao = async (organizacaoId: string, id: string) => {
  const todos = await getResponsaveisTecnicos(organizacaoId)
  await Promise.all(
    todos.map((rt) => {
      if (rt.id === id && !rt.padrao) return atualizarResponsavelTecnico(rt.id, { padrao: true })
      if (rt.id !== id && rt.padrao) return atualizarResponsavelTecnico(rt.id, { padrao: false })
      return Promise.resolve(rt)
    }),
  )
}

export const formatarRegistroRT = (
  rt: Pick<ResponsavelTecnico, 'tipo_registro' | 'numero_registro' | 'uf'>,
) => `${rt.tipo_registro}${rt.uf ? '-' + rt.uf.toUpperCase() : ''} nº ${rt.numero_registro}`
