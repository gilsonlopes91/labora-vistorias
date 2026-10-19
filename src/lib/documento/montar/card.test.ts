import { describe, it, expect } from 'vitest'
import { matrizMini, montarCard } from './card'
import { dados, agente, avaliacao, medicao, matrizN } from '../testes/fabrica'

const SUJOS = /undefined|null|NaN/

const ruido = agente({
  id: 'ag1',
  nome: 'Ruído contínuo ou intermitente',
  tipo: 'Físico',
  anexo_nr15: '1',
  codigo_esocial: '02.01.001',
  limite_tolerancia_valor: 85,
  limite_tolerancia_unidade: 'dB(A)',
  danos_saude_tipicos: 'Perda auditiva induzida por ruído',
})

describe('matrizMini', () => {
  it('5x5: marca a célula e escalona o tom de 1 a 5', () => {
    const m = matrizMini(matrizN(5), 3, 2)
    expect(m.dimensao).toBe(5)
    expect(m.niveis).toHaveLength(5)
    expect(m.niveis[0]).toHaveLength(5)
    expect(m).toMatchObject({ p: 3, s: 2, pontos: 6 })
    // linha de cima é P=5, coluna 5 é S=5: Intolerável = tom 5; P=1,S=1: Trivial = tom 1
    expect(m.niveis[0][4]).toBe(5)
    expect(m.niveis[4][0]).toBe(1)
  })

  it('3x3: gera uma grade 3x3, não uma 5x5 fixa', () => {
    const m = matrizMini(matrizN(3), 2, 3)
    expect(m.dimensao).toBe(3)
    expect(m.niveis).toHaveLength(3)
    expect(m.niveis[0]).toHaveLength(3)
    expect(m).toMatchObject({ p: 2, s: 3, pontos: 6 })
    expect(m.niveis[0][2]).toBe(5)
  })
})

describe('montarCard', () => {
  const aval = avaliacao({
    id: 'a1',
    agente_id: 'ag1',
    expand: { agente_id: ruido },
    trilha_probabilidade: 'Quantitativa (medição)',
    frequencia_exposicao: 'Habitual e intermitente',
    tempo_exposicao_min_jornada: 300,
    fonte_geradora: 'Aspirador industrial e politriz',
    epc_lista: 'Lavadora em baia separada',
    medidas_administrativas: 'Rodízio a cada 2 horas',
    epis_utilizados: 'Protetor auricular de inserção (CA 5745)',
    probabilidade_sugerida: 3,
    severidade_sugerida: 2,
  })
  const m = medicao({
    resultado_valor: 73.1,
    resultado_unidade: 'dB(A)',
    metodologia: 'Dosimetria, NHO-01',
    equipamento: 'Instrutherm DOS-600',
    ruido_dose_nr15_pct: 25,
  })
  const d = dados({ avaliacoes: [aval], medicoes: { a1: [m] }, matriz: matrizN(5) })

  it('ruído com medição: régua com nível de ação 80 e limite 85', () => {
    const c = montarCard(d, aval as never, 'pgr')
    expect(c.categoria).toBe('fisico')
    expect(c.nome).toBe('Ruído contínuo ou intermitente')
    expect(c.referencias).toEqual(['NR-15, Anexo 1', 'eSocial 02.01.001'])
    expect(c.medicao?.valor).toBe('73,1 dB(A)')
    expect(c.medicao?.detalhe).toBe('dose de 25 %')
    expect(c.medicao?.limiteTexto).toBe('85 dB(A)')
    expect(c.medicao?.marcas.map((x) => x.rotulo)).toEqual(['NA 80', 'LT 85'])
    expect(c.medicao!.fracao).toBeGreaterThan(0)
    expect(c.medicao!.fracao).toBeLessThan(c.medicao!.marcas[0].fracao)
    expect(c.exposicao).toEqual({ titulo: 'Habitual e intermitente', detalhe: '300 min/jornada' })
    expect(c.avaliadoPor?.titulo).toBe('Dosimetria, NHO-01')
    expect(c.danos).toBe('Perda auditiva induzida por ruído')
  })

  it('avaliação do risco traz P, S, pontos, categoria e a miniatura', () => {
    const c = montarCard(d, aval as never, 'pgr')
    expect(c.avaliacao).toMatchObject({
      probabilidade: { nivel: 3, nome: 'Possível' },
      severidade: { nivel: 2, nome: 'Baixa' },
      pontos: 6,
      categoria: 'Tolerável',
      prazoDias: null,
    })
    expect(c.avaliacao?.matriz).toMatchObject({ p: 3, s: 2 })
    expect(c.nivel).toEqual({ rotulo: 'Tolerável', pontos: 6 })
  })

  it('a cláusula dos 7 requisitos do EPI só aparece nos laudos', () => {
    const comEpi = {
      ...aval,
      epi_eficacia_atenuacao_ok: true,
      epi_medida_previa_ok: true,
      epi_validade_ca_ok: true,
      epi_condicao_funcionamento: true,
      epi_uso_ininterrupto: true,
      epi_periodicidade_troca_ok: true,
      epi_higienizacao_ok: true,
    }
    const noPgr = montarCard(d, comEpi as never, 'pgr').medidas.find((x) => x.tipo === 'EPI')
    const noLaudo = montarCard(d, comEpi as never, 'insalubridade').medidas.find(
      (x) => x.tipo === 'EPI',
    )
    expect(noPgr?.texto).toBe('Protetor auricular de inserção, CA 5745')
    expect(noLaudo?.texto).toBe('Protetor auricular de inserção, CA 5745 · 7 requisitos atendidos')
  })

  it('risco sem medição e sem limite não tem régua e começa por "como foi avaliado"', () => {
    const semLimite = agente({ id: 'ag2', nome: 'Poeira', tipo: 'Químico' })
    const a2 = avaliacao({
      id: 'a2',
      agente_id: 'ag2',
      expand: { agente_id: semLimite },
      trilha_probabilidade: 'Qualitativa (controle)',
    })
    const c = montarCard(dados({ avaliacoes: [a2], matriz: matrizN(5) }), a2 as never, 'pgr')
    expect(c.medicao).toBeUndefined()
    expect(c.avaliadoPor).toEqual({
      titulo: 'Avaliação qualitativa',
      detalhe: 'Qualitativa (controle)',
    })
    expect(JSON.stringify(c)).not.toMatch(SUJOS)
  })

  it('limite igual a zero não gera régua nem divide por zero', () => {
    const ag0 = agente({ id: 'ag3', nome: 'Agente', limite_tolerancia_valor: 0 })
    const a3 = avaliacao({ id: 'a3', agente_id: 'ag3', expand: { agente_id: ag0 } })
    const c = montarCard(
      dados({ avaliacoes: [a3], medicoes: { a3: [medicao({ resultado_valor: 1 })] } }),
      a3 as never,
      'pgr',
    )
    expect(c.medicao).toBeUndefined()
  })

  it('risco ergonômico mostra a análise ergonômica; os outros não', () => {
    const erg = avaliacao({
      id: 'a4',
      trilha_probabilidade: 'Ergonômica (AEP/AET)',
      perigo_descricao: 'Postura em pé por longos períodos',
      resultado_aep_aet: 'Médio',
      observacoes_aep_aet: 'Sem assento disponível',
      aet_situacao: 'Não exigida nesta data',
      medidas_faltantes: 'Banco semi-sentado\nTapete antifadiga',
      comentario_tecnico: 'A pausa reduz o problema, mas não o resolve.',
      probabilidade_sugerida: 3,
      severidade_sugerida: 3,
    })
    const dd = dados({ avaliacoes: [erg], matriz: matrizN(5) })
    const c = montarCard(dd, erg as never, 'pgr')
    expect(c.categoria).toBe('ergonomico')
    expect(c.aet).toEqual({ titulo: 'Não exigida nesta data', detalhe: 'resultado da AEP: Médio' })
    expect(c.avaliadoPor?.titulo).toBe('Análise ergonômica preliminar (AEP)')
    expect(c.medidas).toContainEqual({
      tipo: 'FALTA',
      texto: 'Banco semi-sentado; Tapete antifadiga',
    })
    expect(c.leitura).toBe('A pausa reduz o problema, mas não o resolve.')
    expect(c.nivel).toEqual({ rotulo: 'Moderado', pontos: 9 })
    const fis = montarCard(d, aval as never, 'pgr')
    expect(fis.aet).toBeUndefined()
  })

  it('sem matriz, o card sai sem avaliação e sem nível', () => {
    const c = montarCard(dados({ avaliacoes: [aval], medicoes: { a1: [m] } }), aval as never, 'pgr')
    expect(c.avaliacao).toBeUndefined()
    expect(c.nivel).toBeUndefined()
  })

  it('laudo de insalubridade traz a conclusão da avaliação', () => {
    const conc = {
      ...aval,
      insalubridade_final: 'Não caracteriza',
      insalubridade_justificativa: 'Abaixo do limite.',
    }
    const c = montarCard(d, conc as never, 'insalubridade')
    expect(c.conclusaoLaudo).toMatchObject({
      texto: 'Não caracterizada',
      enquadramento: 'NR-15, Anexo 1',
      justificativa: 'Abaixo do limite.',
    })
    expect(montarCard(d, conc as never, 'pgr').conclusaoLaudo).toBeUndefined()
  })
})
