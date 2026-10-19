/* Pré-visualização do documento: gera o mesmo PDF da emissão, sem assinatura nem QR,
 * e mostra ao lado o que ainda falta preencher. Nada é gravado. */
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { gerarDocumentoPdf, type ArgsGeracao } from '@/lib/documento/emissao'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Pendencia {
  campo: string
  descricao: string
}

interface Props {
  aberto: boolean
  onFechar: () => void
  /** mesmos argumentos da emissão, sem assinatura */
  args: Omit<ArgsGeracao, 'assinatura' | 'exigirCamposCriticos'> | null
}

export function Previa({ aberto, onFechar, args }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [pendencias, setPendencias] = useState<Pendencia[]>([])
  const [erro, setErro] = useState('')
  const [gerando, setGerando] = useState(false)
  // A prévia usa o que estava na tela quando foi aberta; mudar os argumentos
  // depois (a cada digitação) não deve gerar o PDF de novo.
  const argsRef = useRef(args)
  argsRef.current = args

  useEffect(() => {
    const atuais = argsRef.current
    if (!aberto || !atuais) return
    let vivo = true
    let criada: string | null = null
    setGerando(true)
    setErro('')
    setUrl(null)
    gerarDocumentoPdf(atuais)
      .then((r) => {
        if (!vivo) return
        criada = URL.createObjectURL(r.blob)
        setUrl(criada)
        setPendencias(
          r.renderizado.pendencias.map((p) => ({ campo: p.campo, descricao: p.descricao })),
        )
      })
      .catch((e) => vivo && setErro(getErrorMessage(e)))
      .finally(() => vivo && setGerando(false))
    return () => {
      vivo = false
      if (criada) URL.revokeObjectURL(criada)
    }
  }, [aberto])

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="flex h-[90vh] max-w-6xl flex-col">
        <DialogHeader>
          <DialogTitle>Pré-visualização do documento</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Esta é uma prévia: não tem a assinatura eletrônica nem o QR de verificação, que só entram
          na emissão.
        </p>
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-h-0 overflow-hidden rounded-lg border bg-muted/30">
            {gerando ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Montando o documento...
              </div>
            ) : erro ? (
              <div className="p-4 text-sm text-destructive">
                Não foi possível montar a prévia: {erro}
              </div>
            ) : url ? (
              <iframe src={url} title="Prévia do documento" className="h-full w-full" />
            ) : null}
          </div>
          <aside className="min-h-0 overflow-y-auto text-sm">
            <h3 className="mb-2 font-semibold">O que falta preencher</h3>
            {gerando ? null : pendencias.length === 0 ? (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" /> Nenhuma pendência.
              </p>
            ) : (
              <ul className="space-y-2">
                {pendencias.map((p, i) => (
                  <li key={i} className="flex gap-1.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{p.descricao}</span>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default Previa
