import type { AvaliacaoRisco } from '@/services/avaliacoesRisco'
import type { FuncaoSst } from '@/services/funcoesSst'

/**
 * "Risco efetivo da função" (Ponto 1 do plano
 * claude/labora-vistoria-plano-fluxo-cargos-ghe-os-epi-2026-09-28.md):
 *
 * riscos diretos do cargo (avaliacoes_risco.funcao_id === funcao.id)
 *   ∪
 * riscos do GHE do ambiente onde o cargo atua (avaliacoes_risco.ghe_id ===
 * funcao.ghe_id), quando a função tiver um GHE vinculado.
 *
 * Uma função não é mais obrigada a ter GHE: pode ter só riscos diretos, só
 * riscos herdados do GHE, ou os dois ao mesmo tempo (uma mesma avaliação
 * nunca aparece duplicada, mesmo se por acaso tivesse os dois vínculos).
 */
export function avaliacoesDaFuncao(
  funcao: Pick<FuncaoSst, 'id' | 'ghe_id'>,
  avaliacoes: AvaliacaoRisco[],
): AvaliacaoRisco[] {
  const vistas = new Set<string>()
  const resultado: AvaliacaoRisco[] = []

  for (const a of avaliacoes) {
    const direta = a.funcao_id === funcao.id
    const herdadaDoGhe = !!funcao.ghe_id && a.ghe_id === funcao.ghe_id
    if ((direta || herdadaDoGhe) && !vistas.has(a.id)) {
      vistas.add(a.id)
      resultado.push(a)
    }
  }

  return resultado
}
