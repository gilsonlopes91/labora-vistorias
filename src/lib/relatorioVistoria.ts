/* Gera o PDF do laudo de vistoria — resumo executivo, itens agrupados por
 * seção (com fotos já com marca d'água) e assinatura do responsável técnico.
 * Roda inteiramente no navegador (jsPDF), sem precisar de backend. */
import { jsPDF } from 'jspdf'
import autoTablePlugin, { applyPlugin as autoTableApplyPlugin } from 'jspdf-autotable'

import { formatBrazilianDate } from '@/lib/date'
import type { Vistoria } from '@/services/vistorias'
import type { ItemChecklist } from '@/services/itensChecklist'
import { fotoUrl, type RespostaVistoria, type Situacao } from '@/services/respostasVistoria'

type AutoTableFn = (doc: jsPDF, options: Record<string, unknown>) => void

function executarAutoTable(doc: jsPDF, options: Record<string, unknown>): number {
  try {
    if (typeof autoTableApplyPlugin === 'function') {
      autoTableApplyPlugin(jsPDF)
    }
  } catch {
    // ignora se já tiver sido aplicado
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

export interface ResumoVistoria {
  conforme: number
  naoConforme: number
  naoAplica: number
  semResposta: number
  multaMin: number
  multaMax: number
}

/** Regime de cálculo de multa da NR-28 aplicado a cada item (ver migration 0095). */
export type RegimeMultaItem = 'anexo_i' | 'anexo_ia_portuario' | 'rural_art18'

export interface DadosRelatorioVistoria {
  vistoria: Vistoria
  empresaNome: string
  empresaCnpj?: string
  empresaEndereco?: string
  tipoNome: string
  tipoNrReferencia?: string
  organizacaoNome: string
  logoUrl: string
  itens: ItemChecklist[]
  respostas: Record<string, RespostaVistoria>
  resumo: ResumoVistoria
  /** Regime de cada item, por id. Sem isso o laudo não sabe de qual anexo saiu o valor. */
  regimePorItem?: Record<string, RegimeMultaItem>
  /** Valor por empregado do critério rural, conforme a base legal escolhida na vistoria. */
  valorRuralPorEmpregado?: number
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const COR_SITUACAO: Record<Situacao, [number, number, number]> = {
  C: [16, 122, 79],
  'N/C': [180, 40, 40],
  'N/A': [120, 120, 120],
}

interface ImagemCarregada {
  dataUrl: string
  largura: number
  altura: number
}

// Limite para embutir imagens no PDF — imagens maiores que isso são
// redimensionadas antes. Sem isso, um PNG de alta resolução (ex.: logo
// 4167px) entra inteiro no PDF e o laudo sai com dezenas de MB. 600px é
// ~3x a maior exibição no laudo (foto ~210pt), suficiente para nitidez.
const MAX_DIMENSAO_IMAGEM_PDF = 600

async function carregarImagemComoDataUrl(url: string): Promise<ImagemCarregada | null> {
  try {
    const resposta = await fetch(url)
    if (!resposta.ok) return null
    const blob = await resposta.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Falha ao ler imagem'))
      reader.readAsDataURL(blob)
    })
    const dimensoes = await new Promise<{ largura: number; altura: number }>((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ largura: img.naturalWidth || 4, altura: img.naturalHeight || 3 })
      img.onerror = () => resolve({ largura: 4, altura: 3 })
      img.src = dataUrl
    })

    // Redimensiona imagens grandes (logo/foto em alta resolução) antes de
    // embutir no PDF — evita laudos com dezenas de MB. PNG continua PNG
    // (preserva transparência da logo); os demais viram JPEG.
    const maiorDimensao = Math.max(dimensoes.largura, dimensoes.altura)
    if (maiorDimensao > MAX_DIMENSAO_IMAGEM_PDF) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const imagem = new Image()
          imagem.onload = () => resolve(imagem)
          imagem.onerror = () => reject(new Error('Falha ao decodificar imagem'))
          imagem.src = dataUrl
        })
        const escala = MAX_DIMENSAO_IMAGEM_PDF / maiorDimensao
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(dimensoes.largura * escala)
        canvas.height = Math.round(dimensoes.altura * escala)
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const tipoSaida = blob.type === 'image/png' ? 'image/png' : 'image/jpeg'
          const redimensionado = canvas.toDataURL(
            tipoSaida,
            tipoSaida === 'image/jpeg' ? 0.85 : undefined,
          )
          return { dataUrl: redimensionado, largura: canvas.width, altura: canvas.height }
        }
      } catch {
        // falha ao redimensionar — segue com a imagem original
      }
    }

    return { dataUrl, ...dimensoes }
  } catch {
    return null
  }
}

export async function gerarPdfVistoria(dados: DadosRelatorioVistoria): Promise<void> {
  // Regime de cada item. Fallback para laudos gerados por chamadas antigas,
  // sem o mapa: código de ementa 231xxx = NR-31 (rural).
  const regimeDoItem = (item: ItemChecklist): RegimeMultaItem =>
    dados.regimePorItem?.[item.id] ||
    (item.codigo && item.codigo.startsWith('231') ? 'rural_art18' : 'anexo_i')

  const valorRural = dados.valorRuralPorEmpregado ?? 392.89

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 40
  const larguraUtil = pageWidth - margin * 2
  // Coluna da direita, reservada pra situação (C/N/C/N/A) e valor de multa —
  // fica alinhada em todos os itens, em vez de aparecer solta dentro do texto.
  const larguraColunaValores = 130
  const larguraColunaDescricao = larguraUtil - larguraColunaValores - 12
  const xColunaValores = margin + larguraColunaDescricao + 12
  let y = margin

  // Cabeçalho: logo da organização + nome + título do documento
  const logo = await carregarImagemComoDataUrl(dados.logoUrl)
  if (logo) {
    const alturaLogo = 38
    const larguraLogo = alturaLogo * (logo.largura / logo.altura)
    doc.addImage(logo.dataUrl, 'PNG', margin, y, larguraLogo, alturaLogo)
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(dados.organizacaoNome, pageWidth - margin, y + 14, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Laudo de Vistoria de Segurança do Trabalho', pageWidth - margin, y + 28, {
    align: 'right',
  })
  y += 52
  doc.setDrawColor(200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 22

  // Título do tipo de vistoria — evita repetir "NR-01 — NR-01 — ..." quando o
  // nome do tipo já começa com a própria referência da norma.
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  const nomeTipoJaTemReferencia =
    !!dados.tipoNrReferencia &&
    dados.tipoNome.trim().toLowerCase().startsWith(dados.tipoNrReferencia.trim().toLowerCase())
  const titulo =
    dados.tipoNrReferencia && !nomeTipoJaTemReferencia
      ? `${dados.tipoNrReferencia} — ${dados.tipoNome}`
      : dados.tipoNome || 'Laudo de Vistoria SST'
  const linhasTitulo = doc.splitTextToSize(titulo, larguraUtil)
  doc.text(linhasTitulo, margin, y)
  y += linhasTitulo.length * 17 + 6

  // Dados gerais
  const dataAgendada = dados.vistoria.data_agendada
    ? formatBrazilianDate(dados.vistoria.data_agendada)
    : '-'
  const finalYDadosGerais = executarAutoTable(doc, {
    startY: y,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 110 } },
    body: [
      ['Empresa', dados.empresaNome],
      ['CNPJ', dados.empresaCnpj || '-'],
      ['Endereço', dados.empresaEndereco || '-'],
      ['Data da vistoria', dataAgendada],
    ],
    margin: { left: margin, right: margin },
  })
  y = (finalYDadosGerais || y) + 18

  // Resumo executivo
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Resumo', margin, y)
  y += 4

  const finalYResumo = executarAutoTable(doc, {
    startY: y + 6,
    head: [['Conforme', 'Não conforme', 'Não se aplica', 'Sem resposta']],
    body: [
      [
        String(dados.resumo.conforme),
        String(dados.resumo.naoConforme),
        String(dados.resumo.naoAplica),
        String(dados.resumo.semResposta),
      ],
    ],
    theme: 'grid',
    styles: { halign: 'center', fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [70, 100, 70] },
    margin: { left: margin, right: margin },
  })
  y = (finalYResumo || y) + 16

  if (dados.resumo.naoConforme > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(180, 40, 40)
    doc.text(
      `Estimativa de multa: ${currency.format(dados.resumo.multaMin)} a ${currency.format(dados.resumo.multaMax)}`,
      margin,
      y,
    )
    doc.setTextColor(0, 0, 0)
    y += 13
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)

    // A nota de rodapé do resumo tem que refletir os regimes realmente
    // presentes na vistoria — afirmar "Anexo I" numa vistoria portuária ou
    // rural seria incorreto.
    const regimes = new Set(dados.itens.map((item) => regimeDoItem(item)))
    const notas: string[] = ['Soma dos itens não conformes.']
    if (regimes.has('anexo_i')) {
      notas.push('Gradação do Anexo I da NR-28, convertida da UFIR.')
    }
    if (regimes.has('anexo_ia_portuario')) {
      notas.push(
        'Itens da NR-29 (trabalho portuário) usam o Anexo I-A da NR-28, cujos valores já são fixados em reais.',
      )
    }
    if (regimes.has('rural_art18')) {
      notas.push(
        `Itens da NR-31 (trabalho rural) seguem o art. 18 da Lei 5.889/1973 — ${currency.format(valorRural)} por empregado em situação irregular (dobrado na reincidência), conforme o nº de empregados informado em cada item.`,
      )
    }
    doc.setTextColor(120)
    const linhasNota = doc.splitTextToSize(notas.join(' '), larguraUtil)
    doc.text(linhasNota, margin, y)
    doc.setTextColor(0)
    y += linhasNota.length * 10
    y += 9
  } else {
    y += 4
  }

  // Itens do checklist, agrupados por seção — só os itens respondidos entram no laudo
  const grupos = new Map<string, ItemChecklist[]>()
  for (const item of dados.itens) {
    const chave = item.secao || 'Disposições gerais'
    if (!grupos.has(chave)) grupos.set(chave, [])
    grupos.get(chave)!.push(item)
  }

  for (const [secao, itensGrupo] of grupos) {
    const itensRespondidos = itensGrupo.filter((item) => dados.respostas[item.id]?.situacao)
    if (itensRespondidos.length === 0) continue

    if (y > pageHeight - 90) {
      doc.addPage()
      y = margin
    }
    doc.setFillColor(235, 240, 235)
    doc.rect(margin, y - 12, larguraUtil, 18, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(40, 60, 40)
    doc.text(secao.toUpperCase(), margin + 6, y)
    doc.setTextColor(0, 0, 0)
    y += 24

    for (const item of itensRespondidos) {
      const resposta = dados.respostas[item.id]
      if (!resposta?.situacao) continue

      if (y > pageHeight - 100) {
        doc.addPage()
        y = margin
      }

      const yInicioItem = y
      const temMulta =
        resposta.situacao === 'N/C' && !!(resposta.valor_multa_min || resposta.valor_multa_max)
      const ehNr31 = resposta.situacao === 'N/C' && regimeDoItem(item) === 'rural_art18'

      // Coluna direita: situação (C/N/C/N/A) e valor de multa, alinhados.
      // Desenhada antes do texto porque o texto literal pode virar a página.
      const paginaInicioItem = doc.getNumberOfPages()
      let yColunaValores = yInicioItem
      const cor = COR_SITUACAO[resposta.situacao]
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(cor[0], cor[1], cor[2])
      doc.text(resposta.situacao, xColunaValores, yColunaValores)
      doc.setTextColor(0, 0, 0)
      yColunaValores += 16

      if (temMulta) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(180, 40, 40)
        doc.text('Multa estimada', xColunaValores, yColunaValores)
        yColunaValores += 10
        const linhasMulta = doc.splitTextToSize(
          `${currency.format(resposta.valor_multa_min || 0)} a ${currency.format(resposta.valor_multa_max || 0)}`,
          larguraColunaValores,
        )
        doc.text(linhasMulta, xColunaValores, yColunaValores)
        yColunaValores += linhasMulta.length * 10
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'normal')
      }

      // Coluna esquerda: identificação do item + descrição + observação
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(`Item ${item.item_ref}`, margin, y)
      y += 12
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(110)
      doc.text(
        `Código da ementa ${item.codigo}${item.revogado ? ' (ementa revogada — não consta no Anexo II da NR-28 vigente)' : ''}`,
        margin,
        y,
      )
      doc.setTextColor(0)
      y += 12

      // Texto literal da norma: pode ser longo (vários subitens/alíneas), então
      // quebra de página linha a linha em vez de imprimir o bloco de uma vez.
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const linhasDescricao: string[] = doc.splitTextToSize(item.descricao, larguraColunaDescricao)
      for (const linha of linhasDescricao) {
        if (y > pageHeight - 60) {
          doc.addPage()
          y = margin
        }
        doc.text(linha, margin, y)
        y += 11
      }
      y += 2

      if (resposta.observacao) {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(8)
        const linhasObs = doc.splitTextToSize(
          `Observação: ${resposta.observacao}`,
          larguraColunaDescricao,
        )
        doc.text(linhasObs, margin, y)
        y += linhasObs.length * 10 + 2
        doc.setFont('helvetica', 'normal')
      }

      if (ehNr31) {
        // NR-31: explica o critério rural no laudo
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(7.5)
        doc.setTextColor(120)
        const linhasNr31 = doc.splitTextToSize(
          resposta.numero_funcionarios_irregulares
            ? `NR-31 (Lei 5.889/1973, art. 18): ${currency.format(valorRural)} por empregado em situação irregular × ${resposta.numero_funcionarios_irregulares} empregado(s); dobrada na reincidência (${currency.format(valorRural * 2)}).`
            : 'NR-31 (Lei 5.889/1973, art. 18): multa por empregado em situação irregular — informe o nº de empregados irregulares para calcular.',
          larguraColunaDescricao,
        )
        doc.text(linhasNr31, margin, y)
        y += linhasNr31.length * 9 + 2
        doc.setTextColor(0)
        doc.setFont('helvetica', 'normal')
      }

      // A altura do item é a maior entre as duas colunas (se o texto não virou a página)
      y = (doc.getNumberOfPages() === paginaInicioItem ? Math.max(y, yColunaValores) : y) + 6

      if (resposta.foto && resposta.foto.length > 0) {
        const alturaFoto = 160
        const larguraMaxFoto = 220
        let x = margin
        if (y + alturaFoto > pageHeight - 60) {
          doc.addPage()
          y = margin
        }
        for (const filename of resposta.foto) {
          const imagem = await carregarImagemComoDataUrl(fotoUrl(resposta, filename))
          if (!imagem) continue
          const largura = Math.min(larguraMaxFoto, alturaFoto * (imagem.largura / imagem.altura))
          if (x + largura > pageWidth - margin) {
            x = margin
            y += alturaFoto + 10
            if (y + alturaFoto > pageHeight - 60) {
              doc.addPage()
              y = margin
            }
          }
          doc.addImage(imagem.dataUrl, 'JPEG', x, y, largura, alturaFoto)
          x += largura + 10
        }
        y += alturaFoto + 14
      } else {
        y += 8
      }

      doc.setDrawColor(230)
      doc.line(margin, y, pageWidth - margin, y)
      y += 12
    }
  }

  // Assinatura do responsável técnico
  if (y > pageHeight - 90) {
    doc.addPage()
    y = margin
  } else {
    y += 26
  }
  const centro = pageWidth / 2
  doc.setDrawColor(0)
  doc.line(centro - 100, y, centro + 100, y)
  y += 14
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(dados.vistoria.responsavel_tecnico_nome || 'Responsável técnico', centro, y, {
    align: 'center',
  })
  y += 12
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(dados.vistoria.responsavel_tecnico_registro || '', centro, y, { align: 'center' })
  y += 10
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text('Responsável técnico', centro, y, { align: 'center' })
  doc.setTextColor(0)

  // Rodapé em todas as páginas
  const totalPaginas = doc.getNumberOfPages()
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(140)
    doc.text(
      `Gerado em ${new Date().toLocaleString('pt-BR')} — página ${i} de ${totalPaginas}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' },
    )
    doc.setTextColor(0)
  }

  const slugEmpresa = dados.empresaNome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const slugTipo = (dados.tipoNrReferencia || dados.tipoNome || 'vistoria')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  doc.save(`laudo-${slugEmpresa || 'empresa'}-${slugTipo || 'vistoria'}.pdf`)
}
