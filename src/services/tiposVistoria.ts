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

export interface TipoVistoriaInput {
  nome: string
  nr_referencia?: string
  descricao?: string
  ativo?: boolean
}

// Modelo customizado da organização (organizacao_id preenchido = visível/editável só pelo dono).
export const createTipoVistoria = (organizacaoId: string, data: TipoVistoriaInput) =>
  pb.collection('tipos_vistoria').create<TipoVistoria>({
    organizacao_id: organizacaoId,
    ativo: true,
    ...data,
  })

export const updateTipoVistoria = (id: string, data: Partial<TipoVistoriaInput>) =>
  pb.collection('tipos_vistoria').update<TipoVistoria>(id, data)

export const deleteTipoVistoria = (id: string) => pb.collection('tipos_vistoria').delete(id)
