import { describe, it, expect } from 'vitest'
import { casoSentenca, separarNumero } from './titulos'

describe('titulos', () => {
  it('converte título em maiúsculas para caso de sentença e preserva siglas', () => {
    expect(casoSentenca('PROCESSO DE IDENTIFICAÇÃO DE PERIGOS E AVALIAÇÃO DE RISCOS')).toBe(
      'Processo de identificação de perigos e avaliação de riscos',
    )
    expect(casoSentenca('ERGONOMIA: ANÁLISE ERGONÔMICA PRELIMINAR E AET')).toBe(
      'Ergonomia: análise ergonômica preliminar e AET',
    )
    expect(casoSentenca('INTRODUÇÃO E ESCOPO DO PGR (NR-1)')).toBe(
      'Introdução e escopo do PGR (NR-1)',
    )
  })

  it('não mexe em título que já está em caixa mista', () => {
    expect(casoSentenca('Plano de ação')).toBe('Plano de ação')
  })

  it('separa o número do título', () => {
    expect(separarNumero('12 – PLANO DE AÇÃO')).toEqual({ numero: '12', titulo: 'PLANO DE AÇÃO' })
    expect(separarNumero('Anexo A – Dicionário')).toEqual({
      numero: '',
      titulo: 'Anexo A – Dicionário',
    })
  })
})
