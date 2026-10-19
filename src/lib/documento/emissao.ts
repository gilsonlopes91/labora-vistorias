import QRCode from 'qrcode'
import { carregarDadosDocumento, type DadosDocumento } from '@/lib/modelosSst/dados'
import type { DocumentoRenderizado } from '@/lib/modelosSst/renderizar'
import { carregarModelo, renderizarDocumento, resolverEscolhas } from '@/lib/modelosSst'
import { urlLogoEmpresa } from '@/services/empresas'
import type { DocumentoSst, TipoDocumentoSst } from '@/services/documentosSst'
import { carregarImagemComoDataUrl } from './imagens'
import type { Assinatura, Documento, Marca } from './modelo'
import { montarDocumento } from './montar/documento'

export interface ArgsGeracao {
  empresaId: string
  tipo: TipoDocumentoSst
  /** documento salvo mais as edições da tela (selecionado + f) */
  documento: Partial<DocumentoSst>
  titulo: string
  /** sem assinatura = pré-visualização */
  assinatura?: { nome: string; registro?: string; confirmadaEm: Date; link: string }
  /** na emissão: falha antes de gerar o PDF se faltar um campo obrigatório */
  exigirCamposCriticos?: boolean
}

export interface ResultadoGeracao {
  blob: Blob
  documento: Documento
  renderizado: DocumentoRenderizado
  dados: DadosDocumento
}

async function montarMarca(dados: DadosDocumento): Promise<Marca> {
  const org = dados.organizacao
  const logoCliente = urlLogoEmpresa(dados.empresa)
  return {
    organizacaoNome: org.nome,
    razaoSocial: org.dados?.razao_social || undefined,
    cnpj: org.dados?.cnpj || undefined,
    corPrimaria: org.corPrimaria,
    corSecundaria: org.corSecundaria,
    logoOrganizacao: org.logoUrl ? await carregarImagemComoDataUrl(org.logoUrl) : null,
    logoCliente: logoCliente ? await carregarImagemComoDataUrl(logoCliente) : null,
  }
}

async function montarAssinatura(a?: ArgsGeracao['assinatura']): Promise<Assinatura | undefined> {
  if (!a) return undefined
  return {
    nome: a.nome,
    registro: a.registro,
    confirmadaEm: a.confirmadaEm.toLocaleString('pt-BR'),
    link: a.link,
    qrDataUrl: await QRCode.toDataURL(a.link, { margin: 0, width: 160 }),
  }
}

/** Carrega os dados, monta o documento e gera o PDF (no navegador, como blob). */
export async function gerarDocumentoPdf(args: ArgsGeracao): Promise<ResultadoGeracao> {
  const dados = await carregarDadosDocumento(args.empresaId, args.documento, args.tipo)
  const modelo = carregarModelo(args.tipo)
  const escolhas = resolverEscolhas(modelo, dados, args.documento.alternativas)
  const renderizado = renderizarDocumento(modelo, args.documento.secoes || [], dados, escolhas)
  if (args.exigirCamposCriticos && renderizado.camposCriticosVazios.length > 0) {
    throw new Error(
      `Faltam dados obrigatórios para emitir: ${renderizado.camposCriticosVazios.join(', ')}`,
    )
  }
  const [marca, assinatura] = await Promise.all([
    montarMarca(dados),
    montarAssinatura(args.assinatura),
  ])
  const documento = montarDocumento({ dados, renderizado, marca, titulo: args.titulo, assinatura })
  const { gerarPdfDocumento } = await import('./pdf')
  const blob = await gerarPdfDocumento(documento)
  return { blob, documento, renderizado, dados }
}
