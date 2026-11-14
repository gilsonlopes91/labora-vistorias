/** Reduz uma imagem para caber em `maxLado` pixels no maior lado e devolve em
 *  PNG (mantém a transparência do logo). Devolve a própria imagem quando ela já
 *  é menor ou quando o navegador não consegue reduzir.
 *
 *  Existe porque um logo pesado, repetido no cabeçalho de todas as páginas,
 *  fazia o PDF dos documentos de SST passar de 40 MB e o envio ser recusado. */
export async function reduzirImagem(origem: Blob, maxLado: number): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(origem)
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * escala))
    canvas.height = Math.max(1, Math.round(bitmap.height * escala))
    const ctx = canvas.getContext('2d')
    if (!ctx) return origem
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const reduzida = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    )
    return reduzida && reduzida.size < origem.size ? reduzida : origem
  } catch {
    return origem
  }
}

/** Maior lado, em pixels, do logo guardado no cadastro (organização e empresa). */
export const LOGO_MAX_LADO_PX = 800

/** Logo pronto para enviar: mesmo nome de arquivo, já reduzido. */
export async function reduzirLogo(logo: File): Promise<File> {
  const reduzida = await reduzirImagem(logo, LOGO_MAX_LADO_PX)
  return reduzida === logo ? logo : new File([reduzida], logo.name, { type: 'image/png' })
}
