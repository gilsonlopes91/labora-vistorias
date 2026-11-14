/* Conteúdo do modal de vídeo: cabeçalho no topo, player 1:1 à esquerda (topo em telas
   estreitas) e painel de anotações/marcações privadas do usuário logado ao lado. */
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Bookmark, Clock, Pencil, StickyNote, Trash2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useYoutubePlayer } from '@/hooks/use-youtube-player'
import {
  apagarVideoNota,
  atualizarVideoNota,
  criarVideoNota,
  formatarTempo,
  getVideoNotas,
  type VideoNota,
} from '@/services/videoNotas'
import type { VideoItem } from '@/services/videos'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Props {
  video: VideoItem
  videoId: string
}

const ordenarNotas = (lista: VideoNota[]) =>
  [...lista].sort((a, b) => a.segundos - b.segundos || a.created.localeCompare(b.created))

export function VideoVisualizador({ video, videoId }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { getTempo, irPara } = useYoutubePlayer(wrapperRef, videoId)
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

  const carregar = useCallback(async () => {
    try {
      setNotas(await getVideoNotas(video.id))
    } catch (error) {
      toast.error('Não foi possível carregar as anotações', { description: getErrorMessage(error) })
    } finally {
      setCarregando(false)
    }
  }, [video.id])

  useEffect(() => {
    carregar()
  }, [carregar])

  const salvarNovo = async (tipo: 'nota' | 'marcacao') => {
    const conteudo = texto.trim()
    if (tipo === 'nota' && !conteudo) return
    setSalvando(true)
    try {
      const criada = await criarVideoNota({
        video: video.id,
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

  const iniciarEdicao = (nota: VideoNota) => {
    setEditandoId(nota.id)
    setTextoEdicao(nota.texto || '')
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
    <>
      <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b px-5 py-4 pr-14 text-left">
        <DialogTitle className="min-w-0 truncate text-lg font-semibold leading-snug tracking-tight text-foreground">
          {video.titulo}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Reprodução do vídeo com anotações privadas
        </DialogDescription>
      </DialogHeader>

      <div className="grid min-h-0 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-3 p-5">
          <div className="relative h-[min(52vh,420px)] w-full overflow-hidden rounded-xl bg-black shadow-inner">
            <div ref={wrapperRef} className="absolute inset-0" />
          </div>
          {video.descricao && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{video.descricao}</p>
          )}
        </div>

        <aside className="flex min-h-0 flex-col gap-3 border-t p-5 md:border-l md:border-t-0">
          <div className="space-y-2">
            <Textarea
              rows={3}
              value={texto}
              maxLength={2000}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escreva uma anotação sobre este momento..."
            />
            <p className="text-xs text-muted-foreground">
              Momento atual:{' '}
              <span className="font-semibold tabular-nums text-foreground">
                {formatarTempo(tempoAtual)}
              </span>
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => salvarNovo('nota')}
                disabled={salvando || !texto.trim()}
              >
                Salvar nota
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => salvarNovo('marcacao')}
                disabled={salvando}
              >
                <Bookmark className="mr-2 h-4 w-4" />
                Marcar importante
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 md:max-h-[48vh]">
            {carregando ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Carregando...</p>
            ) : notas.length === 0 ? (
              <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
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
                          onClick={() => iniciarEdicao(n)}
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
        </aside>
      </div>
    </>
  )
}
