// Regras do certificado de treinamento: variáveis do texto, lista de colaboradores e validação.
// Os modelos em si (texto, conteúdo programático, selo) ficam no banco, na coleção
// modelos_certificado — ver src/services/modelosCertificado.ts.
//
// Variáveis aceitas no texto do certificado:
//   {NOME} {CPF} {EMPRESA} {ENDERECO} {DATA} {CARGA} {EXTRA}
// {CARGA} já sai com a unidade ("04 horas"). {EXTRA} é o campo extra do modelo (ex.: máquina da NR 12).
// {ENDERECO} sai no formato "no endereço: <endereço>" quando preenchido, ou vazio quando em branco.
//
// Conteúdo programático: uma linha por tópico.
//   - linha comum: sai com marcador (bolinha na cor da organização)
//   - linha começando com "a) ", "b) ", "I. ", "II. "...: sai sem marcador
//   - linha começando com "~ ": texto corrido, sem marcador

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
  /** Nome do modelo (ex.: "NR 12 – Operador de máquina"). */
  nomeModelo: string
  /** Selo logo abaixo do título (ex.: "NR 12"). Vazio = sem selo. */
  selo: string
  /** Rótulo do campo extra do modelo; vazio = o modelo não tem campo extra. */
  campoExtraRotulo?: string
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
  if (!lote.empresa.trim()) erros.push('Informe a empresa.')
  if (!lote.data) erros.push('Informe a data do curso.')
  if (!lote.cargaHoraria.trim()) erros.push('Informe a carga horária.')
  if (lote.campoExtraRotulo && !lote.extra.trim()) erros.push(`Informe: ${lote.campoExtraRotulo}.`)
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
