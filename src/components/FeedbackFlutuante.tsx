/* Botão flutuante de sugestões, presente em todas as páginas do app logado.
   O envio cai na caixa de sugestões do administrador (console > Sugestões).
   Pode levar um anexo: print da tela como está no momento ou uma foto/imagem. */
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Camera, ImagePlus, MessageSquarePlus, X } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { enviarFeedback, TIPOS_FEEDBACK, type TipoFeedback } from '@/services/feedbacks'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Fotografa a aba atual (o navegador pede permissão para compartilhar a tela). */
async function capturarTela(): Promise<File> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    preferCurrentTab: true,
  } as DisplayMediaStreamOptions)
  try {
    const video = document.createElement('video')
    video.srcObject = stream
    video.muted = true
    await video.play()
    await pausa(500)
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.85))
    if (!blob) throw new Error('Não foi possível gerar a imagem')
    return new File([blob], 'print-da-tela.jpg', { type: 'image/jpeg' })
  } finally {
    stream.getTracks().forEach((t) => t.stop())
  }
}

export default function FeedbackFlutuante() {
  const location = useLocation()
  const [aberto, setAberto] = useState(false)
  const [tipo, setTipo] = useState<TipoFeedback>('melhoria')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [anexo, setAnexo] = useState<File | null>(null)
  const [previa, setPrevia] = useState('')
  const [capturando, setCapturando] = useState(false)
  const inputArquivo = useRef<HTMLInputElement>(null)
  const podeCapturar = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia

  useEffect(() => {
    if (!anexo) {
      setPrevia('')
      return
    }
    const url = URL.createObjectURL(anexo)
    setPrevia(url)
    return () => URL.revokeObjectURL(url)
  }, [anexo])

  const escolherArquivo = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Envie uma imagem (print ou foto).')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('A imagem passa de 8 MB. Escolha uma menor.')
      return
    }
    setAnexo(file)
  }

  const tirarPrint = async () => {
    setCapturando(true)
    setAberto(false)
    try {
      await pausa(350)
      setAnexo(await capturarTela())
    } catch (error) {
      // Cancelar a janela de compartilhamento não é erro.
      if ((error as { name?: string })?.name !== 'NotAllowedError') {
        toast.error('Não foi possível tirar o print', { description: getErrorMessage(error) })
      }
    } finally {
      setCapturando(false)
      setAberto(true)
    }
  }

  const enviar = async () => {
    setEnviando(true)
    try {
      await enviarFeedback({
        tipo,
        mensagem: mensagem.trim(),
        pagina: location.pathname + location.search,
        anexo,
      })
      toast.success('Obrigado! Sua mensagem foi enviada.')
      setMensagem('')
      setAnexo(null)
      setTipo('melhoria')
      setAberto(false)
    } catch (error) {
      toast.error('Não foi possível enviar', { description: getErrorMessage(error) })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      {!capturando && (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elevation transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden"
          aria-label="Enviar sugestão, dica ou relatar um problema"
        >
          <MessageSquarePlus className="h-5 w-5" />
          <span className="hidden sm:inline">Sugestões e problemas</span>
        </button>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fale com a gente</DialogTitle>
            <DialogDescription>
              Conte o que melhorar, o problema que encontrou ou uma dica. Enviamos junto a página em
              que você está, para entender melhor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoFeedback)}
              >
                {TIPOS_FEEDBACK.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                rows={5}
                value={mensagem}
                maxLength={4000}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Descreva com o máximo de detalhes que puder"
              />
            </div>
            <div className="space-y-2">
              <Label>Imagem (opcional)</Label>
              {previa ? (
                <div className="relative w-fit">
                  <img
                    src={previa}
                    alt="Imagem anexada"
                    className="max-h-40 rounded-lg border object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setAnexo(null)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background"
                    aria-label="Remover imagem"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {podeCapturar && (
                    <Button type="button" variant="outline" size="sm" onClick={tirarPrint}>
                      <Camera className="mr-1.5 h-4 w-4" />
                      Tirar print da tela
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => inputArquivo.current?.click()}
                  >
                    <ImagePlus className="mr-1.5 h-4 w-4" />
                    Anexar foto ou imagem
                  </Button>
                </div>
              )}
              <input
                ref={inputArquivo}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  escolherArquivo(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={enviar} disabled={enviando || mensagem.trim().length < 5}>
              {enviando ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
