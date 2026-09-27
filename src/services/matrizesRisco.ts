import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export interface CriterioProbabilidade {
  nivel: number
  nome: string
  quantitativo: string
  qualitativo: string
}
export interface CriterioSeveridade {
  nivel: number
  nome: string
  descricao: string
  dias_afastamento: string
  aiha_efeito: number | string
}
export interface CategoriaMatriz {
  categoria: string
  cor: string
  acao: string
  prazo_dias: number | null
}
export interface CelulaMatrizDados {
  p: number
  s: number
  categoria: string
  pontuacao: number
}

export interface MatrizRisco extends RecordModel {
  id: string
  organizacao_id?: string
  nome: string
  metodologia?: string
  dimensao: '3' | '5'
  criterios_probabilidade: CriterioProbabilidade[]
  criterios_severidade: CriterioSeveridade[]
  categorias: CategoriaMatriz[]
  celulas: CelulaMatrizDados[]
  versao?: string
  somente_leitura?: boolean
  created: string
  updated: string
}

/** As matrizes oficiais AIHA 3x3/5x5 + as customizadas da organização. */
export const getMatrizesRisco = () =>
  pb.collection('matrizes_risco').getFullList<MatrizRisco>({ sort: 'dimensao' })

export const getMatrizOficial = async (dimensao: 3 | 5, metodologia: string = 'AIHA') => {
  const todas = await getMatrizesRisco()
  return (
    todas.find(
      (m) => m.somente_leitura && Number(m.dimensao) === dimensao && m.metodologia === metodologia,
    ) || null
  )
}
