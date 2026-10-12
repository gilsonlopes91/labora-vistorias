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
  expand?: {
    modelo_formulario_id?: { nome: string; icone?: string; campos?: CampoFormulario[] }
    empresa_id?: { razao_social: string; nome_fantasia?: string }
  }
  dados: Record<string, unknown>
  // cópia dos campos do modelo no momento do registro
  campos_snapshot?: CampoFormulario[] | null
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
    expand: 'modelo_formulario_id,empresa_id',
  })

export const getFormulario = (id: string) =>
  pb.collection('formularios').getOne<Formulario>(id, {
    expand: 'modelo_formulario_id,empresa_id',
  })

// Registros de formulário de uma empresa (página da empresa / filtro por empresa).
export const getFormulariosByEmpresa = (empresaId: string) =>
  pb.collection('formularios').getFullList<Formulario>({
    filter: pb.filter('empresa_id = {:id}', { id: empresaId }),
    sort: '-created',
    expand: 'modelo_formulario_id,empresa_id',
  })

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

// Registro já criado com este client_uuid (envio refeito depois de uma queda).
export const buscarFormularioPorUuid = async (uuid: string) => {
  try {
    return await pb
      .collection('formularios')
      .getFirstListItem<Formulario>(pb.filter('client_uuid = {:u}', { u: uuid }), {
        requestKey: null,
      })
  } catch (error) {
    if ((error as { status?: number })?.status === 404) return null
    throw error
  }
}

export const createFormulario = (data: FormularioInput) =>
  pb.collection('formularios').create<Formulario>(data)

export const updateFormulario = (id: string, data: Partial<Omit<FormularioInput, 'client_uuid'>>) =>
  pb.collection('formularios').update<Formulario>(id, data)

export const deleteFormulario = (id: string) => pb.collection('formularios').delete(id)

// Acrescenta anexos (fotos/assinatura) ao registro sem apagar os que já estão
// lá ("anexos+"). Devolve o registro e os nomes com que o servidor gravou os
// arquivos novos — são esses nomes que ficam nos dados do campo.
export const adicionarAnexos = async (registro: Formulario, arquivos: File[]) => {
  const antes = new Set(registro.anexos || [])
  const fd = new FormData()
  for (const arquivo of arquivos) fd.append('anexos+', arquivo)
  const atualizado = await pb.collection('formularios').update<Formulario>(registro.id, fd)
  const novos = (atualizado.anexos || []).filter((nome) => !antes.has(nome))
  return { registro: atualizado, novos }
}

export const removerAnexos = (id: string, nomes: string[]) => {
  const fd = new FormData()
  for (const nome of nomes) fd.append('anexos-', nome)
  return pb.collection('formularios').update<Formulario>(id, fd)
}

// Anexos são arquivos protegidos: o link precisa do token temporário
// (pb.files.getToken()).
export const urlAnexo = (registro: Formulario, nome: string, token?: string) =>
  pb.files.getURL(registro, nome, token ? { token } : undefined)
