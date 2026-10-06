import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

/** Modelo de certificado. organizacao_id vazio = modelo base da plataforma (só a administração edita). */
export interface ModeloCertificado extends RecordModel {
  id: string
  organizacao_id?: string
  nome: string
  /** Selo logo abaixo do título (ex.: "NR 12"). Vazio = sem selo. */
  selo?: string
  /** Texto da frente, com variáveis {NOME} {CPF} {EMPRESA} {ENDERECO} {DATA} {CARGA} {EXTRA}. */
  texto: string
  carga_horaria?: string
  campo_extra_rotulo?: string
  campo_extra_exemplo?: string
  /** Conteúdo programático, uma linha por tópico. */
  conteudo: string
  rascunho?: boolean
  ordem?: number
  created: string
  updated: string
}

export type ModeloCertificadoInput = Omit<
  ModeloCertificado,
  'id' | 'created' | 'updated' | 'collectionId' | 'collectionName' | 'expand'
>

export const ehModeloBase = (m: Pick<ModeloCertificado, 'organizacao_id'>) => !m.organizacao_id

const organizacaoDoUsuario = (): string =>
  String((pb.authStore.record as { organizacao_id?: string } | null)?.organizacao_id || '')

/** Modelos da organização (primeiro) e modelos base da plataforma. */
export async function getModelosCertificado(): Promise<ModeloCertificado[]> {
  const orgId = organizacaoDoUsuario()
  const filtro = orgId
    ? `organizacao_id = "" || organizacao_id = "${orgId}"`
    : 'organizacao_id = ""'
  const lista = await pb
    .collection('modelos_certificado')
    .getFullList<ModeloCertificado>({ filter: filtro, sort: 'ordem,nome' })
  const proprios = lista.filter((m) => !ehModeloBase(m))
  const base = lista.filter(ehModeloBase)
  return [...proprios, ...base]
}

export const criarModeloCertificado = (dados: Omit<ModeloCertificadoInput, 'organizacao_id'>) =>
  pb
    .collection('modelos_certificado')
    .create<ModeloCertificado>({ ...dados, organizacao_id: organizacaoDoUsuario() })

export const atualizarModeloCertificado = (id: string, dados: Partial<ModeloCertificadoInput>) =>
  pb.collection('modelos_certificado').update<ModeloCertificado>(id, dados)

export const excluirModeloCertificado = (id: string) =>
  pb.collection('modelos_certificado').delete(id)

/** Copia um modelo (base ou próprio) para a organização, para poder editar. */
export const duplicarModeloCertificado = (m: ModeloCertificado) =>
  criarModeloCertificado({
    nome: `${m.nome} (cópia)`.slice(0, 200),
    selo: m.selo || '',
    texto: m.texto,
    carga_horaria: m.carga_horaria || '',
    campo_extra_rotulo: m.campo_extra_rotulo || '',
    campo_extra_exemplo: m.campo_extra_exemplo || '',
    conteudo: m.conteudo,
    rascunho: Boolean(m.rascunho),
    ordem: 0,
  })
