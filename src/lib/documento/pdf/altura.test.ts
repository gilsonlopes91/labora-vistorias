import { describe, it, expect } from 'vitest'
import { alturaEstimada, CABE_NA_PAGINA } from './altura'
import type { CardRisco } from '../modelo'

const base: CardRisco = { categoria: 'fisico', nome: 'Ruído', referencias: [], medidas: [] }

describe('alturaEstimada', () => {
  it('card simples cabe numa página', () => {
    expect(alturaEstimada(base)).toBeLessThan(CABE_NA_PAGINA)
  })

  it('texto muito longo e muitas medidas passam do tamanho da página', () => {
    const longo = 'palavra '.repeat(900)
    const c: CardRisco = {
      ...base,
      fonte: longo,
      danos: longo,
      leitura: longo,
      medidas: Array.from({ length: 30 }, (_, i) => ({
        tipo: 'EPI' as const,
        texto: `Protetor ${i} com CA 1234 e validade longa`,
      })),
    }
    expect(alturaEstimada(c)).toBeGreaterThan(CABE_NA_PAGINA)
  })
})
