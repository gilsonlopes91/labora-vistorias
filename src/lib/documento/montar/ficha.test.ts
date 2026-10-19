import { describe, it, expect } from 'vitest'
import { montarFichas } from './ficha'
import { dados, setor, ghe, funcao, agente, avaliacao, matrizN } from '../testes/fabrica'

describe('montarFichas', () => {
  it('uma ficha por função, com os riscos do cargo e os herdados do GHE', () => {
    const ag = agente({ nome: 'Ruído', tipo: 'Físico', anexo_nr15: '1' })
    const direta = avaliacao({
      id: 'a1',
      funcao_id: 'f1',
      agente_id: 'ag1',
      expand: { agente_id: ag },
    })
    const doGhe = avaliacao({
      id: 'a2',
      funcao_id: undefined,
      ghe_id: 'g1',
      agente_id: 'ag1',
      expand: { agente_id: ag },
    })
    const d = dados({
      setores: [setor()],
      ghes: [ghe({ setor_id: 's1' })],
      funcoes: [
        funcao({
          ghe_id: 'g1',
          numero_empregados: 1,
          numero_homens: 1,
          numero_mulheres: 0,
          cbo: '5199-35',
        }),
      ],
      avaliacoes: [direta, doGhe],
      matriz: matrizN(5),
      documento: { data_levantamento: '2026-10-02' },
    })
    const [f] = montarFichas(d, 'pgr')
    expect(f.nome).toBe('Acabador de lavagem')
    expect(f.ghe).toBe('GHE 01 – Lavagem e acabamento')
    expect(f.expostos).toBe('1 homem')
    expect(f.riscos).toHaveLength(2)
    expect(f.levantamento).toBe('Levantamento em 02/10/2026')
  })

  it('função sem nenhum risco continua com ficha, com a lista vazia', () => {
    const d = dados({ setores: [setor()], funcoes: [funcao()], matriz: matrizN(5) })
    const [f] = montarFichas(d, 'pgr')
    expect(f.riscos).toEqual([])
    expect(f.comMedicao).toBe(0)
  })

  it('os laudos só trazem os riscos que a norma do laudo cobre', () => {
    const ruido = agente({ id: 'ag1', nome: 'Ruído', anexo_nr15: '1' })
    const queda = agente({ id: 'ag2', nome: 'Queda', tipo: 'Acidente' })
    const a1 = avaliacao({ id: 'a1', agente_id: 'ag1', expand: { agente_id: ruido } })
    const a2 = avaliacao({ id: 'a2', agente_id: 'ag2', expand: { agente_id: queda } })
    const d = dados({ funcoes: [funcao()], avaliacoes: [a1, a2], matriz: matrizN(5) })
    expect(montarFichas(d, 'pgr')[0].riscos).toHaveLength(2)
    expect(montarFichas(d, 'insalubridade')[0].riscos).toHaveLength(1)
    expect(montarFichas(d, 'periculosidade')[0].riscos).toHaveLength(0)
  })

  it('expostos sem separar por sexo mostra só o total', () => {
    const d = dados({ funcoes: [funcao({ numero_empregados: 4 })] })
    expect(montarFichas(d, 'pgr')[0].expostos).toBe('4')
  })
})
