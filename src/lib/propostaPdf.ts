/* Gera o PDF da proposta comercial. O desenho vem do modelo escolhido:
 * cores, logo, imagem de capa, textos e quais seções entram no documento.
 *
 * Três layouts, com a mesma informação por baixo:
 *   classico    capa com faixa, títulos sublinhados, tabela com bordas
 *   moderno     capa colorida inteira, títulos em bloco, tabela zebrada
 *   minimalista sem capa, títulos em versalete, tabela sem linhas
 */
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
  COR_PRIMARIA_PADRAO,
  COR_SECUNDARIA_PADRAO,
  type ModeloProposta,
} from '@/services/modelosProposta'
import { gerarPdfPropostaLabora } from '@/lib/propostaPdfLabora'

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

const hexParaRgb = (hex?: string, padrao: RGB = [108, 136, 69]): RGB => {
  if (!hex) return padrao
  const limpo = hex.replace('#', '').trim()
  if (limpo.length !== 6) return padrao
  const n = parseInt(limpo, 16)
  if (Number.isNaN(n)) return padrao
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const formatarData = (iso?: string) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return ''
  }
}

interface ImagemCarregada {
  dataUrl: string
  largura: number
  altura: number
}

async function carregarImagem(url: string | null): Promise<ImagemCarregada | null> {
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

export interface DadosProposta {
  orcamento: Orcamento
  empresa?: Empresa
  modelo: ModeloProposta | null
  organizacaoNome: string
  /** Logo da organização, usada quando o modelo não tem logo própria. */
  logoOrganizacaoUrl?: string | null
}

export async function gerarPdfProposta(dados: DadosProposta): Promise<void> {
  const { orcamento, empresa, modelo, organizacaoNome } = dados

  // O layout "labora" é um documento de cinco páginas com estrutura própria,
  // então tem gerador separado.
  if (modelo?.layout === 'labora') {
    return gerarPdfPropostaLabora({
      orcamento,
      empresa,
      modelo,
      organizacaoNome,
      logoOrganizacaoUrl: dados.logoOrganizacaoUrl,
    })
  }

  const layout = modelo?.layout || 'classico'
  const primaria = hexParaRgb(modelo?.cor_primaria, hexParaRgb(COR_PRIMARIA_PADRAO))
  const secundaria = hexParaRgb(modelo?.cor_secundaria, hexParaRgb(COR_SECUNDARIA_PADRAO))

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const larguraPagina = doc.internal.pageSize.getWidth()
  const alturaPagina = doc.internal.pageSize.getHeight()
  const margem = layout === 'minimalista' ? 56 : 44
  const larguraUtil = larguraPagina - margem * 2
  let y = margem

  const logo = await carregarImagem(
    (modelo ? urlArquivoModelo(modelo, 'logo') : null) || dados.logoOrganizacaoUrl || null,
  )
  const capa = await carregarImagem(modelo ? urlArquivoModelo(modelo, 'imagem_capa') : null)

  const nomeCliente = empresa?.nome_fantasia || empresa?.razao_social || 'Cliente'

  const novaPaginaSePreciso = (espaco: number) => {
    if (y + espaco > alturaPagina - 70) {
      doc.addPage()
      y = margem
    }
  }

  const desenharLogo = (x: number, topo: number, altura: number) => {
    if (!logo) return 0
    const largura = altura * (logo.largura / logo.altura)
    doc.addImage(logo.dataUrl, 'PNG', x, topo, largura, altura)
    return largura
  }

  // Título de seção, no desenho de cada layout.
  const titulo = (texto: string) => {
    novaPaginaSePreciso(60)
    if (layout === 'moderno') {
      doc.setFillColor(primaria[0], primaria[1], primaria[2])
      doc.roundedRect(margem, y - 12, larguraUtil, 24, 4, 4, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(255, 255, 255)
      doc.text(texto.toUpperCase(), margem + 10, y + 4)
      doc.setTextColor(0, 0, 0)
      y += 32
      return
    }
    if (layout === 'minimalista') {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
      doc.text(texto.toUpperCase(), margem, y, { charSpace: 1.6 })
      doc.setTextColor(0, 0, 0)
      y += 18
      return
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
    doc.text(texto, margem, y)
    doc.setDrawColor(primaria[0], primaria[1], primaria[2])
    doc.setLineWidth(1.5)
    doc.line(margem, y + 5, margem + 56, y + 5)
    doc.setLineWidth(0.5)
    doc.setTextColor(0, 0, 0)
    y += 24
  }

  const paragrafo = (texto?: string, tamanho = 10) => {
    if (!texto) return
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(tamanho)
    doc.setTextColor(40, 40, 40)
    const linhas = doc.splitTextToSize(texto, larguraUtil)
    novaPaginaSePreciso(linhas.length * (tamanho + 4))
    doc.text(linhas, margem, y)
    y += linhas.length * (tamanho + 4) + 8
    doc.setTextColor(0, 0, 0)
  }

  const listaComMarcador = (itens: string[], cor: RGB) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    for (const item of itens) {
      const linhas = doc.splitTextToSize(item, larguraUtil - 16)
      novaPaginaSePreciso(linhas.length * 14 + 4)
      doc.setFillColor(cor[0], cor[1], cor[2])
      doc.circle(margem + 3, y - 3, 2, 'F')
      doc.setTextColor(40, 40, 40)
      doc.text(linhas, margem + 14, y)
      y += linhas.length * 14 + 2
    }
    doc.setTextColor(0, 0, 0)
    y += 8
  }

  // ----- Capa -----
  if (secaoAtiva(modelo, 'capa')) {
    if (layout === 'moderno') {
      doc.setFillColor(primaria[0], primaria[1], primaria[2])
      doc.rect(0, 0, larguraPagina, alturaPagina, 'F')
      if (capa) {
        const alturaImagem = alturaPagina * 0.42
        const largura = alturaImagem * (capa.largura / capa.altura)
        doc.addImage(
          capa.dataUrl,
          'JPEG',
          (larguraPagina - Math.max(largura, larguraPagina)) / 2,
          alturaPagina - alturaImagem,
          Math.max(largura, larguraPagina),
          alturaImagem,
        )
      }
      if (logo) desenharLogo(margem, margem + 10, 44)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(34)
      doc.text('Proposta', margem, alturaPagina * 0.4)
      doc.text('comercial', margem, alturaPagina * 0.4 + 38)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(13)
      doc.text(nomeCliente, margem, alturaPagina * 0.4 + 74)
      doc.setFontSize(10)
      doc.text(
        `${orcamento.numero || ''}   ${formatarData(orcamento.data_proposta)}`,
        margem,
        alturaPagina * 0.4 + 94,
      )
      doc.setTextColor(0, 0, 0)
      doc.addPage()
      y = margem
    } else if (layout === 'classico') {
      doc.setFillColor(primaria[0], primaria[1], primaria[2])
      doc.rect(0, 0, larguraPagina, 12, 'F')
      if (logo) desenharLogo(margem, margem + 20, 50)
      y = margem + 130
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(26)
      doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
      doc.text('PROPOSTA COMERCIAL', margem, y)
      y += 14
      doc.setDrawColor(primaria[0], primaria[1], primaria[2])
      doc.setLineWidth(2)
      doc.line(margem, y, margem + 180, y)
      doc.setLineWidth(0.5)
      y += 40
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.setTextColor(60, 60, 60)
      doc.text(`Cliente: ${nomeCliente}`, margem, y)
      y += 18
      if (empresa?.cnpj) {
        doc.text(`CNPJ: ${empresa.cnpj}`, margem, y)
        y += 18
      }
      doc.text(`Proposta nº ${orcamento.numero || ''}`, margem, y)
      y += 18
      if (orcamento.data_proposta) {
        doc.text(`Data: ${formatarData(orcamento.data_proposta)}`, margem, y)
        y += 18
      }
      if (capa) {
        const alturaImagem = 210
        const largura = Math.min(larguraUtil, alturaImagem * (capa.largura / capa.altura))
        doc.addImage(
          capa.dataUrl,
          'JPEG',
          margem,
          alturaPagina - alturaImagem - 70,
          largura,
          alturaImagem,
        )
      }
      doc.setTextColor(0, 0, 0)
      doc.addPage()
      y = margem
    }
  }

  // Cabeçalho das páginas internas quando não houve capa.
  if (!secaoAtiva(modelo, 'capa')) {
    if (logo) {
      const largura = desenharLogo(margem, y, 34)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(120)
      doc.text(organizacaoNome, margem + largura + 12, y + 20)
      doc.setTextColor(0)
      y += 52
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
    doc.text('Proposta comercial', margem, y)
    doc.setTextColor(0)
    y += 20
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(110)
    doc.text(
      `${nomeCliente}   ·   ${orcamento.numero || ''}   ·   ${formatarData(orcamento.data_proposta)}`,
      margem,
      y,
    )
    doc.setTextColor(0)
    y += 28
  }

  // ----- Apresentação -----
  if (secaoAtiva(modelo, 'apresentacao') && modelo?.texto_apresentacao) {
    titulo('Apresentação')
    paragrafo(modelo.texto_apresentacao)
  }

  // ----- Objeto -----
  if (secaoAtiva(modelo, 'objeto')) {
    titulo('Objeto da proposta')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    const linhasTitulo = doc.splitTextToSize(orcamento.titulo, larguraUtil)
    novaPaginaSePreciso(linhasTitulo.length * 16)
    doc.text(linhasTitulo, margem, y)
    y += linhasTitulo.length * 16 + 6
    paragrafo(orcamento.descricao)
  }

  // ----- Normas de referência -----
  const normas = orcamento.normas_referencia || []
  if (secaoAtiva(modelo, 'normas_referencia') && normas.length) {
    titulo('Normas de referência')
    listaComMarcador(normas, primaria)
  }

  // ----- Itens inclusos e exclusos -----
  const inclusos = orcamento.itens_inclusos || []
  if (secaoAtiva(modelo, 'itens_inclusos') && inclusos.length) {
    titulo('O que está incluso')
    listaComMarcador(inclusos, primaria)
  }

  const exclusos = orcamento.itens_exclusos || []
  if (secaoAtiva(modelo, 'itens_exclusos') && exclusos.length) {
    titulo('O que não está incluso')
    listaComMarcador(exclusos, [190, 70, 70])
  }

  // ----- Tabela de valores -----
  if (secaoAtiva(modelo, 'tabela_valores')) {
    titulo('Valores')
    const itens = orcamento.itens || []
    const ehTreinamento = orcamento.tipo === 'treinamento'

    const head = ehTreinamento
      ? [['Treinamento', 'Carga horária', 'Pessoas', 'Turmas', 'Valor unit.', 'Subtotal']]
      : [['Descrição', 'Qtd.', 'Un.', 'Valor unit.', 'Subtotal']]

    const body = itens.map((item) => {
      if (isItemTreinamento(item)) {
        const it = item as ItemTreinamento
        return [
          it.nome,
          it.carga_horaria,
          String(it.pessoas ?? ''),
          String(it.turmas ?? ''),
          moeda.format(it.valor_unitario || 0),
          moeda.format(subtotalItem(item)),
        ]
      }
      const it = item as ItemServico
      return [
        it.descricao,
        String(it.quantidade ?? ''),
        it.unidade || '',
        moeda.format(it.valor_unitario || 0),
        moeda.format(subtotalItem(item)),
      ]
    })

    const tema = layout === 'minimalista' ? 'plain' : layout === 'moderno' ? 'striped' : 'grid'
    const finalY = executarAutoTable(doc, {
      startY: y,
      head,
      body,
      theme: tema,
      styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak' },
      headStyles:
        layout === 'minimalista'
          ? {
              fillColor: [255, 255, 255],
              textColor: [70, 70, 70],
              fontStyle: 'bold',
              lineWidth: { bottom: 1 },
              lineColor: secundaria,
            }
          : { fillColor: primaria, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: layout === 'moderno' ? { fillColor: [246, 248, 243] } : undefined,
      columnStyles: ehTreinamento
        ? {
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right' },
          }
        : {
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' },
          },
      margin: { left: margem, right: margem },
    })
    y = (finalY || y) + 16

    // Total em destaque
    novaPaginaSePreciso(60)
    const alturaCaixa = 34
    if (layout === 'minimalista') {
      doc.setDrawColor(secundaria[0], secundaria[1], secundaria[2])
      doc.setLineWidth(1)
      doc.line(larguraPagina - margem - 220, y, larguraPagina - margem, y)
      doc.setLineWidth(0.5)
      y += 20
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('Valor total', larguraPagina - margem - 220, y)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      doc.text(moeda.format(orcamento.valor_total || 0), larguraPagina - margem, y, {
        align: 'right',
      })
      y += 28
    } else {
      doc.setFillColor(primaria[0], primaria[1], primaria[2])
      doc.roundedRect(larguraPagina - margem - 230, y, 230, alturaCaixa, 4, 4, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('VALOR TOTAL', larguraPagina - margem - 218, y + 14)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text(moeda.format(orcamento.valor_total || 0), larguraPagina - margem - 12, y + 25, {
        align: 'right',
      })
      doc.setTextColor(0, 0, 0)
      y += alturaCaixa + 18
    }

    if (orcamento.valor_entrada) {
      paragrafo(`Entrada de ${moeda.format(orcamento.valor_entrada)}.`, 9)
    }
  }

  // ----- Condições comerciais -----
  const condicoes: string[][] = []
  if (secaoAtiva(modelo, 'condicoes_pagamento') && orcamento.condicao_pagamento) {
    condicoes.push(['Condição de pagamento', orcamento.condicao_pagamento])
  }
  if (secaoAtiva(modelo, 'condicoes_pagamento') && orcamento.forma_pagamento) {
    condicoes.push(['Forma de pagamento', orcamento.forma_pagamento])
  }
  if (secaoAtiva(modelo, 'prazo_entrega') && orcamento.prazo_entrega) {
    condicoes.push(['Prazo de entrega', orcamento.prazo_entrega])
  }
  if (secaoAtiva(modelo, 'validade') && orcamento.validade_dias) {
    const texto = orcamento.data_proposta
      ? (() => {
          const venc = new Date(orcamento.data_proposta)
          venc.setDate(venc.getDate() + (orcamento.validade_dias || 0))
          return `${orcamento.validade_dias} dias, até ${venc.toLocaleDateString('pt-BR')}`
        })()
      : `${orcamento.validade_dias} dias`
    condicoes.push(['Validade da proposta', texto])
  }

  if (condicoes.length) {
    titulo('Condições comerciais')
    const finalY = executarAutoTable(doc, {
      startY: y,
      body: condicoes,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 170 } },
      margin: { left: margem, right: margem },
    })
    y = (finalY || y) + 18
  }

  // ----- Responsável técnico -----
  if (secaoAtiva(modelo, 'responsavel_tecnico') && orcamento.responsavel_engenheiro) {
    titulo('Responsável técnico')
    paragrafo(
      orcamento.crea
        ? `${orcamento.responsavel_engenheiro} (${orcamento.crea})`
        : orcamento.responsavel_engenheiro,
    )
  }

  // ----- Encerramento -----
  if (secaoAtiva(modelo, 'encerramento') && modelo?.texto_encerramento) {
    titulo('Considerações finais')
    paragrafo(modelo.texto_encerramento)
  }

  // ----- Assinatura -----
  if (secaoAtiva(modelo, 'assinatura')) {
    novaPaginaSePreciso(120)
    y += 30
    const larguraLinha = (larguraUtil - 40) / 2
    doc.setDrawColor(120)
    doc.line(margem, y, margem + larguraLinha, y)
    doc.line(margem + larguraLinha + 40, y, margem + larguraUtil, y)
    y += 14
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(90)
    doc.text(organizacaoNome, margem, y)
    doc.text(nomeCliente, margem + larguraLinha + 40, y)
    y += 12
    doc.setFontSize(8)
    doc.setTextColor(140)
    doc.text('Proponente', margem, y)
    doc.text('Aceite do cliente', margem + larguraLinha + 40, y)
    doc.setTextColor(0)
  }

  // ----- Rodapé -----
  const totalPaginas = doc.getNumberOfPages()
  const temCapa = secaoAtiva(modelo, 'capa') && layout !== 'minimalista'
  for (let i = 1; i <= totalPaginas; i++) {
    if (temCapa && i === 1) continue
    doc.setPage(i)
    doc.setFontSize(7.5)
    doc.setTextColor(150)
    doc.text(
      `${organizacaoNome}   ·   Proposta ${orcamento.numero || ''}${orcamento.versao ? ' ' + orcamento.versao : ''}`,
      margem,
      alturaPagina - 24,
    )
    doc.text(`${i} de ${totalPaginas}`, larguraPagina - margem, alturaPagina - 24, {
      align: 'right',
    })
    doc.setTextColor(0)
  }

  const slug = (texto: string) =>
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

  doc.save(
    `proposta-${(orcamento.numero || 's-n').replace(/\//g, '-')}-${slug(nomeCliente) || 'cliente'}.pdf`,
  )
}
