import pb from '@/lib/pocketbase/client'
import { ordenarNormas } from '@/lib/normas'

/** Qual regime de cálculo de multa da NR-28 o checklist segue (migration 0095). */
export type RegimeMulta = 'anexo_i' | 'anexo_ia_portuario' | 'rural_art18'

export interface TipoVistoria {
  id: string
  organizacao_id?: string
  nome: string
  nr_referencia?: string
  descricao?: string
  ativo?: boolean
  regime_multa?: RegimeMulta
  /** Seção oficial do catálogo ("NR-12", "NR-12 - ANEXO VIII"). */
  secao_oficial?: string
  created: string
  updated: string
}

// Ordem das normas: NR-01, NR-01 Anexo I, NR-01 Anexo II, NR-03... (corpo
// primeiro e anexos em ordem numérica; ver lib/normas).
export const getTiposVistoria = () =>
  pb
    .collection('tipos_vistoria')
    .getFullList<TipoVistoria>({
      filter: 'ativo = true',
      sort: 'nome',
    })
    .then(ordenarNormas)

export interface TipoVistoriaInput {
  nome: string
  nr_referencia?: string
  descricao?: string
  ativo?: boolean
  regime_multa?: RegimeMulta
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
