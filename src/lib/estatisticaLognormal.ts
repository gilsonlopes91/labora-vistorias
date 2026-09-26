/* Estatística lognormal para conjuntos de medições de um mesmo GHE — a
   "categoria AIHA de exposição" (0-4) da avaliação de risco deveria vir
   daqui, não ser digitada à mão, sempre que houver medições suficientes.
   Ver plano "labora-vistoria-documentacao-sst-plano.md", seção 4.7.

   Metodologia AIHA (IHSTAT): assume distribuição lognormal da exposição.
   Com 6 ou mais amostras, calcula o P95 pontual e o limite superior de
   confiança de 95% do P95 (UCL95, conservador — é o que decide a
   categoria). Com menos de 6 amostras, não há base estatística: usa-se o
   maior valor medido e a incerteza fica "alta".

   Fatores de tolerância unilateral (K) para 95% de confiança / 95º
   percentil — tabela clássica (Natrella 1963), reproduzida em material da
   AIHA/NIOSH. O plano cita 4 pontos (6→3.707, 10→2.911, 20→2.396,
   30→2.220); os demais pontos abaixo completam a mesma tabela padrão. */

const FATOR_K_95_95: Record<number, number> = {
  6: 3.707,
  7: 3.399,
  8: 3.187,
  9: 3.031,
  10: 2.911,
  11: 2.815,
  12: 2.736,
  13: 2.671,
  14: 2.614,
  15: 2.566,
  16: 2.524,
  17: 2.486,
  18: 2.453,
  19: 2.423,
  20: 2.396,
  25: 2.292,
  30: 2.22,
  35: 2.166,
  40: 2.126,
  50: 2.065,
  60: 2.022,
  120: 1.912,
}
const MAIOR_N_TABELA = 120
const K_INFINITO = 1.645 // limite assintótico (z da normal para 95º percentil)

function fatorK(n: number): number {
  if (n >= MAIOR_N_TABELA) return FATOR_K_95_95[MAIOR_N_TABELA]
  if (FATOR_K_95_95[n] != null) return FATOR_K_95_95[n]
  // Interpolação linear entre os pontos conhecidos da tabela (ou até o
  // limite assintótico, para n acima do maior ponto tabulado aqui).
  const pontos = Object.keys(FATOR_K_95_95)
    .map(Number)
    .sort((a, b) => a - b)
  let inferior = pontos[0]
  let superior = pontos[pontos.length - 1]
  for (let i = 0; i < pontos.length - 1; i++) {
    if (pontos[i] <= n && n <= pontos[i + 1]) {
      inferior = pontos[i]
      superior = pontos[i + 1]
      break
    }
  }
  if (n > superior)
    return (
      K_INFINITO +
      ((FATOR_K_95_95[superior] - K_INFINITO) * (MAIOR_N_TABELA - n)) / (MAIOR_N_TABELA - superior)
    )
  const kInf = FATOR_K_95_95[inferior]
  const kSup = FATOR_K_95_95[superior]
  const fracao = (n - inferior) / (superior - inferior)
  return kInf + fracao * (kSup - kInf)
}

export interface EstatisticaLognormal {
  n: number
  mediaGeometrica: number
  desvioPadraoGeometrico: number
  p95Pontual: number
  fatorK: number
  limiteSuperior95: number
  /** Valor a usar na comparação com o limite: UCL95 do P95 com >=6 amostras, maior valor medido com menos. */
  valorDecisao: number
  suficiente: boolean
}

/** Calcula a estatística lognormal de um conjunto de resultados (> 0). */
export function calcularEstatisticaLognormal(valores: number[]): EstatisticaLognormal | null {
  const validos = valores.filter((v) => v != null && !Number.isNaN(v) && v > 0)
  const n = validos.length
  if (n === 0) return null

  const logs = validos.map((v) => Math.log(v))
  const mediaLog = logs.reduce((a, b) => a + b, 0) / n
  const variancia = n > 1 ? logs.reduce((a, b) => a + (b - mediaLog) ** 2, 0) / (n - 1) : 0
  const dpLog = Math.sqrt(variancia)

  const mediaGeometrica = Math.exp(mediaLog)
  const desvioPadraoGeometrico = Math.exp(dpLog)
  const p95Pontual = Math.exp(mediaLog + 1.645 * dpLog)
  const suficiente = n >= 6
  const k = suficiente ? fatorK(n) : 0
  const limiteSuperior95 = suficiente ? Math.exp(mediaLog + k * dpLog) : Math.max(...validos)
  const valorDecisao = suficiente ? limiteSuperior95 : Math.max(...validos)

  return {
    n,
    mediaGeometrica,
    desvioPadraoGeometrico,
    p95Pontual,
    fatorK: k,
    limiteSuperior95,
    valorDecisao,
    suficiente,
  }
}

/** Categoria AIHA de exposição (0-4) a partir da razão valor/limite —
 *  mesma escala usada em matrizRisco.ts (probabilidadePorCategoriaAiha):
 *  0 <10%, 1 10-50%, 2 50-100%, 3 100-500% (nível de ação), 4 >500%. */
export function categoriaAihaPorRazao(razao: number): '0' | '1' | '2' | '3' | '4' {
  if (razao < 0.1) return '0'
  if (razao < 0.5) return '1'
  if (razao < 1) return '2'
  if (razao < 5) return '3'
  return '4'
}

/** Atalho: estatística + limite de tolerância -> categoria AIHA sugerida. */
export function sugerirCategoriaAihaPorMedicoes(
  valores: number[],
  limiteTolerancia: number,
): {
  estatistica: EstatisticaLognormal
  categoria: ReturnType<typeof categoriaAihaPorRazao>
} | null {
  if (!(limiteTolerancia > 0)) return null
  const estatistica = calcularEstatisticaLognormal(valores)
  if (!estatistica) return null
  const razao = estatistica.valorDecisao / limiteTolerancia
  return { estatistica, categoria: categoriaAihaPorRazao(razao) }
}
