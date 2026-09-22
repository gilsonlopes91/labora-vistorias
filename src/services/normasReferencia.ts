import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

/**
 * Catálogo de normas e leis citadas nas propostas.
 * organizacao_id vazio = norma do catálogo oficial, comum a todas as contas.
 * organizacao_id preenchido = norma cadastrada pela própria organização.
 */
export interface NormaReferencia extends RecordModel {
  id: string
  organizacao_id?: string
  nome: string
  ordem?: number
  created: string
  updated: string
}

export const getNormasReferencia = () =>
  pb.collection('normas_referencia').getFullList<NormaReferencia>({ sort: 'ordem,nome' })

export const criarNormaReferencia = (organizacaoId: string, nome: string) =>
  pb.collection('normas_referencia').create<NormaReferencia>({
    organizacao_id: organizacaoId,
    nome: nome.trim(),
    ordem: 999,
  })

export const excluirNormaReferencia = (id: string) => pb.collection('normas_referencia').delete(id)
