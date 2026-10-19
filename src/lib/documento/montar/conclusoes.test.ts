import { describe, it, expect } from 'vitest'
import { montarConclusoes } from './conclusoes'
import { dados, funcao, agente, avaliacao, matrizN } from '../testes/fabrica'

describe('montarConclusoes', () => {
  it('uma linha por função e agente, com a conclusão do laudo', () => {
    const ag = agente({ nome: 'Ruído', anexo_nr15: '1', limite_tolerancia_valor: 85 })
    const a = avaliacao({
      id: 'a1',
      agente_id: 'ag1',
      expand: { agente_id: ag },
      insalubridade_final: 'Não caracteriza',
      insalubridade_justificativa: 'Abaixo do limite.',
    })
    const d = dados({ funcoes: [funcao()], avaliacoes: [a], matriz: matrizN(5) })
    const linhas = montarConclusoes(d, 'insalubridade')
    expect(linhas).toHaveLength(1)
    expect(linhas[0]).toMatchObject({
      funcao: 'Acabador de lavagem',
      agente: 'Ruído',
      conclusao: 'Não caracterizada',
      justificativa: 'Abaixo do limite.',
      enquadramento: 'NR-15, Anexo 1',
    })
    expect(linhas[0].ghe).toBeUndefined()
  })

  it('função sem agente da norma do laudo recebe a frase de ausência', () => {
    const d = dados({ funcoes: [funcao()], matriz: matrizN(5) })
    const [l] = montarConclusoes(d, 'periculosidade')
    expect(l.conclusao).toBe('Não caracterizada')
    expect(l.agente).toBe('Ausência de atividade perigosa')
    expect(JSON.stringify(l)).not.toMatch(/undefined|null|NaN/)
  })

  it('no LTCAT, função sem agente nocivo traz o código 09.01.001', () => {
    const d = dados({ funcoes: [funcao()], matriz: matrizN(5) })
    const [l] = montarConclusoes(d, 'ltcat')
    expect(l.agente).toBe('Ausência de agente nocivo (código 09.01.001)')
    expect(l.conclusao).toBe('Não caracteriza atividade especial')
  })

  it('o PGR não tem conclusões de laudo', () => {
    expect(montarConclusoes(dados({ funcoes: [funcao()] }), 'pgr')).toEqual([])
  })
})
