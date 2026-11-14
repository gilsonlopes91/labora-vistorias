/* Anotações e marcações privadas do usuário logado, no painel ao lado direito
   do vídeo dentro do modal: criar nota/marcação importante, editar, apagar e
   pular o vídeo para o momento anotado. O mesmo painel do modal completo; ao
   minimizar ele fica escondido (o player continua tocando). */
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Bookmark, Clock, Pencil, StickyNote, Trash2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useVideoPlayer } from '@/hooks/use-video-player'
import {
  apagarVideoNota,
  atualizarVideoNota,
  criarVideoNota,
  formatarTempo,
  getVideoNotas,
  type VideoNota,
} from '@/services/videoNotas'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const ordenarNotas = (lista: VideoNota[]) =>
  [...lista].sort((a, b) => a.segundos - b.segundos || a.created.localeCompare(b.created))

export function VideoNotas() {
  const { video, getTempo, irPara } = useVideoPlayer()
  const [tempoAtual, setTempoAtual] = useState(0)
  const [texto, setTexto] = useState('')
  const [notas, setNotas] = useState<VideoNota[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [textoEdicao, setTextoEdicao] = useState('')

  // Acompanha o momento do player para o usuário ver em que ponto está.
  useEffect(() => {
    const id = window.setInterval(() => setTempoAtual(getTempo()), 500)
    return () => window.clearInterval(id)
  }, [getTempo])

  const videoIdAtual = video?.id

  const carregar = useCallback(async () => {
    if (!videoIdAtual) return
    try {
      setNotas(await getVideoNotas(videoIdAtual))
    } catch (error) {
      toast.error('Não foi possível carregar as anotações', { description: getErrorMessage(error) })
    } finally {
      setCarregando(false)
    }
  }, [videoIdAtual])

  useEffect(() => {
    carregar()
    setTexto('')
    setEditandoId(null)
  }, [carregar])

  const salvarNovo = async (tipo: 'nota' | 'marcacao') => {
    if (!videoIdAtual) return
    const conteudo = texto.trim()
    if (tipo === 'nota' && !conteudo) return
    setSalvando(true)
    try {
      const criada = await criarVideoNota({
        video: videoIdAtual,
        texto: conteudo,
        segundos: Math.floor(getTempo()),
        tipo,
      })
      setNotas((lista) => [...lista, criada])
      setTexto('')
      toast.success(tipo === 'nota' ? 'Anotação salva.' : 'Momento marcado.')
    } catch (error) {
      toast.error(
        tipo === 'nota'
          ? 'Não foi possível salvar a anotação'
          : 'Não foi possível marcar o momento',
        { description: getErrorMessage(error) },
      )
    } finally {
      setSalvando(false)
    }
  }

  const salvarEdicao = async (nota: VideoNota) => {
    const conteudo = textoEdicao.trim()
    if (!conteudo) return
    try {
      const atualizada = await atualizarVideoNota(nota.id, conteudo)
      setNotas((lista) => lista.map((x) => (x.id === nota.id ? atualizada : x)))
      setEditandoId(null)
      toast.success('Anotação atualizada.')
    } catch (error) {
      toast.error('Não foi possível atualizar', { description: getErrorMessage(error) })
    }
  }

  const apagar = async (nota: VideoNota) => {
    try {
      await apagarVideoNota(nota.id)
      setNotas((lista) => lista.filter((x) => x.id !== nota.id))
      toast.success('Anotação apagada.')
    } catch (error) {
      toast.error('Não foi possível apagar', { description: getErrorMessage(error) })
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Textarea
          rows={2}
          value={texto}
          maxLength={2000}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva uma anotação sobre este momento..."
        />
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-xs text-muted-foreground">
            Momento atual:{' '}
            <span className="font-semibold tabular-nums text-foreground">
              {formatarTempo(tempoAtual)}
            </span>
          </p>
          <Button size="sm" onClick={() => salvarNovo('nota')} disabled={salvando || !texto.trim()}>
            Salvar nota
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => salvarNovo('marcacao')}
            disabled={salvando}
          >
            <Bookmark className="mr-2 h-4 w-4" />
            Marcar importante
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {carregando ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : notas.length === 0 ? (
          <p className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">
            Nenhuma anotação ainda.
          </p>
        ) : (
          ordenarNotas(notas).map((n) => (
            <div key={n.id} className="rounded-xl border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => irPara(n.segundos)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums text-primary hover:bg-primary/10"
                  aria-label={`Ir para ${formatarTempo(n.segundos)}`}
                  title="Ir para este momento"
                >
                  {n.tipo === 'marcacao' ? (
                    <Bookmark className="h-3.5 w-3.5 fill-current" />
                  ) : (
                    <StickyNote className="h-3.5 w-3.5" />
                  )}
                  <Clock className="h-3 w-3" />
                  {formatarTempo(n.segundos)}
                </button>
                {editandoId !== n.id && (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => {
                        setEditandoId(n.id)
                        setTextoEdicao(n.texto || '')
                      }}
                      aria-label="Editar"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => apagar(n)}
                      aria-label="Apagar"
                      title="Apagar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {editandoId === n.id ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    rows={3}
                    value={textoEdicao}
                    maxLength={2000}
                    onChange={(e) => setTextoEdicao(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditandoId(null)}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => salvarEdicao(n)}
                      disabled={!textoEdicao.trim()}
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-1.5 whitespace-pre-wrap text-sm">
                  {n.texto || (n.tipo === 'marcacao' ? 'Momento importante' : '')}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
