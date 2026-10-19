/* Console de contas — galeria do documento: o PDF de exemplo (empresa fictícia) gerado
 * pelo mesmo motor da emissão, para conferir o visual sem precisar de uma empresa real. */
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import AdminNav from '@/components/admin/AdminNav'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { documentoLavajato } from '@/lib/documento/fixtures/lavajato'

export default function GaleriaDocumento() {
  const [url, setUrl] = useState<string | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let vivo = true
    let criada: string | null = null
    import('@/lib/documento/pdf')
      .then(({ gerarPdfDocumento }) => gerarPdfDocumento(documentoLavajato))
      .then((blob) => {
        if (!vivo) return
        criada = URL.createObjectURL(blob)
        setUrl(criada)
      })
      .catch((e) => vivo && setErro(getErrorMessage(e)))
    return () => {
      vivo = false
      if (criada) URL.revokeObjectURL(criada)
    }
  }, [])

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Galeria do documento</h1>
        <p className="text-sm text-muted-foreground">
          Documento de exemplo (lava-jato fictício) gerado pelo motor de documentos da Labora.
        </p>
      </div>
      <AdminNav />
      <div className="h-[80vh] overflow-hidden rounded-lg border bg-muted/30">
        {erro ? (
          <div className="p-4 text-sm text-destructive">Não foi possível gerar: {erro}</div>
        ) : url ? (
          <iframe src={url} title="Documento de exemplo" className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Gerando o PDF...
          </div>
        )}
      </div>
    </div>
  )
}
