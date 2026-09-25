/* Gera o PDF do laudo de vistoria — resumo executivo, itens agrupados por
 * seção (com fotos já com marca d'água) e assinatura do responsável técnico.
 * Roda inteiramente no navegador (jsPDF), sem precisar de backend. */
import { jsPDF } from 'jspdf'
import autoTablePlugin, { applyPlugin as autoTableApplyPlugin } from 'jspdf-autotable'

import { formatBrazilianDate, formatarDataCalendario } from '@/lib/date'
import { rotuloItemRef } from '@/lib/normas'
import type { Vistoria } from '@/services/vistorias'
import type { ItemChecklist } from '@/services/itensChecklist'
import {
  fotoUrl,
  getTokenArquivos,
  type RespostaVistoria,
  type Situacao,
} from '@/services/respostasVistoria'
import {
  carregarIdentidade,
  clarear,
  hexParaRgb,
  COR_PRIMARIA_LABORA,
  COR_SECUNDARIA_LABORA,
} from '@/lib/identidadeVisual'

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
  /** Nº de empregados usado no cálculo. Vazio/0 = cadastro sem esse dado. */
  empresaNumeroEmpregados?: number
  tipoNome: string
  tipoNrReferencia?: string
  /** Checklists da vistoria, na ordem (principal e adicionais). Com mais de um,
   *  o relatório lista todos e cada seção diz de qual norma ou anexo é. */
  checklists?: { id: string; rotulo: string; nome: string }[]
  /** Imagem da assinatura do RT que assinou (link com token). Opcional. */
  assinaturaRtUrl?: string
  organizacaoNome: string
  logoUrl: string
  itens: ItemChecklist[]
  respostas: Record<string, RespostaVistoria>
  resumo: ResumoVistoria
  /** Regime de cada item, por id. Sem isso o laudo não sabe de qual anexo saiu o valor. */
  regimePorItem?: Record<string, RegimeMultaItem>
  /** Valor por empregado do critério rural, conforme a base legal escolhida na vistoria. */
  valorRuralPorEmpregado?: number
  /** Cores da organização (hex). Sem elas, o laudo lê de Configurações > Identidade visual. */
  corPrimaria?: string
  corSecundaria?: string
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
// 4167px) entra inteiro no PDF e o relatório sai com dezenas de MB. 600px é
// ~3x a maior exibição no relatório (foto ~210pt), suficiente para nitidez.
const MAX_DIMENSAO_IMAGEM_PDF = 600
// A logo aparece com 38pt de altura; 300px sobra.
const MAX_DIMENSAO_LOGO_PDF = 300
// Fotos sempre regravadas em JPEG com esta qualidade: com 40 ou 50 fotos o
// arquivo precisa caber num WhatsApp ou e-mail.
const QUALIDADE_FOTO_PDF = 0.72

interface OpcoesImagem {
  maxDimensao?: number
  /** Regrava toda foto em JPEG, mesmo as pequenas. */
  sempreJpeg?: boolean
}

async function carregarImagemComoDataUrl(
  url: string,
  opcoes: OpcoesImagem = {},
): Promise<ImagemCarregada | null> {
  const limite = opcoes.maxDimensao || MAX_DIMENSAO_IMAGEM_PDF
  // Sem logo (organização que não enviou o seu) ou link que não é imagem:
  // o relatório sai sem a imagem, em vez de quebrar.
  if (!url) return null
  try {
    const resposta = await fetch(url)
    if (!resposta.ok) return null
    const blob = await resposta.blob()
    if (!blob.type.startsWith('image/')) return null
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
    if (maiorDimensao > limite || opcoes.sempreJpeg) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const imagem = new Image()
          imagem.onload = () => resolve(imagem)
          imagem.onerror = () => reject(new Error('Falha ao decodificar imagem'))
          imagem.src = dataUrl
        })
        const escala = Math.min(1, limite / maiorDimensao)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(dimensoes.largura * escala)
        canvas.height = Math.round(dimensoes.altura * escala)
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const tipoSaida =
            blob.type === 'image/png' && !opcoes.sempreJpeg ? 'image/png' : 'image/jpeg'
          if (tipoSaida === 'image/jpeg') {
            // fundo branco: JPEG não tem transparência
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const redimensionado = canvas.toDataURL(
            tipoSaida,
            tipoSaida === 'image/jpeg' ? QUALIDADE_FOTO_PDF : undefined,
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

  // Identidade visual da organização: cores no cabeçalho, tabelas e faixas.
  const identidade = dados.corPrimaria && dados.corSecundaria ? null : await carregarIdentidade()
  const primaria = hexParaRgb(
    dados.corPrimaria || identidade?.corPrimaria,
    hexParaRgb(COR_PRIMARIA_LABORA, [108, 136, 69]),
  )
  const secundaria = hexParaRgb(
    dados.corSecundaria || identidade?.corSecundaria,
    hexParaRgb(COR_SECUNDARIA_LABORA, [32, 39, 32]),
  )
  const faixaSecao = clarear(primaria, 0.85)

  // compress: texto e imagens PNG comprimidos no arquivo.
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
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

  // Faixa na cor da organização no topo da primeira página
  doc.setFillColor(primaria[0], primaria[1], primaria[2])
  doc.rect(0, 0, pageWidth, 8, 'F')

  // Cabeçalho: logo da organização + nome + título do documento
  const logo = await carregarImagemComoDataUrl(dados.logoUrl || identidade?.logoUrl || '', {
    maxDimensao: MAX_DIMENSAO_LOGO_PDF,
  })
  if (logo) {
    const alturaLogo = 38
    const larguraLogo = alturaLogo * (logo.largura / logo.altura)
    const formatoLogo = logo.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
    doc.addImage(logo.dataUrl, formatoLogo, margin, y, larguraLogo, alturaLogo, 'logo', 'FAST')
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
  doc.text(dados.organizacaoNome, pageWidth - margin, y + 14, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Relatório de Vistoria de Segurança e Saúde no Trabalho', pageWidth - margin, y + 28, {
    align: 'right',
  })
  y += 52
  doc.setDrawColor(primaria[0], primaria[1], primaria[2])
  doc.setLineWidth(1.2)
  doc.line(margin, y, pageWidth - margin, y)
  doc.setLineWidth(0.5)
  y += 22

  // Título do tipo de vistoria — evita repetir "NR-01 — NR-01 — ..." quando o
  // nome do tipo já começa com a própria referência da norma.
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  const nomeTipoJaTemReferencia =
    !!dados.tipoNrReferencia &&
    dados.tipoNome.trim().toLowerCase().startsWith(dados.tipoNrReferencia.trim().toLowerCase())
  const variosChecklists = (dados.checklists?.length || 0) > 1
  const titulo = variosChecklists
    ? `Vistoria com ${dados.checklists!.length} checklists`
    : dados.tipoNrReferencia && !nomeTipoJaTemReferencia
      ? `${dados.tipoNrReferencia} — ${dados.tipoNome}`
      : dados.tipoNome || 'Relatório de Vistoria SST'
  const linhasTitulo = doc.splitTextToSize(titulo, larguraUtil)
  doc.text(linhasTitulo, margin, y)
  y += linhasTitulo.length * 17 + 6

  // Dados gerais — vale a data em que a vistoria foi feita; se não houver,
  // a data agendada.
  const dataVistoria =
    dados.vistoria.data_realizada || dados.vistoria.data_agendada
      ? formatBrazilianDate(dados.vistoria.data_realizada || dados.vistoria.data_agendada)
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
      [
        'Nº de empregados',
        dados.empresaNumeroEmpregados ? String(dados.empresaNumeroEmpregados) : 'não informado',
      ],
      ['Data da vistoria', dataVistoria],
      ...(variosChecklists
        ? [['Checklists', dados.checklists!.map((c) => c.nome).join('\n')]]
        : []),
      ...(dados.vistoria.acompanhante_nome
        ? [
            [
              'Acompanhou pela empresa',
              [dados.vistoria.acompanhante_nome, dados.vistoria.acompanhante_cargo]
                .filter(Boolean)
                .join(' — '),
            ],
          ]
        : []),
      ...(dados.vistoria.art_numero ? [['ART', dados.vistoria.art_numero]] : []),
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
    headStyles: { fillColor: primaria },
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
    if (
      !dados.empresaNumeroEmpregados &&
      (regimes.has('anexo_i') || regimes.has('anexo_ia_portuario'))
    ) {
      notas.push(
        'Atenção: a empresa não tinha número de empregados no cadastro, e a multa foi estimada pela menor faixa da tabela (1 a 10 empregados). O valor real pode ser maior.',
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

  // Fotos são arquivos protegidos: o link precisa de token temporário, renovado
  // a cada minuto porque um laudo com muitas fotos pode demorar para montar.
  let tokenArquivos = ''
  let tokenObtidoEm = 0
  const tokenAtual = async () => {
    if (!tokenArquivos || Date.now() - tokenObtidoEm > 60_000) {
      try {
        tokenArquivos = await getTokenArquivos()
        tokenObtidoEm = Date.now()
      } catch {
        // sem token as fotos não carregam; o laudo sai sem elas
      }
    }
    return tokenArquivos
  }

  // Itens do checklist, agrupados por seção — só os itens respondidos entram no
  // relatório. Com mais de um checklist, a seção diz de qual norma ou anexo é
  // ("NR-12 · Anexo VIII · ..."), na ordem em que os checklists foram escolhidos.
  const rotuloChecklist = new Map((dados.checklists || []).map((c) => [c.id, c.rotulo]))
  const situacaoDe = (item: ItemChecklist) => dados.respostas[item.id]?.situacao

  // Plano de ação: cada não conformidade com o que foi encontrado, a
  // recomendação e o prazo para corrigir.
  const itensNC = dados.itens.filter((item) => situacaoDe(item) === 'N/C')
  if (itensNC.length > 0) {
    if (y > pageHeight - 140) {
      doc.addPage()
      y = margin
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Plano de ação', margin, y)
    const fimPlano = executarAutoTable(doc, {
      startY: y + 8,
      head: [['Item', 'Situação encontrada', 'Recomendação', 'Prazo']],
      body: itensNC.map((item) => {
        const r = dados.respostas[item.id]
        const origem = variosChecklists
          ? `${rotuloChecklist.get(item.tipo_vistoria_id) || ''}\n`
          : ''
        return [
          `${origem}${rotuloItemRef(item.item_ref)}${item.grau ? `\nInfração I${item.grau}` : ''}`,
          r?.observacao || 'Não atende ao item da norma.',
          r?.recomendacao || 'A definir',
          r?.prazo_adequacao ? formatarDataCalendario(r.prazo_adequacao) : 'A definir',
        ]
      }),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4, valign: 'top', overflow: 'linebreak' },
      headStyles: { fillColor: primaria },
      columnStyles: { 0: { cellWidth: 78 }, 3: { cellWidth: 58 } },
      margin: { left: margin, right: margin },
    })
    y = (fimPlano || y) + 24
  }

  // No detalhamento entram os itens C e N/C com o texto da norma. Os N/A vão
  // numa lista curta no fim, a não ser que tenham observação ou foto.
  const detalhar = (item: ItemChecklist) => {
    const r = dados.respostas[item.id]
    if (!r?.situacao) return false
    if (r.situacao !== 'N/A') return true
    return !!(r.observacao || (r.foto && r.foto.length))
  }

  const grupos = new Map<string, ItemChecklist[]>()
  for (const item of dados.itens) {
    const secao = item.secao || 'Disposições gerais'
    const chave = variosChecklists
      ? `${rotuloChecklist.get(item.tipo_vistoria_id) || 'Checklist'} · ${secao}`
      : secao
    if (!grupos.has(chave)) grupos.set(chave, [])
    grupos.get(chave)!.push(item)
  }

  for (const [secao, itensGrupo] of grupos) {
    const itensRespondidos = itensGrupo.filter(detalhar)
    if (itensRespondidos.length === 0) continue

    if (y > pageHeight - 90) {
      doc.addPage()
      y = margin
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    const linhasSecao: string[] = doc.splitTextToSize(secao.toUpperCase(), larguraUtil - 12)
    doc.setFillColor(faixaSecao[0], faixaSecao[1], faixaSecao[2])
    doc.rect(margin, y - 12, larguraUtil, 6 + linhasSecao.length * 13, 'F')
    doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
    doc.text(linhasSecao, margin + 6, y)
    doc.setTextColor(0, 0, 0)
    y += 11 + linhasSecao.length * 13

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
      doc.text(`Item ${rotuloItemRef(item.item_ref)}`, margin, y)
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

      if (resposta.situacao === 'N/C' && (resposta.recomendacao || resposta.prazo_adequacao)) {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(8)
        const linhasPlano = doc.splitTextToSize(
          [
            resposta.recomendacao ? `Recomendação: ${resposta.recomendacao}` : '',
            resposta.prazo_adequacao
              ? `Prazo: ${formatarDataCalendario(resposta.prazo_adequacao)}`
              : '',
          ]
            .filter(Boolean)
            .join('  ·  '),
          larguraColunaDescricao,
        )
        doc.text(linhasPlano, margin, y)
        y += linhasPlano.length * 10 + 2
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
          const imagem = await carregarImagemComoDataUrl(
            fotoUrl(resposta, filename, await tokenAtual()),
            { sempreJpeg: true },
          )
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

  // Itens que não se aplicam: lista curta, sem o texto da norma.
  const itensNA = dados.itens.filter((item) => situacaoDe(item) === 'N/A' && !detalhar(item))
  if (itensNA.length > 0) {
    if (y > pageHeight - 110) {
      doc.addPage()
      y = margin
    } else {
      y += 6
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`Itens que não se aplicam a este estabelecimento (${itensNA.length})`, margin, y)
    const fimNA = executarAutoTable(doc, {
      startY: y + 8,
      head: [['Item', 'Código', variosChecklists ? 'Checklist · seção' : 'Seção']],
      body: itensNA.map((item) => [
        rotuloItemRef(item.item_ref),
        item.codigo || '',
        (variosChecklists ? `${rotuloChecklist.get(item.tipo_vistoria_id) || ''} · ` : '') +
          (item.secao || 'Disposições gerais'),
      ]),
      theme: 'striped',
      styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: primaria },
      columnStyles: { 0: { cellWidth: 150 }, 1: { cellWidth: 62 } },
      margin: { left: margin, right: margin },
    })
    y = (fimNA || y) + 12
  }

  // Assinaturas: responsável técnico (com a assinatura digitalizada, se houver)
  // e o representante da empresa que acompanhou a vistoria.
  const alturaBlocoAssinatura = 120
  if (y > pageHeight - alturaBlocoAssinatura - 40) {
    doc.addPage()
    y = margin + 60
  } else {
    y += 60
  }
  const larguraAssinatura = 200
  const xRT = margin + (larguraUtil / 2 - larguraAssinatura) / 2
  const xEmpresa = margin + larguraUtil / 2 + (larguraUtil / 2 - larguraAssinatura) / 2
  const centroRT = xRT + larguraAssinatura / 2
  const centroEmpresa = xEmpresa + larguraAssinatura / 2

  if (dados.assinaturaRtUrl) {
    const assinatura = await carregarImagemComoDataUrl(dados.assinaturaRtUrl, {
      maxDimensao: MAX_DIMENSAO_LOGO_PDF * 2,
    })
    if (assinatura) {
      const alturaImg = 44
      const larguraImg = Math.min(
        larguraAssinatura,
        alturaImg * (assinatura.largura / assinatura.altura),
      )
      const formato = assinatura.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
      doc.addImage(
        assinatura.dataUrl,
        formato,
        centroRT - larguraImg / 2,
        y - alturaImg - 2,
        larguraImg,
        alturaImg,
      )
    }
  }

  doc.setDrawColor(0)
  doc.line(xRT, y, xRT + larguraAssinatura, y)
  doc.line(xEmpresa, y, xEmpresa + larguraAssinatura, y)

  let yRT = y + 14
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(dados.vistoria.responsavel_tecnico_nome || 'Responsável técnico', centroRT, yRT, {
    align: 'center',
  })
  yRT += 12
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(dados.vistoria.responsavel_tecnico_registro || '', centroRT, yRT, { align: 'center' })
  yRT += 10
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text('Responsável técnico', centroRT, yRT, { align: 'center' })
  if (dados.vistoria.art_numero) {
    yRT += 10
    doc.text(`ART nº ${dados.vistoria.art_numero}`, centroRT, yRT, { align: 'center' })
  }
  doc.setTextColor(0)

  let yEmpresa = y + 14
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(dados.vistoria.acompanhante_nome || ' ', centroEmpresa, yEmpresa, { align: 'center' })
  yEmpresa += 12
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  if (dados.vistoria.acompanhante_cargo) {
    doc.text(dados.vistoria.acompanhante_cargo, centroEmpresa, yEmpresa, { align: 'center' })
  }
  yEmpresa += 10
  doc.setFontSize(8)
  doc.setTextColor(120)
  const linhasEmpresa: string[] = doc.splitTextToSize(
    `Representante da empresa · ${dados.empresaNome}`,
    larguraAssinatura,
  )
  doc.text(linhasEmpresa, centroEmpresa, yEmpresa, { align: 'center' })
  doc.setTextColor(0)

  // Rodapé em todas as páginas: dados da organização (Configurações) e página.
  const dadosOrg = identidade?.dados
  const linhaOrganizacao = [
    dadosOrg?.razao_social || dados.organizacaoNome,
    dadosOrg?.cnpj ? `CNPJ ${dadosOrg.cnpj}` : '',
    dadosOrg?.telefone || '',
    dadosOrg?.email || '',
  ]
    .filter(Boolean)
    .join('  ·  ')
  const totalPaginas = doc.getNumberOfPages()
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(140)
    if (linhaOrganizacao) {
      doc.text(linhaOrganizacao, pageWidth / 2, pageHeight - 30, { align: 'center' })
    }
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
  doc.save(`relatorio-${slugEmpresa || 'empresa'}-${slugTipo || 'vistoria'}.pdf`)
}
