/* PDF dos documentos gerados a partir dos Modelos Gerais Labora (PGR, LTCAT,
 * laudos NR-15 e NR-16). Recebe o documento já renderizado
 * (src/lib/modelosSst/renderizar.ts) — capa, seções com parágrafos, listas e
 * tabelas, campos substituídos — e o desenha com jsPDF + autoTable, nas
 * mesmas convenções visuais de gerarPdfPgr.ts: capa com identidade visual,
 * página de identificação, sumário com número de página, um capítulo por
 * página, tabelas largas em paisagem, assinatura eletrônica e rodapé. */
import { jsPDF } from 'jspdf'
import autoTablePlugin, { applyPlugin as autoTableApplyPlugin } from 'jspdf-autotable'

import {
  clarear,
  hexParaRgb,
  COR_PRIMARIA_LABORA,
  COR_SECUNDARIA_LABORA,
  type RGB,
} from '@/lib/identidadeVisual'
import type { AssinaturaEletronica } from '@/lib/gerarPdfPgr'
import { urlLogoEmpresa } from '@/services/empresas'
import type { DadosDocumento } from '@/lib/modelosSst/dados'
import type { DocumentoRenderizado, ElRender, Run } from '@/lib/modelosSst/renderizar'

type AutoTableFn = (doc: jsPDF, options: Record<string, unknown>) => void

function executarAutoTable(doc: jsPDF, options: Record<string, unknown>): number {
  try {
    if (typeof autoTableApplyPlugin === 'function') autoTableApplyPlugin(jsPDF)
  } catch {
    // já aplicado
  }
  const docAny = doc as unknown as {
    autoTable?: (options: Record<string, unknown>) => unknown
    lastAutoTable?: { finalY?: number }
  }
  if (typeof docAny.autoTable === 'function') {
    docAny.autoTable(options)
    return docAny.lastAutoTable?.finalY ?? (typeof options.startY === 'number' ? options.startY : 0)
  }
  let fn: unknown = autoTablePlugin
  if (
    typeof fn !== 'function' &&
    fn &&
    typeof (fn as { default?: unknown }).default === 'function'
  ) {
    fn = (fn as { default: unknown }).default
  }
  if (typeof fn === 'function') {
    ;(fn as AutoTableFn)(doc, options)
    return docAny.lastAutoTable?.finalY ?? (typeof options.startY === 'number' ? options.startY : 0)
  }
  throw new Error('Não foi possível inicializar o gerador de tabelas (autoTable não disponível)')
}

export interface OpcoesPdfModelo {
  renderizado: DocumentoRenderizado
  dados: DadosDocumento
  titulo: string
  versao: number
  dataEmissao: Date
  assinatura?: AssinaturaEletronica
}

// ---------- imagens ----------

async function carregarImagemComoDataUrl(url: string): Promise<string | null> {
  try {
    const resposta = await fetch(url)
    if (!resposta.ok) return null
    const blob = await resposta.blob()
    return await new Promise<string>((resolve, reject) => {
      const leitor = new FileReader()
      leitor.onload = () => resolve(leitor.result as string)
      leitor.onerror = () => reject(leitor.error)
      leitor.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function dimensoesImagem(dataUrl: string): Promise<{ largura: number; altura: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ largura: img.naturalWidth || 1, altura: img.naturalHeight || 1 })
    img.onerror = () => reject(new Error('Não foi possível ler a imagem'))
    img.src = dataUrl
  })
}

function desenharPadraoCapa(doc: jsPDF, pageWidth: number, pageHeight: number, cor: RGB) {
  const fugaX = pageWidth * 0.78
  const fugaY = pageHeight * 0.64
  const nLinhas = 26
  doc.setDrawColor(cor[0], cor[1], cor[2])
  doc.setLineWidth(0.6)
  for (let i = 0; i < nLinhas; i++) {
    const t = i / (nLinhas - 1)
    doc.line(fugaX, fugaY, -pageWidth * 0.15 + t * pageWidth * 1.3, pageHeight)
    doc.line(fugaX, fugaY, pageWidth, fugaY + t * (pageHeight - fugaY))
  }
}

// ---------- layout ----------

const MARGEM = 42
const ALTURA_LINHA = 12.5
const TAM_TEXTO = 9.5

interface Estado {
  doc: jsPDF
  y: number
  paisagem: boolean
  primaria: RGB
  secundaria: RGB
  cabecalho: string
  /** Páginas que recebem cabeçalho e rodapé (todas menos a capa). */
  numeroCapa: number
}

const larguraPagina = (e: Estado) => e.doc.internal.pageSize.getWidth()
const alturaPagina = (e: Estado) => e.doc.internal.pageSize.getHeight()
const larguraUtil = (e: Estado) => larguraPagina(e) - MARGEM * 2
const limiteInferior = (e: Estado) => alturaPagina(e) - 52

function novaPagina(e: Estado, paisagem = false) {
  e.doc.addPage('a4', paisagem ? 'landscape' : 'portrait')
  e.paisagem = paisagem
  e.y = MARGEM + 14
}

function garantirEspaco(e: Estado, altura: number) {
  if (e.y + altura > limiteInferior(e)) novaPagina(e, false)
}

/** Quebra uma sequência de runs (negrito/itálico) em linhas e escreve. */
function escreverRuns(e: Estado, runs: Run[], recuo = 0, marcador?: string) {
  const doc = e.doc
  const xInicial = MARGEM + recuo
  const largura = larguraUtil(e) - recuo
  type Palavra = {
    texto: string
    negrito?: boolean
    italico?: boolean
    largura: number
    quebra?: boolean
  }
  const palavras: Palavra[] = []
  const fonteDe = (r: { negrito?: boolean; italico?: boolean }) =>
    r.negrito && r.italico ? 'bolditalic' : r.negrito ? 'bold' : r.italico ? 'italic' : 'normal'
  doc.setFontSize(TAM_TEXTO)
  for (const r of runs) {
    const partes = r.texto.split('\n')
    partes.forEach((parte, idx) => {
      if (idx > 0) palavras.push({ texto: '', largura: 0, quebra: true })
      doc.setFont('helvetica', fonteDe(r))
      for (const palavra of parte.split(/(\s+)/)) {
        if (!palavra) continue
        palavras.push({
          texto: palavra,
          negrito: r.negrito,
          italico: r.italico,
          largura: doc.getTextWidth(palavra),
        })
      }
    })
  }
  let linha: Palavra[] = []
  let larguraLinha = 0
  let linhasEscritas = 0
  const descarregar = () => {
    // remove espaços nas pontas
    while (linha.length && /^\s+$/.test(linha[0].texto)) linha.shift()
    while (linha.length && /^\s+$/.test(linha[linha.length - 1].texto)) linha.pop()
    garantirEspaco(e, ALTURA_LINHA)
    let x = xInicial
    if (marcador !== undefined && linhasEscritas === 0) {
      doc.setFont('helvetica', 'normal')
      doc.text(marcador, xInicial - 10, e.y)
    }
    linhasEscritas++
    for (const p of linha) {
      doc.setFont('helvetica', fonteDe(p))
      doc.text(p.texto, x, e.y)
      x += p.largura
    }
    e.y += ALTURA_LINHA
    linha = []
    larguraLinha = 0
  }
  for (const p of palavras) {
    if (p.quebra) {
      descarregar()
      continue
    }
    if (larguraLinha + p.largura > largura && linha.length > 0) {
      descarregar()
    }
    linha.push(p)
    larguraLinha += p.largura
  }
  if (linha.length) {
    descarregar()
  }
  doc.setFont('helvetica', 'normal')
}

function escreverTitulo(e: Estado, texto: string, nivel: 1 | 2 | 3) {
  const tamanho = nivel === 1 ? 15 : nivel === 2 ? 12.5 : 10.5
  garantirEspaco(e, tamanho + 14)
  e.y += nivel === 3 ? 4 : 8
  e.doc.setFont('helvetica', 'bold')
  e.doc.setFontSize(tamanho)
  e.doc.setTextColor(e.secundaria[0], e.secundaria[1], e.secundaria[2])
  const linhas = e.doc.splitTextToSize(texto, larguraUtil(e)) as string[]
  for (const l of linhas) {
    e.doc.text(l, MARGEM, e.y)
    e.y += tamanho + 3
  }
  e.doc.setTextColor(0, 0, 0)
  e.doc.setFont('helvetica', 'normal')
  e.doc.setFontSize(TAM_TEXTO)
  e.y += 2
}

function escreverTabela(e: Estado, el: Extract<ElRender, { tipo: 'tabela' }>) {
  const doc = e.doc
  if (el.excluido) return
  if (el.titulo) {
    garantirEspaco(e, 20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(e.primaria[0], e.primaria[1], e.primaria[2])
    doc.text(el.titulo, MARGEM, e.y)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    e.y += 10
  }
  if (el.linhas.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(90, 90, 90)
    const aviso = el.manual
      ? 'Bloco a ser preenchido pelo responsável técnico — sem origem automática no sistema nesta versão.'
      : 'Não há registros para este bloco neste levantamento.'
    const linhas = doc.splitTextToSize(aviso, larguraUtil(e)) as string[]
    for (const l of linhas) {
      garantirEspaco(e, ALTURA_LINHA)
      doc.text(l, MARGEM, e.y)
      e.y += ALTURA_LINHA
    }
    if (el.observacao) {
      for (const l of doc.splitTextToSize(
        `Observação: ${el.observacao}`,
        larguraUtil(e),
      ) as string[]) {
        garantirEspaco(e, ALTURA_LINHA)
        doc.text(l, MARGEM, e.y)
        e.y += ALTURA_LINHA
      }
    }
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(TAM_TEXTO)
    e.y += 6
    return
  }
  const colunas = Math.max(el.cabecalho.length, ...el.linhas.map((l) => l.length))
  const precisaPaisagem = colunas > 6
  if (precisaPaisagem && !e.paisagem) {
    novaPagina(e, true)
    if (el.titulo) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(e.primaria[0], e.primaria[1], e.primaria[2])
      doc.text(el.titulo, MARGEM, e.y)
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
      e.y += 10
    }
  } else {
    garantirEspaco(e, 60)
  }
  const fonte = colunas > 8 ? 6.5 : colunas > 5 ? 7.5 : 8.5
  const temCabecalho = el.cabecalho.length > 0
  const yFinal = executarAutoTable(doc, {
    startY: e.y,
    theme: 'grid',
    styles: { fontSize: fonte, cellPadding: 3, valign: 'top', overflow: 'linebreak' },
    head: temCabecalho ? [el.cabecalho] : [],
    body: el.linhas,
    headStyles: { fillColor: e.primaria, textColor: 255, fontStyle: 'bold' },
    margin: { left: MARGEM, right: MARGEM, top: MARGEM + 14, bottom: 56 },
    tableWidth: 'auto',
  })
  e.y = yFinal + 8
  if (el.observacao) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    for (const l of doc.splitTextToSize(
      `Observação: ${el.observacao}`,
      larguraUtil(e),
    ) as string[]) {
      garantirEspaco(e, ALTURA_LINHA)
      doc.text(l, MARGEM, e.y)
      e.y += ALTURA_LINHA
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(TAM_TEXTO)
  }
  if (precisaPaisagem) {
    // volta ao retrato para o texto seguinte
    novaPagina(e, false)
  } else {
    e.y += 4
  }
}

function escreverElemento(e: Estado, el: ElRender) {
  switch (el.tipo) {
    case 'titulo':
      escreverTitulo(e, el.texto, el.nivel)
      return
    case 'paragrafo':
      escreverRuns(e, el.runs)
      e.y += 4
      return
    case 'lista':
      for (const item of el.itens) escreverRuns(e, item, 14, '•')
      e.y += 4
      return
    case 'tabela':
      escreverTabela(e, el)
      return
  }
}

// ---------- capa e identificação ----------

async function desenharCapa(e: Estado, op: OpcoesPdfModelo) {
  const doc = e.doc
  const pageWidth = larguraPagina(e)
  const pageHeight = alturaPagina(e)
  const centroX = pageWidth / 2
  const { organizacao, empresa } = op.dados

  doc.setFillColor(238, 238, 238)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')
  desenharPadraoCapa(doc, pageWidth, pageHeight, clarear(e.primaria, 0.15))

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(52)
  doc.setTextColor(30, 30, 30)
  doc.text(op.renderizado.modelo.sigla, centroX, 130, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(15)
  doc.setTextColor(e.primaria[0], e.primaria[1], e.primaria[2])
  const linhasTitulo = doc.splitTextToSize(
    op.renderizado.modelo.titulo,
    pageWidth - 120,
  ) as string[]
  let yTitulo = 155
  for (const l of linhasTitulo) {
    doc.text(l, centroX, yTitulo, { align: 'center' })
    yTitulo += 18
  }

  let y = Math.max(250, yTitulo + 40)
  const logoClienteUrl = urlLogoEmpresa(empresa)
  const logoCliente = logoClienteUrl ? await carregarImagemComoDataUrl(logoClienteUrl) : null
  if (logoCliente) {
    try {
      const { largura, altura } = await dimensoesImagem(logoCliente)
      const escala = Math.min(180 / largura, 100 / altura, 1)
      const w = largura * escala
      const h = altura * escala
      doc.addImage(logoCliente, centroX - w / 2, y, w, h)
      y += h + 24
    } catch {
      y += 20
    }
  } else {
    y += 20
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(20, 20, 20)
  doc.text(empresa.nome_fantasia || empresa.razao_social, centroX, y, { align: 'center' })
  y += 16
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  if (empresa.cnpj) {
    doc.text(`CNPJ ${empresa.cnpj}`, centroX, y, { align: 'center' })
    y += 13
  }
  doc.text(
    `Versão ${op.versao} · Início da vigência: ${op.dataEmissao.toLocaleDateString('pt-BR')}`,
    centroX,
    y,
    { align: 'center' },
  )
  y += 13
  if (op.renderizado.campos.DATA_REVISAO_ATE) {
    doc.text(`Revisar até: ${op.renderizado.campos.DATA_REVISAO_ATE}`, centroX, y, {
      align: 'center',
    })
  }

  const logoOrg = organizacao.logoUrl ? await carregarImagemComoDataUrl(organizacao.logoUrl) : null
  const nomeOrg = organizacao.dados?.razao_social || organizacao.nome
  if (logoOrg) {
    try {
      const { largura, altura } = await dimensoesImagem(logoOrg)
      const escala = Math.min(140 / largura, 60 / altura, 1)
      const w = largura * escala
      const h = altura * escala
      doc.addImage(logoOrg, centroX - w / 2, pageHeight - 90, w, h)
    } catch {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(e.secundaria[0], e.secundaria[1], e.secundaria[2])
      doc.text(nomeOrg, centroX, pageHeight - 60, { align: 'center' })
    }
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(e.secundaria[0], e.secundaria[1], e.secundaria[2])
    doc.text(nomeOrg, centroX, pageHeight - 60, { align: 'center' })
  }
  doc.setTextColor(0, 0, 0)
}

function desenharIdentificacao(e: Estado, op: OpcoesPdfModelo) {
  novaPagina(e, false)
  escreverTitulo(e, op.renderizado.modelo.titulo, 1)
  for (const el of op.renderizado.capa) {
    if (el.tipo === 'titulo') continue
    if (el.tipo === 'tabela') {
      escreverTabela(e, { ...el, titulo: undefined })
    } else {
      escreverElemento(e, el)
    }
  }
}

// ---------- principal ----------

export async function gerarPdfModeloSst(op: OpcoesPdfModelo): Promise<jsPDF> {
  const { organizacao, empresa } = op.dados
  const primaria = hexParaRgb(
    organizacao.corPrimaria,
    hexParaRgb(COR_PRIMARIA_LABORA, [108, 136, 69]),
  )
  const secundaria = hexParaRgb(
    organizacao.corSecundaria,
    hexParaRgb(COR_SECUNDARIA_LABORA, [32, 39, 32]),
  )
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const e: Estado = {
    doc,
    y: MARGEM,
    paisagem: false,
    primaria,
    secundaria,
    cabecalho: `${op.titulo} · ${empresa.nome_fantasia || empresa.razao_social} · versão ${op.versao}`,
    numeroCapa: 1,
  }

  await desenharCapa(e, op)
  desenharIdentificacao(e, op)

  // Sumário: reserva as páginas agora e preenche depois, com os números certos.
  const secoes = op.renderizado.secoes
  const paginasSumario = Math.max(1, Math.ceil((secoes.length + 2) / 38))
  const primeiraPaginaSumario = doc.getNumberOfPages() + 1
  for (let i = 0; i < paginasSumario; i++) novaPagina(e, false)

  const inicioSecao: { titulo: string; pagina: number }[] = []
  for (const secao of secoes) {
    novaPagina(e, false)
    inicioSecao.push({ titulo: secao.titulo, pagina: doc.getNumberOfPages() })
    escreverTitulo(e, secao.titulo, 2)
    for (const el of secao.elementos) escreverElemento(e, el)
  }

  // Assinatura eletrônica
  if (op.assinatura) {
    if (e.paisagem) novaPagina(e, false)
    garantirEspaco(e, 90)
    e.y += 10
    doc.setDrawColor(primaria[0], primaria[1], primaria[2])
    doc.line(MARGEM, e.y, larguraPagina(e) - MARGEM, e.y)
    e.y += 18
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
    doc.text('Assinatura eletrônica', MARGEM, e.y)
    e.y += 15
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.text(
      `${op.assinatura.nome}${op.assinatura.registro ? ` — ${op.assinatura.registro}` : ''}`,
      MARGEM,
      e.y,
    )
    e.y += 13
    doc.text(
      `Identidade confirmada por senha em ${op.assinatura.confirmadaEm.toLocaleString('pt-BR')}`,
      MARGEM,
      e.y,
    )
    e.y += 13
    doc.setTextColor(60, 90, 200)
    doc.textWithLink(`Verificar autenticidade: ${op.assinatura.linkVerificacao}`, MARGEM, e.y, {
      url: op.assinatura.linkVerificacao,
    })
    doc.setTextColor(0, 0, 0)
  }

  // Preenche o sumário
  const total = doc.getNumberOfPages()
  doc.setPage(primeiraPaginaSumario)
  e.paisagem = false
  e.y = MARGEM + 14
  escreverTitulo(e, 'Sumário', 2)
  doc.setFontSize(TAM_TEXTO)
  let paginaAtualSumario = primeiraPaginaSumario
  for (const item of inicioSecao) {
    if (e.y + ALTURA_LINHA > limiteInferior(e)) {
      paginaAtualSumario++
      if (paginaAtualSumario < primeiraPaginaSumario + paginasSumario) {
        doc.setPage(paginaAtualSumario)
        e.y = MARGEM + 14
      } else {
        break
      }
    }
    const numero = String(item.pagina)
    const larguraNumero = doc.getTextWidth(numero)
    const xNumero = larguraPagina(e) - MARGEM
    const linhasTitulo = doc.splitTextToSize(
      item.titulo,
      larguraUtil(e) - larguraNumero - 30,
    ) as string[]
    doc.text(linhasTitulo[0], MARGEM, e.y)
    const larguraTitulo = doc.getTextWidth(linhasTitulo[0])
    const inicioPontos = MARGEM + larguraTitulo + 4
    const fimPontos = xNumero - larguraNumero - 4
    if (fimPontos > inicioPontos) {
      const ponto = doc.getTextWidth('.')
      const n = Math.floor((fimPontos - inicioPontos) / ponto)
      doc.setTextColor(150, 150, 150)
      doc.text('.'.repeat(Math.max(0, n)), inicioPontos, e.y)
      doc.setTextColor(0, 0, 0)
    }
    doc.text(numero, xNumero, e.y, { align: 'right' })
    e.y += ALTURA_LINHA
    for (const extra of linhasTitulo.slice(1)) {
      doc.text(extra, MARGEM + 12, e.y)
      e.y += ALTURA_LINHA
    }
  }

  // Cabeçalho e rodapé em todas as páginas menos a capa
  const dadosOrg = organizacao.dados
  const linhaOrganizacao = [
    dadosOrg?.razao_social || organizacao.nome,
    dadosOrg?.cnpj ? `CNPJ ${dadosOrg.cnpj}` : '',
  ]
    .filter(Boolean)
    .join('  ·  ')
  for (let i = 2; i <= total; i++) {
    doc.setPage(i)
    const w = doc.internal.pageSize.getWidth()
    const h = doc.internal.pageSize.getHeight()
    doc.setFillColor(primaria[0], primaria[1], primaria[2])
    doc.rect(0, 0, w, 6, 'F')
    doc.setFontSize(7.5)
    doc.setTextColor(120)
    doc.text(e.cabecalho, MARGEM, 22)
    doc.setFontSize(7)
    doc.setTextColor(140)
    if (linhaOrganizacao) doc.text(linhaOrganizacao, w / 2, h - 30, { align: 'center' })
    doc.text(
      `${op.assinatura ? 'Documento assinado eletronicamente · ' : ''}Emitido em ${op.dataEmissao.toLocaleDateString('pt-BR')} — página ${i} de ${total}`,
      w / 2,
      h - 20,
      { align: 'center' },
    )
    doc.setTextColor(0)
  }

  return doc
}
