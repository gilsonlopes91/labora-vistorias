/* Aplica uma marca d'água (faixa cinza com data/hora, coordenadas e logo da
 * organização) na foto antes do upload — usado nas fotos da execução da
 * vistoria. Se algo falhar no processo, devolve a foto original em vez de
 * travar o envio. */

export interface OpcoesMarcaDagua {
  dataHora: Date
  localizacao?: { lat: number; lon: number }
  logoUrl?: string | null
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Falha ao carregar imagem'))
    img.src = src
  })
}

export async function aplicarMarcaDagua(file: File, opcoes: OpcoesMarcaDagua): Promise<File> {
  try {
    const objectUrl = URL.createObjectURL(file)
    let foto: HTMLImageElement
    try {
      foto = await carregarImagem(objectUrl)
    } finally {
      URL.revokeObjectURL(objectUrl)
    }

    // Foto de celular (12 MP ou mais) reduzida para no máximo 2000 px no lado
    // maior: continua nítida no relatório e sobe bem mais rápido no 4G.
    const LADO_MAXIMO = 2000
    const escala = Math.min(1, LADO_MAXIMO / Math.max(foto.naturalWidth, foto.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(foto.naturalWidth * escala)
    canvas.height = Math.round(foto.naturalHeight * escala)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(foto, 0, 0, canvas.width, canvas.height)

    const faixaAltura = Math.max(56, Math.round(canvas.height * 0.09))
    const faixaY = canvas.height - faixaAltura
    ctx.fillStyle = 'rgba(32, 32, 32, 0.72)'
    ctx.fillRect(0, faixaY, canvas.width, faixaAltura)

    const paddingX = Math.round(faixaAltura * 0.3)
    let textoX = paddingX

    if (opcoes.logoUrl) {
      try {
        const logo = await carregarImagem(opcoes.logoUrl)
        const logoAltura = faixaAltura * 0.68
        const logoLargura = logoAltura * (logo.naturalWidth / logo.naturalHeight)
        ctx.drawImage(
          logo,
          paddingX,
          faixaY + (faixaAltura - logoAltura) / 2,
          logoLargura,
          logoAltura,
        )
        textoX = paddingX + logoLargura + paddingX
      } catch {
        // sem logo disponível (falha de rede/CORS) — segue só com o texto
      }
    }

    const dataFormatada = opcoes.dataHora.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    const fonteBase = Math.max(13, Math.round(faixaAltura * 0.3))
    ctx.textBaseline = 'middle'

    ctx.font = `600 ${fonteBase}px sans-serif`
    ctx.fillStyle = '#ffffff'
    ctx.fillText(dataFormatada, textoX, faixaY + faixaAltura * (opcoes.localizacao ? 0.36 : 0.5))

    if (opcoes.localizacao) {
      const coordTexto = `Lat ${opcoes.localizacao.lat.toFixed(5)}  Lon ${opcoes.localizacao.lon.toFixed(5)}`
      ctx.font = `400 ${Math.round(fonteBase * 0.82)}px sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillText(coordTexto, textoX, faixaY + faixaAltura * 0.68)
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85),
    )
    if (!blob) return file

    const novoNome = file.name.replace(/\.\w+$/, '') + '.jpg'
    return new File([blob], novoNome, { type: 'image/jpeg' })
  } catch {
    return file
  }
}
