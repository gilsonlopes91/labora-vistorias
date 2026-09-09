import pb from '@/lib/pocketbase/client'

export interface TipoVistoria {
  id: string
  organizacao_id?: string
  nome: string
  nr_referencia?: string
  descricao?: string
  ativo?: boolean
  created: string
  updated: string
}

export const getTiposVistoria = () =>
  pb.collection('tipos_vistoria').getFullList<TipoVistoria>({
    filter: 'ativo = true',
    sort: 'nome',
  })
