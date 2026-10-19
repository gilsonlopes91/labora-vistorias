/** Baixa uma imagem (logo) e devolve como data URL, para o PDF embutir. Devolve null se não conseguir (sem logo, CORS etc.). */
export async function carregarImagemComoDataUrl(url: string): Promise<string | null> {
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
