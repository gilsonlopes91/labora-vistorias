/* Botão flutuante de sugestões, presente em todas as páginas do app logado.
   O envio cai na caixa de sugestões do administrador (console > Sugestões). */
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { MessageSquarePlus } from 'lucide-react'

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

export default function FeedbackFlutuante() {
  const location = useLocation()
  const [aberto, setAberto] = useState(false)
  const [tipo, setTipo] = useState<TipoFeedback>('melhoria')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async () => {
    setEnviando(true)
    try {
      await enviarFeedback({
        tipo,
        mensagem: mensagem.trim(),
        pagina: location.pathname + location.search,
      })
      toast.success('Obrigado! Sua mensagem foi enviada.')
      setMensagem('')
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
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elevation transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden"
        aria-label="Enviar sugestão, dica ou relatar um problema"
      >
        <MessageSquarePlus className="h-5 w-5" />
        <span className="hidden sm:inline">Sugestões e problemas</span>
      </button>

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
