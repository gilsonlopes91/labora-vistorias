import { describe, it, expect } from 'vitest'
import { CATEGORIAS, categoriaDoRisco } from './categorias'
import { NIVEL_ACAO_RUIDO_DBA, nivelDeAcao } from './niveis'

describe('categoriaDoRisco', () => {
  it('usa o tipo do agente, com ou sem acento', () => {
    expect(categoriaDoRisco({ tipoAgente: 'Físico' })).toBe('fisico')
    expect(categoriaDoRisco({ tipoAgente: 'Químico' })).toBe('quimico')
    expect(categoriaDoRisco({ tipoAgente: 'Biologico' })).toBe('biologico')
    expect(categoriaDoRisco({ tipoAgente: 'Ergonômico' })).toBe('ergonomico')
  })

  it('cai para a trilha quando não há agente', () => {
    expect(categoriaDoRisco({ trilha: 'Acidente/mecânico' })).toBe('acidente')
    expect(categoriaDoRisco({ trilha: 'Ergonômica (AEP/AET)' })).toBe('ergonomico')
    expect(categoriaDoRisco({ trilha: 'Psicossocial' })).toBe('psicossocial')
  })

  it('devolve "outro" quando nada identifica o risco', () => {
    expect(categoriaDoRisco({})).toBe('outro')
    expect(categoriaDoRisco({ trilha: 'Sem dados suficientes' })).toBe('outro')
  })

  it('usa as cores do mapa de riscos', () => {
    expect(CATEGORIAS.fisico.cor).toBe('#2E9E4F')
    expect(CATEGORIAS.quimico.cor).toBe('#D7262C')
    expect(CATEGORIAS.biologico.cor).toBe('#7A4A1E')
    expect(CATEGORIAS.ergonomico.cor).toBe('#F2C318')
    expect(CATEGORIAS.acidente.cor).toBe('#1F5FBF')
  })
})

describe('nivelDeAcao', () => {
  it('ruído: metade da dose, 80 dB(A) (NR-9, item 9.6.1 c)', () => {
    expect(NIVEL_ACAO_RUIDO_DBA).toBe(80)
    expect(
      nivelDeAcao({ nome: 'Ruído contínuo', anexo_nr15: '1', limite_tolerancia_valor: 85 }),
    ).toBe(80)
  })

  it('agente químico: metade do limite (NR-9, item 9.6.1 b)', () => {
    expect(
      nivelDeAcao({
        nome: 'Tolueno',
        tipo: 'Químico',
        anexo_nr15: '11',
        limite_tolerancia_valor: 78,
      }),
    ).toBe(39)
  })

  it('sem limite ou sem regra de nível de ação: indefinido', () => {
    expect(
      nivelDeAcao({ nome: 'Calor', anexo_nr15: '3', limite_tolerancia_valor: 28 }),
    ).toBeUndefined()
    expect(nivelDeAcao({ nome: 'Tolueno', tipo: 'Químico' })).toBeUndefined()
    expect(nivelDeAcao(undefined)).toBeUndefined()
  })
})
