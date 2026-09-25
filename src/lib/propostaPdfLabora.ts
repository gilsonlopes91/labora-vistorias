/* Layout "Labora completo": documento de cinco páginas, no desenho da proposta
 * original da Labora Engenharia e SST.
 *
 *   1  capa com logo, número da proposta, cliente e foto
 *   2  institucional: metodologia em quatro etapas, valores e portfólio
 *   3  escopo: dados do cliente, objeto, normas, incluso e não incluso
 *   4  investimento: tabela de valores, total, nota fiscal e dados bancários
 *   5  fechamento: condições, prazo, responsabilidade técnica e aceite
 *
 * Tudo que é da empresa (cores, logo, fotos, contato, CNPJ, banco, valores,
 * serviços e etapas) sai do modelo de proposta, não do código. Campo vazio
 * simplesmente não é desenhado. */
import { jsPDF } from 'jspdf'
import autoTablePlugin, { applyPlugin as autoTableApplyPlugin } from 'jspdf-autotable'

import type { Empresa } from '@/services/empresas'
import {
  isItemTreinamento,
  subtotalItem,
  type ItemServico,
  type ItemTreinamento,
  type Orcamento,
} from '@/services/orcamentos'
import {
  secaoAtiva,
  urlArquivoModelo,
  type DadosInstitucionais,
  type ModeloProposta,
} from '@/services/modelosProposta'
import { formatarDataCalendario } from '@/lib/date'

type RGB = [number, number, number]
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
  throw new Error('Não foi possível inicializar o gerador de tabelas')
}

const hexParaRgb = (hex: string | undefined, padrao: RGB): RGB => {
  if (!hex) return padrao
  const limpo = hex.replace('#', '').trim()
  if (limpo.length !== 6) return padrao
  const n = parseInt(limpo, 16)
  if (Number.isNaN(n)) return padrao
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Clareia uma cor para usar como fundo de caixa. */
const clarear = (cor: RGB, fator = 0.88): RGB => [
  Math.round(cor[0] + (255 - cor[0]) * fator),
  Math.round(cor[1] + (255 - cor[1]) * fator),
  Math.round(cor[2] + (255 - cor[2]) * fator),
]

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// Datas da proposta são dias de calendário (00:00 UTC): sem esse cuidado o
// PDF mostrava a véspera no fuso do Brasil.
const formatarData = (iso?: string) => formatarDataCalendario(iso)

async function carregarImagem(
  url: string | null,
): Promise<{ dataUrl: string; largura: number; altura: number } | null> {
  if (!url) return null
  try {
    const resposta = await fetch(url)
    if (!resposta.ok) return null
    const blob = await resposta.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('falha ao ler imagem'))
      reader.readAsDataURL(blob)
    })
    const dimensoes = await new Promise<{ largura: number; altura: number }>((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ largura: img.naturalWidth || 4, altura: img.naturalHeight || 3 })
      img.onerror = () => resolve({ largura: 4, altura: 3 })
      img.src = dataUrl
    })
    return { dataUrl, ...dimensoes }
  } catch {
    return null
  }
}

export interface DadosPropostaLabora {
  orcamento: Orcamento
  empresa?: Empresa
  modelo: ModeloProposta
  organizacaoNome: string
  logoOrganizacaoUrl?: string | null
}

export async function gerarPdfPropostaLabora(dados: DadosPropostaLabora): Promise<void> {
  const { orcamento, empresa, modelo, organizacaoNome } = dados
  const inst: DadosInstitucionais = modelo.dados_institucionais || {}

  const primaria = hexParaRgb(modelo.cor_primaria, [108, 136, 69])
  const escura = hexParaRgb(modelo.cor_secundaria, [61, 77, 39])
  const clara = clarear(primaria)
  const borda = clarear(primaria, 0.55)
  const textoEscuro: RGB = [28, 33, 39]
  const textoCorpo: RGB = [55, 65, 81]
  const textoFraco: RGB = [100, 116, 139]
  const fundoCartao: RGB = [252, 253, 250]

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const larguraPagina = doc.internal.pageSize.getWidth()
  const alturaPagina = doc.internal.pageSize.getHeight()
  const margem = 14
  const larguraUtil = larguraPagina - margem * 2

  const [logo, capa, fotoInstitucional, fotoServicos, fotoValores, fotoEncerramento] =
    await Promise.all([
      carregarImagem(urlArquivoModelo(modelo, 'logo') || dados.logoOrganizacaoUrl || null),
      carregarImagem(urlArquivoModelo(modelo, 'imagem_capa')),
      carregarImagem(urlArquivoModelo(modelo, 'imagem_institucional')),
      carregarImagem(urlArquivoModelo(modelo, 'imagem_servicos')),
      carregarImagem(urlArquivoModelo(modelo, 'imagem_valores')),
      carregarImagem(urlArquivoModelo(modelo, 'imagem_encerramento')),
    ])

  const nomeCliente = empresa?.nome_fantasia || empresa?.razao_social || 'Cliente'
  const docCliente = empresa?.cnpj || ''
  const contatoCliente = empresa?.contato_nome || empresa?.contato_email || ''
  const numero = orcamento.numero || ''
  const dataProposta = formatarData(orcamento.data_proposta)
  const validade = orcamento.validade_dias ? `${orcamento.validade_dias} dias` : ''

  // Cabeçalho das páginas internas: faixa escura com logo, título e badge.
  const cabecalhoInterno = (foto: typeof logo, categoria: string, titulo: string): number => {
    const topo = 16
    const altura = 28
    const fim = topo + altura

    doc.setFillColor(escura[0], escura[1], escura[2])
    doc.rect(0, topo, larguraPagina, altura, 'F')
    if (foto) {
      try {
        doc.addImage(foto.dataUrl, 'JPEG', 0, topo, larguraPagina, altura)
        // Camada da cor da marca por cima da foto, para o texto continuar legível.
        doc.setFillColor(escura[0], escura[1], escura[2])
        doc.rect(0, topo, larguraPagina, altura, 'F')
      } catch {
        // fundo já preenchido
      }
    }

    if (logo) {
      try {
        doc.addImage(logo.dataUrl, 'PNG', margem, 24, 15, 15)
      } catch {
        // sem logo
      }
    }

    const x = margem + (logo ? 19 : 0)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.text(organizacaoNome, x, 30)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(clara[0], clara[1], clara[2])
    doc.text(categoria.toUpperCase(), x, 35.5)

    if (numero) {
      const larguraBadge = 46
      const alturaBadge = 12.5
      const xBadge = larguraPagina - margem - larguraBadge
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(primaria[0], primaria[1], primaria[2])
      doc.setLineWidth(0.4)
      doc.roundedRect(xBadge, 25.2, larguraBadge, alturaBadge, 1.5, 1.5, 'FD')
      doc.setTextColor(escura[0], escura[1], escura[2])
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.text('PROPOSTA COMERCIAL', xBadge + larguraBadge / 2, 29.5, { align: 'center' })
      doc.setTextColor(primaria[0], primaria[1], primaria[2])
      doc.setFontSize(8.5)
      doc.text(numero, xBadge + larguraBadge / 2, 35, { align: 'center' })
    }

    doc.setFillColor(primaria[0], primaria[1], primaria[2])
    doc.rect(0, fim, larguraPagina, 2.5, 'F')

    const yTitulo = fim + 7
    doc.setTextColor(escura[0], escura[1], escura[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(titulo, margem, yTitulo + 4)
    doc.setDrawColor(borda[0], borda[1], borda[2])
    doc.setLineWidth(0.4)
    doc.line(margem, yTitulo + 7, larguraPagina - margem, yTitulo + 7)
    return yTitulo + 11.5
  }

  const rodapeInterno = (pagina: number, total: number) => {
    const y = alturaPagina - 12
    doc.setDrawColor(borda[0], borda[1], borda[2])
    doc.setLineWidth(0.3)
    doc.line(margem, y, larguraPagina - margem, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(textoFraco[0], textoFraco[1], textoFraco[2])
    const partes = [inst.razao_social || organizacaoNome]
    if (inst.cnpj) partes.push(`CNPJ ${inst.cnpj}`)
    if (inst.telefone) partes.push(inst.telefone)
    doc.text(partes.join('  ·  '), margem, y + 4.5)
    doc.text(`Página ${pagina} de ${total}`, larguraPagina - margem, y + 4.5, { align: 'right' })
  }

  const faixaTitulo = (y: number, texto: string): number => {
    doc.setFillColor(primaria[0], primaria[1], primaria[2])
    doc.roundedRect(margem, y, larguraUtil, 6, 1, 1, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(texto.toUpperCase(), margem + 3, y + 4.2)
    doc.setTextColor(0, 0, 0)
    return y + 8.5
  }

  // =====================================================================
  // 1. CAPA
  // =====================================================================
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, larguraPagina, alturaPagina, 'F')
  doc.setFillColor(primaria[0], primaria[1], primaria[2])
  doc.rect(0, 0, larguraPagina, 4, 'F')

  let y = 24
  if (logo) {
    const tamanho = 36
    try {
      doc.addImage(logo.dataUrl, 'PNG', (larguraPagina - tamanho) / 2, y, tamanho, tamanho)
    } catch {
      // sem logo
    }
    y += tamanho + 8
  } else {
    y += 10
  }

  doc.setTextColor(escura[0], escura[1], escura[2])
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(organizacaoNome.toUpperCase(), larguraPagina / 2, y, { align: 'center' })

  if (inst.tagline) {
    y += 6
    doc.setTextColor(primaria[0], primaria[1], primaria[2])
    doc.setFontSize(8.5)
    doc.text(inst.tagline, larguraPagina / 2, y, { align: 'center' })
  }
  if (inst.subtitulo) {
    y += 5
    doc.setTextColor(textoFraco[0], textoFraco[1], textoFraco[2])
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(inst.subtitulo, larguraPagina / 2, y, { align: 'center' })
  }

  y += 12
  const larguraCaixa = 140
  doc.setDrawColor(borda[0], borda[1], borda[2])
  doc.setLineWidth(0.4)
  doc.setFillColor(clara[0], clara[1], clara[2])
  doc.roundedRect((larguraPagina - larguraCaixa) / 2, y, larguraCaixa, 24, 2, 2, 'FD')
  doc.setTextColor(escura[0], escura[1], escura[2])
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('PROPOSTA COMERCIAL', larguraPagina / 2, y + 9, { align: 'center' })
  doc.setTextColor(primaria[0], primaria[1], primaria[2])
  doc.setFontSize(11)
  doc.text(numero ? `Nº ${numero}` : '', larguraPagina / 2, y + 16.5, { align: 'center' })

  y += 30
  doc.setTextColor(textoEscuro[0], textoEscuro[1], textoEscuro[2])
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Apresentada a: ${nomeCliente}`, larguraPagina / 2, y + 4, { align: 'center' })
  const linhaData = [
    dataProposta && `Emissão: ${dataProposta}`,
    validade && `Validade: ${validade}`,
  ]
    .filter(Boolean)
    .join('   |   ')
  if (linhaData) {
    doc.setFontSize(7.5)
    doc.setTextColor(textoFraco[0], textoFraco[1], textoFraco[2])
    doc.text(linhaData, larguraPagina / 2, y + 9, { align: 'center' })
  }

  const alturaRodape = 40
  const yFoto = 142
  const alturaFoto = alturaPagina - alturaRodape - yFoto
  if (capa) {
    try {
      doc.addImage(capa.dataUrl, 'JPEG', 0, yFoto, larguraPagina, alturaFoto)
    } catch {
      doc.setFillColor(clara[0], clara[1], clara[2])
      doc.rect(0, yFoto, larguraPagina, alturaFoto, 'F')
    }
  } else {
    doc.setFillColor(clara[0], clara[1], clara[2])
    doc.rect(0, yFoto, larguraPagina, alturaFoto, 'F')
  }

  const yRodape = alturaPagina - alturaRodape
  doc.setFillColor(primaria[0], primaria[1], primaria[2])
  doc.rect(0, yRodape, larguraPagina, alturaRodape, 'F')
  doc.setFillColor(escura[0], escura[1], escura[2])
  doc.rect(0, yRodape, larguraPagina, 1.5, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('CONTATO E ATENDIMENTO', margem, yRodape + 9)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  let yContato = yRodape + 15
  for (const linha of [
    inst.telefone && `Telefone: ${inst.telefone}`,
    inst.email && `E-mail: ${inst.email}`,
    inst.cnpj && `CNPJ: ${inst.cnpj}`,
    inst.razao_social || organizacaoNome,
  ].filter(Boolean) as string[]) {
    doc.text(linha, margem, yContato)
    yContato += 5
  }

  if (inst.lema) {
    const larguraLema = 75
    const xLema = larguraPagina - margem - larguraLema
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('NOSSO COMPROMISSO', xLema, yRodape + 9)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.text(doc.splitTextToSize(`"${inst.lema}"`, larguraLema), xLema, yRodape + 15)
  }

  // =====================================================================
  // 2. INSTITUCIONAL
  // =====================================================================
  doc.addPage()
  let y2 = cabecalhoInterno(
    fotoInstitucional,
    'Apresentação institucional',
    `Conheça a ${organizacaoNome}`,
  )

  const etapas = inst.etapas || []
  if (etapas.length) {
    doc.setTextColor(escura[0], escura[1], escura[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.text('COMO TRABALHAMOS', margem, y2)
    y2 += 4.5

    const largura = (larguraUtil - 3 * 3) / etapas.length
    const altura = 32
    etapas.forEach((etapa, i) => {
      const x = margem + i * (largura + 3)
      doc.setFillColor(fundoCartao[0], fundoCartao[1], fundoCartao[2])
      doc.setDrawColor(borda[0], borda[1], borda[2])
      doc.setLineWidth(0.3)
      doc.roundedRect(x, y2, largura, altura, 1.5, 1.5, 'FD')
      doc.setFillColor(primaria[0], primaria[1], primaria[2])
      doc.roundedRect(x, y2, largura, 3, 1, 1, 'F')

      doc.setFillColor(clara[0], clara[1], clara[2])
      doc.setDrawColor(primaria[0], primaria[1], primaria[2])
      doc.roundedRect(x + 2, y2 + 4.5, 7, 5, 0.8, 0.8, 'FD')
      doc.setTextColor(escura[0], escura[1], escura[2])
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.text(etapa.num, x + 5.5, y2 + 8, { align: 'center' })

      doc.setFontSize(7)
      doc.text(doc.splitTextToSize(etapa.titulo, largura - 11), x + 10.5, y2 + 8)
      doc.setTextColor(textoCorpo[0], textoCorpo[1], textoCorpo[2])
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.text(doc.splitTextToSize(etapa.desc, largura - 4), x + 2.5, y2 + 16)
    })
    y2 += altura + 8
  }

  const valores = inst.valores || []
  if (valores.length) {
    y2 = faixaTitulo(y2, 'Nossos valores')
    const largura = (larguraUtil - (valores.length - 1) * 3.5) / valores.length
    const altura = 24
    valores.forEach((valor, i) => {
      const x = margem + i * (largura + 3.5)
      doc.setFillColor(fundoCartao[0], fundoCartao[1], fundoCartao[2])
      doc.setDrawColor(borda[0], borda[1], borda[2])
      doc.setLineWidth(0.3)
      doc.roundedRect(x, y2, largura, altura, 1.5, 1.5, 'FD')
      doc.setFillColor(primaria[0], primaria[1], primaria[2])
      doc.rect(x, y2, 2, altura, 'F')
      doc.setTextColor(escura[0], escura[1], escura[2])
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text(valor.titulo, x + 4.5, y2 + 5.5)
      doc.setTextColor(textoCorpo[0], textoCorpo[1], textoCorpo[2])
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.text(doc.splitTextToSize(valor.desc, largura - 6.5), x + 4.5, y2 + 10.5)
    })
    y2 += altura + 8
  }

  const servicos = inst.servicos || []
  if (servicos.length) {
    y2 = faixaTitulo(y2, 'Portfólio de soluções e serviços')
    const metade = Math.ceil(servicos.length / 2)
    const colunas = [servicos.slice(0, metade), servicos.slice(metade)]
    const larguraColuna = (larguraUtil - 8) / 2
    const altura = Math.max(metade * 9.5 + 8, 30)

    doc.setFillColor(fundoCartao[0], fundoCartao[1], fundoCartao[2])
    doc.setDrawColor(borda[0], borda[1], borda[2])
    doc.setLineWidth(0.3)
    doc.roundedRect(margem, y2, larguraUtil, altura, 1.5, 1.5, 'FD')

    colunas.forEach((coluna, indiceColuna) => {
      let yItem = y2 + 5.5
      const xBolinha = indiceColuna === 0 ? margem + 5 : margem + larguraColuna + 8
      const xTexto = indiceColuna === 0 ? margem + 8 : margem + larguraColuna + 11
      for (const servico of coluna) {
        doc.setFillColor(primaria[0], primaria[1], primaria[2])
        doc.circle(xBolinha, yItem - 1, 1, 'F')
        doc.setTextColor(textoCorpo[0], textoCorpo[1], textoCorpo[2])
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        const linhas = doc.splitTextToSize(servico, larguraColuna - 8)
        doc.text(linhas, xTexto, yItem)
        yItem += Math.max(linhas.length * 3.4, 9.5)
      }
    })
  }
  rodapeInterno(2, 5)

  // =====================================================================
  // 3. ESCOPO
  // =====================================================================
  doc.addPage()
  let y3 = cabecalhoInterno(fotoServicos, 'Especificação técnica', 'Escopo e detalhamento')

  const alturaCartaoCliente = 27
  doc.setFillColor(fundoCartao[0], fundoCartao[1], fundoCartao[2])
  doc.setDrawColor(borda[0], borda[1], borda[2])
  doc.setLineWidth(0.35)
  doc.roundedRect(margem, y3, larguraUtil, alturaCartaoCliente, 1.5, 1.5, 'FD')
  doc.setFillColor(primaria[0], primaria[1], primaria[2])
  doc.rect(margem, y3, 2.5, alturaCartaoCliente, 'F')

  doc.setTextColor(escura[0], escura[1], escura[2])
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('DADOS DO CLIENTE', margem + 5, y3 + 5)
  doc.setFontSize(9)
  doc.setTextColor(textoEscuro[0], textoEscuro[1], textoEscuro[2])
  doc.text(nomeCliente.substring(0, 48), margem + 5, y3 + 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(textoCorpo[0], textoCorpo[1], textoCorpo[2])
  if (docCliente) doc.text(`CNPJ: ${docCliente}`, margem + 5, y3 + 15)
  if (contatoCliente) doc.text(`Contato: ${contatoCliente}`, margem + 5, y3 + 20)

  const xDireita = margem + larguraUtil - 68
  doc.setTextColor(escura[0], escura[1], escura[2])
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('DETALHES DA PROPOSTA', xDireita, y3 + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(textoCorpo[0], textoCorpo[1], textoCorpo[2])
  if (numero) doc.text(`Número: ${numero}`, xDireita, y3 + 10)
  if (linhaData) doc.text(linhaData, xDireita, y3 + 15)
  if (orcamento.responsavel_engenheiro) {
    doc.text(`Resp. técnico: ${orcamento.responsavel_engenheiro}`, xDireita, y3 + 20)
  }
  y3 += alturaCartaoCliente + 6

  if (secaoAtiva(modelo, 'objeto')) {
    y3 = faixaTitulo(y3, '1. Descrição e objetivo do serviço')
    doc.setTextColor(escura[0], escura[1], escura[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(doc.splitTextToSize(orcamento.titulo, larguraUtil - 4), margem + 2, y3 + 2)
    y3 += 6
    if (orcamento.descricao) {
      doc.setTextColor(textoCorpo[0], textoCorpo[1], textoCorpo[2])
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.8)
      const linhas = doc.splitTextToSize(orcamento.descricao, larguraUtil - 4)
      doc.text(linhas, margem + 2, y3)
      y3 += linhas.length * 3.8 + 4
    }
  }

  const normas = orcamento.normas_referencia || []
  if (secaoAtiva(modelo, 'normas_referencia') && normas.length) {
    y3 = faixaTitulo(y3, '2. Normas e legislações de referência')
    const texto = normas.map((n) => `• ${n}`).join('    |    ')
    const linhas = doc.splitTextToSize(texto, larguraUtil - 6)
    const altura = Math.max(linhas.length * 3.8 + 6, 12)
    doc.setFillColor(fundoCartao[0], fundoCartao[1], fundoCartao[2])
    doc.setDrawColor(borda[0], borda[1], borda[2])
    doc.setLineWidth(0.3)
    doc.roundedRect(margem, y3, larguraUtil, altura, 1.5, 1.5, 'FD')
    doc.setTextColor(textoCorpo[0], textoCorpo[1], textoCorpo[2])
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text(linhas, margem + 3, y3 + 5)
    y3 += altura + 5
  }

  const inclusos = secaoAtiva(modelo, 'itens_inclusos') ? orcamento.itens_inclusos || [] : []
  const exclusos = secaoAtiva(modelo, 'itens_exclusos') ? orcamento.itens_exclusos || [] : []
  if (inclusos.length || exclusos.length) {
    const larguraColuna = (larguraUtil - 4) / 2
    const maior = Math.max(inclusos.length, exclusos.length, 1)
    const altura = Math.min(Math.max(maior * 6 + 14, 38), 70)

    doc.setFillColor(242, 250, 242)
    doc.setDrawColor(185, 220, 185)
    doc.setLineWidth(0.35)
    doc.roundedRect(margem, y3, larguraColuna, altura, 1.5, 1.5, 'FD')
    doc.setFillColor(46, 125, 50)
    doc.roundedRect(margem, y3, larguraColuna, 5.5, 1, 1, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text('INCLUSO NA PROPOSTA', margem + 3, y3 + 3.8)
    let yIn = y3 + 9
    for (const item of inclusos) {
      doc.setTextColor(textoEscuro[0], textoEscuro[1], textoEscuro[2])
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      const linhas = doc.splitTextToSize(`• ${item}`, larguraColuna - 6)
      doc.text(linhas, margem + 3, yIn)
      yIn += linhas.length * 3.2 + 1.2
    }

    const xEx = margem + larguraColuna + 4
    doc.setFillColor(254, 242, 242)
    doc.setDrawColor(240, 190, 190)
    doc.roundedRect(xEx, y3, larguraColuna, altura, 1.5, 1.5, 'FD')
    doc.setFillColor(180, 40, 40)
    doc.roundedRect(xEx, y3, larguraColuna, 5.5, 1, 1, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text('NÃO ESTÁ INCLUSO', xEx + 3, y3 + 3.8)
    let yEx = y3 + 9
    for (const item of exclusos) {
      doc.setTextColor(textoEscuro[0], textoEscuro[1], textoEscuro[2])
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      const linhas = doc.splitTextToSize(`• ${item}`, larguraColuna - 6)
      doc.text(linhas, xEx + 3, yEx)
      yEx += linhas.length * 3.2 + 1.2
    }
  }
  rodapeInterno(3, 5)

  // =====================================================================
  // 4. INVESTIMENTO
  // =====================================================================
  doc.addPage()
  let y4 = cabecalhoInterno(
    fotoValores,
    'Investimento e condições',
    `Proposta de valores (${orcamento.tipo === 'treinamento' ? 'Treinamento' : 'Serviço'})`,
  )

  if (secaoAtiva(modelo, 'tabela_valores')) {
    const itens = orcamento.itens || []
    const ehTreinamento = orcamento.tipo === 'treinamento'
    const head = ehTreinamento
      ? [
          [
            'Item',
            'Treinamento',
            'Carga horária',
            'Participantes',
            'Turmas',
            'Unitário',
            'Subtotal',
          ],
        ]
      : [['Item', 'Descrição do serviço', 'Qtd.', 'Unidade', 'Valor unitário', 'Subtotal']]

    const body = itens.map((item, i) => {
      const ordem = String(i + 1).padStart(2, '0')
      if (isItemTreinamento(item)) {
        const it = item as ItemTreinamento
        return [
          ordem,
          it.nome,
          it.carga_horaria || '—',
          it.pessoas ? `${it.pessoas} part.` : '—',
          it.turmas ? `${it.turmas} turma(s)` : '1 turma',
          moeda.format(it.valor_unitario || 0),
          moeda.format(subtotalItem(item)),
        ]
      }
      const it = item as ItemServico
      return [
        ordem,
        it.descricao,
        String(it.quantidade ?? ''),
        it.unidade || '—',
        moeda.format(it.valor_unitario || 0),
        moeda.format(subtotalItem(item)),
      ]
    })

    const fim = executarAutoTable(doc, {
      startY: y4,
      head,
      body,
      margin: { left: margem, right: margem },
      theme: 'grid',
      headStyles: {
        fillColor: primaria,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: 2,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
        textColor: textoEscuro,
        lineColor: borda,
        lineWidth: 0.2,
        overflow: 'linebreak',
      },
      columnStyles: ehTreinamento
        ? {
            0: { halign: 'center', cellWidth: 10 },
            1: { cellWidth: 'auto' },
            2: { halign: 'center', cellWidth: 22 },
            3: { halign: 'center', cellWidth: 22 },
            4: { halign: 'center', cellWidth: 18 },
            5: { halign: 'right', cellWidth: 26 },
            6: { halign: 'right', cellWidth: 26, fontStyle: 'bold' },
          }
        : {
            0: { halign: 'center', cellWidth: 12 },
            1: { cellWidth: 'auto' },
            2: { halign: 'center', cellWidth: 15 },
            3: { halign: 'center', cellWidth: 20 },
            4: { halign: 'right', cellWidth: 32 },
            5: { halign: 'right', cellWidth: 32, fontStyle: 'bold' },
          },
      alternateRowStyles: { fillColor: [252, 254, 250] },
    })
    y4 = (fim || y4) + 6

    const entrada = orcamento.valor_entrada || 0
    const larguraTotal = 95
    const xTotal = larguraPagina - margem - larguraTotal
    const alturaTotal = entrada > 0 ? 22 : 16
    doc.setFillColor(clara[0], clara[1], clara[2])
    doc.setDrawColor(primaria[0], primaria[1], primaria[2])
    doc.setLineWidth(0.4)
    doc.roundedRect(xTotal, y4, larguraTotal, alturaTotal, 2, 2, 'FD')
    doc.setTextColor(escura[0], escura[1], escura[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text('INVESTIMENTO TOTAL:', xTotal + 4, y4 + 6)
    doc.setFontSize(13)
    doc.setTextColor(primaria[0], primaria[1], primaria[2])
    doc.text(moeda.format(orcamento.valor_total || 0), xTotal + larguraTotal - 4, y4 + 6.5, {
      align: 'right',
    })
    if (entrada > 0) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(textoFraco[0], textoFraco[1], textoFraco[2])
      doc.text(`Entrada: ${moeda.format(entrada)}`, xTotal + 4, y4 + 12.5)
      doc.text(
        `Saldo: ${moeda.format((orcamento.valor_total || 0) - entrada)}`,
        xTotal + 4,
        y4 + 17.5,
      )
    }
    y4 += alturaTotal + 8
  }

  // Nota fiscal
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(borda[0], borda[1], borda[2])
  doc.setLineWidth(0.3)
  doc.roundedRect(margem, y4, larguraUtil, 15, 1.5, 1.5, 'FD')
  doc.setTextColor(escura[0], escura[1], escura[2])
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text('NOTA SOBRE IMPOSTOS E EMISSÃO DE NOTA FISCAL', margem + 3, y4 + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(textoCorpo[0], textoCorpo[1], textoCorpo[2])
  doc.text(
    'Os valores acima são líquidos de impostos municipais e federais conforme a legislação vigente.',
    margem + 3,
    y4 + 8.5,
  )
  doc.text(
    'A nota fiscal de prestação de serviços é emitida após a aprovação da proposta ou conforme o cronograma de faturamento.',
    margem + 3,
    y4 + 12,
  )
  y4 += 23

  // Dados bancários
  const banco = inst.banco || {}
  const temBanco = !!(banco.instituicao || banco.pix || banco.conta)
  if (temBanco) {
    const altura = 34
    doc.setFillColor(clara[0], clara[1], clara[2])
    doc.setDrawColor(primaria[0], primaria[1], primaria[2])
    doc.setLineWidth(0.4)
    doc.roundedRect(margem, y4, larguraUtil, altura, 2, 2, 'FD')
    doc.setFillColor(primaria[0], primaria[1], primaria[2])
    doc.roundedRect(margem, y4, larguraUtil, 6, 1, 1, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('DADOS BANCÁRIOS PARA PAGAMENTO', margem + 3, y4 + 4.2)

    const x1 = margem + 5
    let yBanco = y4 + 11
    for (const [rotulo, valor] of [
      ['Favorecido:', banco.favorecido || inst.razao_social || organizacaoNome],
      ['Instituição:', banco.instituicao || ''],
      ['Agência:', banco.agencia || ''],
      ['Conta:', banco.conta || ''],
    ] as [string, string][]) {
      if (!valor) continue
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(escura[0], escura[1], escura[2])
      doc.text(rotulo, x1, yBanco)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(textoEscuro[0], textoEscuro[1], textoEscuro[2])
      doc.text(valor, x1 + 22, yBanco)
      yBanco += 5.5
    }

    if (banco.pix) {
      const x2 = margem + larguraUtil / 2 + 2
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(borda[0], borda[1], borda[2])
      doc.setLineWidth(0.3)
      doc.roundedRect(x2, y4 + 9, larguraUtil / 2 - 6, 20, 1.5, 1.5, 'FD')
      doc.setTextColor(escura[0], escura[1], escura[2])
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text('CHAVE PIX', x2 + 3, y4 + 14)
      doc.setTextColor(primaria[0], primaria[1], primaria[2])
      doc.setFontSize(10.5)
      doc.text(doc.splitTextToSize(banco.pix, larguraUtil / 2 - 12), x2 + 3, y4 + 20)
    }
  }
  rodapeInterno(4, 5)

  // =====================================================================
  // 5. FECHAMENTO
  // =====================================================================
  doc.addPage()
  let y5 = cabecalhoInterno(
    fotoEncerramento,
    'Fechamento e formalização',
    'Termos comerciais, responsabilidade e aceite',
  )

  const larguraBox = (larguraUtil - 4) / 2
  const alturaBox = 26

  doc.setFillColor(fundoCartao[0], fundoCartao[1], fundoCartao[2])
  doc.setDrawColor(borda[0], borda[1], borda[2])
  doc.setLineWidth(0.35)
  doc.roundedRect(margem, y5, larguraBox, alturaBox, 1.5, 1.5, 'FD')
  doc.setFillColor(primaria[0], primaria[1], primaria[2])
  doc.roundedRect(margem, y5, larguraBox, 5.5, 1, 1, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text('CONDIÇÕES DE PAGAMENTO', margem + 3, y5 + 3.8)
  doc.setTextColor(escura[0], escura[1], escura[2])
  doc.setFontSize(7.5)
  doc.text('Condição:', margem + 3, y5 + 10)
  doc.text('Forma:', margem + 3, y5 + 15)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(textoEscuro[0], textoEscuro[1], textoEscuro[2])
  doc.text(
    doc.splitTextToSize(orcamento.condicao_pagamento || '—', larguraBox - 24),
    margem + 20,
    y5 + 10,
  )
  doc.text(orcamento.forma_pagamento || '—', margem + 20, y5 + 15)

  const xPrazo = margem + larguraBox + 4
  doc.setFillColor(fundoCartao[0], fundoCartao[1], fundoCartao[2])
  doc.setDrawColor(borda[0], borda[1], borda[2])
  doc.roundedRect(xPrazo, y5, larguraBox, alturaBox, 1.5, 1.5, 'FD')
  doc.setFillColor(primaria[0], primaria[1], primaria[2])
  doc.roundedRect(xPrazo, y5, larguraBox, 5.5, 1, 1, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text('PRAZO DE EXECUÇÃO E ENTREGA', xPrazo + 3, y5 + 3.8)
  doc.setTextColor(escura[0], escura[1], escura[2])
  doc.text('Prazo estimado:', xPrazo + 3, y5 + 10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(textoEscuro[0], textoEscuro[1], textoEscuro[2])
  doc.text(doc.splitTextToSize(orcamento.prazo_entrega || '—', larguraBox - 6), xPrazo + 3, y5 + 15)
  y5 += alturaBox + 8

  if (secaoAtiva(modelo, 'responsavel_tecnico') && orcamento.responsavel_engenheiro) {
    const altura = 30
    doc.setFillColor(clara[0], clara[1], clara[2])
    doc.setDrawColor(primaria[0], primaria[1], primaria[2])
    doc.setLineWidth(0.4)
    doc.roundedRect(margem, y5, larguraUtil, altura, 2, 2, 'FD')
    doc.setFillColor(primaria[0], primaria[1], primaria[2])
    doc.roundedRect(margem, y5, larguraUtil, 5.5, 1, 1, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text('RESPONSABILIDADE TÉCNICA', margem + 3, y5 + 3.8)

    doc.setTextColor(escura[0], escura[1], escura[2])
    doc.setFontSize(8)
    doc.text(`Responsável: ${orcamento.responsavel_engenheiro}`, margem + 4, y5 + 11)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(textoCorpo[0], textoCorpo[1], textoCorpo[2])
    if (orcamento.crea) doc.text(`Registro profissional: ${orcamento.crea}`, margem + 4, y5 + 16)
    doc.text(
      doc.splitTextToSize(
        'Os laudos e programas acompanham anotação de responsabilidade técnica emitida junto ao respectivo conselho de classe.',
        larguraUtil - 8,
      ),
      margem + 4,
      y5 + 21,
    )
    const local = [inst.cidade_emissao, dataProposta].filter(Boolean).join(', ')
    if (local) doc.text(`Local e data de emissão: ${local}`, margem + 4, y5 + 27)
    y5 += altura + 10
  }

  if (secaoAtiva(modelo, 'encerramento') && modelo.texto_encerramento) {
    doc.setTextColor(textoCorpo[0], textoCorpo[1], textoCorpo[2])
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    const linhas = doc.splitTextToSize(modelo.texto_encerramento, larguraUtil)
    doc.text(linhas, margem, y5)
    y5 += linhas.length * 3.8 + 8
  }

  if (secaoAtiva(modelo, 'assinatura')) {
    doc.setTextColor(escura[0], escura[1], escura[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('TERMO DE ACEITE DA PROPOSTA', margem, y5)
    y5 += 4

    const alturaAssinatura = 46
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(borda[0], borda[1], borda[2])
    doc.setLineWidth(0.35)
    doc.roundedRect(margem, y5, larguraUtil, alturaAssinatura, 2, 2, 'FD')

    const larguraLinha = 68
    const xProponente = margem + 12
    const xCliente = larguraPagina - margem - larguraLinha - 12
    const yLinha = y5 + 24

    doc.setDrawColor(escura[0], escura[1], escura[2])
    doc.setLineWidth(0.4)
    doc.line(xProponente, yLinha, xProponente + larguraLinha, yLinha)
    doc.line(xCliente, yLinha, xCliente + larguraLinha, yLinha)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(escura[0], escura[1], escura[2])
    doc.text(
      orcamento.responsavel_engenheiro || organizacaoNome,
      xProponente + larguraLinha / 2,
      yLinha + 4.5,
      {
        align: 'center',
      },
    )
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(textoFraco[0], textoFraco[1], textoFraco[2])
    if (orcamento.crea) {
      doc.text(orcamento.crea, xProponente + larguraLinha / 2, yLinha + 8.5, { align: 'center' })
    }
    doc.text(inst.razao_social || organizacaoNome, xProponente + larguraLinha / 2, yLinha + 12, {
      align: 'center',
    })
    if (inst.cnpj) {
      doc.text(`CNPJ: ${inst.cnpj}`, xProponente + larguraLinha / 2, yLinha + 15.5, {
        align: 'center',
      })
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(textoEscuro[0], textoEscuro[1], textoEscuro[2])
    doc.text(nomeCliente.substring(0, 32), xCliente + larguraLinha / 2, yLinha + 4.5, {
      align: 'center',
    })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(textoFraco[0], textoFraco[1], textoFraco[2])
    if (docCliente) {
      doc.text(`CNPJ: ${docCliente}`, xCliente + larguraLinha / 2, yLinha + 8.5, {
        align: 'center',
      })
    }
    doc.text('De acordo com a proposta comercial', xCliente + larguraLinha / 2, yLinha + 12, {
      align: 'center',
    })
    doc.text('Data: _____/_____/_________', xCliente + larguraLinha / 2, yLinha + 15.5, {
      align: 'center',
    })
  }
  rodapeInterno(5, 5)

  const slug = (texto: string) =>
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

  doc.save(
    `proposta-${(numero || 's-n').replace(/\//g, '-')}-${slug(nomeCliente) || 'cliente'}.pdf`,
  )
}
