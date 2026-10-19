import type { CardRisco } from '../modelo'

/** Altura útil de uma página A4 com as margens do documento, em pontos, com folga. */
export const CABE_NA_PAGINA = 640

const linhas = (texto: string | undefined, caracteresPorLinha: number) =>
  texto ? Math.ceil(texto.length / caracteresPorLinha) : 0

/** Estimativa de altura de um card. Só decide entre "não quebra" e "pode quebrar". */
export function alturaEstimada(c: CardRisco): number {
  let h = 70 // cabeçalho do card e margens
  if (c.medicao || c.exposicao || c.avaliadoPor || c.aet) h += 70
  h += Math.max(linhas(c.fonte, 60), linhas(c.danos, 60)) * 13 + 20
  h += c.medidas.reduce((t, m) => t + Math.max(1, linhas(m.texto, 95)) * 13 + 6, 0) + 16
  if (c.avaliacao) h += 90
  h += linhas(c.leitura, 120) * 13 + (c.leitura ? 14 : 0)
  if (c.conclusaoLaudo) h += 40
  return h
}
