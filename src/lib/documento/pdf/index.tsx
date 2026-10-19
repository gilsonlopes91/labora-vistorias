import { pdf } from '@react-pdf/renderer'
import type { Documento } from '../modelo'
import { DocumentoPdf } from './DocumentoPdf'
import { registrarFontes, type FontesPoppins } from './fontes'

/** Gera o PDF no navegador. Importar este módulo com import() dinâmico, só na hora de emitir ou pré-visualizar. */
export async function gerarPdfDocumento(doc: Documento, fontes?: FontesPoppins): Promise<Blob> {
  registrarFontes(fontes)
  return pdf(<DocumentoPdf doc={doc} />).toBlob()
}
