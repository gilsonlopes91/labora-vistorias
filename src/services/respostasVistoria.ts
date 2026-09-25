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
  // Cópia do item da norma no momento da resposta; congelada quando a vistoria
  // é concluída (migration 0110). O laudo de vistoria concluída usa esta cópia.
  item_ref_snapshot?: string
  codigo_snapshot?: string
  grau_snapshot?: number
  tipo_snapshot?: string
  descricao_snapshot?: string
  secao_snapshot?: string
  snapshot_em?: string
  created: string
  updated: string
}

interface RespostaCreateInput {
  vistoria_id: string
  item_checklist_id: string
  situacao?: Situacao
  observacao?: string
  numero_funcionarios_irregulares?: number
  client_uuid: string
  fotos?: File[]
  localizacao?: GeoLocalizacao
}

interface RespostaUpdateInput {
  situacao?: Situacao
  observacao?: string
  numero_funcionarios_irregulares?: number
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

/** Resposta já gravada de um item (ou null). Usada ao enviar a fila offline. */
export const buscarResposta = async (vistoriaId: string, itemId: string) => {
  try {
    return await pb
      .collection('respostas_vistoria')
      .getFirstListItem<RespostaVistoria>(
        pb.filter('vistoria_id = {:v} && item_checklist_id = {:i}', { v: vistoriaId, i: itemId }),
        { requestKey: null },
      )
  } catch (error) {
    if ((error as { status?: number })?.status === 404) return null
    throw error
  }
}

export const createResposta = (data: RespostaCreateInput) =>
  pb
    .collection('respostas_vistoria')
    .create<RespostaVistoria>(toFormData(data as unknown as Record<string, unknown>))

export const updateResposta = (id: string, data: RespostaUpdateInput) =>
  pb
    .collection('respostas_vistoria')
    .update<RespostaVistoria>(id, toFormData(data as unknown as Record<string, unknown>))

// As fotos são arquivos protegidos (migration 0125): o link só abre com um
// token temporário do usuário logado. Busque o token com getTokenArquivos()
// e passe aqui. O token vale alguns minutos — para abrir a foto em outra aba
// depois disso, gere um novo.
export const getTokenArquivos = () => pb.files.getToken()

export const fotoUrl = (resposta: RespostaVistoria, filename: string, token?: string) =>
  pb.files.getURL(resposta, filename, token ? { token } : undefined)
