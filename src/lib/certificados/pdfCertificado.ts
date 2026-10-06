/* Certificado de treinamento (A4 paisagem, 2 páginas: frente + conteúdo
   programático). Um PDF por colaborador.
   A organização da Labora sai com a arte original da Labora. As demais saem
   com o mesmo desenho, nas cores e com o logo de Configurações > Identidade
   visual, para o certificado do cliente não levar a marca da Labora. */
import { jsPDF } from 'jspdf'

import {
  carregarIdentidade,
  ehOrganizacaoLabora,
  hexParaRgb,
  type RGB,
} from '@/lib/identidadeVisual'
import { sanitizarNomeArquivo } from './arquivos'
import { FUNDO_ALTURA_PT, FUNDO_FRENTE_SVG, FUNDO_LARGURA_PT, FUNDO_VERSO_SVG } from './fundos'
import { montarTexto, type Colaborador, type DadosLote } from './modelos'

const COR_TEXTO: RGB = [26, 32, 27]
const COR_CINZA: RGB = [80, 84, 82]
const COR_VERDE: RGB = [93, 135, 67]

const W = FUNDO_LARGURA_PT
const H = FUNDO_ALTURA_PT

// ---------------------------------------------------------------------------
// Marca do certificado: arte da Labora ou cores e logo da organização
// ---------------------------------------------------------------------------
export interface MarcaCertificado {
  nome: string
  corPrimaria: RGB
  corSecundaria: RGB
  /** Arte original da Labora (frente e verso). Só a organização da Labora usa. */
  arte: { frente: string; verso: string } | null
  logo: { png: string; proporcao: number } | null
}

const ESCALA_FUNDO = 3

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível carregar a arte do certificado.'))
    img.src = src
  })
}

function paraPng(img: HTMLImageElement, largura: number, altura: number, fundoBranco: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(largura)
  canvas.height = Math.round(altura)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível.')
  if (fundoBranco) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

async function svgParaPng(svg: string): Promise<string> {
  const img = await carregarImagem('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg))
  return paraPng(img, W * ESCALA_FUNDO, H * ESCALA_FUNDO, true)
}

// A arte da Labora vira PNG uma vez por sessão e é reaproveitada em todos os PDFs.
let arteEmCache: Promise<{ frente: string; verso: string }> | null = null

function carregarArteLabora() {
  if (!arteEmCache) {
    arteEmCache = Promise.all([svgParaPng(FUNDO_FRENTE_SVG), svgParaPng(FUNDO_VERSO_SVG)])
      .then(([frente, verso]) => ({ frente, verso }))
      .catch((e) => {
        arteEmCache = null
        throw e
      })
  }
  return arteEmCache
}

/** Logo da organização em PNG. Sem logo (ou se o arquivo falhar), o certificado sai sem ela. */
async function carregarLogo(url: string | null): Promise<MarcaCertificado['logo']> {
  if (!url) return null
  try {
    const resposta = await fetch(url)
    if (!resposta.ok) return null
    const blob = await resposta.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const leitor = new FileReader()
      leitor.onload = () => resolve(leitor.result as string)
      leitor.onerror = () => reject(new Error('Falha ao ler o logo.'))
      leitor.readAsDataURL(blob)
    })
    const img = await carregarImagem(dataUrl)
    if (!img.naturalWidth || !img.naturalHeight) return null
    const escala = Math.min(1, 800 / img.naturalWidth)
    return {
      png: paraPng(img, img.naturalWidth * escala, img.naturalHeight * escala, false),
      proporcao: img.naturalWidth / img.naturalHeight,
    }
  } catch {
    return null
  }
}

/** Carrega a marca da organização logada. Chamar uma vez por lote. */
export async function carregarMarca(): Promise<MarcaCertificado> {
  const identidade = await carregarIdentidade()
  if (ehOrganizacaoLabora(identidade.nome)) {
    return {
      nome: identidade.nome,
      corPrimaria: COR_VERDE,
      corSecundaria: COR_TEXTO,
      arte: await carregarArteLabora(),
      logo: null,
    }
  }
  return {
    nome: identidade.nome,
    corPrimaria: hexParaRgb(identidade.corPrimaria, COR_CINZA),
    corSecundaria: hexParaRgb(identidade.corSecundaria, COR_TEXTO),
    arte: null,
    logo: await carregarLogo(identidade.logoUrl),
  }
}

// ---------------------------------------------------------------------------
// Fundo das páginas
// ---------------------------------------------------------------------------
const FRENTE_CX = 420 // centro do título "CERTIFICADO" na arte
const VERSO_X = 247

/** Moldura e logo das organizações que não usam a arte da Labora. */
function fundoDaOrganizacao(doc: jsPDF, marca: MarcaCertificado, lado: 'frente' | 'verso') {
  const frente = lado === 'frente'
  doc.setFillColor(...marca.corSecundaria)
  doc.rect(0, 564.6, W, H - 564.6, 'F')
  doc.setFillColor(...marca.corPrimaria)
  doc.rect(0, 559.9, W, 4.7, 'F')
  doc.setFillColor(...marca.corSecundaria)
  doc.rect(frente ? 0 : W - 30.5, 0, 30.5, H, 'F')
  doc.setFillColor(...marca.corPrimaria)
  doc.rect(frente ? 30.1 : W - 34.8, 0, 4.7, 564.6, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...marca.corSecundaria)
  if (frente) {
    doc.setFontSize(43)
    doc.text('CERTIFICADO', FRENTE_CX, 69, { align: 'center' })
  } else {
    doc.setFontSize(20)
    doc.text(txt('CONTEÚDO PROGRAMÁTICO:'), VERSO_X, 68.5)
  }

  if (marca.logo) {
    const largura = Math.min(200, 44 * marca.logo.proporcao)
    const altura = largura / marca.logo.proporcao
    const x = frente ? 73 : W - 73 - largura
    doc.addImage(marca.logo.png, 'PNG', x, 528 - altura, largura, altura, 'logo', 'FAST')
  }
}

function fundo(doc: jsPDF, marca: MarcaCertificado, lado: 'frente' | 'verso') {
  if (marca.arte) doc.addImage(marca.arte[lado], 'PNG', 0, 0, W, H, `fundo-${lado}`, 'FAST')
  else fundoDaOrganizacao(doc, marca, lado)
}

// ---------------------------------------------------------------------------
// Utilitários de desenho
// ---------------------------------------------------------------------------
/** As fontes padrão do PDF só aceitam Latin-1: troca o que não existe nelas. */
function txt(s: string): string {
  return s
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/→/g, '->')
    .replace(/✓|✔/g, 'x')
    .replace(/–|—|−/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, '-')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
}

/** Reduz a fonte (em passos de 0,5 pt) até o texto caber na largura. Retorna o tamanho usado. */
function ajustarFonte(
  doc: jsPDF,
  texto: string,
  estilo: 'normal' | 'bold',
  tamanhoMax: number,
  larguraMax: number,
  tamanhoMin: number,
): number {
  doc.setFont('helvetica', estilo)
  let t = tamanhoMax
  doc.setFontSize(t)
  while (t > tamanhoMin && doc.getTextWidth(texto) > larguraMax) {
    t -= 0.5
    doc.setFontSize(t)
  }
  return t
}

/** Quebra o texto em linhas na largura dada; reduz a fonte até caber em `maxLinhas` (sem cortar texto). */
function quebrar(
  doc: jsPDF,
  texto: string,
  estilo: 'normal' | 'bold',
  tamanhoMax: number,
  tamanhoMin: number,
  largura: number,
  maxLinhas: number,
): { linhas: string[]; tamanho: number } {
  doc.setFont('helvetica', estilo)
  let t = tamanhoMax
  for (;;) {
    doc.setFontSize(t)
    const linhas: string[] = doc.splitTextToSize(texto, largura)
    if (linhas.length <= maxLinhas || t <= tamanhoMin) return { linhas, tamanho: t }
    t -= 0.5
  }
}

// ---------------------------------------------------------------------------
// Frente
// ---------------------------------------------------------------------------
const FRENTE_LARGURA_TEXTO = 580
const FRENTE_LARGURA_ASSINATURAS = 640

function desenharFrente(
  doc: jsPDF,
  marca: MarcaCertificado,
  lote: DadosLote,
  colabOriginal: Colaborador,
) {
  const colab: Colaborador = {
    ...colabOriginal,
    nome: colabOriginal.nome.trim().toLocaleUpperCase('pt-BR'),
  }

  // "NR 12" logo abaixo do título
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(...marca.corPrimaria)
  doc.text(`NR ${lote.nr}`, FRENTE_CX, 112, { align: 'center' })

  // nome do aluno em destaque
  const nome = txt(colab.nome)
  const tNome = ajustarFonte(doc, nome, 'bold', 32, FRENTE_LARGURA_TEXTO, 16)
  doc.setFontSize(tNome)
  doc.setTextColor(...COR_TEXTO)
  doc.text(nome, FRENTE_CX, 168, { align: 'center' })
  doc.setDrawColor(...marca.corPrimaria)
  doc.setLineWidth(2)
  doc.line(FRENTE_CX - 40, 182, FRENTE_CX + 40, 182)

  // texto do certificado (reduz a fonte se for longo)
  const texto = txt(montarTexto(lote, colab))
  let tamanho = 15
  let linhas: string[] = []
  let entrelinha = tamanho * 1.6
  for (;;) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(tamanho)
    linhas = doc.splitTextToSize(texto, FRENTE_LARGURA_TEXTO)
    entrelinha = tamanho * 1.6
    if (linhas.length * entrelinha <= 170 || tamanho <= 10) break
    tamanho -= 0.5
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(tamanho)
  doc.setTextColor(...COR_TEXTO)
  linhas.forEach((linha, i) => {
    doc.text(linha, FRENTE_CX, 222 + i * entrelinha, { align: 'center' })
  })

  // assinaturas: aluno + até 2 instrutores, distribuídos de forma igual
  const colunas: { nome: string; l1: string; l2: string }[] = [
    { nome: colab.nome, l1: colab.cpf.trim() ? `CPF: ${colab.cpf.trim()}` : '', l2: '' },
    ...lote.instrutores
      .filter((i) => i.nome.trim())
      .slice(0, 2)
      .map((i) => ({
        nome: i.nome.trim(),
        l1: i.qualificacao1.trim(),
        l2: i.qualificacao2.trim(),
      })),
  ]
  const gap = 36
  const larg = (FRENTE_LARGURA_ASSINATURAS - gap * (colunas.length - 1)) / colunas.length
  const x0 = FRENTE_CX - FRENTE_LARGURA_ASSINATURAS / 2
  const yLinha = 418 // o logo (canto inferior esquerdo) começa em y = 486
  colunas.forEach((c, i) => {
    const x = x0 + i * (larg + gap)
    const cx = x + larg / 2
    doc.setDrawColor(...COR_TEXTO)
    doc.setLineWidth(0.7)
    doc.line(x, yLinha, x + larg, yLinha)

    let y = yLinha + 15
    const escrever = (
      s: string,
      estilo: 'normal' | 'bold',
      tMax: number,
      tMin: number,
      cor: RGB,
    ) => {
      if (!s) return
      const { linhas: ls, tamanho: t } = quebrar(doc, txt(s), estilo, tMax, tMin, larg, 2)
      doc.setFont('helvetica', estilo)
      doc.setFontSize(t)
      doc.setTextColor(...cor)
      for (const l of ls) {
        doc.text(l, cx, y, { align: 'center' })
        y += t + 3
      }
    }
    escrever(c.nome, 'bold', 11, 7.5, COR_TEXTO)
    escrever(c.l1, 'normal', 9.5, 7, COR_CINZA)
    escrever(c.l2, 'normal', 9.5, 7, COR_CINZA)
  })
  doc.setTextColor(...COR_TEXTO)
}

// ---------------------------------------------------------------------------
// Verso (conteúdo programático)
// ---------------------------------------------------------------------------
// Largura da coluna útil do verso: o logo no rodapé direito começa por volta de x=580 e y=486.
const VERSO_LARGURA = 525
const VERSO_Y_INI = 96
// Limite inferior em 435 pt para manter respiro (~50 pt) antes do logo.
const VERSO_Y_FIM = 435

interface ItemConteudo {
  tipo: 'marcador' | 'sem-marcador'
  texto: string
}

function interpretarConteudo(conteudo: string): ItemConteudo[] {
  const itens: ItemConteudo[] = []
  for (const bruta of conteudo.split(/\r?\n/)) {
    const linha = bruta.trim()
    if (!linha) continue
    if (linha.startsWith('~')) {
      itens.push({ tipo: 'sem-marcador', texto: linha.replace(/^~\s*/, '') })
    } else if (/^([a-zA-Z]\)|[IVXLCivxlc]+[.)])\s/.test(linha)) {
      itens.push({ tipo: 'sem-marcador', texto: linha })
    } else {
      itens.push({ tipo: 'marcador', texto: linha })
    }
  }
  return itens
}

function medirConteudo(doc: jsPDF, itens: ItemConteudo[], tamanho: number) {
  const entrelinha = tamanho * 1.32
  // Espaçamento entre itens: comedido para manter boa legibilidade sem empurrar para o rodapé
  const espaco = Math.max(2.5, Math.min(5, tamanho * 0.38))
  // Recuo do texto com marcador (espaço para a bolinha)
  const recuoMarcador = Math.max(12, Math.round(tamanho * 1.15))
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(tamanho)
  let altura = 0
  const blocos = itens.map((it) => {
    const recuo = it.tipo === 'marcador' ? recuoMarcador : 0
    const linhas: string[] = doc.splitTextToSize(txt(it.texto), VERSO_LARGURA - recuo)
    altura += linhas.length * entrelinha + espaco
    return { ...it, linhas, recuo }
  })
  return {
    blocos,
    entrelinha,
    espaco,
    recuoMarcador,
    altura: itens.length > 0 ? altura - espaco : 0,
  }
}

function desenharVerso(doc: jsPDF, marca: MarcaCertificado, conteudo: string) {
  const itens = interpretarConteudo(conteudo)
  const disponivel = VERSO_Y_FIM - VERSO_Y_INI
  // Começa em 12 pt e encolhe até 8 pt só o necessário para terminar acima do logo.
  let tamanho = 12
  let medida = medirConteudo(doc, itens, tamanho)
  while (tamanho > 8 && medida.altura > disponivel) {
    tamanho -= 0.5
    medida = medirConteudo(doc, itens, tamanho)
  }

  const { blocos, entrelinha, espaco, recuoMarcador } = medida
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(tamanho)
  doc.setTextColor(...COR_TEXTO)
  let y = VERSO_Y_INI + tamanho * 0.8
  for (const b of blocos) {
    // Quebra de página apenas se nem na fonte mínima o bloco couber no espaço útil
    if (y + (b.linhas.length - 1) * entrelinha > VERSO_Y_FIM && y > VERSO_Y_INI + tamanho) {
      doc.addPage()
      fundo(doc, marca, 'verso')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(tamanho)
      doc.setTextColor(...COR_TEXTO)
      y = VERSO_Y_INI + tamanho * 0.8
    }
    if (b.tipo === 'marcador') {
      doc.setFillColor(...marca.corPrimaria)
      const raio = Math.max(1.2, tamanho * 0.15)
      const centroBolinhaX = VERSO_X + Math.max(3, recuoMarcador * 0.28)
      doc.circle(centroBolinhaX, y - tamanho * 0.28, raio, 'F')
    }
    b.linhas.forEach((linha, i) => {
      doc.text(linha, VERSO_X + b.recuo, y + i * entrelinha)
    })
    y += b.linhas.length * entrelinha + espaco
  }
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
export function gerarCertificadoPdf(
  lote: DadosLote,
  colab: Colaborador,
  marca: MarcaCertificado,
): Blob {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4', compress: true })
  doc.setProperties({
    title: txt(`Certificado NR ${lote.nr} - ${colab.nome.trim()}`),
    author: txt(marca.nome),
    creator: 'Labora Vistorias',
  })

  fundo(doc, marca, 'frente')
  desenharFrente(doc, marca, lote, colab)

  doc.addPage()
  fundo(doc, marca, 'verso')
  desenharVerso(doc, marca, lote.conteudo)

  return doc.output('blob')
}

export function nomeArquivoCertificado(nr: string, colab: Colaborador): string {
  const limpo = colab.nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
  return `Certificado_NR${nr}_${sanitizarNomeArquivo(limpo)}.pdf`
}
