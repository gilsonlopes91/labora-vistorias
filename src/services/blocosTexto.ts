/* Biblioteca de textos-padrão para os documentos de SST (migration 0147).
 * organizacao_id vazio = bloco oficial (catálogo geral); a regra de acesso
 * do PocketBase já mistura oficiais + os da própria organização. */
import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export type TipoDocumentoBloco = 'pgr' | 'insalubridade' | 'periculosidade' | 'ltcat' | 'geral'
export type SecaoBloco =
  | 'objetivo'
  | 'base_legal'
  | 'metodologia'
  | 'agente'
  | 'conclusao'
  | 'recomendacoes'
  | 'outro'

export interface BlocoTexto extends RecordModel {
  id: string
  organizacao_id?: string
  tipo_documento: TipoDocumentoBloco
  secao: SecaoBloco
  agente_id?: string
  titulo: string
  texto: string
  norma_referencia?: string
  ativo?: boolean
  created: string
  updated: string
}

export type BlocoTextoInput = Partial<Omit<BlocoTexto, 'id' | 'created' | 'updated'>> & {
  tipo_documento: TipoDocumentoBloco
  secao: SecaoBloco
  titulo: string
  texto: string
}

export const getBlocosTexto = (tipoDocumento: TipoDocumentoBloco) =>
  pb.collection('blocos_texto').getFullList<BlocoTexto>({
    filter: `ativo = true && tipo_documento = "${tipoDocumento}"`,
    sort: 'secao,titulo',
  })

export const createBlocoTexto = (data: BlocoTextoInput) =>
  pb.collection('blocos_texto').create<BlocoTexto>({ ativo: true, ...data })

export const updateBlocoTexto = (id: string, data: Partial<BlocoTextoInput>) =>
  pb.collection('blocos_texto').update<BlocoTexto>(id, data)

export const deleteBlocoTexto = (id: string) => pb.collection('blocos_texto').delete(id)
