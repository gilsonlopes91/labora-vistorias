/* Vincular a agenda do Labora a outros calendários (Google Agenda, Outlook,
   calendário do iPhone/Mac). Gera um link de assinatura .ics só de leitura,
   com as vistorias da organização. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CalendarPlus, Copy, RefreshCw } from 'lucide-react'

import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { urlServidorPublico } from '@/lib/enderecosPublicos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const novaChave = () => (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '')

export default function AgendaExternaDialog() {
  const [aberto, setAberto] = useState(false)
  const [chave, setChave] = useState('')
  const [gerando, setGerando] = useState(false)

  const usuario = pb.authStore.record as {
    id: string
    agenda_token?: string
    agenda_app_url?: string
  } | null

  // Guarda o endereço do app para o link "Abrir no app" dentro dos eventos.
  useEffect(() => {
    if (!usuario) return
    const origem = window.location.origin
    if (usuario.agenda_app_url === origem) return
    pb.collection('users')
      .update(usuario.id, { agenda_app_url: origem }, { requestKey: null })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const gravar = async (valor: string) => {
    if (!usuario) return
    setGerando(true)
    try {
      await pb.collection('users').update(usuario.id, { agenda_token: valor })
      setChave(valor)
    } catch (error) {
      toast.error('Não foi possível gerar o link', { description: getErrorMessage(error) })
    } finally {
      setGerando(false)
    }
  }

  const abrir = async () => {
    setAberto(true)
    if (!usuario) return
    try {
      const u = await pb.collection('users').getOne<{ agenda_token?: string }>(usuario.id, {
        fields: 'agenda_token',
        requestKey: null,
      })
      if (u.agenda_token) setChave(u.agenda_token)
      else await gravar(novaChave())
    } catch {
      await gravar(novaChave())
    }
  }

  // Com domínio próprio configurado, o link sai por ele (item 47).
  const base = urlServidorPublico()
  const link = chave ? `${base}/backend/v1/agenda/${chave}.ics` : ''
  const webcal = link.replace(/^https?:\/\//, 'webcal://')
  const google = link
    ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`
    : ''

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Link copiado')
    } catch {
      toast.error('Não foi possível copiar', { description: 'Selecione o link e copie.' })
    }
  }

  return (
    <>
      <Button variant="outline" onClick={abrir}>
        <CalendarPlus className="mr-2 h-4 w-4" />
        Vincular calendário
      </Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ver as vistorias em outro calendário</DialogTitle>
            <DialogDescription>
              Assine este link no Google Agenda, no Outlook ou no calendário do iPhone. As vistorias
              da sua empresa aparecem lá e se atualizam sozinhas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={gerando && !link ? 'Gerando...' : link}
                onFocus={(e) => e.target.select()}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copiar}
                disabled={!link}
                title="Copiar link"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild disabled={!link}>
                <a href={google} target="_blank" rel="noreferrer">
                  Adicionar ao Google Agenda
                </a>
              </Button>
              <Button asChild variant="outline" disabled={!link}>
                <a href={webcal}>Abrir no iPhone, Mac ou Outlook</a>
              </Button>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>
                <b>Outlook na web:</b> Calendário, Adicionar calendário, Assinar da web, e cole o
                link.
              </p>
              <p>
                <b>Google Agenda no computador:</b> Outras agendas, +, Do URL, e cole o link (se o
                botão acima não abrir direto).
              </p>
              <p>
                O vínculo é só de leitura: novas vistorias e mudanças de data aparecem no outro
                calendário na próxima atualização dele. O Google pode levar algumas horas; Outlook e
                iPhone costumam ser mais rápidos.
              </p>
              <p>
                <b>Lembretes:</b> cada vistoria com horário vem com aviso 1 dia antes e 1 hora
                antes. Outlook e iPhone respeitam esses avisos; o Google Agenda costuma ignorar
                lembretes de agendas assinadas por link.
              </p>
              <p>
                O link é pessoal. Quem tiver o link vê as vistorias; se ele vazar, gere um novo
                abaixo e o antigo para de funcionar.
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => gravar(novaChave())}
              disabled={gerando}
              className="text-muted-foreground"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Gerar novo link (desativa o anterior)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
