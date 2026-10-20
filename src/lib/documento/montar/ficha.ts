import type { DadosDocumento } from '@/lib/modelosSst/dados'
import { agenteDe, indices, juntar, rotuloGhe } from '@/lib/modelosSst/blocos'
import { fData, vazio } from '@/lib/modelosSst/campos'
import { avaliacoesDaFuncao } from '@/lib/riscoFuncao'
import type { AvaliacaoRisco } from '@/services/avaliacoesRisco'
import type { FuncaoSst } from '@/services/funcoesSst'
import type { TipoDocumentoSst } from '@/services/documentosSst'
import { formatarRegistroRT } from '@/services/responsaveisTecnicos'
import type { FichaFuncao } from '../modelo'
import { montarCard } from './card'

function relevante(tipo: TipoDocumentoSst, a: AvaliacaoRisco): boolean {
  const ag = agenteDe(a)
  if (tipo === 'insalubridade') return !!ag?.anexo_nr15
  if (tipo === 'periculosidade') return !!ag?.anexo_nr16
  if (tipo === 'ltcat') return !!ag
  return true
}

function textoExpostos(f: FuncaoSst): string | undefined {
  const h = f.numero_homens
  const m = f.numero_mulheres
  if (h != null && m != null) {
    const partes = [
      h > 0 && `${h} homem${h === 1 ? '' : 's'}`,
      m > 0 && `${m} mulher${m === 1 ? '' : 'es'}`,
    ]
    return juntar(partes, ' e ') || '0'
  }
  return f.numero_empregados != null ? String(f.numero_empregados) : undefined
}

export function montarFichas(d: DadosDocumento, tipo: TipoDocumentoSst): FichaFuncao[] {
  const ix = indices(d)
  const ordemGhe = new Map(d.ghes.map((g, i) => [g.id, i]))
  const funcoes = [...d.funcoes].sort(
    (a, b) => (ordemGhe.get(a.ghe_id || '') ?? 999) - (ordemGhe.get(b.ghe_id || '') ?? 999),
  )
  const dataLevantamento = fData(d.documento.data_levantamento)
  return funcoes.map((f) => {
    const g = f.ghe_id ? ix.ghePorId.get(f.ghe_id) : undefined
    const avals = avaliacoesDaFuncao(f, d.avaliacoes).filter((a) => relevante(tipo, a))
    // do mais grave para o menos grave; empate mantém a ordem do cadastro
    const riscos = avals
      .map((a) => montarCard(d, a, tipo))
      .map((c, i) => ({ c, i }))
      .sort((x, y) => (y.c.avaliacao?.pontos ?? -1) - (x.c.avaliacao?.pontos ?? -1) || x.i - y.i)
      .map(({ c }) => c)
    const comMedicao = avals.filter((a) => (d.medicoes[a.id] || []).length > 0).length
    return {
      nome: f.nome,
      cbo: vazio(f.cbo),
      ghe: g ? rotuloGhe(g) : undefined,
      ambiente: ix.setorDaFuncao(f)?.nome,
      levantamento: juntar(
        [
          dataLevantamento && `Levantamento em ${dataLevantamento}`,
          d.autor && `por ${d.autor.nome}, ${formatarRegistroRT(d.autor)}`,
        ],
        ' ',
      ),
      expostos: textoExpostos(f),
      jornada: vazio(g?.jornada_trabalho) || vazio(d.empresa.jornada_trabalho),
      atividades: vazio(f.descricao_atividades),
      comMedicao,
      riscos,
    }
  })
}
