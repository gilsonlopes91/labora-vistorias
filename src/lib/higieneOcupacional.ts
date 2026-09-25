/* Cálculos de higiene ocupacional dos formulários de campo de Calor e Ruído.
   Calor: NR-09 Anexo III (Quadros 1 a 4) e NR-15 Anexo 3, metodologia da NHO 06.
   Ruído: NR-15 Anexo 1 (q = 5), NR-09 item 9.6.1 (nível de ação = metade da
   dose) e NHO 01 (q = 3). */

// ---------- Tabelas oficiais ----------

// [M em W, IBUTG máximo em °C]. Os valores de IBUTG caem 0,1 °C a cada linha,
// então a tabela é montada a partir da coluna de M, na ordem da norma.
function tabela(ms: number[], primeiro: number): [number, number][] {
  return ms.map((m, i) => [m, Math.round((primeiro - i * 0.1) * 10) / 10])
}

/** NR-09 Anexo III, Quadro 2 (igual ao Quadro 1 do Anexo 3 da NR-15): limite de exposição. */
export const LIMITE_EXPOSICAO_CALOR = tabela(
  [
    100, 102, 104, 106, 108, 110, 112, 115, 117, 119, 122, 124, 127, 129, 132, 135, 137, 140, 143,
    146, 149, 152, 155, 158, 161, 165, 168, 171, 175, 178, 182, 186, 189, 193, 197, 201, 205, 209,
    214, 218, 222, 227, 231, 236, 241, 246, 251, 256, 261, 266, 272, 277, 283, 289, 294, 300, 306,
    313, 319, 325, 332, 339, 346, 353, 360, 367, 374, 382, 390, 398, 406, 414, 422, 431, 440, 448,
    458, 467, 476, 486, 496, 506, 516, 526, 537, 548, 559, 570, 582, 594, 606,
  ],
  33.7,
)

/** NR-09 Anexo III, Quadro 1: nível de ação. A norma publicada pula de 464 W
 *  (22,3 °C) para 479 W (22,1 °C); a tabela segue o texto oficial. */
export const NIVEL_ACAO_CALOR: [number, number][] = [
  ...tabela(
    [
      100, 101, 103, 105, 106, 108, 110, 112, 114, 115, 117, 119, 121, 123, 125, 127, 129, 132, 134,
      136, 138, 140, 143, 145, 148, 150, 152, 155, 158, 160, 163, 165, 168, 171, 174, 177, 180, 183,
      186, 189, 192, 195, 198, 201, 205, 208, 212, 215, 219, 222, 226, 230, 233, 237, 241, 245, 249,
      253, 257, 262, 266, 270, 275, 279, 284, 289, 293, 298, 303, 308, 313, 318, 324, 329, 334, 340,
      345, 351, 357, 363, 369, 375, 381, 387, 394, 400, 407, 414, 420, 427, 434, 442, 449, 456, 464,
    ],
    31.7,
  ),
  ...tabela([479, 487, 495, 503, 511, 520, 528, 537, 546, 555, 564, 573, 583, 593, 602], 22.1),
]

/** NR-09 Anexo III, Quadro 3 (igual ao Quadro 2 do Anexo 3 da NR-15). */
export const TAXAS_METABOLICAS: [string, number][] = [
  ['Sentado · em repouso', 100],
  ['Sentado · trabalho leve com as mãos', 126],
  ['Sentado · trabalho moderado com as mãos', 153],
  ['Sentado · trabalho pesado com as mãos', 171],
  ['Sentado · trabalho leve com um braço', 162],
  ['Sentado · trabalho moderado com um braço', 198],
  ['Sentado · trabalho pesado com um braço', 234],
  ['Sentado · trabalho leve com dois braços', 216],
  ['Sentado · trabalho moderado com dois braços', 252],
  ['Sentado · trabalho pesado com dois braços', 288],
  ['Sentado · trabalho leve com braços e pernas', 324],
  ['Sentado · trabalho moderado com braços e pernas', 441],
  ['Sentado · trabalho pesado com braços e pernas', 603],
  ['Em pé, agachado ou ajoelhado · em repouso', 126],
  ['Em pé, agachado ou ajoelhado · trabalho leve com as mãos', 153],
  ['Em pé, agachado ou ajoelhado · trabalho moderado com as mãos', 180],
  ['Em pé, agachado ou ajoelhado · trabalho pesado com as mãos', 198],
  ['Em pé, agachado ou ajoelhado · trabalho leve com um braço', 189],
  ['Em pé, agachado ou ajoelhado · trabalho moderado com um braço', 225],
  ['Em pé, agachado ou ajoelhado · trabalho pesado com um braço', 261],
  ['Em pé, agachado ou ajoelhado · trabalho leve com dois braços', 243],
  ['Em pé, agachado ou ajoelhado · trabalho moderado com dois braços', 279],
  ['Em pé, agachado ou ajoelhado · trabalho pesado com dois braços', 315],
  ['Em pé, agachado ou ajoelhado · trabalho leve com o corpo', 351],
  ['Em pé, agachado ou ajoelhado · trabalho moderado com o corpo', 468],
  ['Em pé, agachado ou ajoelhado · trabalho pesado com o corpo', 630],
  ['Andando no plano, sem carga, 2 km/h', 198],
  ['Andando no plano, sem carga, 3 km/h', 252],
  ['Andando no plano, sem carga, 4 km/h', 297],
  ['Andando no plano, sem carga, 5 km/h', 360],
  ['Andando no plano, com 10 kg, 4 km/h', 333],
  ['Andando no plano, com 30 kg, 4 km/h', 450],
  ['Correndo no plano, 9 km/h', 787],
  ['Correndo no plano, 12 km/h', 873],
  ['Correndo no plano, 15 km/h', 990],
  ['Subindo rampa sem carga, 5°, 4 km/h', 324],
  ['Subindo rampa sem carga, 15°, 3 km/h', 378],
  ['Subindo rampa sem carga, 25°, 3 km/h', 540],
  ['Subindo rampa com 20 kg, 15°, 4 km/h', 486],
  ['Subindo rampa com 20 kg, 25°, 4 km/h', 738],
  ['Descendo rampa sem carga, 5°, 5 km/h', 243],
  ['Descendo rampa sem carga, 15°, 5 km/h', 252],
  ['Descendo rampa sem carga, 25°, 5 km/h', 324],
  ['Subindo escada (80 degraus/min), sem carga', 522],
  ['Subindo escada (80 degraus/min), com 20 kg', 648],
  ['Descendo escada (80 degraus/min), sem carga', 279],
  ['Descendo escada (80 degraus/min), com 20 kg', 400],
  ['Trabalho moderado de braços (varrer, almoxarifado)', 320],
  ['Trabalho moderado de levantar ou empurrar', 349],
  ['Empurrar carrinho de mão no plano, com carga', 391],
  ['Carregar pesos ou movimentos vigorosos com os braços (foice)', 495],
  ['Trabalho pesado de levantar, empurrar ou arrastar pesos (pá, valas)', 524],
]

export const OUTRA_TAXA = 'Outra atividade (informar a taxa em W)'
export const OPCOES_TAXA_METABOLICA = [
  ...TAXAS_METABOLICAS.map(([nome, w]) => `${nome} (${w} W)`),
  OUTRA_TAXA,
]

/** NR-09 Anexo III, Quadro 4: acréscimo ao IBUTG médio pela vestimenta. */
export const OPCOES_VESTIMENTA = [
  'Uniforme de trabalho, calça e camisa de manga comprida (+0 °C)',
  'Macacão de tecido (+0 °C)',
  'Macacão de polipropileno SMS (+0,5 °C)',
  'Macacão de poliolefina (+2 °C)',
  'Vestimenta ou macacão forrado, tecido duplo (+3 °C)',
  'Avental longo de manga comprida impermeável ao vapor (+4 °C)',
  'Macacão impermeável ao vapor (+10 °C)',
  'Macacão impermeável ao vapor sobre a roupa de trabalho (+12 °C)',
]

export const AMBIENTE_FECHADO = 'Fechado ou com fonte artificial de calor'
export const AMBIENTE_ABERTO = 'Céu aberto sem fonte artificial de calor'

export const CRITERIO_NR15 = 'NR-15 (q = 5)'
export const CRITERIO_NHO01 = 'NHO 01 (q = 3)'

// ---------- Utilidades ----------

export interface ResultadoTecnico {
  /** Pares rótulo / valor para mostrar em tabela. */
  linhas: [string, string][]
  /** Conclusões; acima = passou do limite ou do nível de ação. */
  conclusoes: { texto: string; acima: boolean }[]
  avisos: string[]
  /** O que falta preencher para calcular. Com itens aqui, não há resultado. */
  faltando: string[]
  /** Texto corrido guardado no registro. */
  resumo: string
}

type Dados = Record<string, unknown>

function num(v: unknown): number | null {
  if (v === undefined || v === null) return null
  const s = String(v).trim().replace(',', '.')
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const fmt = (n: number, casas = 1) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })

function lista(v: unknown): Dados[] {
  if (Array.isArray(v)) return v.filter((x): x is Dados => !!x && typeof x === 'object')
  if (typeof v === 'string') {
    try {
      return lista(JSON.parse(v))
    } catch {
      return []
    }
  }
  if (v && typeof v === 'object') return lista(Object.values(v as Dados))
  return []
}

/** Primeira linha da tabela com M igual ou maior que o M médio. */
function limitePara(
  tabelaM: [number, number][],
  m: number,
): { valor: number; linha: number; foraDaTabela: boolean } {
  for (const [linha, valor] of tabelaM) if (linha >= m) return { valor, linha, foraDaTabela: false }
  const ultima = tabelaM[tabelaM.length - 1]
  return { valor: ultima[1], linha: ultima[0], foraDaTabela: true }
}

function minutosEntre(inicio: unknown, fim: unknown): number | null {
  const a = /^(\d{1,2}):(\d{2})/.exec(String(inicio || ''))
  const b = /^(\d{1,2}):(\d{2})/.exec(String(fim || ''))
  if (!a || !b) return null
  let d = Number(b[1]) * 60 + Number(b[2]) - (Number(a[1]) * 60 + Number(a[2]))
  if (d <= 0) d += 1440
  return d
}

function montarResumo(r: Omit<ResultadoTecnico, 'resumo'>): string {
  if (r.faltando.length) return ''
  const partes = [
    r.linhas.map(([k, v]) => `${k}: ${v}`).join('; ') + '.',
    ...r.conclusoes.map((c) => c.texto),
    ...r.avisos.map((a) => `Observação: ${a}`),
  ]
  return partes.join('\n')
}

// ---------- Calor ----------

export interface OrigemCalor {
  pontos: string
  tempo: string
  tbn: string
  tbs: string
  tg: string
  ibutg?: string
  solar: string
  taxa: string
  taxaW: string
  vestimenta?: string
  capuz?: string
  ambiente?: string
}

export function calcularCalor(dados: Dados, o: OrigemCalor): ResultadoTecnico {
  const faltando: string[] = []
  const avisos: string[] = []
  const pontos = lista(dados[o.pontos]).filter((p) => Object.keys(p).some((k) => k !== '__novo'))
  if (pontos.length === 0) faltando.push('ao menos uma situação de exposição')

  let somaT = 0
  let somaIb = 0
  let somaM = 0
  pontos.forEach((p, i) => {
    const n = i + 1
    const t = num(p[o.tempo])
    if (!t || t <= 0) {
      faltando.push(`tempo da situação ${n}`)
      return
    }
    const tbn = num(p[o.tbn])
    const tg = num(p[o.tg])
    const tbs = num(p[o.tbs])
    const solar = String(p[o.solar] ?? '') === 'Sim'
    let ib: number | null = null
    if (tbn !== null && tg !== null) {
      if (solar) {
        if (tbs === null) {
          faltando.push(`bulbo seco da situação ${n} (há carga solar)`)
          return
        }
        ib = 0.7 * tbn + 0.1 * tbs + 0.2 * tg
      } else {
        ib = 0.7 * tbn + 0.3 * tg
      }
    } else if (o.ibutg && num(p[o.ibutg]) !== null) {
      ib = num(p[o.ibutg])
    }
    if (ib === null) {
      faltando.push(`temperaturas da situação ${n}`)
      return
    }
    const opcao = String(p[o.taxa] ?? '')
    const doQuadro = /\((\d+) W\)$/.exec(opcao)
    const m = doQuadro ? Number(doQuadro[1]) : num(p[o.taxaW])
    if (!m || m <= 0) {
      faltando.push(`taxa metabólica da situação ${n}`)
      return
    }
    somaT += t
    somaIb += ib * t
    somaM += m * t
  })

  if (faltando.length || somaT === 0) {
    return { linhas: [], conclusoes: [], avisos: [], faltando, resumo: '' }
  }

  if (Math.abs(somaT - 60) > 0.5) {
    avisos.push(
      `os tempos somam ${fmt(somaT, 0)} min. A NR-15 (Anexo 3, item 2.4) e a NHO 06 pedem os 60 minutos corridos mais críticos; a média foi feita sobre ${fmt(somaT, 0)} min.`,
    )
  }

  const ibMedio = somaIb / somaT
  const mMedio = Math.round(somaM / somaT)
  let acrescimo = 0
  const vest = o.vestimenta ? String(dados[o.vestimenta] ?? '') : ''
  const mv = /\(\+([\d,]+) °C\)$/.exec(vest)
  if (mv) acrescimo += Number(mv[1].replace(',', '.'))
  const capuz = o.capuz ? String(dados[o.capuz] ?? '') === 'Sim' : false
  if (capuz) acrescimo += 1
  const ibFinal = Math.round((ibMedio + acrescimo) * 10) / 10

  const na = limitePara(NIVEL_ACAO_CALOR, mMedio)
  const le = limitePara(LIMITE_EXPOSICAO_CALOR, mMedio)
  if (le.foraDaTabela || na.foraDaTabela) {
    avisos.push(
      `a taxa metabólica média (${mMedio} W) passa da última linha dos quadros; foi usado o último valor da tabela.`,
    )
  }

  const linhas: [string, string][] = [['IBUTG médio', `${fmt(ibMedio)} °C`]]
  if (acrescimo) {
    linhas.push([
      'Acréscimo da vestimenta',
      `+${fmt(acrescimo)} °C (Quadro 4${capuz ? ', com capuz' : ''})`,
    ])
    linhas.push(['IBUTG médio ajustado', `${fmt(ibFinal)} °C`])
  }
  linhas.push(['Taxa metabólica média', `${mMedio} W`])
  linhas.push([
    'Nível de ação (NR-09, Anexo III, Quadro 1)',
    `${fmt(na.valor)} °C (linha de ${na.linha} W)`,
  ])
  linhas.push([
    'Limite de exposição (NR-09, Anexo III, Quadro 2)',
    `${fmt(le.valor)} °C (linha de ${le.linha} W)`,
  ])

  const conclusoes: { texto: string; acima: boolean }[] = []
  if (ibFinal > le.valor) {
    conclusoes.push({
      texto:
        'Acima do limite de exposição: adotar medidas corretivas (NR-09, Anexo III, item 4.2).',
      acima: true,
    })
  } else if (ibFinal > na.valor) {
    conclusoes.push({
      texto:
        'Acima do nível de ação e abaixo do limite de exposição: adotar medidas preventivas (NR-09, Anexo III, item 4.1).',
      acima: true,
    })
  } else {
    conclusoes.push({ texto: 'Abaixo do nível de ação.', acima: false })
  }

  const ambiente = o.ambiente ? String(dados[o.ambiente] ?? '') : ''
  if (ambiente === AMBIENTE_ABERTO) {
    conclusoes.push({
      texto:
        'NR-15, Anexo 3: não se aplica, atividade a céu aberto sem fonte artificial de calor (item 1.1.1).',
      acima: false,
    })
  } else if (ambiente === AMBIENTE_FECHADO) {
    conclusoes.push(
      ibFinal > le.valor
        ? {
            texto: 'NR-15, Anexo 3: caracteriza insalubridade em grau médio (itens 2.3 e 2.6).',
            acima: true,
          }
        : { texto: 'NR-15, Anexo 3: não caracteriza insalubridade.', acima: false },
    )
  } else {
    avisos.push('informe o tipo de ambiente para concluir sobre a insalubridade (NR-15, Anexo 3).')
  }

  const r = { linhas, conclusoes, avisos, faltando: [] as string[] }
  return { ...r, resumo: montarResumo(r) }
}

// ---------- Ruído ----------

export interface OrigemRuido {
  criterio: string
  inicio?: string
  fim?: string
  amostragem?: string
  jornada?: string
  dose: string
  nen?: string
  calIni?: string
  calFim?: string
}

export function calcularRuido(dados: Dados, o: OrigemRuido): ResultadoTecnico {
  const faltando: string[] = []
  const avisos: string[] = []
  const criterio = String(dados[o.criterio] ?? '')
  const nho = criterio === CRITERIO_NHO01
  if (!criterio) faltando.push('critério (NR-15 ou NHO 01)')
  const k = nho ? 10 : 16.61

  let tm = o.amostragem ? num(dados[o.amostragem]) : null
  let tmDoHorario = false
  if (!tm && o.inicio && o.fim) {
    tm = minutosEntre(dados[o.inicio], dados[o.fim])
    tmDoHorario = tm !== null
  }
  const dose = num(dados[o.dose])
  const nenInformado = o.nen ? num(dados[o.nen]) : null
  if (dose === null && nenInformado === null) faltando.push('dose')
  if (dose !== null && !tm) faltando.push('tempo de amostragem')
  if (faltando.length) return { linhas: [], conclusoes: [], avisos: [], faltando, resumo: '' }

  let te = o.jornada ? num(dados[o.jornada]) : null
  if (!te) {
    te = 480
    avisos.push('jornada não informada; foi considerada a de 8 horas (480 min).')
  }

  const linhas: [string, string][] = [['Critério', nho ? 'NHO 01, q = 3' : 'NR-15, Anexo 1, q = 5']]
  let nen: number
  let doseJornada: number
  if (dose !== null && tm) {
    if (dose <= 0) {
      return {
        linhas: [],
        conclusoes: [],
        avisos: [],
        faltando: ['dose maior que zero'],
        resumo: '',
      }
    }
    doseJornada = (dose * te) / tm
    const ne = 85 + k * Math.log10((480 / tm) * (dose / 100))
    nen = 85 + k * Math.log10(doseJornada / 100)
    linhas.push([
      'Tempo de amostragem',
      `${fmt(tm, 0)} min${tmDoHorario ? ' (pelos horários)' : ''}`,
    ])
    linhas.push(['Dose medida', `${fmt(dose)}%`])
    linhas.push(['Jornada', `${fmt(te, 0)} min`])
    linhas.push(['Dose projetada na jornada', `${fmt(doseJornada)}%`])
    linhas.push(['Nível equivalente (NE)', `${fmt(ne)} dB(A)`])
    linhas.push(['NEN', `${fmt(nen)} dB(A)`])
    if (nenInformado !== null && Math.abs(nenInformado - nen) > 0.5) {
      avisos.push(
        `o NEN informado (${fmt(nenInformado)} dB(A)) difere do calculado (${fmt(nen)} dB(A)). Confira o tempo de amostragem, a jornada e o critério do dosímetro.`,
      )
    }
  } else {
    nen = nenInformado as number
    linhas.push(['NEN informado', `${fmt(nen)} dB(A)`])
    doseJornada = 100 * Math.pow(10, (nen - 85) / k)
  }

  const limite = 85
  const nivelAcao = nho ? 82 : 80
  linhas.push([
    'Nível de ação',
    nho ? `${nivelAcao} dB(A) (NHO 01)` : `dose de 50%, ${nivelAcao} dB(A) (NR-09, item 9.6.1)`,
  ])
  linhas.push([
    'Limite',
    nho ? `${limite} dB(A) (NHO 01)` : `dose de 100%, ${limite} dB(A) em 8 h (NR-15, Anexo 1)`,
  ])

  const conclusoes: { texto: string; acima: boolean }[] = []
  // NHO 01 compara o NEN; a NR-15 compara a dose ("superior à unidade").
  // Os dois com uma casa decimal, como aparecem no laudo.
  const nenR = Math.round(nen * 10) / 10
  const doseR = Math.round(doseJornada * 10) / 10
  const acimaLimite = nho ? nenR > limite : doseR > 100
  const acimaAcao = nho ? nenR > nivelAcao : doseR > 50
  if (acimaLimite) {
    conclusoes.push({
      texto: 'Acima do limite de exposição: adotar medidas corretivas.',
      acima: true,
    })
  } else if (acimaAcao) {
    conclusoes.push({
      texto: 'Acima do nível de ação e abaixo do limite: adotar medidas preventivas.',
      acima: true,
    })
  } else {
    conclusoes.push({ texto: 'Abaixo do nível de ação.', acima: false })
  }
  if (nho) {
    conclusoes.push({
      texto:
        'Para insalubridade, a NR-15 usa q = 5: faça a leitura do dosímetro também nesse critério.',
      acima: false,
    })
  } else {
    conclusoes.push(
      acimaLimite
        ? { texto: 'NR-15, Anexo 1: caracteriza insalubridade em grau médio.', acima: true }
        : { texto: 'NR-15, Anexo 1: não caracteriza insalubridade.', acima: false },
    )
  }

  const ci = o.calIni ? num(dados[o.calIni]) : null
  const cf = o.calFim ? num(dados[o.calFim]) : null
  if (ci !== null && cf !== null) {
    linhas.push(['Calibração (início / fim)', `${fmt(ci)} / ${fmt(cf)} dB`])
    if (Math.abs(cf - ci) > 1) {
      avisos.push(
        `a calibração variou ${fmt(Math.abs(cf - ci))} dB entre o início e o fim. Pela NHO 01, variação acima de 1 dB invalida a medição.`,
      )
    }
  }

  const r = { linhas, conclusoes, avisos, faltando: [] as string[] }
  return { ...r, resumo: montarResumo(r) }
}

// ---------- Entrada única usada pelo formulário ----------

export interface CampoCalculoTecnico {
  calculo?: unknown
  origem?: unknown
}

export function calcularTecnico(campo: CampoCalculoTecnico, dados: Dados): ResultadoTecnico | null {
  const origem = campo.origem as Record<string, string> | undefined
  if (!origem || typeof origem !== 'object') return null
  if (campo.calculo === 'calor') return calcularCalor(dados, origem as unknown as OrigemCalor)
  if (campo.calculo === 'ruido') return calcularRuido(dados, origem as unknown as OrigemRuido)
  return null
}
