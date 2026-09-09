import pb from '@/lib/pocketbase/client'

export type Situacao = 'C' | 'N/C' | 'N/A'

export interface GeoLocalizacao {
  lon: number
  lat: number
}

export interface RespostaVistoria {
  id: string
  vistoria_id: string
  item_checklist_id: string
  situacao?: Situacao
  observacao?: string
  numero_funcionarios_irregulares?: number
  valor_multa_min?: number
  valor_multa_max?: number
  foto?: string[]
  localizacao?: GeoLocalizacao
  client_uuid: string
  created: string
  updated: string
}

interface RespostaCreateInput {
  vistoria_id: string
  item_checklist_id: string
  situacao?: Situacao
  observacao?: string
  client_uuid: string
  fotos?: File[]
  localizacao?: GeoLocalizacao
}

interface RespostaUpdateInput {
  situacao?: Situacao
  observacao?: string
  fotos?: File[]
  localizacao?: GeoLocalizacao
}

// Monta FormData porque o upload de foto exige multipart. "foto+" instrui o
// PocketBase a ACRESCENTAR aos arquivos já existentes no campo (que aceita
// várias fotos por item) em vez de substituí-los.
function toFormData(data: Record<string, unknown>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue
    if (key === 'fotos' && Array.isArray(value)) {
      for (const file of value as File[]) fd.append('foto+', file)
      continue
    }
    if (key === 'localizacao') {
      fd.append('localizacao', JSON.stringify(value))
      continue
    }
    fd.append(key, String(value))
  }
  return fd
}

export const getRespostasByVistoria = (vistoriaId: string) =>
  pb.collection('respostas_vistoria').getFullList<RespostaVistoria>({
    filter: pb.filter('vistoria_id = {:id}', { id: vistoriaId }),
  })

export const createResposta = (data: RespostaCreateInput) =>
  pb.collection('respostas_vistoria').create<RespostaVistoria>(toFormData(data))

export const updateResposta = (id: string, data: RespostaUpdateInput) =>
  pb.collection('respostas_vistoria').update<RespostaVistoria>(id, toFormData(data))

export const fotoUrl = (resposta: RespostaVistoria, filename: string) =>
  pb.files.getURL(resposta, filename)
