import { reduzirImagem } from '@/lib/reduzirImagem'

/** Maior lado, em pixels, do logo embutido no PDF. O logo se repete em todas
 *  as páginas, então o tamanho dele multiplica o tamanho do arquivo. */
const LOGO_PDF_MAX_LADO_PX = 600

/** Baixa uma imagem (logo), reduz e devolve como data URL, para o PDF embutir. Devolve null se não conseguir (sem logo, CORS etc.). */
export async function carregarImagemComoDataUrl(url: string): Promise<string | null> {
  try {
    const resposta = await fetch(url)
    if (!resposta.ok) return null
    const blob = await reduzirImagem(await resposta.blob(), LOGO_PDF_MAX_LADO_PX)
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
