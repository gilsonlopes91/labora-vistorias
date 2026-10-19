import { describe, it, expect } from 'vitest'
import { montarDocumento } from './documento'
import { dados, setor, funcao, agente, avaliacao, acao, matrizN } from '../testes/fabrica'
import type { DocumentoRenderizado } from '@/lib/modelosSst/renderizar'

const tabela = (blocoId: string, extra = {}) => ({
  tipo: 'tabela' as const,
  blocoId,
  titulo: blocoId,
  cabecalho: ['x'],
  linhas: [['1']],
  ...extra,
})

function renderizado(secoes: DocumentoRenderizado['secoes']): DocumentoRenderizado {
  return {
    modelo: {
      tipo: 'pgr',
      sigla: 'PGR',
      titulo: 'Programa de Gerenciamento de Riscos',
      versaoTexto: 'x',
      capa: [],
      secoes: [],
    },
    campos: {
      DATA_INICIO_VALIDADE: '19/10/2026',
      DATA_REVISAO_ATE: '19/10/2028',
      NUM_TRABALHADORES: '38',
      NOME_RESPONSAVEL_PLANO: 'Maria Souza',
      CARGO_RESPONSAVEL_PLANO: 'Gerente',
    },
    capa: [
      {
        tipo: 'tabela',
        titulo: 'Identificação',
        cabecalho: ['Campo', 'Informação'],
        linhas: [
          ['CNPJ', '12.345.678/0001-90'],
          ['Telefone', ''],
        ],
      },
    ],
    secoes,
    pendencias: [],
    notas: [],
    camposCriticosVazios: [],
  } as unknown as DocumentoRenderizado
}

const marca = { organizacaoNome: 'Labora', corPrimaria: '#6C8845', corSecundaria: '#202720' }

describe('montarDocumento', () => {
  const ag = agente({ nome: 'Ruído', tipo: 'Físico' })
  const d = dados({
    setores: [setor()],
    funcoes: [funcao({ numero_empregados: 1 })],
    avaliacoes: [
      avaliacao({
        id: 'a1',
        agente_id: 'ag1',
        expand: { agente_id: ag },
        probabilidade_sugerida: 3,
        severidade_sugerida: 2,
      }),
    ],
    acoes: [acao()],
    matriz: matrizN(5),
  })

  it('troca os blocos mapeados pelas estruturas e some com os absorvidos', () => {
    const r = renderizado([
      {
        id: 's20',
        titulo: '20 – AMBIENTES, FUNÇÕES E INVENTÁRIO DE RISCOS',
        elementos: [
          { tipo: 'paragrafo', runs: [{ texto: 'Texto do capítulo.' }] },
          tabela('20:ambientes_e_processos'),
          tabela('20:funcoes_e_grupos_de_exposicao'),
          tabela('20:inventario_de_perigos'),
          tabela('20:avaliacao_de_riscos'),
          tabela('20:epc_e_epi'),
          tabela('20:medicoes'),
        ],
      },
      { id: 's12', titulo: '12 – PLANO DE AÇÃO', elementos: [tabela('12:plano_de_acao')] },
    ])
    const doc = montarDocumento({ dados: d, renderizado: r, marca, titulo: 'PGR' })
    const cap20 = doc.capitulos[0]
    expect(cap20.numero).toBe('20')
    expect(cap20.titulo).toBe('Ambientes, funções e inventário de riscos')
    expect(cap20.blocos.map((b) => b.tipo)).toEqual([
      'paragrafo',
      'ambientes',
      'funcoes',
      'inventario',
      'tabela',
    ])
    expect(doc.capitulos[1].blocos.map((b) => b.tipo)).toEqual(['plano'])
  })

  it('laudo de insalubridade: ambientes, funções, inventário, conclusões e plano', () => {
    const dl = dados({
      tipo: 'insalubridade',
      setores: [setor()],
      funcoes: [funcao({ numero_empregados: 1 })],
      avaliacoes: [],
      acoes: [acao()],
      matriz: matrizN(5),
    })
    const r = renderizado([
      {
        id: 's11',
        titulo: '11 – CARACTERIZAÇÃO',
        elementos: [
          tabela('11:ambientes'),
          tabela('11:ghe'),
          tabela('11:funcoes'),
          tabela('11:reconhecimento_de_agentes'),
          tabela('11:epc_e_medidas_administrativas'),
        ],
      },
      {
        id: 's12',
        titulo: '12 – CONCLUSÃO POR FUNÇÃO',
        elementos: [
          tabela('12:conclusao_por_funcao'),
          tabela('12:resumo_de_adicional_por_funcao'),
          tabela('12:plano_de_acao'),
        ],
      },
    ])
    const doc = montarDocumento({ dados: dl, renderizado: r, marca, titulo: 'Laudo' })
    expect(doc.capitulos[0].blocos.map((b) => b.tipo)).toEqual([
      'ambientes',
      'funcoes',
      'inventario',
      'tabela',
    ])
    expect(doc.capitulos[1].blocos.map((b) => b.tipo)).toEqual(['conclusoes', 'tabela', 'plano'])
    expect(doc.capa.subtitulo).toBe('Atividades e operações insalubres · NR-15')
  })

  it('LTCAT: o capítulo 10 traz as fichas e as conclusões', () => {
    const dl = dados({ tipo: 'ltcat', funcoes: [funcao()], matriz: matrizN(5) })
    const r = renderizado([
      {
        id: 's10',
        titulo: '10 – CONCLUSÃO POR FUNÇÃO',
        elementos: [
          tabela('10:conclusao_por_funcao'),
          tabela('10:resumo_por_funcao_para_ppp_e_esocial'),
        ],
      },
    ])
    const doc = montarDocumento({ dados: dl, renderizado: r, marca, titulo: 'LTCAT' })
    expect(doc.capitulos[0].blocos.map((b) => b.tipo)).toEqual([
      'inventario',
      'conclusoes',
      'tabela',
    ])
    expect(doc.anexos).toEqual([])
  })

  it('respeita o bloco desligado pelo técnico', () => {
    const r = renderizado([
      {
        id: 's',
        titulo: '20 – X',
        elementos: [tabela('20:ambientes_e_processos', { excluido: true })],
      },
    ])
    const doc = montarDocumento({ dados: d, renderizado: r, marca, titulo: 'PGR' })
    expect(doc.capitulos[0].blocos).toEqual([])
  })

  it('bloco sem mapeamento continua como tabela', () => {
    const r = renderizado([{ id: 's', titulo: '20 – X', elementos: [tabela('20:medicoes')] }])
    const doc = montarDocumento({ dados: d, renderizado: r, marca, titulo: 'PGR' })
    expect(doc.capitulos[0].blocos[0].tipo).toBe('tabela')
  })

  it('monta capa, identificação sem linhas vazias e a tabela consolidada em anexo', () => {
    const doc = montarDocumento({ dados: d, renderizado: renderizado([]), marca, titulo: 'PGR' })
    expect(doc.capa.sigla).toBe('PGR')
    expect(doc.capa.cartoes).toEqual([
      { rotulo: 'Versão', valor: '1' },
      { rotulo: 'Vigência', valor: '19/10/2026' },
      { rotulo: 'Revisar até', valor: '19/10/2028' },
      { rotulo: 'Trabalhadores', valor: '38' },
    ])
    expect(doc.identificacao).toEqual([{ rotulo: 'CNPJ', valor: '12.345.678/0001-90' }])
    expect(doc.anexos).toHaveLength(1)
    expect(doc.anexos[0].titulo).toBe('Tabela consolidada do inventário')
  })

  it('capa sem logos e sem CNPJ não imprime undefined', () => {
    const doc = montarDocumento({
      dados: dados(),
      renderizado: renderizado([]),
      marca,
      titulo: 'PGR',
    })
    expect(JSON.stringify(doc.capa)).not.toMatch(/undefined|null|NaN/)
    expect(doc.marca.logoCliente).toBeUndefined()
  })
})
