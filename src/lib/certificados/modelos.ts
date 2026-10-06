// Modelos de certificado de treinamento por NR (texto do certificado e conteúdo programático).
// Os textos de NR 01, 06, 12 e 18 vêm dos certificados da Labora. NR 17 e NR 23 são rascunhos para revisão.
//
// Variáveis aceitas no texto do certificado:
//   {NOME} {CPF} {EMPRESA} {ENDERECO} {DATA} {CARGA} {EXTRA}
// {CARGA} já sai com a unidade ("04 horas"). {EXTRA} é o campo específico do modelo (ex.: máquina da NR 12).
// {ENDERECO} sai no formato "no endereço: <endereço>" quando preenchido, ou vazio quando em branco.
//
// Conteúdo programático: uma linha por tópico.
//   - linha comum: sai com marcador (bolinha verde)
//   - linha começando com "a) ", "b) ", "I. ", "II. "...: sai sem marcador
//   - linha começando com "~ ": texto corrido, sem marcador

export type NrId = '01' | '06' | '12' | '17' | '18' | '23'

export interface ModeloNr {
  id: NrId
  rotulo: string
  /** Texto do certificado, com variáveis. */
  texto: string
  /** Carga horária sugerida (vazia = o usuário precisa informar). */
  cargaHoraria: string
  /** Conteúdo programático, uma linha por tópico. */
  conteudo: string
  /** Campo extra específico da NR (aparece no formulário e substitui {EXTRA}). */
  campoExtra?: { rotulo: string; exemplo: string }
  /** Texto ainda não validado pela Labora. */
  rascunho?: boolean
}

const ABERTURA =
  'Certificamos que {NOME}, portador do CPF {CPF}, concluiu com aproveitamento satisfatório'
const FECHO = 'promovido nas dependências da empresa {EMPRESA} no dia {DATA}'

export const MODELOS_NR: Record<NrId, ModeloNr> = {
  '01': {
    id: '01',
    rotulo: 'NR 01 – Curso Básico em Segurança do Trabalho',
    texto: `${ABERTURA} o curso de NR 01 – Curso Básico em Segurança do Trabalho, ${FECHO}, conforme exigências da Norma Regulamentadora – NR 01, com carga horária de {CARGA}.`,
    cargaHoraria: '',
    conteudo: [
      'Conceitos básicos de segurança do trabalho.',
      'Importância da prevenção de acidentes e doenças ocupacionais.',
      'Responsabilidades do empregador e do empregado.',
      'Visão geral das leis trabalhistas e das Normas Regulamentadoras.',
      'CIPA e SESMT: objetivos, atribuições, eleição e funcionamento.',
      'Identificação e avaliação de riscos no ambiente de trabalho.',
      'Medidas de prevenção e controle de acidentes.',
      'Equipamentos de proteção individual (EPI) e coletiva (EPC).',
      'Noções básicas sobre prevenção e combate a incêndios.',
      'Procedimentos de evacuação e utilização de extintores.',
      'Princípios de primeiros socorros e atendimento a emergências.',
      'Registro e análise de acidentes e doenças do trabalho.',
    ].join('\n'),
  },
  '06': {
    id: '06',
    rotulo: 'NR 06 – Uso e guarda de EPI',
    texto: `${ABERTURA} o Curso sobre uso e guarda de EPI, ${FECHO}, conforme exigências da Norma Regulamentadora – NR 06, com carga horária de {CARGA}.`,
    cargaHoraria: '',
    conteudo: [
      'Descrição do equipamento e seus componentes;',
      'Risco ocupacional contra o qual o EPI oferece proteção;',
      'Conhecimento dos riscos presentes no ambiente de trabalho e como os EPIs protegem contra esses riscos;',
      'Restrições e limitações de proteção;',
      'Forma adequada de uso e ajuste;',
      'Procedimentos de inspeção antes do uso dos EPIs;',
      'Identificação de danos, desgastes e validade dos EPIs;',
      'Manutenção, limpeza e substituição;',
      'Estímulo à conscientização e atitude próativa em relação à segurança pessoal;',
      'Discussão de casos práticos e situações específicas relacionadas ao uso de EPIs.',
    ].join('\n'),
  },
  '12': {
    id: '12',
    rotulo: 'NR 12 – Operador de máquina',
    texto: `${ABERTURA} o Curso para operador de {EXTRA}, ${FECHO}, conforme exigências da Norma Regulamentadora – NR 12, com carga horária de {CARGA}.`,
    cargaHoraria: '',
    campoExtra: { rotulo: 'Máquina / equipamento', exemplo: 'Ex.: serra circular de bancada' },
    conteudo: [
      '~ A capacitação para operação segura de máquinas deve abranger as etapas teórica e prática, a fim de proporcionar a competência adequada do operador para trabalho seguro.',
      'a) descrição e identificação dos riscos associados com cada máquina e equipamento e as proteções específicas contra cada um deles;',
      'b) funcionamento das proteções; como e por que devem ser usadas;',
      'c) como e em que circunstâncias uma proteção pode ser removida, e por quem, sendo na maioria dos casos, somente o pessoal de inspeção ou manutenção;',
      'd) o que fazer, por exemplo, contatar o supervisor, se uma proteção foi danificada ou se perdeu sua função, deixando de garantir uma segurança adequada;',
      'e) os princípios de segurança na utilização da máquina ou equipamento;',
      'f) segurança para riscos mecânicos, elétricos e outros relevantes;',
      'g) método de trabalho seguro;',
      'h) permissão de trabalho; e',
      'i) sistema de bloqueio de funcionamento da máquina e equipamento durante operações de inspeção, limpeza, lubrificação e manutenção.',
    ].join('\n'),
  },
  '17': {
    id: '17',
    rotulo: 'NR 17 – Ergonomia',
    texto: `${ABERTURA} o curso de NR 17 – Ergonomia, ${FECHO}, conforme exigências da Norma Regulamentadora – NR 17, com carga horária de {CARGA}.`,
    cargaHoraria: '',
    rascunho: true,
    conteudo: [
      'Conceito de ergonomia e objetivo da NR 17.',
      'Responsabilidades do empregador e dos trabalhadores.',
      'Relação entre o trabalhador, a tarefa e as condições de trabalho.',
      'Organização do trabalho: ritmo, pausas, jornada e conteúdo das tarefas.',
      'Avaliação ergonômica preliminar (AEP) e análise ergonômica do trabalho (AET).',
      'Levantamento, transporte e descarga individual de cargas.',
      'Mobiliário e postos de trabalho: posturas sentada e em pé, regulagens e ajustes.',
      'Trabalho com computadores e equipamentos de escritório.',
      'Condições ambientais de trabalho: ruído, iluminação, temperatura e umidade.',
      'Fatores de risco ergonômico e distúrbios osteomusculares relacionados ao trabalho.',
      'Medidas de prevenção: pausas, alongamentos e boas práticas posturais.',
      'Orientações práticas para ajuste do posto de trabalho.',
    ].join('\n'),
  },
  '18': {
    id: '18',
    rotulo: 'NR 18 – Curso Básico (construção civil)',
    texto: `${ABERTURA} o curso de NR 18 – Segurança e Saúde no Trabalho na Indústria da Construção (Curso Básico), ${FECHO}, conforme exigências da Norma Regulamentadora – NR 18, com carga horária de {CARGA}.`,
    cargaHoraria: '04',
    conteudo: [
      'I. as condições e meio ambiente de trabalho;',
      'II. os riscos inerentes às atividades desenvolvidas;',
      'III. os equipamentos e proteção coletiva existentes no canteiro de obras;',
      'IV. o uso adequado dos equipamentos de proteção individual;',
      'V. o PGR do canteiro de obras.',
    ].join('\n'),
  },
  '23': {
    id: '23',
    rotulo: 'NR 23 – Proteção Contra Incêndios',
    texto: `${ABERTURA} o curso de NR 23 – Proteção Contra Incêndios, ${FECHO}, conforme exigências da Norma Regulamentadora – NR 23, com carga horária de {CARGA}.`,
    cargaHoraria: '',
    rascunho: true,
    conteudo: [
      'Conceitos de fogo: triângulo e tetraedro do fogo.',
      'Causas dos incêndios e formas de propagação do calor.',
      'Classes de incêndio e métodos de extinção.',
      'Agentes extintores e tipos de extintores portáteis.',
      'Escolha, localização, sinalização e inspeção de extintores.',
      'Técnica de utilização de extintores (prática).',
      'Prevenção de incêndios no ambiente de trabalho: materiais inflamáveis, armazenamento e instalações elétricas.',
      'Saídas de emergência, rotas de fuga e sinalização.',
      'Sistemas de alarme, detecção e combate a incêndio.',
      'Plano de emergência e procedimentos de abandono.',
      'Responsabilidades dos trabalhadores e noções sobre brigada de incêndio.',
    ].join('\n'),
  },
}

export const ORDEM_NR: NrId[] = ['01', '06', '12', '17', '18', '23']

export interface Instrutor {
  nome: string
  qualificacao1: string
  qualificacao2: string
}

export interface Colaborador {
  nome: string
  cpf: string
}

export interface DadosLote {
  nr: NrId
  empresa: string
  endereco?: string
  /** AAAA-MM-DD (valor de input type=date) */
  data: string
  cargaHoraria: string
  extra: string
  texto: string
  conteudo: string
  instrutores: Instrutor[]
}

export function formatarCpf(valor: string): string {
  const d = valor.replace(/\D/g, '')
  if (d.length !== 11) return valor.trim()
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

export function formatarDataBr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

export function formatarCarga(valor: string): string {
  const v = valor.trim()
  if (!v) return ''
  const n = Number(v.replace(',', '.'))
  return Number.isFinite(n) && n === 1 ? `${v} hora` : `${v} horas`
}

/** Preenche as variáveis do texto do certificado para um colaborador. */
export function montarTexto(lote: DadosLote, colaborador: Colaborador): string {
  const enderecoLimpo = (lote.endereco || '').trim()
  const complementoEndereco = enderecoLimpo ? `no endereço: ${enderecoLimpo}` : ''

  const mapa: Record<string, string> = {
    NOME: colaborador.nome.trim(),
    CPF: formatarCpf(colaborador.cpf),
    EMPRESA: lote.empresa.trim(),
    ENDERECO: complementoEndereco,
    DATA: formatarDataBr(lote.data),
    CARGA: formatarCarga(lote.cargaHoraria),
    EXTRA: lote.extra.trim(),
  }

  let textoFinal = lote.texto

  // Se o texto contiver explicitamente {ENDERECO}, substitui pela variável
  if (textoFinal.includes('{ENDERECO}')) {
    textoFinal = textoFinal.replace(/\{ENDERECO\}/g, complementoEndereco)
  } else if (complementoEndereco) {
    // Se o texto não tiver a tag {ENDERECO}, mas o endereço foi informado,
    // insere automaticamente "no endereço: <endereço>" logo após o nome da empresa
    const nomeEmpresa = lote.empresa.trim()
    if (textoFinal.includes('{EMPRESA}')) {
      textoFinal = textoFinal.replace(/\{EMPRESA\}/g, `{EMPRESA} ${complementoEndereco}`)
    } else if (nomeEmpresa && textoFinal.includes(nomeEmpresa)) {
      textoFinal = textoFinal.replace(nomeEmpresa, `${nomeEmpresa} ${complementoEndereco}`)
    }
  }

  return textoFinal
    .replace(
      /\{(NOME|CPF|EMPRESA|ENDERECO|DATA|CARGA|EXTRA)\}/g,
      (_, chave: string) => mapa[chave] || '',
    )
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.:;!?])/g, '$1')
    .trim()
}

/**
 * Interpreta uma lista colada (Excel, Word ou texto): uma pessoa por linha, nome e CPF separados
 * por tabulação, ponto e vírgula ou vírgula. Linha com só o nome também vale (CPF fica em branco).
 */
export function interpretarLista(texto: string): Colaborador[] {
  const saida: Colaborador[] = []
  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.trim()
    if (!linha) continue
    const partes = linha
      .split(/\t|;/)
      .map((p) => p.trim())
      .filter(Boolean)
    let nome = partes[0] || ''
    let cpf = partes[1] || ''
    if (partes.length === 1) {
      // "Nome Sobrenome 123.456.789-00" ou "Nome, 12345678900"
      const m = /^(.*?)[\s,]+(\d{3}\.?\d{3}\.?\d{3}-?\d{2})$/.exec(linha)
      if (m) {
        nome = m[1].trim()
        cpf = m[2]
      }
    }
    // ordem invertida (CPF primeiro)
    if (
      /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(nome) &&
      cpf &&
      !/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/.test(cpf)
    ) {
      ;[nome, cpf] = [cpf, nome]
    }
    if (nome) saida.push({ nome, cpf: formatarCpf(cpf) })
  }
  return saida
}

/** Confere os dígitos verificadores do CPF. */
export function cpfValido(valor: string): boolean {
  const d = valor.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const digito = (base: string, pesoInicial: number) => {
    let soma = 0
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return digito(d.slice(0, 9), 10) === Number(d[9]) && digito(d.slice(0, 10), 11) === Number(d[10])
}

/** Lista o que falta ou está errado antes de gerar. Vazio = pode gerar. */
export function validarLote(lote: DadosLote, colaboradores: Colaborador[]): string[] {
  const erros: string[] = []
  const modelo = MODELOS_NR[lote.nr]
  if (!lote.empresa.trim()) erros.push('Informe a empresa.')
  if (!lote.data) erros.push('Informe a data do curso.')
  if (!lote.cargaHoraria.trim()) erros.push('Informe a carga horária.')
  if (modelo.campoExtra && !lote.extra.trim()) erros.push(`Informe: ${modelo.campoExtra.rotulo}.`)
  if (!lote.texto.trim()) erros.push('O texto do certificado está vazio.')
  if (!lote.conteudo.trim()) erros.push('O conteúdo programático está vazio.')
  if (!lote.instrutores.some((i) => i.nome.trim())) erros.push('Informe pelo menos um instrutor.')
  if (!colaboradores.length) erros.push('Adicione pelo menos um colaborador.')
  colaboradores.forEach((c, i) => {
    const quem = c.nome.trim() || `colaborador ${i + 1}`
    if (!c.nome.trim()) erros.push(`Colaborador ${i + 1}: falta o nome.`)
    else if (!c.cpf.trim()) erros.push(`${quem}: falta o CPF.`)
    else if (!cpfValido(c.cpf)) erros.push(`${quem}: CPF inválido (${c.cpf}).`)
  })
  return erros
}
