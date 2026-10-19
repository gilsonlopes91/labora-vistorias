import { ehQuimico, ehRuido } from '@/lib/modelosSst/blocos'
import type { AgenteCatalogo } from '@/services/agentesCatalogo'
import { NIVEL_ACAO_RUIDO_DBA } from './constantes'

export { NIVEL_ACAO_RUIDO_DBA }

type AgenteParcial = Partial<
  Pick<AgenteCatalogo, 'nome' | 'tipo' | 'anexo_nr15' | 'limite_tolerancia_valor'>
>

/** Nível de ação do agente na mesma unidade do limite, ou indefinido quando a norma não define. */
export function nivelDeAcao(ag?: AgenteParcial): number | undefined {
  if (!ag) return undefined
  const agente = ag as AgenteCatalogo
  if (ehRuido(agente)) return NIVEL_ACAO_RUIDO_DBA
  if (ehQuimico(agente) && ag.limite_tolerancia_valor != null) return ag.limite_tolerancia_valor / 2
  return undefined
}
