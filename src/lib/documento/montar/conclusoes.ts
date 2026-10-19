import type { DadosDocumento } from '@/lib/modelosSst/dados'
import { linhasConclusao } from '@/lib/modelosSst/blocos'
import { vazio } from '@/lib/modelosSst/campos'
import type { TipoDocumentoSst } from '@/services/documentosSst'
import type { ConclusaoFuncao } from '../modelo'

/** Conclusão por função dos laudos (insalubridade, periculosidade e LTCAT), a partir das mesmas linhas da tabela do modelo. */
export function montarConclusoes(d: DadosDocumento, tipo: TipoDocumentoSst): ConclusaoFuncao[] {
  if (tipo === 'pgr') return []
  return linhasConclusao(d, tipo).map((v) => {
    const ghe = vazio(v.GHE_NOME)
    return {
      funcao: v.FUNCAO_NOME || '',
      ghe: ghe === 'Sem GHE' ? undefined : ghe,
      agente: v.CONC_AGENTE || v.AGENTE_NOME || '',
      enquadramento: vazio(v.CONC_ENQUADRAMENTO),
      conclusao: v.CONC_CONCLUSAO || 'Não avaliado',
      justificativa: vazio(v.CONC_JUSTIFICATIVA),
    }
  })
}
