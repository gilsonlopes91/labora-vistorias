import pb from '@/lib/pocketbase/client'

export type Situacao = 'C' | 'N/C' | 'N/A'

export interface RespostaVistoria {
  id: string
  vistoria_id: string
  item_checklist_id: string
  situacao?: Situacao
  observacao?: string
  numero_funcionarios_irregulares?: number
  valor_multa_min?: number
  valor_multa_max?: number
  client_uuid: string
  created: string
  updated: string
}

export const getRespostasByVistoria = (vistoriaId: string) =>
  pb.collection('respostas_vistoria').getFullList<RespostaVistoria>({
    filter: pb.filter('vistoria_id = {:id}', { id: vistoriaId }),
  })

export const createResposta = (data: {
  vistoria_id: string
  item_checklist_id: string
  situacao?: Situacao
  observacao?: string
  client_uuid: string
}) => pb.collection('respostas_vistoria').create<RespostaVistoria>(data)

export const updateResposta = (
  id: string,
  data: Partial<{ situacao: Situacao; observacao: string }>,
) => pb.collection('respostas_vistoria').update<RespostaVistoria>(id, data)
