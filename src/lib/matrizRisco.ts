/* Motor da matriz de risco (metodologia AIHA adaptada — 3x3 ou 5x5).
   Ver plano "labora-vistoria-documentacao-sst-plano.md", seção 4.

   A avaliação (avaliacoes_risco) guarda o dado BRUTO, que não depende da
   matriz escolhida: a trilha de probabilidade, a categoria de exposição
   AIHA (0-4, quando há medição), o nível de controle (quando não há) e o
   efeito à saúde AIHA (0-4). Este módulo converte esse dado bruto numa
   sugestão de P e S para a matriz de uma dimensão específica (3 ou 5), e
   resolve a célula da matriz (categoria, cor, ação, prazo).

   Trocar a matriz de um documento (3x3 <-> 5x5) não perde dado nenhum: só
   recalcula a sugestão a partir do mesmo dado bruto. */

import type { AvaliacaoRisco } from '@/services/avaliacoesRisco'
import type { MatrizRisco } from '@/services/matrizesRisco'

export type Dimensao = 3 | 5

/** Nível de controle qualitativo, do melhor para o pior — mesma ordem do
 *  select `controle_nivel` da coleção avaliacoes_risco. */
export const NIVEIS_CONTROLE = [
  'Excelente / melhor prática',
  'Conforme, com manutenção garantida',
  'Adequado, com pequenas deficiências',
  'Deficiente ou incompleto',
  'Inexistente ou inadequado',
] as const

const NIVEL_CONTROLE_P5: Record<string, number> = {
  'Excelente / melhor prática': 1,
  'Conforme, com manutenção garantida': 2,
  'Adequado, com pequenas deficiências': 3,
  'Deficiente ou incompleto': 4,
  'Inexistente ou inadequado': 5,
}
// 3x3: os dois melhores níveis caem em P1, o do meio em P2, os dois piores em P3.
const NIVEL_CONTROLE_P3: Record<string, number> = {
  'Excelente / melhor prática': 1,
  'Conforme, com manutenção garantida': 1,
  'Adequado, com pequenas deficiências': 2,
  'Deficiente ou incompleto': 3,
  'Inexistente ou inadequado': 3,
}

const RESULTADO_AEP_P5: Record<string, number> = { Baixo: 2, Médio: 3, Alto: 4 }
const RESULTADO_AEP_P3: Record<string, number> = { Baixo: 1, Médio: 2, Alto: 3 }

/** Categoria AIHA de exposição (0-4, calculada a partir de %LEO/medições —
 *  ver Fase 3) -> nível de probabilidade sugerido. Categoria 4 (>100% do
 *  LEO) é ambígua entre P4 e P5 na 5x5 (100-500% x acima de 500%); sem uma
 *  medição exata, sugerimos o piso (P4) e deixamos o técnico subir para P5
 *  quando o valor medido estourar muito o limite. */
function probabilidadePorCategoriaAiha(categoria: number, dimensao: Dimensao): number {
  if (dimensao === 5) {
    // 0->1, 1->2, 2->3, 3->4, 4->4 (ver nota acima)
    return Math.min(5, Math.max(1, categoria + 1 === 5 ? 4 : categoria + 1))
  }
  // 3x3: 0-1 -> P1, 2 -> P2, 3-4 -> P3 (a AIHA-3 já funde 0-2 "abaixo de 50%")
  if (categoria <= 1) return 1
  if (categoria === 2) return 2
  return 3
}

/** Sugestão de probabilidade a partir do dado bruto da avaliação. Retorna
 *  null quando falta informação para sugerir (ex.: trilha quantitativa sem
 *  categoria AIHA ainda preenchida).
 *
 *  Duas regras do manual do MTE são aplicadas por cima da trilha escolhida:
 *  - "Sem dados suficientes" é uma trilha própria (distinta de "Qualitativa
 *    (controle)", que pressupõe um julgamento sobre um controle existente):
 *    sem base para avaliar, a sugestão é sempre o teto da dimensão.
 *  - Requisito específico de NR não atendido (item 11.4 do manual, exemplo
 *    dos assentos da NR-17) força a probabilidade ao teto, não importa a
 *    trilha ou o dado bruto. */
export function sugerirProbabilidade(
  avaliacao: Pick<
    AvaliacaoRisco,
    | 'trilha_probabilidade'
    | 'categoria_aiha_exposicao'
    | 'controle_nivel'
    | 'resultado_aep_aet'
    | 'nr_especifica_aplicavel'
    | 'nr_especifica_atendida'
  >,
  dimensao: Dimensao,
): number | null {
  if (avaliacao.nr_especifica_aplicavel && !avaliacao.nr_especifica_atendida) {
    return dimensao
  }
  const { trilha_probabilidade: trilha } = avaliacao
  if (trilha === 'Sem dados suficientes') {
    return dimensao
  }
  if (trilha === 'Quantitativa (medição)') {
    if (
      avaliacao.categoria_aiha_exposicao == null ||
      (avaliacao.categoria_aiha_exposicao as string) === ''
    )
      return null
    return probabilidadePorCategoriaAiha(Number(avaliacao.categoria_aiha_exposicao), dimensao)
  }
  if (trilha === 'Qualitativa (controle)' || trilha === 'Acidente/mecânico') {
    if (!avaliacao.controle_nivel) return null
    const tabela = dimensao === 5 ? NIVEL_CONTROLE_P5 : NIVEL_CONTROLE_P3
    return tabela[avaliacao.controle_nivel] ?? null
  }
  if (trilha === 'Ergonômica (AEP/AET)' || trilha === 'Psicossocial') {
    if (!avaliacao.resultado_aep_aet || avaliacao.resultado_aep_aet === 'Não avaliado') return null
    const tabela = dimensao === 5 ? RESULTADO_AEP_P5 : RESULTADO_AEP_P3
    return tabela[avaliacao.resultado_aep_aet] ?? null
  }
  return null
}

/** Sugestão de severidade a partir do efeito à saúde AIHA (0-4). NR-01
 *  1.5.4.4.4.1: sempre o pior dano plausível — já é o que efeito_saude_aiha
 *  deve representar. */
export function sugerirSeveridade(
  efeitoSaudeAiha: string | number | undefined,
  dimensao: Dimensao,
): number | null {
  if (efeitoSaudeAiha == null || efeitoSaudeAiha === '') return null
  const efeito = Number(efeitoSaudeAiha)
  if (Number.isNaN(efeito)) return null
  if (dimensao === 5) return Math.min(5, efeito + 1)
  // 3x3: 0-1 -> S1, 2 -> S2, 3-4 -> S3
  if (efeito <= 1) return 1
  if (efeito === 2) return 2
  return 3
}

export interface CelulaMatriz {
  categoria: string
  cor: string
  acao: string
  prazo_dias: number | null
}

/** Resolve a célula (P, S) numa matriz — a categoria, cor, ação e prazo. */
export function resolverCelula(
  matriz: MatrizRisco,
  probabilidade: number,
  severidade: number,
): CelulaMatriz | null {
  const celula = matriz.celulas.find((c) => c.p === probabilidade && c.s === severidade)
  if (!celula) return null
  const cat = matriz.categorias.find((c) => c.categoria === celula.categoria)
  return {
    categoria: celula.categoria,
    cor: cat?.cor || '#94a3b8',
    acao: cat?.acao || '',
    prazo_dias: cat?.prazo_dias ?? null,
  }
}

/** Se a incerteza é alta (2 ou 3) ou a avaliação está acima do nível de
 *  ação (categoria AIHA >= 3), gera avisos de ação obrigatória além da
 *  categoria da matriz — NR-01 1.5.4.4.5.2 e NR-09 9.6.1.2. */
export function avisosComplementares(
  avaliacao: Pick<
    AvaliacaoRisco,
    | 'incerteza'
    | 'categoria_aiha_exposicao'
    | 'trilha_probabilidade'
    | 'nr_especifica_aplicavel'
    | 'nr_especifica_atendida'
    | 'risco_evidente'
  >,
): string[] {
  const avisos: string[] = []
  const incerteza = avaliacao.incerteza != null ? Number(avaliacao.incerteza) : null
  if (avaliacao.risco_evidente) {
    avisos.push(
      'Risco evidente (manual do MTE, item 9): a ação imediata não pode esperar a conclusão da avaliação formal pela matriz.',
    )
  }
  if (avaliacao.nr_especifica_aplicavel && !avaliacao.nr_especifica_atendida) {
    avisos.push(
      'Requisito específico de NR não atendido: a probabilidade foi elevada ao teto da matriz (manual do MTE, item 11.4), independente da trilha escolhida.',
    )
  }
  if (avaliacao.trilha_probabilidade === 'Sem dados suficientes') {
    avisos.push(
      'Sem dados suficientes para avaliar: a probabilidade foi lançada no teto da matriz até que haja base (medição, análise ou julgamento do controle) para reavaliar.',
    )
  }
  if (incerteza != null && incerteza >= 2) {
    avisos.push(
      'Incerteza alta: recomenda-se coletar mais dados (mínimo de 6 amostras no GHE) antes de reduzir o risco.',
    )
  }
  if (
    avaliacao.trilha_probabilidade === 'Quantitativa (medição)' &&
    avaliacao.categoria_aiha_exposicao != null &&
    Number(avaliacao.categoria_aiha_exposicao) >= 3
  ) {
    avisos.push(
      'Acima do nível de ação (NR-09, 9.6.1.2): monitoramento sistemático e inclusão no PCMSO, independente da categoria da matriz.',
    )
  }
  return avisos
}
