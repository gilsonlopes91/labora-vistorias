/* Estrutura dos Modelos Gerais Labora depois de convertidos pelo
   scripts/converter-modelos.mjs (src/modelos-sst/gerados/*.json). O texto
   corrido fica em "segmentos": texto comum (com os campos [NOME] dentro),
   alternativas [MANTER APENAS UMA] e condicionais [SE HOUVER ...]. */

export type TipoModelo = 'pgr' | 'ltcat' | 'insalubridade' | 'periculosidade'

export interface SegTexto {
  t: 'texto'
  texto: string
}
export interface SegNota {
  /** Marcador [CONFIRMAR ...] do autor do modelo: não sai no documento, vira aviso ao técnico. */
  t: 'nota'
  texto: string
}
export interface SegAlternativaInline {
  t: 'alternativa'
  id: string
  inline: true
  opcoes: { id: string; texto: string }[]
}
export interface SegCondicional {
  t: 'condicional'
  id: string
  condicao: string
  /** Texto próprio ("[SE HOUVER x: texto]") ... */
  texto?: string
  /** ... ou o resto do parágrafo ("[SE HOUVER x] resto"). */
  segmentos?: Segmento[]
}
export type Segmento = SegTexto | SegNota | SegAlternativaInline | SegCondicional

export interface ElParagrafo {
  tipo: 'paragrafo'
  segmentos: Segmento[]
}
export interface ElSubtitulo {
  tipo: 'subtitulo'
  numero: string
  texto: string
}
export interface ElLista {
  tipo: 'lista'
  itens: Segmento[][]
}
export interface ElTabela {
  tipo: 'tabela'
  cabecalho: string[]
  linhas: Segmento[][][]
  /** Tabela do capítulo 11 do PGR que o app gera a partir da matriz escolhida. */
  blocoMatriz?: string
}
export interface ElBloco {
  tipo: 'bloco'
  id: string
  titulo: string
  rotulo?: string | null
  condicao?: string | null
  condicaoId?: string | null
  nota?: string | null
  cabecalho: string[]
  /** Uma célula por coluna, com os campos [NOME] da linha-modelo. */
  modeloLinha: string[]
}
export interface OpcaoAlternativa {
  id: string
  rotulo?: string
  texto?: string
  segmentos?: Segmento[]
}
export interface ElAlternativa {
  tipo: 'alternativa'
  id: string
  estilo?: 'paragrafos'
  /** Parágrafo que antecede a lista de opções (estilo PGR). */
  prefixo?: ElParagrafo
  opcoes: OpcaoAlternativa[]
}
export interface ElTituloDocumento {
  tipo: 'titulo_documento'
  texto: string
}
export type Elemento =
  | ElParagrafo
  | ElSubtitulo
  | ElLista
  | ElTabela
  | ElBloco
  | ElAlternativa
  | ElTituloDocumento

export interface SecaoModelo {
  id: string
  numero: string
  titulo: string
  elementos: Elemento[]
}

export interface ModeloDocumento {
  tipo: TipoModelo
  sigla: string
  titulo: string
  versaoTexto: string
  capa: Elemento[]
  secoes: SecaoModelo[]
}

/** Entrada do dicionário único (src/modelos-sst/dicionario.json). */
export interface CampoDicionario {
  descricao: string
  origem: string
  tipo: string
}
