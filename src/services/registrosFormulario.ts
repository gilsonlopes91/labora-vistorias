import pb from '@/lib/pocketbase/client'
import type { CampoFormulario } from '@/services/formularios'

// Registro de formulário preenchido em campo.
export interface Formulario {
  id: string
  organizacao_id: string
  empresa_id?: string
  modelo_formulario_id: string
  vistoria_id?: string
  // expand do modelo (usado na listagem/detalhe)
  expand?: { modelo_formulario_id?: { nome: string; icone?: string; campos?: CampoFormulario[] } }
  dados: Record<string, unknown>
  anexos: string[]
  status: 'rascunho' | 'concluido'
  data_campo?: string
  criado_por?: string
  client_uuid: string
  created: string
  updated: string
}

export const getFormularios = () =>
  pb.collection('formularios').getFullList<Formulario>({
    sort: '-created',
    expand: 'modelo_formulario_id',
  })

export const getFormulario = (id: string) =>
  pb.collection('formularios').getOne<Formulario>(id, { expand: 'modelo_formulario_id' })

// Registros de formulário já preenchidos dentro de uma vistoria específica.
export const getFormulariosByVistoria = (vistoriaId: string) =>
  pb.collection('formularios').getFullList<Formulario>({
    filter: pb.filter('vistoria_id = {:id}', { id: vistoriaId }),
    expand: 'modelo_formulario_id',
  })

export interface FormularioInput {
  organizacao_id: string
  empresa_id?: string
  modelo_formulario_id: string
  vistoria_id?: string
  dados?: Record<string, unknown>
  status: 'rascunho' | 'concluido'
  data_campo?: string
  client_uuid: string
}

export const createFormulario = (data: FormularioInput) =>
  pb.collection('formularios').create<Formulario>(data)

export const updateFormulario = (id: string, data: Partial<Omit<FormularioInput, 'client_uuid'>>) =>
  pb.collection('formularios').update<Formulario>(id, data)

export const deleteFormulario = (id: string) => pb.collection('formularios').delete(id)

// Upload de anexos (fotos/assinatura) num formulário já criado.
export const enviarAnexos = (id: string, arquivos: File[]) => {
  const fd = new FormData()
  for (const arquivo of arquivos) fd.append('anexos', arquivo)
  return pb.collection('formularios').update<Formulario>(id, fd)
}
