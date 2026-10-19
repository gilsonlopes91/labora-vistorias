import type { DadosDocumento } from '@/lib/modelosSst/dados'
import type { MatrizRisco } from '@/services/matrizesRisco'

type Obj = Record<string, unknown>

export const setor = (p: Obj = {}) => ({ id: 's1', nome: 'Galpão de lavagem', ...p })
export const ghe = (p: Obj = {}) => ({
  id: 'g1',
  nome: 'Lavagem e acabamento',
  codigo: 'GHE 01',
  ...p,
})
export const funcao = (p: Obj = {}) => ({
  id: 'f1',
  nome: 'Acabador de lavagem',
  setor_id: 's1',
  ...p,
})
export const agente = (p: Obj = {}) => ({ id: 'ag1', nome: 'Agente', tipo: 'Físico', ...p })
export const medicao = (p: Obj = {}) => ({ id: 'm1', ...p })
export const acao = (p: Obj = {}) => ({ id: 'ac1', medida: 'Medida', status: 'Pendente', ...p })
export const avaliacao = (p: Obj = {}) => ({
  id: 'a1',
  funcao_id: 'f1',
  trilha_probabilidade: 'Qualitativa (controle)',
  ...p,
})

export function dados(p: Obj = {}): DadosDocumento {
  return {
    tipo: 'pgr',
    documento: {},
    versao: 1,
    dataEmissao: new Date('2026-10-19T12:00:00'),
    organizacao: {
      nome: 'Labora',
      corPrimaria: '#6C8845',
      corSecundaria: '#202720',
      logoUrl: null,
    },
    empresa: { razao_social: 'Lava-Jato Horizonte LTDA', jornada_trabalho: '44 h/semana' },
    autor: null,
    coordenador: null,
    setores: [],
    ghes: [],
    funcoes: [],
    avaliacoes: [],
    medicoes: {},
    epis: [],
    acoes: [],
    planos: [],
    matriz: null,
    revisoes: [],
    emitidos: {},
    ...p,
  } as unknown as DadosDocumento
}

/** Matriz de teste. 5x5: Trivial até 4 pontos, Tolerável até 8, Moderado até 12, Substancial até 16, Intolerável acima. 3x3: Baixo até 2, Médio até 4, Alto acima. */
export function matrizN(n: 3 | 5): MatrizRisco {
  const nomesP =
    n === 5
      ? ['Improvável', 'Pouco provável', 'Possível', 'Provável', 'Muito provável']
      : ['Baixa', 'Média', 'Alta']
  const nomesS =
    n === 5
      ? ['Insignificante', 'Baixa', 'Moderada', 'Alta', 'Catastrófica']
      : ['Baixa', 'Média', 'Alta']
  const categorias =
    n === 5
      ? [
          {
            categoria: 'Trivial',
            cor: '#5BA552',
            acao: 'Nenhuma ação adicional',
            prazo_dias: null,
          },
          { categoria: 'Tolerável', cor: '#9BC53D', acao: 'Manter os controles', prazo_dias: null },
          { categoria: 'Moderado', cor: '#F2B01E', acao: 'Reduzir o risco', prazo_dias: 180 },
          {
            categoria: 'Substancial',
            cor: '#F0762B',
            acao: 'Reduzir com prioridade',
            prazo_dias: 90,
          },
          {
            categoria: 'Intolerável',
            cor: '#D32F2F',
            acao: 'Interromper e corrigir',
            prazo_dias: 0,
          },
        ]
      : [
          { categoria: 'Baixo', cor: '#5BA552', acao: 'Manter os controles', prazo_dias: null },
          { categoria: 'Médio', cor: '#F2B01E', acao: 'Reduzir o risco', prazo_dias: 180 },
          { categoria: 'Alto', cor: '#D32F2F', acao: 'Corrigir com prioridade', prazo_dias: 30 },
        ]
  const indice = (pontos: number) =>
    n === 5
      ? pontos <= 4
        ? 0
        : pontos <= 8
          ? 1
          : pontos <= 12
            ? 2
            : pontos <= 16
              ? 3
              : 4
      : pontos <= 2
        ? 0
        : pontos <= 4
          ? 1
          : 2
  const celulas = []
  for (let p = 1; p <= n; p++)
    for (let s = 1; s <= n; s++)
      celulas.push({ p, s, categoria: categorias[indice(p * s)].categoria, pontuacao: p * s })
  return {
    id: `m${n}`,
    nome: `AIHA ${n}x${n}`,
    dimensao: String(n),
    criterios_probabilidade: nomesP.map((nome, i) => ({
      nivel: i + 1,
      nome,
      quantitativo: `Exposição quantitativa do nível ${i + 1}`,
      qualitativo: `Controle qualitativo do nível ${i + 1}`,
    })),
    criterios_severidade: nomesS.map((nome, i) => ({
      nivel: i + 1,
      nome,
      descricao: `Dano de severidade ${i + 1}`,
      dias_afastamento: '',
      aiha_efeito: i,
    })),
    categorias,
    celulas,
  } as unknown as MatrizRisco
}
