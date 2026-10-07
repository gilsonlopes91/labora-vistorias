/* Console de contas — caixa de sugestões enviadas pelo botão flutuante. */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Check, Eye, Trash2 } from 'lucide-react'

import AdminNav from '@/components/admin/AdminNav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  apagarFeedback,
  atualizarStatusFeedback,
  getFeedbacks,
  TIPOS_FEEDBACK,
  type Feedback,
  type StatusFeedback,
} from '@/services/feedbacks'

const ROTULO_TIPO = Object.fromEntries(TIPOS_FEEDBACK.map((t) => [t.value, t.label]))
const ROTULO_STATUS: Record<string, string> = {
  novo: 'Novo',
  lido: 'Lido',
  resolvido: 'Resolvido',
}

export default function AdminFeedbacks() {
  const [itens, setItens] = useState<Feedback[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      setItens(await getFeedbacks())
    } catch (error) {
      toast.error('Não foi possível carregar as sugestões', {
        description: getErrorMessage(error),
      })
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const visiveis = useMemo(
    () =>
      itens.filter(
        (f) =>
          (!filtroStatus || (f.status || 'novo') === filtroStatus) &&
          (!filtroTipo || f.tipo === filtroTipo),
      ),
    [itens, filtroStatus, filtroTipo],
  )

  const mudar = async (f: Feedback, status: StatusFeedback) => {
    try {
      const atual = await atualizarStatusFeedback(f.id, status)
      setItens((v) => v.map((x) => (x.id === f.id ? atual : x)))
    } catch (error) {
      toast.error('Não foi possível atualizar', { description: getErrorMessage(error) })
    }
  }

  const apagar = async (f: Feedback) => {
    try {
      await apagarFeedback(f.id)
      setItens((v) => v.filter((x) => x.id !== f.id))
    } catch (error) {
      toast.error('Não foi possível apagar', { description: getErrorMessage(error) })
    }
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Sugestões</h1>
        <p className="text-sm text-muted-foreground">
          Mensagens enviadas pelo botão flutuante, em qualquer página do app.
        </p>
      </div>
      <AdminNav />

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          {Object.entries(ROTULO_STATUS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          {TIPOS_FEEDBACK.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {carregando ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : visiveis.length === 0 ? (
        <Card className="rounded-2xl border-dashed p-12 text-center text-sm text-muted-foreground">
          Nenhuma sugestão por aqui.
        </Card>
      ) : (
        <div className="space-y-3">
          {visiveis.map((f) => {
            const status = f.status || 'novo'
            return (
              <Card key={f.id} className="rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={f.tipo === 'bug' ? 'destructive' : 'secondary'}>
                      {ROTULO_TIPO[f.tipo] || f.tipo}
                    </Badge>
                    <Badge variant={status === 'novo' ? 'default' : 'outline'}>
                      {ROTULO_STATUS[status]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(f.created).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {status === 'novo' && (
                      <Button size="sm" variant="ghost" onClick={() => mudar(f, 'lido')}>
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Marcar lido
                      </Button>
                    )}
                    {status !== 'resolvido' && (
                      <Button size="sm" variant="ghost" onClick={() => mudar(f, 'resolvido')}>
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Resolvido
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => apagar(f)}
                      title="Apagar"
                      aria-label="Apagar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm">{f.mensagem}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {f.usuario_nome || '—'}
                  {f.usuario_email ? ` · ${f.usuario_email}` : ''}
                  {f.pagina ? ` · página ${f.pagina}` : ''}
                </p>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
