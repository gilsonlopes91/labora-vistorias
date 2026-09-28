/* Gera o PDF do PGR a partir dos dados já levantados (GHEs, inventário de
 * riscos, plano de ação) e das seções de texto do documento. Segue as
 * mesmas convenções de src/lib/relatorioVistoria.ts (jsPDF + autoTable,
 * identidade visual, cabeçalho/rodapé, quebra de página manual). Quem chama
 * decide o destino: `doc.output('blob')` para enviar ao servidor, ou
 * `doc.save(...)` para baixar direto no navegador. */
import { jsPDF } from 'jspdf'
import autoTablePlugin, { applyPlugin as autoTableApplyPlugin } from 'jspdf-autotable'

import {
  carregarIdentidade,
  clarear,
  hexParaRgb,
  COR_PRIMARIA_LABORA,
  COR_SECUNDARIA_LABORA,
  type RGB,
} from '@/lib/identidadeVisual'
import type { SecaoDocumento } from '@/services/documentosSst'

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

export interface LinhaInventarioPgr {
  unidade: string
  agente: string
  trilha: string
  severidade: number | string
  probabilidade: number | string
  categoria: string
}

export interface LinhaPlanoAcaoPgr {
  medida: string
  responsavel: string
  prazo: string
  status: string
  prioridade: string
}

/** Carimbo de assinatura eletrônica nível 1 (reautenticação por senha, sem
 *  provedor externo) — nome e registro de quem emitiu, quando confirmou a
 *  senha e o link da página pública de verificação. */
export interface AssinaturaEletronica {
  nome: string
  registro?: string
  confirmadaEm: Date
  linkVerificacao: string
}

export interface LinhaConclusaoLaudo {
  funcao: string
  agente: string
  regua: string
  dadoUsado: string
  conclusao: string
  justificativa: string
}

export interface DadosRelatorioPgr {
  organizacaoNome: string
  logoUrl?: string | null
  corPrimaria?: string
  corSecundaria?: string
  empresaNome: string
  empresaCnpj?: string
  /** Logo da empresa cliente (services/empresas.ts, migration 0166), exibida
   *  na capa ao lado do logo da organização que presta o serviço. */
  empresaLogoUrl?: string | null
  /** Sigla em destaque na capa (ex.: "PGR", "LTCAT"). Sem ela, usa `titulo`. */
  siglaDocumento?: string
  titulo: string
  versao: number
  dataEmissao: Date
  /** Início/fim de vigência mostrados na capa. Sem `vigenciaInicio`, usa `dataEmissao`. */
  vigenciaInicio?: Date
  vigenciaFim?: Date | null
  elaboradores?: string
  secoes: SecaoDocumento[]
  unidadesAvaliacao: string[]
  inventario: LinhaInventarioPgr[]
  planoAcao: LinhaPlanoAcaoPgr[]
  assinatura?: AssinaturaEletronica
  /** Só para laudos derivados (insalubridade/periculosidade/LTCAT): a
   *  conclusão por função, com a régua e o dado técnico usados (NR-1, item
   *  1.5.2 — não é a classificação do PGR). */
  conclusoesFuncao?: LinhaConclusaoLaudo[]
}

/** Busca uma imagem (logo) pela URL e converte para data URL, para poder ser
 *  embutida no PDF com doc.addImage. Retorna null se não conseguir buscar
 *  (sem logo cadastrado, CORS, etc.) — a capa cai para o nome em texto. */
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
    img.onerror = () => reject(new Error('Não foi possível ler as dimensões da imagem'))
    img.src = dataUrl
  })
}

/** Padrão decorativo de linhas cruzadas da identidade visual da Labora,
 *  redesenhado em vetor (leque de linhas retas a partir de um ponto de
 *  fuga) para não depender de uma imagem de fundo embutida no app. */
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

/** Capa do documento: fundo neutro, padrão decorativo, título/sigla em
 *  destaque, logo da empresa cliente e, no rodapé, o logo (ou nome) de quem
 *  presta o serviço — os dois lados do trabalho, na primeira página. */
async function desenharCapa(
  doc: jsPDF,
  dados: DadosRelatorioPgr,
  primaria: RGB,
  secundaria: RGB,
): Promise<void> {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const centroX = pageWidth / 2

  doc.setFillColor(238, 238, 238)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')
  desenharPadraoCapa(doc, pageWidth, pageHeight, clarear(primaria, 0.15))

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(52)
  doc.setTextColor(30, 30, 30)
  doc.text(dados.siglaDocumento || dados.titulo, centroX, 130, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(15)
  doc.setTextColor(primaria[0], primaria[1], primaria[2])
  doc.text(dados.titulo, centroX, 155, { align: 'center' })

  let y = 260
  const logoCliente = dados.empresaLogoUrl
    ? await carregarImagemComoDataUrl(dados.empresaLogoUrl)
    : null
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
  doc.text(dados.empresaNome, centroX, y, { align: 'center' })
  y += 16

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  const vigenciaInicio = dados.vigenciaInicio || dados.dataEmissao
  doc.text(
    `Início da vigência: ${vigenciaInicio.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })}`,
    centroX,
    y,
    { align: 'center' },
  )
  if (dados.vigenciaFim) {
    y += 13
    doc.text(
      `Fim da vigência: ${dados.vigenciaFim.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })}`,
      centroX,
      y,
      { align: 'center' },
    )
  }

  const logoOrg = dados.logoUrl ? await carregarImagemComoDataUrl(dados.logoUrl) : null
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
      doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
      doc.text(dados.organizacaoNome, centroX, pageHeight - 60, { align: 'center' })
    }
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
    doc.text(dados.organizacaoNome, centroX, pageHeight - 60, { align: 'center' })
  }

  doc.addPage()
}

const htmlParaTexto = (html: string) =>
  html
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

export async function gerarPdfPgr(dados: DadosRelatorioPgr): Promise<jsPDF> {
  const identidade = dados.corPrimaria && dados.corSecundaria ? null : await carregarIdentidade()
  const primaria = hexParaRgb(
    dados.corPrimaria || identidade?.corPrimaria,
    hexParaRgb(COR_PRIMARIA_LABORA, [108, 136, 69]),
  )
  const secundaria = hexParaRgb(
    dados.corSecundaria || identidade?.corSecundaria,
    hexParaRgb(COR_SECUNDARIA_LABORA, [32, 39, 32]),
  )

  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  await desenharCapa(doc, dados, primaria, secundaria)

  const margin = 40
  const larguraUtil = pageWidth - margin * 2
  let y = margin

  doc.setFillColor(primaria[0], primaria[1], primaria[2])
  doc.rect(0, 0, pageWidth, 8, 'F')
  y += 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
  doc.text(dados.titulo, margin, y)
  y += 18
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(
    `${dados.empresaNome}${dados.empresaCnpj ? ` · CNPJ ${dados.empresaCnpj}` : ''}`,
    margin,
    y,
  )
  y += 14
  doc.text(
    `Versão ${dados.versao} · Emitido em ${dados.dataEmissao.toLocaleDateString('pt-BR')}${
      dados.elaboradores ? ` · Elaboração: ${dados.elaboradores}` : ''
    }`,
    margin,
    y,
  )
  y += 22
  doc.setDrawColor(primaria[0], primaria[1], primaria[2])
  doc.line(margin, y, pageWidth - margin, y)
  y += 24

  const secoesAtivas = dados.secoes.filter((s) => s.ativo).sort((a, b) => a.ordem - b.ordem)
  for (const secao of secoesAtivas) {
    if (y > pageHeight - 110) {
      doc.addPage()
      y = margin
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
    doc.text(secao.titulo, margin, y)
    y += 16
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    const texto = htmlParaTexto(secao.texto) || '(sem conteúdo preenchido)'
    for (const paragrafo of texto.split('\n')) {
      const linhas = doc.splitTextToSize(paragrafo || ' ', larguraUtil)
      for (const linha of linhas) {
        if (y > pageHeight - 60) {
          doc.addPage()
          y = margin
        }
        doc.text(linha, margin, y)
        y += 13
      }
      y += 3
    }
    y += 10
  }

  if (y > pageHeight - 90) {
    doc.addPage()
    y = margin
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
  doc.text('Unidades de avaliação', margin, y)
  y += 10
  y =
    executarAutoTable(doc, {
      startY: y,
      theme: 'grid',
      styles: { fontSize: 9 },
      head: [['Unidade de avaliação']],
      body: dados.unidadesAvaliacao.map((u) => [u]),
      headStyles: { fillColor: primaria },
      margin: { left: margin, right: margin },
    }) + 20

  if (y > pageHeight - 90) {
    doc.addPage()
    y = margin
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
  doc.text('Inventário de riscos ocupacionais', margin, y)
  y += 10
  y =
    executarAutoTable(doc, {
      startY: y,
      theme: 'grid',
      styles: { fontSize: 8 },
      head: [['Unidade', 'Agente/perigo', 'Trilha', 'S', 'P', 'Categoria']],
      body: dados.inventario.map((l) => [
        l.unidade,
        l.agente,
        l.trilha,
        String(l.severidade),
        String(l.probabilidade),
        l.categoria,
      ]),
      headStyles: { fillColor: primaria },
      margin: { left: margin, right: margin },
    }) + 20

  if (y > pageHeight - 140) {
    doc.addPage()
    y = margin
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
  doc.text('Plano de ação', margin, y)
  y += 10
  executarAutoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 8 },
    head: [['Medida', 'Responsável', 'Prazo', 'Status', 'Prioridade']],
    body: dados.planoAcao.map((a) => [a.medida, a.responsavel, a.prazo, a.status, a.prioridade]),
    headStyles: { fillColor: primaria },
    margin: { left: margin, right: margin },
  })

  if (dados.conclusoesFuncao && dados.conclusoesFuncao.length > 0) {
    y = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y
    y += 20
    if (y > pageHeight - 140) {
      doc.addPage()
      y = margin
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
    doc.text('Conclusões por função', margin, y)
    y += 10
    executarAutoTable(doc, {
      startY: y,
      theme: 'grid',
      styles: { fontSize: 7.5 },
      head: [['Função', 'Agente/perigo', 'Régua', 'Dado usado', 'Conclusão', 'Justificativa']],
      body: dados.conclusoesFuncao.map((l) => [
        l.funcao,
        l.agente,
        l.regua,
        l.dadoUsado,
        l.conclusao,
        l.justificativa || '—',
      ]),
      headStyles: { fillColor: primaria },
      margin: { left: margin, right: margin },
    })
  }

  if (dados.assinatura) {
    y = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y
    y += 30
    if (y > pageHeight - 90) {
      doc.addPage()
      y = margin
    }
    doc.setDrawColor(primaria[0], primaria[1], primaria[2])
    doc.line(margin, y, pageWidth - margin, y)
    y += 18
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
    doc.text('Assinatura eletrônica', margin, y)
    y += 15
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.text(
      `${dados.assinatura.nome}${dados.assinatura.registro ? ` — ${dados.assinatura.registro}` : ''}`,
      margin,
      y,
    )
    y += 13
    doc.text(
      `Identidade confirmada por senha em ${dados.assinatura.confirmadaEm.toLocaleString('pt-BR')}`,
      margin,
      y,
    )
    y += 13
    doc.setTextColor(60, 90, 200)
    doc.textWithLink(`Verificar autenticidade: ${dados.assinatura.linkVerificacao}`, margin, y, {
      url: dados.assinatura.linkVerificacao,
    })
    doc.setTextColor(0, 0, 0)
    y += 13
  }

  const dadosOrg = identidade?.dados
  const linhaOrganizacao = [
    dadosOrg?.razao_social || dados.organizacaoNome,
    dadosOrg?.cnpj ? `CNPJ ${dadosOrg.cnpj}` : '',
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

  return doc
}

export const nomeArquivoPgr = (empresaNome: string, versao: number) =>
  nomeArquivoDocumentoSst('pgr', empresaNome, versao)

/** Nome de arquivo para qualquer um dos 4 tipos de documento SST (PGR,
 * LTCAT, laudo de insalubridade ou de periculosidade). */
export const nomeArquivoDocumentoSst = (tipo: string, empresaNome: string, versao: number) => {
  const slug = empresaNome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${tipo}-${slug || 'empresa'}-v${versao}.pdf`
}

export const hashSha256 = async (blob: Blob) => {
  const buffer = await blob.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
