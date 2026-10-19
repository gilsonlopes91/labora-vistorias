import type { DadosDocumento } from '@/lib/modelosSst/dados'
import { distintos, indices, juntar, nomeAgente, rotuloGhe } from '@/lib/modelosSst/blocos'
import { fNum, vazio } from '@/lib/modelosSst/campos'
import type { FuncaoSst } from '@/services/funcoesSst'
import type { Ambiente, FuncaoItem, GrupoFuncoes, Par } from '../modelo'

const informado = (f: FuncaoSst) => f.numero_empregados != null

export function montarAmbientes(d: DadosDocumento): Ambiente[] {
  const ix = indices(d)
  return d.setores.map((s, i) => {
    const funcs = ix.funcoesDoSetor(s)
    const avals = d.avaliacoes.filter((a) => ix.setorDaAvaliacao(a)?.id === s.id)
    const total = funcs.reduce((t, f) => t + (f.numero_empregados || 0), 0)
    const metricas: Par[] = []
    if (s.area_m2 != null) metricas.push({ rotulo: 'Área', valor: `${fNum(s.area_m2)} m²` })
    if (s.pe_direito_m != null)
      metricas.push({ rotulo: 'Pé-direito', valor: `${fNum(s.pe_direito_m)} m` })
    if (funcs.some(informado)) metricas.push({ rotulo: 'Trabalhadores', valor: String(total) })
    if (funcs.length > 0) metricas.push({ rotulo: 'Funções', valor: String(funcs.length) })
    return {
      nome: s.nome,
      subtitulo: `Ambiente ${String(i + 1).padStart(2, '0')}`,
      processo: vazio(s.descricao_processo),
      metricas,
      construcao: juntar([
        vazio(s.local),
        vazio(s.cobertura) && `cobertura: ${s.cobertura}`,
        vazio(s.piso) && `piso: ${s.piso}`,
        vazio(s.paredes) && `paredes: ${s.paredes}`,
      ]),
      iluminacaoVentilacao: juntar([
        vazio(s.iluminacao) && `iluminação: ${s.iluminacao}`,
        vazio(s.ventilacao) && `ventilação: ${s.ventilacao}`,
      ]),
      equipamentos: vazio(s.maquinas_equipamentos),
      funcoes: juntar(
        funcs.map((f) => f.nome),
        ', ',
      ),
      fontesPerigo: juntar(distintos(avals.map(nomeAgente)), '; '),
    }
  })
}

function itemFuncao(d: DadosDocumento, f: FuncaoSst, ix: ReturnType<typeof indices>): FuncaoItem {
  const g = f.ghe_id ? ix.ghePorId.get(f.ghe_id) : undefined
  return {
    nome: f.nome,
    cbo: vazio(f.cbo),
    expostos: f.numero_empregados != null ? String(f.numero_empregados) : undefined,
    jornada: vazio(g?.jornada_trabalho) || vazio(d.empresa.jornada_trabalho),
    ambiente: ix.setorDaFuncao(f)?.nome,
    atividades: vazio(f.descricao_atividades),
  }
}

export function montarGrupos(d: DadosDocumento): GrupoFuncoes[] {
  const ix = indices(d)
  const grupos: GrupoFuncoes[] = d.ghes.map((g) => {
    const funcs = ix.funcoesDoGhe(g)
    const setor = g.setor_id ? ix.setorPorId.get(g.setor_id) : undefined
    const expostos =
      g.numero_expostos != null
        ? g.numero_expostos
        : funcs.some(informado)
          ? funcs.reduce((t, f) => t + (f.numero_empregados || 0), 0)
          : undefined
    return {
      titulo: rotuloGhe(g) || g.nome,
      detalhe: juntar(
        [
          setor?.nome,
          expostos != null && `${expostos} trabalhador${expostos === 1 ? '' : 'es'}`,
          vazio(g.criterio_agrupamento) && `critério: ${g.criterio_agrupamento}`,
        ],
        ' · ',
      ),
      funcoes: funcs.map((f) => itemFuncao(d, f, ix)),
    }
  })
  const semGhe = d.funcoes.filter((f) => !f.ghe_id)
  if (semGhe.length > 0) {
    grupos.push({
      titulo: 'Funções avaliadas individualmente',
      detalhe: 'Sem grupo homogêneo de exposição. Os riscos são do próprio cargo.',
      funcoes: semGhe.map((f) => itemFuncao(d, f, ix)),
    })
  }
  return grupos
}
