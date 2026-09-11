/* Widget flutuante de chat com o Assistente Labora (IA). */
import { useEffect, useRef, useState } from 'react'
import { Bot, Send, X } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const conversationId = useRef<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async () => {
    const message = input.trim()
    if (!message || sending) return
    setSending(true)
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: message }])
    try {
      const res = await pb.send('/backend/v1/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ message, conversation_id: conversationId.current }),
      })
      conversationId.current = res.conversation_id || null
      setMessages((m) => [...m, { role: 'assistant', content: res.content || '—' }])
    } catch (error) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Não consegui responder agora. ' + getErrorMessage(error) },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {!open && (
        <Button
          size="icon"
          className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg"
          onClick={() => setOpen(true)}
          aria-label="Abrir assistente"
        >
          <Bot className="h-5 w-5" />
        </Button>
      )}
      {open && (
        <Card className="fixed bottom-5 right-5 z-50 flex h-[480px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden p-0 shadow-xl">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="text-sm font-semibold">Assistente Labora</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 && (
              <div className="space-y-2 pt-6 text-center">
                <Bot className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Olá! Sou o assistente do Labora.</p>
                <p className="px-4 text-xs text-muted-foreground">
                  Pergunte sobre suas vistorias, rotinas, agenda e multas — ex.: "quais vistorias
                  estão atrasadas?" ou "quais rotinas vencem este mês?"
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {m.content}
              </div>
            ))}
            {sending && <div className="text-xs text-muted-foreground">Pensando...</div>}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 border-t p-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Pergunte algo..."
              disabled={sending}
            />
            <Button size="icon" onClick={send} disabled={sending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  )
}
