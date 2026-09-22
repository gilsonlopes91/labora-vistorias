/* Gerador de PDF para download de Modelos de Propostas Comerciais editáveis.
   Utiliza jsPDF e jspdf-autotable, aplicando o logotipo oficial da LABORA vistorias,
   campos editáveis destacados entre colchetes [CAMPOS EDITÁVEIS] e seções padrão:
   - Identificação das Partes
   - Apresentação e Objeto
   - Escopo Detalhado
   - Metodologia de Execução (em etapas)
   - O que NÃO está incluso
   - Prazo de Execução
   - Investimento (Tabela de itens de serviços com valores [A PREENCHER])
   - Condições de Pagamento e Faturamento
   - Validade da Proposta
   - Obrigações das Partes e Disposições Gerais
   - Campos de Assinatura das duas partes
*/
import { jsPDF } from 'jspdf'
import autoTablePlugin, { applyPlugin as autoTableApplyPlugin } from 'jspdf-autotable'
import laboraLogoUrl from '@/assets/projeto-labora-engenharia-e-sst-07-83499.png'
import type { ModeloPropostaComercial } from '@/lib/modelosPropostaComercial'

type AutoTableFn = (doc: jsPDF, options: Record<string, unknown>) => void

function executarAutoTable(doc: jsPDF, options: Record<string, unknown>): number {
  try {
    if (typeof autoTableApplyPlugin === 'function') autoTableApplyPlugin(jsPDF)
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
  throw new Error('Não foi possível inicializar o gerador de tabelas (autoTable)')
}

interface ImagemCarregada {
  dataUrl: string
  largura: number
  altura: number
}

async function carregarImagem(url: string): Promise<ImagemCarregada | null> {
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
    return { dataUrl, ...dimensoes }
  } catch {
    return null
  }
}

export interface OpcoesGeracaoPdfModelo {
  modelo: ModeloPropostaComercial
  logoUrlPersonalizada?: string | null
  nomeOrganizacao?: string
}

export async function gerarPdfModeloPropostaComercial(
  opcoes: OpcoesGeracaoPdfModelo,
): Promise<void> {
  const { modelo, logoUrlPersonalizada, nomeOrganizacao } = opcoes

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 40
  const larguraUtil = pageWidth - margin * 2
  let y = margin

  // Carregar Logo (da organização ou logotipo oficial da LABORA)
  const logo = await carregarImagem(logoUrlPersonalizada || laboraLogoUrl)

  const novaPaginaSeNecessario = (alturaNecessaria: number) => {
    if (y + alturaNecessaria > pageHeight - 55) {
      doc.addPage()
      y = margin
      desenharCabecalhoCompacto()
    }
  }

  const desenharCabecalhoCompacto = () => {
    // Linha de topo discreta com identificação da marca
    doc.setFillColor(108, 136, 69) // Verde Labora
    doc.rect(margin, y, larguraUtil, 3, 'F')
    y += 12

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(108, 136, 69)
    doc.text('LABORA VISTORIAS — MODELO DE PROPOSTA COMERCIAL EDITÁVEL', margin, y)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(130)
    doc.text(`Ref.: ${modelo.nome}`, pageWidth - margin, y, { align: 'right' })
    doc.setTextColor(0)
    y += 14
  }

  // ==========================
  // CABEÇALHO PRINCIPAL
  // ==========================
  if (logo) {
    const alturaLogo = 42
    const larguraLogo = alturaLogo * (logo.largura / logo.altura)
    try {
      doc.addImage(logo.dataUrl, 'PNG', margin, y, larguraLogo, alturaLogo)
    } catch {
      // continua sem imagem se houver erro
    }
  }

  const offsetTextoLogo = logo ? 55 : 0
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(32, 39, 32)
  doc.text(nomeOrganizacao || 'LABORA vistorias', margin + offsetTextoLogo, y + 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100)
  doc.text(
    'Engenharia de Segurança e Saúde no Trabalho — Soluções Técnicas & Vistorias',
    margin + offsetTextoLogo,
    y + 26,
  )

  // Caixa à direita indicando "MODELO COMERCIAL"
  const larguraBadge = 140
  const xBadge = pageWidth - margin - larguraBadge
  doc.setFillColor(245, 247, 242)
  doc.setDrawColor(108, 136, 69)
  doc.setLineWidth(0.8)
  doc.roundedRect(xBadge, y, larguraBadge, 36, 3, 3, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(108, 136, 69)
  doc.text('DOCUMENTO MODELO', xBadge + larguraBadge / 2, y + 14, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(90)
  doc.text('Preencha os campos entre [ ]', xBadge + larguraBadge / 2, y + 26, { align: 'center' })

  y += 50
  doc.setDrawColor(210)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 16

  // Título da Proposta
  doc.setFillColor(108, 136, 69)
  doc.rect(margin, y, 5, 24, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 40, 25)
  doc.text(modelo.nome.toUpperCase(), margin + 12, y + 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(110)
  doc.text(
    `Categoria: ${modelo.categoria}  |  Normas de Referência: ${modelo.nrReferencia}`,
    margin + 12,
    y + 23,
  )
  doc.setTextColor(0)
  y += 34

  // Alerta visual de instrução de preenchimento
  doc.setFillColor(248, 250, 245)
  doc.setDrawColor(108, 136, 69)
  doc.setLineWidth(0.4)
  doc.roundedRect(margin, y, larguraUtil, 26, 3, 3, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(108, 136, 69)
  doc.text('INSTRUÇÕES PARA UTILIZAÇÃO DESTE MODELO:', margin + 8, y + 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(70)
  doc.text(
    'Este documento contém dados padronizados e campos delimitados por colchetes [ex.: NOME DO CLIENTE, CNPJ, VALOR]. Substitua-os pelas informações reais de sua negociação antes do envio final.',
    margin + 8,
    y + 19,
  )
  y += 34

  // Função auxiliar para títulos de seção
  const desenharTituloSecao = (numero: string, titulo: string) => {
    novaPaginaSeNecessario(45)
    doc.setFillColor(240, 244, 236)
    doc.rect(margin, y, larguraUtil, 18, 'F')
    doc.setFillColor(108, 136, 69)
    doc.rect(margin, y, 4, 18, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(35, 50, 25)
    doc.text(`${numero}. ${titulo.toUpperCase()}`, margin + 10, y + 12.5)
    doc.setTextColor(0)
    y += 24
  }

  // 1. IDENTIFICAÇÃO DAS PARTES
  desenharTituloSecao('1', 'Identificação das Partes')
  const finalYPartes = executarAutoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 6, overflow: 'linebreak' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100, fillColor: [250, 250, 250] },
      1: { cellWidth: larguraUtil - 100 },
    },
    body: [
      ['CONTRATADA (Proponente)', modelo.identificacao.contratada],
      ['CONTRATANTE (Cliente)', modelo.identificacao.contratante],
      ['Resumo do Objeto', modelo.identificacao.objetoResumo],
      ['Data de Emissão', '[DATA DE EMISSÃO, ex.: ' + new Date().toLocaleDateString('pt-BR') + ']'],
      ['Número da Proposta', '[Nº PROPOSTA, ex.: PROP-2025/001]'],
    ],
    margin: { left: margin, right: margin },
  })
  y = (finalYPartes || y) + 16

  // 2. APRESENTAÇÃO INSTITUCIONAL
  desenharTituloSecao('2', 'Apresentação Institucional')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(50)
  const linhasApres = doc.splitTextToSize(modelo.apresentacao, larguraUtil)
  doc.text(linhasApres, margin, y)
  y += linhasApres.length * 11 + 12

  // 3. ESCOPO DOS SERVIÇOS
  desenharTituloSecao('3', 'Escopo Detalhado dos Serviços')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  for (const itemEscopo of modelo.escopo) {
    const linhas = doc.splitTextToSize(itemEscopo, larguraUtil - 18)
    novaPaginaSeNecessario(linhas.length * 11 + 4)
    doc.setFillColor(108, 136, 69)
    doc.circle(margin + 5, y - 2.5, 2, 'F')
    doc.setTextColor(40)
    doc.text(linhas, margin + 14, y)
    y += linhas.length * 11 + 3
  }
  y += 8

  // 4. METODOLOGIA E ETAPAS DE EXECUÇÃO
  desenharTituloSecao('4', 'Metodologia e Etapas de Execução')
  const linhasMetodologia = modelo.metodologia.map((m) => [m.etapa, m.descricao])
  const finalYMetodologia = executarAutoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 8.5, cellPadding: 5 },
    headStyles: { fillColor: [108, 136, 69], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 150 },
      1: { cellWidth: larguraUtil - 150 },
    },
    head: [['Etapa / Fase', 'Descrição das Atividades']],
    body: linhasMetodologia,
    margin: { left: margin, right: margin },
  })
  y = (finalYMetodologia || y) + 16

  // 5. ITENS NÃO INCLUSOS (EXCLUSÕES)
  desenharTituloSecao('5', 'Itens Não Inclusos no Escopo')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  for (const itemExcluso of modelo.itensNaoInclusos) {
    const linhas = doc.splitTextToSize(itemExcluso, larguraUtil - 18)
    novaPaginaSeNecessario(linhas.length * 11 + 4)
    doc.setFillColor(180, 50, 50)
    doc.circle(margin + 5, y - 2.5, 2, 'F')
    doc.setTextColor(60)
    doc.text(linhas, margin + 14, y)
    y += linhas.length * 11 + 3
  }
  y += 8

  // 6. PRAZO DE EXECUÇÃO E VIGÊNCIA
  desenharTituloSecao('6', 'Prazo de Execução e Vigência')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(50)
  const linhasPrazo = doc.splitTextToSize(modelo.prazoExecucao, larguraUtil)
  doc.text(linhasPrazo, margin, y)
  y += linhasPrazo.length * 11 + 14

  // 7. INVESTIMENTO E VALORES (TABELA EDITÁVEL)
  desenharTituloSecao('7', 'Investimento e Condições Comerciais')
  const corpoTabela = modelo.itensInvestimento.map((item) => [
    item.item,
    item.descricao,
    item.unidade,
    item.quantidade,
    item.valorUnitario,
    item.subtotal,
  ])

  const finalYInvestimento = executarAutoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak' },
    headStyles: { fillColor: [108, 136, 69], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['Item', 'Descrição do Serviço', 'Un.', 'Qtd.', 'Valor Unit. (R$)', 'Subtotal (R$)']],
    body: corpoTabela,
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      1: { cellWidth: larguraUtil - 26 - 40 - 50 - 95 - 95 },
      2: { cellWidth: 40, halign: 'center' },
      3: { cellWidth: 50, halign: 'center' },
      4: { cellWidth: 95, halign: 'right' },
      5: { cellWidth: 95, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  })
  y = (finalYInvestimento || y) + 12

  // Destaque de Valor Total
  novaPaginaSeNecessario(40)
  doc.setFillColor(245, 248, 242)
  doc.setDrawColor(108, 136, 69)
  doc.setLineWidth(1)
  doc.roundedRect(pageWidth - margin - 230, y, 230, 30, 3, 3, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(60)
  doc.text('INVESTIMENTO GLOBAL ESTIMADO:', pageWidth - margin - 220, y + 13)
  doc.setFontSize(11)
  doc.setTextColor(108, 136, 69)
  doc.text('[R$ VALOR TOTAL A PREENCHER]', pageWidth - margin - 12, y + 23, { align: 'right' })
  y += 40

  // 8. CONDIÇÕES DE PAGAMENTO E FATURAMENTO
  desenharTituloSecao('8', 'Condições de Pagamento e Faturamento')
  for (const condicao of modelo.condicoesPagamento) {
    const linhas = doc.splitTextToSize(condicao, larguraUtil - 18)
    novaPaginaSeNecessario(linhas.length * 11 + 4)
    doc.setFillColor(108, 136, 69)
    doc.circle(margin + 5, y - 2.5, 2, 'F')
    doc.setTextColor(50)
    doc.text(linhas, margin + 14, y)
    y += linhas.length * 11 + 3
  }
  y += 8

  // 9. VALIDADE DA PROPOSTA
  desenharTituloSecao('9', 'Validade da Proposta Comercial')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(50)
  const linhasValidade = doc.splitTextToSize(modelo.validadeProposta, larguraUtil)
  doc.text(linhasValidade, margin, y)
  y += linhasValidade.length * 11 + 14

  // 10. OBRIGAÇÕES DAS PARTES
  desenharTituloSecao('10', 'Obrigações das Partes')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(30)
  doc.text('A) Obrigações da CONTRATANTE:', margin, y)
  y += 12
  for (const ob of modelo.obrigacoesPartes.contratante) {
    const linhas = doc.splitTextToSize(ob, larguraUtil - 18)
    novaPaginaSeNecessario(linhas.length * 11 + 4)
    doc.setFillColor(108, 136, 69)
    doc.circle(margin + 5, y - 2.5, 2, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50)
    doc.text(linhas, margin + 14, y)
    y += linhas.length * 11 + 3
  }

  y += 6
  novaPaginaSeNecessario(40)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(30)
  doc.text('B) Obrigações da CONTRATADA:', margin, y)
  y += 12
  for (const ob of modelo.obrigacoesPartes.contratada) {
    const linhas = doc.splitTextToSize(ob, larguraUtil - 18)
    novaPaginaSeNecessario(linhas.length * 11 + 4)
    doc.setFillColor(108, 136, 69)
    doc.circle(margin + 5, y - 2.5, 2, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50)
    doc.text(linhas, margin + 14, y)
    y += linhas.length * 11 + 3
  }
  y += 8

  // 11. DISPOSIÇÕES GERAIS E FORO
  desenharTituloSecao('11', 'Disposições Gerais e Foro')
  for (const disp of modelo.disposicoesGerais) {
    const linhas = doc.splitTextToSize(disp, larguraUtil - 18)
    novaPaginaSeNecessario(linhas.length * 11 + 4)
    doc.setFillColor(108, 136, 69)
    doc.circle(margin + 5, y - 2.5, 2, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50)
    doc.text(linhas, margin + 14, y)
    y += linhas.length * 11 + 3
  }
  y += 18

  // 12. ACEITE E ASSINATURA DAS DUAS PARTES
  desenharTituloSecao('12', 'Termo de Aceite e Assinaturas')
  novaPaginaSeNecessario(95)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(80)
  doc.text(
    'Estando de acordo com os termos, condições comerciais, escopo e prazos estipulados nesta proposta, as partes assinam o presente termo para que produza os devidos efeitos legais.',
    margin,
    y,
  )
  y += 34

  const larguraLinha = (larguraUtil - 40) / 2
  doc.setDrawColor(120)
  doc.setLineWidth(0.8)
  doc.line(margin, y, margin + larguraLinha, y)
  doc.line(margin + larguraLinha + 40, y, margin + larguraUtil, y)
  y += 12

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(30)
  doc.text(nomeOrganizacao || 'LABORA vistorias (CONTRATADA)', margin, y)
  doc.text('[NOME DO CLIENTE / RAZÃO SOCIAL] (CONTRATANTE)', margin + larguraLinha + 40, y)
  y += 11

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(110)
  doc.text('Responsável Técnico / Representante Legal', margin, y)
  doc.text('Aceite Comercial / Representante Autorizado', margin + larguraLinha + 40, y)
  y += 10
  doc.text('Data: ______ / ______ / ________', margin, y)
  doc.text('Data: ______ / ______ / ________', margin + larguraLinha + 40, y)

  // ==========================
  // RODAPÉ EM TODAS AS PÁGINAS
  // ==========================
  const totalPaginas = doc.getNumberOfPages()
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i)
    doc.setDrawColor(220)
    doc.setLineWidth(0.4)
    doc.line(margin, pageHeight - 26, pageWidth - margin, pageHeight - 26)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(140)
    doc.text(
      `${nomeOrganizacao || 'LABORA vistorias'} — Engenharia e SST | Modelo de Proposta Comercial`,
      margin,
      pageHeight - 16,
    )
    doc.text(`Página ${i} de ${totalPaginas}`, pageWidth - margin, pageHeight - 16, {
      align: 'right',
    })
  }

  const slug = (texto: string) =>
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

  doc.save(`modelo-proposta-${slug(modelo.id)}.pdf`)
}
