/* Mostra um PDF gerado no app dentro de uma janela, página por página, sem
   precisar baixar. Desenha as páginas com o pdf.js (carregado do CDN só
   quando abre), o que funciona também no celular, onde o navegador nem
   sempre mostra PDF dentro da página. Se o pdf.js não carregar, usa o
   visualizador do próprio navegador. */
import { useEffect, useRef, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Download, X } from 'lucide-react'

import { carregarPdfJs } from '@/lib/leitorPdf'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog'

export interface PdfParaVer {
  blob: Blob
  nome: string
}

export function baixarPdf(pdf: PdfParaVer) {
  const url = URL.createObjectURL(pdf.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = pdf.nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export default function VisualizadorPdf({
  pdf,
  titulo,
  descricao,
  onFechar,
}: {
  pdf: PdfParaVer | null
  titulo: string
  descricao?: string
  onFechar: () => void
}) {
  const paginasRef = useRef<HTMLDivElement>(null)
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'reserva'>('carregando')
  const [urlReserva, setUrlReserva] = useState('')
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!pdf) return
    let cancelado = false
    setEstado('carregando')
    setTotal(0)
    // A janela abre com animação; espera o container ter largura.
    const inicio = setTimeout(async () => {
      const container = paginasRef.current
      try {
        const lib = await carregarPdfJs()
        const dados = new Uint8Array(await pdf.blob.arrayBuffer())
        const doc = await lib.getDocument({ data: dados }).promise
        if (cancelado || !container) return
        container.innerHTML = ''
        setTotal(doc.numPages)
        const largura = Math.max(container.clientWidth - 2, 280)
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        for (let p = 1; p <= doc.numPages; p++) {
          const pagina = await doc.getPage(p)
          if (cancelado) return
          const base = pagina.getViewport({ scale: 1 })
          const viewport = pagina.getViewport({ scale: (largura / base.width) * dpr })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.width = '100%'
          canvas.style.height = 'auto'
          canvas.className = 'block rounded-sm border bg-white shadow-sm'
          canvas.setAttribute('aria-label', `Página ${p} de ${doc.numPages}`)
          container.appendChild(canvas)
          await pagina.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
          if (p === 1 && !cancelado) setEstado('pronto')
        }
        doc.destroy?.()
      } catch {
        if (cancelado) return
        setUrlReserva(URL.createObjectURL(pdf.blob))
        setEstado('reserva')
      }
    }, 150)
    return () => {
      cancelado = true
      clearTimeout(inicio)
    }
  }, [pdf])

  useEffect(() => {
    if (pdf || !urlReserva) return
    URL.revokeObjectURL(urlReserva)
    setUrlReserva('')
  }, [pdf, urlReserva])

  return (
    <Dialog open={!!pdf} onOpenChange={(o) => !o && onFechar()}>
      {/* Camada acima das outras janelas: a prévia pode abrir por cima da
          edição do modelo. */}
      <DialogPortal>
        <DialogOverlay className="z-[60]" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[60] flex h-[92vh] w-[calc(100%-1rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-lg border bg-background p-4 shadow-lg sm:p-6">
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            <DialogDescription>
              {[descricao, total ? `${total} ${total === 1 ? 'página' : 'páginas'}.` : '']
                .filter(Boolean)
                .join(' ') || 'Montando a visualização...'}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-md bg-muted/50 p-2 sm:p-4">
            {estado === 'carregando' && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Montando a visualização...
              </p>
            )}
            {estado === 'reserva' && urlReserva && (
              <iframe
                title={titulo}
                src={urlReserva}
                className="h-full min-h-[60vh] w-full rounded-md"
              />
            )}
            <div
              ref={paginasRef}
              className={estado === 'reserva' ? 'hidden' : 'mx-auto max-w-3xl space-y-3'}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onFechar}>
              Fechar
            </Button>
            {pdf && (
              <Button onClick={() => baixarPdf(pdf)}>
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
            )}
          </DialogFooter>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
