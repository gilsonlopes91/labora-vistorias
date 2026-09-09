import pb from '@/lib/pocketbase/client'

export interface ItemChecklist {
  id: string
  tipo_vistoria_id: string
  ordem?: number
  secao?: string
  item_ref: string
  codigo: string
  grau?: number
  tipo?: 'S' | 'M'
  descricao: string
  observacao?: string
  created: string
  updated: string
}

export const getItensChecklist = (tipoVistoriaId: string) =>
  pb.collection('itens_checklist').getFullList<ItemChecklist>({
    filter: pb.filter('tipo_vistoria_id = {:id}', { id: tipoVistoriaId }),
    sort: 'ordem',
  })
