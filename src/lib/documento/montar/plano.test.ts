import { describe, it, expect } from 'vitest'
import { montarPlano, tabelaConsolidada } from './plano'
import { montarFichas } from './ficha'
import { dados, funcao, agente, avaliacao, acao, matrizN } from '../testes/fabrica'

describe('montarPlano', () => {
  it('ordena por prazo, numera e liga cada ação ao risco e à função', () => {
    const ag = agente({ nome: 'Ruído', tipo: 'Físico' })
    const a1 = avaliacao({
      id: 'a1',
      funcao_id: 'f1',
      agente_id: 'ag1',
      expand: { agente_id: ag },
      probabilidade_sugerida: 5,
      severidade_sugerida: 5,
    })
    const d = dados({
      funcoes: [funcao()],
      avaliacoes: [a1],
      matriz: matrizN(5),
      acoes: [
        acao({
          id: 'x2',
          medida: 'Segunda',
          prazo: '2027-04-02',
          avaliacao_id: 'a1',
          responsavel: 'R. Melo',
          custo_estimado: 900,
          como: 'Compra',
        }),
        acao({
          id: 'x1',
          medida: 'Primeira',
          prazo: '2026-10-26',
          origem: 'Fiscalização',
          status: 'Em andamento',
        }),
      ],
    })
    const plano = montarPlano(d)
    expect(plano.map((p) => p.medida)).toEqual(['Primeira', 'Segunda'])
    expect(plano.map((p) => p.numero)).toEqual(['01', '02'])
    expect(plano[0]).toMatchObject({
      risco: 'Fiscalização',
      situacao: 'Em andamento',
      prazo: '26/10/2026',
    })
    expect(plano[1]).toMatchObject({
      risco: 'Ruído',
      funcao: 'Acabador de lavagem',
      nivel: 'Intolerável',
      prazoRotulo: 'imediato',
      responsavel: 'R. Melo',
    })
    expect(plano[1].detalhe).toBe('Compra. Custo estimado: R$ 900,00')
  })

  it('ação sem prazo vai para o fim e não imprime undefined', () => {
    const d = dados({
      acoes: [
        acao({ medida: 'Sem prazo' }),
        acao({ id: 'b', medida: 'Com prazo', prazo: '2026-12-01' }),
      ],
    })
    const plano = montarPlano(d)
    expect(plano.map((p) => p.medida)).toEqual(['Com prazo', 'Sem prazo'])
    expect(JSON.stringify(plano)).not.toMatch(/undefined|null|NaN/)
  })
})

describe('tabelaConsolidada', () => {
  it('uma linha por risco e função', () => {
    const ag = agente({ nome: 'Ruído', tipo: 'Físico', codigo_esocial: '02.01.001' })
    const a1 = avaliacao({
      id: 'a1',
      agente_id: 'ag1',
      expand: { agente_id: ag },
      probabilidade_sugerida: 3,
      severidade_sugerida: 2,
    })
    const d = dados({ funcoes: [funcao()], avaliacoes: [a1], matriz: matrizN(5) })
    const t = tabelaConsolidada(montarFichas(d, 'pgr'))
    expect(t.tipo).toBe('tabela')
    if (t.tipo !== 'tabela') return
    expect(t.cabecalho).toEqual([
      'Função',
      'Risco',
      'Categoria',
      'Exposição',
      'Resultado e limite',
      'P',
      'S',
      'Nível',
    ])
    expect(t.linhas).toHaveLength(1)
    expect(t.linhas[0][0]).toBe('Acabador de lavagem')
    expect(t.linhas[0][2]).toBe('Físico')
    expect(t.linhas[0].slice(5)).toEqual(['3', '2', 'Tolerável'])
  })
})
