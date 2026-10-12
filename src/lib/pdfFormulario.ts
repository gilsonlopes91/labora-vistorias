/* Formulário de campo preenchido no PDF.
   - desenharFormularioNoPdf: desenha um registro (campos, medições em tabela,
     resultado dos cálculos, fotos e assinatura) num documento já aberto. Usado
     pelo relatório da vistoria e pelos PDFs abaixo.
   - gerarPdfFormularios: documento próprio com um ou vários formulários de
     uma empresa (PDF individual e "tudo em um PDF" na página da empresa). */
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
  clarear,
  ehOrganizacaoLabora,
  hexParaRgb,
  type RGB,
} from '@/lib/identidadeVisual'
import { carregarImagemComoDataUrl, executarAutoTable } from '@/lib/relatorioVistoria'
import { getTokenArquivos } from '@/services/respostasVistoria'
import { urlAnexo, type Formulario } from '@/services/registrosFormulario'
import type { CampoFormulario } from '@/services/formularios'
import laboraLogoUrl from '@/assets/projeto-labora-engenharia-e-sst-07-83499.png'

export interface ContextoPdfFormulario {
  doc: jsPDF
  margin: number
  primaria: RGB
  secundaria: RGB
  /** Token dos arquivos protegidos, renovado por quem chama. */
  tokenAtual: () => Promise<string>
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
  const { doc, margin, primaria, secundaria, tokenAtual } = ctx
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const larguraUtil = pageWidth - margin * 2
  const faixa = clarear(primaria, 0.85)
  const dados = (item.registro.dados || {}) as Record<string, unknown>
  let y = yInicial

  const garantirEspaco = (altura: number) => {
    if (y + altura > pageHeight - 60) {
      doc.addPage()
      y = margin
    }
  }

  // Título do formulário numa faixa na cor da organização.
  garantirEspaco(90)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  const linhasTitulo: string[] = doc.splitTextToSize(item.titulo.toUpperCase(), larguraUtil - 12)
  doc.setFillColor(faixa[0], faixa[1], faixa[2])
  doc.rect(margin, y - 12, larguraUtil, 6 + linhasTitulo.length * 13, 'F')
  doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
  doc.text(linhasTitulo, margin + 6, y)
  doc.setTextColor(0, 0, 0)
  y += 4 + linhasTitulo.length * 13

  const dataCampo = item.registro.data_campo || item.registro.created
  const situacao = item.registro.status === 'concluido' ? 'Concluído' : 'Rascunho (não concluído)'
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(110)
  doc.text(
    [
      dataCampo ? `Preenchido em ${formatBrazilianDate(dataCampo)}` : '',
      situacao,
      item.detalhe || '',
    ]
      .filter(Boolean)
      .join('  ·  '),
    margin,
    y,
  )
  doc.setTextColor(0)
  y += 14

  // Campos simples vão juntos numa tabela de duas colunas (campo | valor).
  let linhas: string[][] = []
  const descarregar = () => {
    if (!linhas.length) return
    const fim = executarAutoTable(doc, {
      startY: y,
      body: linhas,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4, valign: 'top', overflow: 'linebreak' },
      columnStyles: { 0: { cellWidth: 190, fontStyle: 'bold', fillColor: [248, 248, 248] } },
      margin: { left: margin, right: margin },
    })
    y = (fim || y) + 10
    linhas = []
  }

  const subtitulo = (texto: string) => {
    garantirEspaco(40)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.text(texto, margin, y)
    doc.setFont('helvetica', 'normal')
    y += 8
  }

  for (const campo of item.campos) {
    if (!campoVisivel(campo, dados)) continue
    const valor = dados[campo.id]

    if (campo.tipo === 'secao') {
      descarregar()
      garantirEspaco(50)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
      doc.text(campo.nome, margin, y + 4)
      doc.setTextColor(0)
      doc.setDrawColor(primaria[0], primaria[1], primaria[2])
      doc.line(margin, y + 8, pageWidth - margin, y + 8)
      y += 20
      continue
    }

    if (TIPOS_SIMPLES.has(campo.tipo)) {
      linhas.push([campo.nome, valorEmTexto(campo, valor)])
      continue
    }

    if (campo.tipo === 'calculo') {
      linhas.push([`${campo.nome} (automático)`, calcularCampo(campo, dados) || '—'])
      continue
    }

    if (campo.tipo === 'calculo_tecnico') {
      descarregar()
      const r = calcularTecnico(campo as unknown as CampoCalculoTecnico, dados)
      if (!r) continue
      if (r.faltando.length) {
        linhas.push([campo.nome, `Cálculo incompleto. Falta: ${r.faltando.join('; ')}.`])
        continue
      }
      subtitulo(campo.nome)
      const fim = executarAutoTable(doc, {
        startY: y,
        body: r.linhas.map(([rotulo, v]) => [rotulo, v]),
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 0: { cellWidth: 260 }, 1: { fontStyle: 'bold', halign: 'right' } },
        margin: { left: margin, right: margin },
      })
      y = (fim || y) + 12
      for (const c of r.conclusoes) {
        const partes: string[] = doc.splitTextToSize(c.texto, larguraUtil)
        garantirEspaco(partes.length * 11 + 4)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        if (c.acima) doc.setTextColor(180, 40, 40)
        doc.text(partes, margin, y)
        doc.setTextColor(0)
        y += partes.length * 11 + 2
      }
      for (const aviso of r.avisos) {
        const partes: string[] = doc.splitTextToSize(`Observação: ${aviso}`, larguraUtil)
        garantirEspaco(partes.length * 10 + 4)
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(8)
        doc.setTextColor(110)
        doc.text(partes, margin, y)
        doc.setTextColor(0)
        y += partes.length * 10 + 2
      }
      doc.setFont('helvetica', 'normal')
      y += 8
      continue
    }

    if (campo.tipo === 'repetivel') {
      const instancias = normalizarInstancias(valor)
      const subcampos = campo.subcampos || []
      if (!instancias.length || !subcampos.length) {
        linhas.push([campo.nome, 'Nenhum registro'])
        continue
      }
      descarregar()
      subtitulo(campo.nome)
      const fim = executarAutoTable(doc, {
        startY: y,
        head: [['Nº', ...subcampos.map((s) => s.nome + (s.unidade ? ` (${s.unidade})` : ''))]],
        body: instancias.map((inst, i) => [
          String(i + 1),
          ...subcampos.map((s) => valorEmTexto(s, inst[s.id])),
        ]),
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 3.5, overflow: 'linebreak' },
        headStyles: { fillColor: primaria },
        columnStyles: { 0: { cellWidth: 26, halign: 'center' } },
        margin: { left: margin, right: margin },
      })
      y = (fim || y) + 12
      continue
    }

    if (campo.tipo === 'foto') {
      const fotos = listaArquivos(valor)
      if (!fotos.length) {
        linhas.push([campo.nome, 'Sem foto'])
        continue
      }
      descarregar()
      subtitulo(campo.nome)
      y += 4
      const alturaFoto = 150
      const larguraMax = 210
      let x = margin
      garantirEspaco(alturaFoto + 10)
      for (const nome of fotos) {
        const imagem = await carregarImagemComoDataUrl(
          urlAnexo(item.registro, nome, await tokenAtual()),
          { sempreJpeg: true },
        )
        if (!imagem) continue
        const largura = Math.min(larguraMax, alturaFoto * (imagem.largura / imagem.altura))
        if (x + largura > pageWidth - margin) {
          x = margin
          y += alturaFoto + 10
          garantirEspaco(alturaFoto + 10)
        }
        doc.addImage(imagem.dataUrl, 'JPEG', x, y, largura, alturaFoto)
        x += largura + 10
      }
      y += alturaFoto + 16
      continue
    }

    if (campo.tipo === 'assinatura') {
      const nome = listaArquivos(valor)[0]
      if (!nome) {
        linhas.push([campo.nome, 'Sem assinatura'])
        continue
      }
      descarregar()
      const imagem = await carregarImagemComoDataUrl(
        urlAnexo(item.registro, nome, await tokenAtual()),
        { maxDimensao: 600 },
      )
      garantirEspaco(90)
      if (imagem) {
        const altura = 50
        const largura = Math.min(200, altura * (imagem.largura / imagem.altura))
        const formato = imagem.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
        doc.addImage(imagem.dataUrl, formato, margin, y, largura, altura)
        y += altura + 4
      }
      doc.setDrawColor(0)
      doc.line(margin, y, margin + 200, y)
      y += 11
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(campo.nome, margin, y)
      y += 18
      continue
    }
  }
  descarregar()
  return y
}

interface DadosPdfFormularios {
  formularios: FormularioParaPdf[]
  empresa: { nome: string; cnpj?: string; endereco?: string }
  /** Título do documento (o nome do formulário, no PDF individual). */
  titulo: string
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
  const larguraUtil = pageWidth - margin * 2
  let y = margin

  doc.setFillColor(primaria[0], primaria[1], primaria[2])
  doc.rect(0, 0, pageWidth, 8, 'F')

  const logoUrl = identidade.logoUrl || (ehOrganizacaoLabora(identidade.nome) ? laboraLogoUrl : '')
  const logo = await carregarImagemComoDataUrl(logoUrl, { maxDimensao: 300 })
  if (logo) {
    const altura = 38
    const formato = logo.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
    doc.addImage(logo.dataUrl, formato, margin, y, altura * (logo.largura / logo.altura), altura)
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(secundaria[0], secundaria[1], secundaria[2])
  doc.text(identidade.nome || '', pageWidth - margin, y + 14, { align: 'right' })
  doc.setTextColor(0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Registro de avaliação de campo', pageWidth - margin, y + 28, { align: 'right' })
  y += 52
  doc.setDrawColor(primaria[0], primaria[1], primaria[2])
  doc.setLineWidth(1.2)
  doc.line(margin, y, pageWidth - margin, y)
  doc.setLineWidth(0.5)
  y += 22

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  const linhasTitulo: string[] = doc.splitTextToSize(d.titulo, larguraUtil)
  doc.text(linhasTitulo, margin, y)
  y += linhasTitulo.length * 17 + 6

  const fimDados = executarAutoTable(doc, {
    startY: y,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 110 } },
    body: [
      ['Empresa', d.empresa.nome],
      ['CNPJ', d.empresa.cnpj || '-'],
      ['Endereço', d.empresa.endereco || '-'],
      ...(d.formularios.length > 1
        ? [['Formulários', d.formularios.map((f) => f.titulo).join('\n')]]
        : []),
    ],
    margin: { left: margin, right: margin },
  })
  y = (fimDados || y) + 26

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

  const ctx: ContextoPdfFormulario = { doc, margin, primaria, secundaria, tokenAtual }
  for (let i = 0; i < d.formularios.length; i++) {
    // Cada formulário começa numa página nova, a partir do segundo.
    if (i > 0) {
      doc.addPage()
      y = margin + 12
    }
    y = await desenharFormularioNoPdf(ctx, d.formularios[i], y)
  }

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
