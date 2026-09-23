/* Extração de linhas de texto de um PDF no navegador, com pdf.js carregado
   sob demanda do CDN (não entra no bundle do app). */

const PDFJS_VER = '4.10.38'
const CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VER}/build`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let libPromise: Promise<any> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function carregarPdfJs(): Promise<any> {
  if (!libPromise) {
    libPromise = import(/* @vite-ignore */ `${CDN}/pdf.min.mjs`).then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = `${CDN}/pdf.worker.min.mjs`
      return lib
    })
    libPromise.catch(() => {
      libPromise = null
    })
  }
  return libPromise
}

interface Pedaco {
  x: number
  y: number
  w: number
  h: number
  s: string
  esp?: boolean // havia um espaço explícito antes deste trecho
}

/** Agrupa os trechos de texto de cada página em linhas (mesma altura), da esquerda para a direita. */
export async function linhasDoDocumento(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  onProgresso?: (p: number, total: number) => void,
): Promise<string[]> {
  const out: string[] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const tc = await page.getTextContent()
    const pedacos: Pedaco[] = []
    let espaco = false
    for (const it of tc.items) {
      if (!('str' in it)) continue
      const s = it.str as string
      if (!s || !s.trim()) {
        espaco = true
        continue
      }
      pedacos.push({
        x: it.transform[4],
        y: it.transform[5],
        w: it.width,
        h: Math.abs(it.transform[3]) || it.height || 10,
        s,
        esp: espaco || /^\s/.test(s),
      })
      espaco = /\s$/.test(s)
    }
    pedacos.sort((a, b) => b.y - a.y || a.x - b.x)
    const linhas: Pedaco[][] = []
    for (const pc of pedacos) {
      const ult = linhas[linhas.length - 1]
      const tol = Math.max(2, Math.min(pc.h, 12) * 0.45)
      if (ult && Math.abs(ult[0].y - pc.y) <= tol) ult.push(pc)
      else linhas.push([pc])
    }
    for (const ln of linhas) {
      ln.sort((a, b) => a.x - b.x)
      let txt = ''
      let fim = -Infinity
      for (const pc of ln) {
        if (txt && (pc.x - fim > 0.8 || (pc.esp && pc.x - fim > -0.5))) txt += ' '
        txt += pc.s
        fim = pc.x + pc.w
      }
      out.push(txt.replace(/\s+/g, ' ').trim())
    }
    out.push('')
    page.cleanup?.()
    onProgresso?.(p, doc.numPages)
  }
  return out
}

export async function extrairLinhasPdf(
  file: File,
  onProgresso?: (p: number, total: number) => void,
): Promise<string[]> {
  const lib = await carregarPdfJs()
  const data = new Uint8Array(await file.arrayBuffer())
  const doc = await lib.getDocument({ data }).promise
  try {
    return await linhasDoDocumento(doc, onProgresso)
  } finally {
    doc.destroy?.()
  }
}
