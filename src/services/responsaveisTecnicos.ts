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
