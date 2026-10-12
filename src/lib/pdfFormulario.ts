/* Formulário de campo preenchido no PDF, no estilo da Ficha de Campo da Labora:
   cabeçalho com logo e linha na cor da organização, título centralizado,
   seções em verde, linhas com divisória fina, cada medição num bloco com
   borda, fotos em duas colunas e linhas de assinatura no fim.
   - Ficha: o "pincel" com esse visual, usado também pelo relatório de vistoria
     quando a vistoria só tem formulários.
   - desenharFormularioNoPdf: desenha um registro num documento já aberto.
   - gerarPdfFormularios: documento próprio com um ou vários formulários de
     uma empresa (PDF individual e "tudo em um PDF" na página da empresa).
   O relatório das vistorias de NR continua com o visual próprio dele. */
import { jsPDF } from 'jspdf'

import { formatBrazilianDate } from '@/lib/date'
import {
  calcularCampo,
  campoVisivel,
  listaArquivos,
  normalizarInstancias,
  valorEmTexto,
} from '@/lib/formularioCampos'
import { calcularTecnico, type CampoCalculoTecnico } from '@/lib/higieneOcupacional'
import {
  carregarIdentidade,
  ehOrganizacaoLabora,
  escurecer,
  hexParaRgb,
  type RGB,
} from '@/lib/identidadeVisual'
import { carregarImagemComoDataUrl } from '@/lib/relatorioVistoria'
import { getTokenArquivos } from '@/services/respostasVistoria'
import { urlAnexo, type Formulario } from '@/services/registrosFormulario'
import type { CampoFormulario } from '@/services/formularios'
import laboraLogoUrl from '@/assets/projeto-labora-engenharia-e-sst-07-83499.png'

export const TAGLINE_LABORA = 'HIGIENE OCUPACIONAL · SEGURANÇA DO TRABALHO'

interface ImagemPdf {
  dataUrl: string
  largura: number
  altura: number
}

const formatoDe = (img: ImagemPdf) => (img.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG')

type Linha = [string, string]

/** Pincel do visual "ficha de campo": guarda a posição (y) e sabe virar a página. */
export class Ficha {
  doc: jsPDF
  margin: number
  primaria: RGB
  y: number
  pageWidth: number
  pageHeight: number
  largura: number
  verde: RGB

  constructor(doc: jsPDF, margin: number, primaria: RGB, y: number) {
    this.doc = doc
    this.margin = margin
    this.primaria = primaria
    this.y = y
    this.pageWidth = doc.internal.pageSize.getWidth()
    this.pageHeight = doc.internal.pageSize.getHeight()
    this.largura = this.pageWidth - margin * 2
    this.verde = escurecer(primaria, 0.35)
  }

  garantirEspaco(altura: number) {
    if (this.y + altura > this.pageHeight - 60) {
      this.doc.addPage()
      this.y = this.margin
    }
  }

  private corVerde() {
    this.doc.setTextColor(this.verde[0], this.verde[1], this.verde[2])
  }

  private linhaVerde(espessura: number) {
    const { doc, primaria } = this
    doc.setDrawColor(primaria[0], primaria[1], primaria[2])
    doc.setLineWidth(espessura)
    doc.line(this.margin, this.y, this.pageWidth - this.margin, this.y)
    doc.setLineWidth(0.5)
  }

  /** Logo, nome da organização, linha verde e título centralizado. */
  cabecalho(o: { nome: string; logo: ImagemPdf | null; tagline?: string; titulo: string }) {
    const { doc } = this
    const alturaLogo = 40
    let x = this.margin
    if (o.logo) {
      const larguraLogo = alturaLogo * (o.logo.largura / o.logo.altura)
      doc.addImage(o.logo.dataUrl, formatoDe(o.logo), x, this.y, larguraLogo, alturaLogo)
      x += larguraLogo + 12
    }
    if (o.nome) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      this.corVerde()
      doc.text(o.nome.toUpperCase(), x, this.y + (o.tagline ? 17 : 24))
    }
    if (o.tagline) {
      const comEspaco = doc as unknown as { setCharSpace?: (n: number) => void }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(110, 110, 110)
      comEspaco.setCharSpace?.(0.9)
      doc.text(o.tagline, x, this.y + 30)
      comEspaco.setCharSpace?.(0)
    }
    doc.setTextColor(0)
    this.y += alturaLogo + 8
    this.linhaVerde(2.5)
    this.y += 34
    this.tituloCentral(o.titulo, 20)
    this.y += 6
  }

  tituloCentral(texto: string, tamanho: number) {
    const { doc } = this
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(tamanho)
    this.corVerde()
    const linhas: string[] = doc.splitTextToSize(texto, this.largura)
    this.garantirEspaco(linhas.length * (tamanho + 4) + 10)
    doc.text(linhas, this.pageWidth / 2, this.y, { align: 'center' })
    doc.setTextColor(0)
    this.y += linhas.length * (tamanho + 4)
  }

  /** Título de seção em verde, com ou sem linha embaixo. */
  secao(texto: string, comLinha = false, tamanho = 12) {
    const { doc } = this
    this.garantirEspaco(40)
    this.y += 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(tamanho)
    this.corVerde()
    doc.text(texto, this.margin, this.y)
    doc.setTextColor(0)
    if (comLinha) {
      this.y += 6
      this.linhaVerde(1)
      this.y += 12
    } else {
      this.y += 14
    }
  }

  /** Texto pequeno e cinza (data de preenchimento, observações). */
  nota(texto: string, italico = false) {
    const { doc } = this
    doc.setFont('helvetica', italico ? 'italic' : 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(110, 110, 110)
    const linhas: string[] = doc.splitTextToSize(texto, this.largura)
    for (const linha of linhas) {
      this.garantirEspaco(14)
      doc.text(linha, this.margin, this.y)
      this.y += 11
    }
    doc.setTextColor(0)
    this.y += 4
  }

  /** Frase em destaque (conclusão do cálculo), em vermelho quando passa do limite. */
  destaque(texto: string, vermelho: boolean) {
    const { doc } = this
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    if (vermelho) doc.setTextColor(180, 40, 40)
    else doc.setTextColor(0)
    const linhas: string[] = doc.splitTextToSize(texto, this.largura)
    for (const linha of linhas) {
      this.garantirEspaco(16)
      doc.text(linha, this.margin + 8, this.y)
      this.y += 13
    }
    doc.setTextColor(0)
    this.y += 4
  }

  /** Campo e valor, um por linha, com divisória fina. */
  linhas(rows: Linha[]) {
    const { doc } = this
    const larguraRotulo = 150
    for (const [rotulo, valor] of rows) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      const linhasRotulo: string[] = doc.splitTextToSize(rotulo, larguraRotulo - 10)
      doc.setFont('helvetica', 'normal')
      const linhasValor: string[] = doc.splitTextToSize(
        valor || '—',
        this.largura - larguraRotulo - 6,
      )
      const n = Math.max(linhasRotulo.length, linhasValor.length)
      this.garantirEspaco(Math.min(n, 3) * 12 + 8)
      for (let i = 0; i < n; i++) {
        if (this.y + 12 > this.pageHeight - 60) {
          doc.addPage()
          this.y = this.margin
        }
        if (linhasRotulo[i]) {
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(45, 45, 45)
          doc.text(linhasRotulo[i], this.margin + 8, this.y + 10)
        }
        if (linhasValor[i]) {
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0)
          doc.text(linhasValor[i], this.margin + larguraRotulo, this.y + 10)
        }
        this.y += 12
      }
      doc.setDrawColor(232, 232, 232)
      doc.setLineWidth(0.5)
      doc.line(this.margin, this.y + 3, this.pageWidth - this.margin, this.y + 3)
      this.y += 8
    }
    doc.setTextColor(0)
  }

  /** Bloco com borda e título (cada medição ou ponto), com os campos dentro. */
  card(titulo: string, rows: Linha[]) {
    const { doc, primaria } = this
    const pad = 12
    const larguraRotulo = 140
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    const medidas = rows.map(([rotulo, valor]) => {
      const linhasRotulo: string[] = doc.splitTextToSize(rotulo, larguraRotulo - 8)
      const linhasValor: string[] = doc.splitTextToSize(
        valor || '—',
        this.largura - pad * 2 - larguraRotulo,
      )
      return { linhasRotulo, linhasValor, n: Math.max(linhasRotulo.length, linhasValor.length) }
    })
    const altura = pad + 24 + medidas.reduce((soma, m) => soma + m.n * 12 + 4, 0) + pad - 4
    // Bloco que cabe numa página não é partido ao meio; só os muito longos fluem.
    const cabe = altura <= this.pageHeight - this.margin - 70
    this.garantirEspaco(cabe ? altura + 12 : 90)
    const topo = this.y
    if (cabe) {
      doc.setDrawColor(primaria[0], primaria[1], primaria[2])
      doc.setLineWidth(1)
      doc.roundedRect(this.margin, topo, this.largura, altura, 6, 6, 'S')
      doc.setLineWidth(0.5)
    }
    this.y = topo + pad + 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(110, 110, 110)
    doc.text(titulo, this.margin + pad, this.y)
    this.y += 16
    doc.setFontSize(9.5)
    for (const m of medidas) {
      for (let i = 0; i < m.n; i++) {
        if (this.y + 12 > this.pageHeight - 60) {
          doc.addPage()
          this.y = this.margin + 10
        }
        if (m.linhasRotulo[i]) {
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(110, 110, 110)
          doc.text(m.linhasRotulo[i], this.margin + pad, this.y)
        }
        if (m.linhasValor[i]) {
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0)
          doc.text(m.linhasValor[i], this.margin + pad + larguraRotulo, this.y)
        }
        this.y += 12
      }
      this.y += 4
    }
    doc.setTextColor(0)
    this.y = cabe ? topo + altura + 12 : this.y + pad
  }

  /** Fotos em duas colunas, cada uma inteira dentro da sua moldura. */
  fotos(titulo: string, imagens: ImagemPdf[]) {
    const { doc } = this
    this.secao(titulo, true, 10.5)
    const intervalo = 12
    const larguraCelula = (this.largura - intervalo) / 2
    const alturaCelula = 175
    let topoLinha = this.y
    imagens.forEach((img, i) => {
      const coluna = i % 2
      if (coluna === 0) {
        this.garantirEspaco(alturaCelula + 12)
        topoLinha = this.y
      }
      const x = this.margin + coluna * (larguraCelula + intervalo)
      doc.setFillColor(246, 246, 246)
      doc.setDrawColor(215, 215, 215)
      doc.roundedRect(x, topoLinha, larguraCelula, alturaCelula, 4, 4, 'FD')
      const escala = Math.min((larguraCelula - 6) / img.largura, (alturaCelula - 6) / img.altura)
      const w = img.largura * escala
      const h = img.altura * escala
      doc.addImage(
        img.dataUrl,
        formatoDe(img),
        x + (larguraCelula - w) / 2,
        topoLinha + (alturaCelula - h) / 2,
        w,
        h,
      )
      if (coluna === 1 || i === imagens.length - 1) this.y = topoLinha + alturaCelula + 12
    })
  }

  /** Duas linhas de assinatura no fim do documento. */
  assinaturas(tecnico: string, responsavel: string) {
    const { doc } = this
    this.garantirEspaco(110)
    this.y += 48
    const intervalo = 30
    const largura = (this.largura - intervalo) / 2
    doc.setDrawColor(0)
    doc.setLineWidth(1)
    doc.line(this.margin, this.y, this.margin + largura, this.y)
    doc.line(this.margin + largura + intervalo, this.y, this.margin + this.largura, this.y)
    doc.setLineWidth(0.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(40, 40, 40)
    const esquerda: string[] = doc.splitTextToSize(`Técnico de campo: ${tecnico}`.trim(), largura)
    const direita: string[] = doc.splitTextToSize(
      `Responsável técnico: ${responsavel}`.trim(),
      largura,
    )
    doc.text(esquerda, this.margin, this.y + 14)
    doc.text(direita, this.margin + largura + intervalo, this.y + 14)
    doc.setTextColor(0)
    this.y += 14 + Math.max(esquerda.length, direita.length) * 12 + 8
  }
}

export interface ContextoPdfFormulario {
  doc: jsPDF
  margin: number
  primaria: RGB
  secundaria: RGB
  /** Token dos arquivos protegidos, renovado por quem chama. */
  tokenAtual: () => Promise<string>
  /** Como o nome do formulário aparece: título grande no meio da página, título
   *  de seção, ou nenhum (quando o documento já tem o nome no topo). */
  estiloTitulo?: 'pagina' | 'secao' | 'nenhum'
}

export interface FormularioParaPdf {
  registro: Formulario
  /** Campos com que o registro foi preenchido (cópia do modelo). */
  campos: CampoFormulario[]
  titulo: string
  /** Linha abaixo do título, por exemplo a vistoria de origem. */
  detalhe?: string
}

/** Campos do registro: a cópia guardada nele ou, sem ela, os do modelo. */
export const camposDoRegistro = (registro: Formulario): CampoFormulario[] =>
  Array.isArray(registro.campos_snapshot) && registro.campos_snapshot.length
    ? registro.campos_snapshot
    : registro.expand?.modelo_formulario_id?.campos || []

const TIPOS_SIMPLES = new Set([
  'texto',
  'texto_longo',
  'numero',
  'sim_nao',
  'selecao',
  'multipla',
  'data',
  'hora',
  'codigo',
  'url',
])

/** Desenha o formulário a partir de y e devolve o y onde terminou. */
export async function desenharFormularioNoPdf(
  ctx: ContextoPdfFormulario,
  item: FormularioParaPdf,
  yInicial: number,
): Promise<number> {
  const { doc, margin, primaria, tokenAtual } = ctx
  const ficha = new Ficha(doc, margin, primaria, yInicial)
  const dados = (item.registro.dados || {}) as Record<string, unknown>
  const estilo = ctx.estiloTitulo || 'secao'

  if (estilo === 'pagina') {
    ficha.tituloCentral(item.titulo, 16)
    ficha.y += 6
  } else if (estilo === 'secao') {
    ficha.secao(item.titulo, true, 13)
  }

  const dataCampo = item.registro.data_campo || item.registro.created
  ficha.nota(
    [
      dataCampo ? `Preenchido em ${formatBrazilianDate(dataCampo)}` : '',
      item.registro.status === 'concluido' ? '' : 'Rascunho (não concluído)',
      item.detalhe || '',
    ]
      .filter(Boolean)
      .join('  ·  '),
  )

  for (const campo of item.campos) {
    if (!campoVisivel(campo, dados)) continue
    const valor = dados[campo.id]

    if (campo.tipo === 'secao') {
      ficha.secao(campo.nome)
      continue
    }

    if (TIPOS_SIMPLES.has(campo.tipo)) {
      ficha.linhas([[campo.nome, valorEmTexto(campo, valor)]])
      continue
    }

    if (campo.tipo === 'calculo') {
      ficha.linhas([[`${campo.nome} (automático)`, calcularCampo(campo, dados) || '—']])
      continue
    }

    if (campo.tipo === 'calculo_tecnico') {
      const r = calcularTecnico(campo as unknown as CampoCalculoTecnico, dados)
      if (!r) continue
      if (r.faltando.length) {
        ficha.linhas([[campo.nome, `Cálculo incompleto. Falta: ${r.faltando.join('; ')}.`]])
        continue
      }
      ficha.secao(campo.nome)
      ficha.linhas(r.linhas.map(([rotulo, v]) => [String(rotulo), String(v)] as Linha))
      for (const c of r.conclusoes) ficha.destaque(c.texto, !!c.acima)
      for (const aviso of r.avisos) ficha.nota(`Observação: ${aviso}`, true)
      continue
    }

    if (campo.tipo === 'repetivel') {
      const instancias = normalizarInstancias(valor)
      const subcampos = campo.subcampos || []
      if (!instancias.length || !subcampos.length) {
        ficha.linhas([[campo.nome, 'Nenhum registro']])
        continue
      }
      ficha.secao(campo.nome)
      instancias.forEach((inst, i) => {
        // O primeiro campo de texto (ex.: código da amostra) identifica o bloco.
        const primeiro = subcampos.find((s) => s.tipo === 'texto' || s.tipo === 'codigo')
        const identificacao = primeiro ? String(inst[primeiro.id] ?? '').trim() : ''
        ficha.card(
          `${campo.nome} ${i + 1}${identificacao ? ` — ${identificacao}` : ''}`,
          subcampos.map(
            (s) =>
              [s.nome + (s.unidade ? ` (${s.unidade})` : ''), valorEmTexto(s, inst[s.id])] as Linha,
          ),
        )
      })
      continue
    }

    if (campo.tipo === 'foto') {
      const imagens: ImagemPdf[] = []
      for (const nome of listaArquivos(valor)) {
        const imagem = await carregarImagemComoDataUrl(
          urlAnexo(item.registro, nome, await tokenAtual()),
          { sempreJpeg: true },
        )
        if (imagem) imagens.push(imagem)
      }
      if (!imagens.length) {
        ficha.linhas([[campo.nome, 'Sem foto']])
        continue
      }
      ficha.fotos(campo.nome, imagens)
      continue
    }

    if (campo.tipo === 'assinatura') {
      const nome = listaArquivos(valor)[0]
      if (!nome) {
        ficha.linhas([[campo.nome, 'Sem assinatura']])
        continue
      }
      const imagem = await carregarImagemComoDataUrl(
        urlAnexo(item.registro, nome, await tokenAtual()),
        { maxDimensao: 600 },
      )
      ficha.garantirEspaco(90)
      ficha.y += 6
      if (imagem) {
        const altura = 50
        const largura = Math.min(200, altura * (imagem.largura / imagem.altura))
        doc.addImage(imagem.dataUrl, formatoDe(imagem), margin + 8, ficha.y, largura, altura)
        ficha.y += altura + 4
      }
      doc.setDrawColor(0)
      doc.line(margin + 8, ficha.y, margin + 208, ficha.y)
      ficha.y += 11
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(110, 110, 110)
      doc.text(campo.nome, margin + 8, ficha.y)
      doc.setTextColor(0)
      ficha.y += 18
      continue
    }
  }
  return ficha.y
}

interface DadosPdfFormularios {
  formularios: FormularioParaPdf[]
  empresa: { nome: string; cnpj?: string; endereco?: string }
  /** Título do documento (o nome do formulário, no PDF individual). */
  titulo: string
  /** Linhas a mais em "Dados Gerais", como a data da vistoria. */
  dadosGerais?: [string, string][]
  /** Nome (e registro) do responsável técnico, para a linha de assinatura. */
  responsavelTecnico?: string
}

/** Documento com um ou vários formulários preenchidos de uma empresa. */
export async function gerarPdfFormularios(d: DadosPdfFormularios): Promise<jsPDF> {
  const identidade = await carregarIdentidade()
  const primaria = hexParaRgb(identidade.corPrimaria, [71, 85, 105])
  const secundaria = hexParaRgb(identidade.corSecundaria, [30, 41, 59])
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 40
  const varios = d.formularios.length > 1

  const logoUrl = identidade.logoUrl || (ehOrganizacaoLabora(identidade.nome) ? laboraLogoUrl : '')
  const logo = await carregarImagemComoDataUrl(logoUrl, { maxDimensao: 300 })

  const ficha = new Ficha(doc, margin, primaria, margin)
  ficha.cabecalho({
    nome: identidade.nome,
    logo,
    tagline: ehOrganizacaoLabora(identidade.nome) ? TAGLINE_LABORA : undefined,
    titulo: d.titulo,
  })
  ficha.secao('Dados Gerais')
  const linhasGerais: Linha[] = [
    ['Empresa', d.empresa.nome],
    ['CNPJ', d.empresa.cnpj || '-'],
    ['Endereço', d.empresa.endereco || '-'],
    ...(d.dadosGerais || []),
  ]
  if (varios) linhasGerais.push(['Formulários', d.formularios.map((f) => f.titulo).join('; ')])
  ficha.linhas(linhasGerais)
  ficha.y += 8

  let token = ''
  let tokenEm = 0
  const tokenAtual = async () => {
    if (!token || Date.now() - tokenEm > 60_000) {
      try {
        token = await getTokenArquivos()
        tokenEm = Date.now()
      } catch {
        // sem token as fotos não carregam; o PDF sai sem elas
      }
    }
    return token
  }

  let y = ficha.y
  for (let i = 0; i < d.formularios.length; i++) {
    // Cada formulário começa numa página nova, a partir do segundo.
    if (i > 0) {
      doc.addPage()
      y = margin
    }
    y = await desenharFormularioNoPdf(
      { doc, margin, primaria, secundaria, tokenAtual, estiloTitulo: varios ? 'pagina' : 'nenhum' },
      d.formularios[i],
      y,
    )
  }

  ficha.y = y
  ficha.assinaturas('', d.responsavelTecnico || '')

  const dadosOrg = identidade.dados
  const linhaOrganizacao = [
    dadosOrg?.razao_social || identidade.nome,
    dadosOrg?.cnpj ? `CNPJ ${dadosOrg.cnpj}` : '',
    dadosOrg?.telefone || '',
    dadosOrg?.email || '',
  ]
    .filter(Boolean)
    .join('  ·  ')
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(140)
    if (linhaOrganizacao) {
      doc.text(linhaOrganizacao, pageWidth / 2, pageHeight - 30, { align: 'center' })
    }
    doc.text(
      `Gerado em ${new Date().toLocaleString('pt-BR')} — página ${i} de ${total}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' },
    )
    doc.setTextColor(0)
  }
  return doc
}

/** Nome de arquivo para o PDF de formulários. */
export const nomeArquivoFormularios = (empresa: string, titulo: string) => {
  const slug = (t: string) =>
    t
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  return `${slug(titulo) || 'formulario'}-${slug(empresa) || 'empresa'}.pdf`
}
