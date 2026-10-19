import type { DadosDocumento } from '@/lib/modelosSst/dados'
import { indices, juntar, nomeAgente, pontuacao } from '@/lib/modelosSst/blocos'
import { fData, fMoeda, vazio } from '@/lib/modelosSst/campos'
import type { ElRender } from '@/lib/modelosSst/renderizar'
import { CATEGORIAS } from '../categorias'
import type { AcaoLinha, FichaFuncao } from '../modelo'

export function montarPlano(d: DadosDocumento): AcaoLinha[] {
  const ix = indices(d)
  const aval = new Map(d.avaliacoes.map((a) => [a.id, a]))
  const linhas = d.acoes.map((ac) => {
    const a = ac.avaliacao_id ? aval.get(ac.avaliacao_id) : undefined
    const pt = a ? pontuacao(d, a) : undefined
    const linha: Omit<AcaoLinha, 'numero'> = {
      medida: ac.medida,
      detalhe: juntar(
        [
          vazio(ac.como),
          ac.custo_estimado != null && `Custo estimado: ${fMoeda(ac.custo_estimado)}`,
        ],
        '. ',
      ),
      risco: a ? nomeAgente(a) : vazio(ac.origem),
      funcao: a ? ix.grupoDaAvaliacao(a) : undefined,
      nivel: pt?.categoria,
      responsavel: vazio(ac.responsavel),
      prazo: fData(ac.prazo),
      prazoRotulo: pt?.prazo == null ? undefined : pt.prazo === 0 ? 'imediato' : `${pt.prazo} dias`,
      situacao: ac.status,
    }
    return { prazoBruto: ac.prazo || '9999-12-31', linha }
  })
  linhas.sort((x, y) => x.prazoBruto.localeCompare(y.prazoBruto))
  return linhas.map((x, i) => ({ ...x.linha, numero: String(i + 1).padStart(2, '0') }))
}

/** Anexo com uma linha por risco e função, no formato que o fiscal e o contador esperam. */
export function tabelaConsolidada(fichas: FichaFuncao[]): ElRender {
  const linhas: string[][] = []
  for (const f of fichas) {
    for (const r of f.riscos) {
      linhas.push([
        f.ghe ? `${f.nome} (${f.ghe})` : f.nome,
        [r.nome, r.referencias.find((x) => x.startsWith('eSocial'))].filter(Boolean).join(' · '),
        CATEGORIAS[r.categoria].rotulo,
        r.exposicao?.titulo ?? '',
        r.medicao ? `${r.medicao.valor} (limite ${r.medicao.limiteTexto})` : '',
        r.avaliacao ? String(r.avaliacao.probabilidade.nivel) : '',
        r.avaliacao ? String(r.avaliacao.severidade.nivel) : '',
        r.nivel?.rotulo ?? '',
      ])
    }
  }
  return {
    tipo: 'tabela',
    titulo: 'Tabela consolidada do inventário',
    cabecalho: [
      'Função',
      'Risco',
      'Categoria',
      'Exposição',
      'Resultado e limite',
      'P',
      'S',
      'Nível',
    ],
    linhas,
  }
}
