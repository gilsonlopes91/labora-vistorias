/* Documentos de SST (PGR, LTCAT, laudos) — migration 0148. Um documento é um
 * "rascunho" editável por seções até ser emitido; a partir daí fica travado
 * (o backend bloqueia updates com status = 'emitido') e qualquer alteração
 * exige uma nova revisão, encadeada por documento_anterior_id. */
import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export type TipoDocumentoSst = 'pgr' | 'ltcat' | 'insalubridade' | 'periculosidade'
export type StatusDocumentoSst = 'rascunho' | 'em_revisao' | 'emitido' | 'substituido'

export interface SecaoDocumento {
  id: string
  titulo: string
  ativo: boolean
  ordem: number
  texto: string
}

export interface DocumentoSst extends RecordModel {
  id: string
  organizacao_id: string
  empresa_id: string
  tipo: TipoDocumentoSst
  titulo: string
  versao?: number
  status: StatusDocumentoSst
  motivo_revisao?: string
  matriz_id?: string
  matriz_snapshot?: Record<string, unknown>
  responsaveis_tecnicos_ids?: string[]
  elaboradores?: string
  data_avaliacao_campo?: string
  data_emissao?: string
  vigencia_ate?: string
  proxima_revisao?: string
  secoes?: SecaoDocumento[]
  abrangencia_ghe_ids?: string[]
  pdf?: string
  pdf_hash_sha256?: string
  dados_emissao?: Record<string, unknown>
  emitido_por?: string
  link_publico_chave?: string
  link_publico_ativo?: boolean
  documento_anterior_id?: string
  created: string
  updated: string
}

export type DocumentoSstInput = Partial<Omit<DocumentoSst, 'id' | 'created' | 'updated'>> & {
  organizacao_id: string
  empresa_id: string
  tipo: TipoDocumentoSst
  titulo: string
  status: StatusDocumentoSst
}

/** Seções padrão de um PGR novo (texto livre; inventário e plano de ação
 * entram no PDF direto dos dados atuais, não como seção editável aqui). */
export const secoesPadraoPgr = (): SecaoDocumento[] => [
  {
    id: crypto.randomUUID(),
    titulo: 'Objetivo e campo de aplicação',
    ativo: true,
    ordem: 0,
    texto: '',
  },
  { id: crypto.randomUUID(), titulo: 'Base legal', ativo: true, ordem: 1, texto: '' },
  {
    id: crypto.randomUUID(),
    titulo: 'Metodologia de avaliação de riscos',
    ativo: true,
    ordem: 2,
    texto: '',
  },
  { id: crypto.randomUUID(), titulo: 'Conclusões', ativo: true, ordem: 3, texto: '' },
  { id: crypto.randomUUID(), titulo: 'Recomendações gerais', ativo: true, ordem: 4, texto: '' },
]

export const getDocumentosSst = (empresaId: string, tipo: TipoDocumentoSst) =>
  pb.collection('documentos_sst').getFullList<DocumentoSst>({
    filter: `empresa_id = "${empresaId}" && tipo = "${tipo}"`,
    sort: '-created',
  })

export const getDocumentoSst = (id: string) =>
  pb.collection('documentos_sst').getOne<DocumentoSst>(id)

export const createDocumentoSst = (data: DocumentoSstInput) =>
  pb.collection('documentos_sst').create<DocumentoSst>(data)

export const updateDocumentoSst = (id: string, data: Partial<DocumentoSstInput>) =>
  pb.collection('documentos_sst').update<DocumentoSst>(id, data)

export const deleteDocumentoSst = (id: string) => pb.collection('documentos_sst').delete(id)

/** Cria um novo rascunho a partir de um documento emitido, para poder editar
 * de novo (o documento emitido em si nunca é alterado). */
export const revisarDocumentoSst = (documento: DocumentoSst, motivoRevisao: string) =>
  pb.collection('documentos_sst').create<DocumentoSst>({
    organizacao_id: documento.organizacao_id,
    empresa_id: documento.empresa_id,
    tipo: documento.tipo,
    titulo: documento.titulo,
    status: 'rascunho',
    motivo_revisao: motivoRevisao,
    elaboradores: documento.elaboradores,
    responsaveis_tecnicos_ids: documento.responsaveis_tecnicos_ids,
    secoes: documento.secoes,
    documento_anterior_id: documento.id,
  })

/** Emite o documento: trava a versão, anexa o PDF gerado e, se for revisão
 * de um documento anterior, marca o anterior como substituído. */
export const emitirDocumentoSst = async (
  documento: DocumentoSst,
  dados: {
    matriz_id?: string
    matriz_snapshot?: Record<string, unknown>
    dados_emissao: Record<string, unknown>
    emitido_por: string
  },
  pdfBlob: Blob,
  nomeArquivo: string,
  pdfHashSha256: string,
) => {
  const proximaVersao = (documento.versao || 0) + 1
  const fd = new FormData()
  fd.append('status', 'emitido')
  fd.append('versao', String(proximaVersao))
  if (dados.matriz_id) fd.append('matriz_id', dados.matriz_id)
  if (dados.matriz_snapshot) fd.append('matriz_snapshot', JSON.stringify(dados.matriz_snapshot))
  fd.append('dados_emissao', JSON.stringify(dados.dados_emissao))
  fd.append('data_emissao', new Date().toISOString())
  fd.append('emitido_por', dados.emitido_por)
  fd.append('pdf_hash_sha256', pdfHashSha256)
  fd.append('pdf', new File([pdfBlob], nomeArquivo, { type: 'application/pdf' }))
  const emitido = await pb.collection('documentos_sst').update<DocumentoSst>(documento.id, fd)
  if (documento.documento_anterior_id) {
    await pb.collection('documentos_sst').update(documento.documento_anterior_id, {
      status: 'substituido',
    })
  }
  return emitido
}

export const getTokenArquivos = () => pb.files.getToken()

export const pdfUrlDocumentoSst = (documento: DocumentoSst, token?: string) =>
  documento.pdf ? pb.files.getURL(documento, documento.pdf, token ? { token } : undefined) : null
