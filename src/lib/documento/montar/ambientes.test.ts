import { describe, it, expect } from 'vitest'
import { montarAmbientes, montarGrupos } from './ambientes'
import { dados, setor, ghe, funcao } from '../testes/fabrica'

const SUJOS = /undefined|null|NaN/

describe('montarAmbientes', () => {
  it('monta o ambiente com os dados do setor', () => {
    const d = dados({
      setores: [
        setor({
          nome: 'Galpão de lavagem',
          descricao_processo: 'Lavagem e acabamento de veículos.',
          area_m2: 240,
          pe_direito_m: 5.5,
          cobertura: 'telha metálica',
          piso: 'concreto',
          iluminacao: 'natural e LED',
          maquinas_equipamentos: 'Duas lavadoras de alta pressão',
        }),
      ],
      funcoes: [
        funcao({ numero_empregados: 4 }),
        funcao({ id: 'f2', nome: 'Lavador', numero_empregados: 5 }),
      ],
    })
    const [amb] = montarAmbientes(d)
    expect(amb.nome).toBe('Galpão de lavagem')
    expect(amb.subtitulo).toBe('Ambiente 01')
    expect(amb.metricas).toEqual([
      { rotulo: 'Área', valor: '240 m²' },
      { rotulo: 'Pé-direito', valor: '5,5 m' },
      { rotulo: 'Trabalhadores', valor: '9' },
      { rotulo: 'Funções', valor: '2' },
    ])
    expect(amb.construcao).toBe('cobertura: telha metálica; piso: concreto')
    expect(amb.funcoes).toBe('Acabador de lavagem, Lavador')
  })

  it('setor sem dados não imprime undefined, null nem NaN', () => {
    const [amb] = montarAmbientes(dados({ setores: [setor()] }))
    expect(amb.metricas).toEqual([])
    expect(amb.processo).toBeUndefined()
    expect(amb.construcao).toBeUndefined()
    expect(JSON.stringify(amb)).not.toMatch(SUJOS)
  })

  it('não mostra "0 trabalhadores" quando ninguém informou o número', () => {
    const d = dados({ setores: [setor()], funcoes: [funcao()] })
    const [amb] = montarAmbientes(d)
    expect(amb.metricas.find((m) => m.rotulo === 'Trabalhadores')).toBeUndefined()
    expect(amb.metricas.find((m) => m.rotulo === 'Funções')?.valor).toBe('1')
  })
})

describe('montarGrupos', () => {
  it('agrupa por GHE e junta as funções sem GHE num grupo à parte', () => {
    const d = dados({
      setores: [setor()],
      ghes: [
        ghe({
          setor_id: 's1',
          criterio_agrupamento: 'mesma área e mesmas máquinas',
          jornada_trabalho: '44 h/semana, 8 h/dia',
        }),
      ],
      funcoes: [
        funcao({
          ghe_id: 'g1',
          cbo: '5199-35',
          numero_empregados: 1,
          descricao_atividades: 'Finaliza o veículo.',
        }),
        funcao({ id: 'f2', nome: 'Atendente', setor_id: undefined, numero_empregados: 1 }),
      ],
    })
    const grupos = montarGrupos(d)
    expect(grupos).toHaveLength(2)
    expect(grupos[0].titulo).toBe('GHE 01 – Lavagem e acabamento')
    expect(grupos[0].detalhe).toContain('critério: mesma área e mesmas máquinas')
    expect(grupos[0].funcoes[0]).toMatchObject({
      nome: 'Acabador de lavagem',
      cbo: '5199-35',
      expostos: '1',
      jornada: '44 h/semana, 8 h/dia',
      ambiente: 'Galpão de lavagem',
    })
    expect(grupos[1].titulo).toBe('Funções avaliadas individualmente')
    expect(grupos[1].funcoes[0].jornada).toBe('44 h/semana')
    expect(JSON.stringify(grupos)).not.toMatch(SUJOS)
  })
})
