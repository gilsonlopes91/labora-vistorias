/* Vídeos — tutoriais da plataforma. Todo usuário logado assiste; o administrador
 * da plataforma cadastra o link do YouTube e pode apagar. */
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Play, Plus, Trash2, Video } from 'lucide-react'

import { getPapelUsuarioLogado } from '@/services/equipe'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  apagarVideo,
  cadastrarVideo,
  getVideos,
  youtubeId,
  type VideoItem,
} from '@/services/videos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

export default function Videos() {
  const podeCadastrar = getPapelUsuarioLogado() === 'admin_plataforma'
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [link, setLink] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [assistindo, setAssistindo] = useState<VideoItem | null>(null)
  const idAssistindo = youtubeId(assistindo?.url || '')

  const idDoLink = youtubeId(link)

  const carregar = useCallback(async () => {
    try {
      setVideos(await getVideos())
    } catch (error) {
      toast.error('Não foi possível carregar os vídeos', { description: getErrorMessage(error) })
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const salvar = async () => {
    if (!idDoLink) return
    setSalvando(true)
    try {
      await cadastrarVideo({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        url: link.trim(),
      })
      toast.success('Vídeo adicionado.')
      setAberto(false)
      setTitulo('')
      setDescricao('')
      setLink('')
      await carregar()
    } catch (error) {
      toast.error('Não foi possível adicionar o vídeo', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  const apagar = async (v: VideoItem) => {
    try {
      await apagarVideo(v.id)
      setVideos((lista) => lista.filter((x) => x.id !== v.id))
    } catch (error) {
      toast.error('Não foi possível apagar', { description: getErrorMessage(error) })
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Vídeos</h1>
          <p className="text-sm text-muted-foreground">Vídeos e tutoriais da plataforma.</p>
        </div>
        {podeCadastrar && (
          <Button onClick={() => setAberto(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar vídeo
          </Button>
        )}
      </div>

      {carregando ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <Video className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum vídeo disponível ainda.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {videos.map((v) => {
            const id = youtubeId(v.url || '')
            return (
              <div key={v.id} className="overflow-hidden rounded-2xl border bg-card">
                {id ? (
                  <button
                    type="button"
                    onClick={() => setAssistindo(v)}
                    className="group relative block aspect-video w-full bg-black"
                    aria-label={`Assistir: ${v.titulo}`}
                  >
                    <img
                      src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                    />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevation transition-transform group-hover:scale-110">
                        <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
                      </span>
                    </span>
                  </button>
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-muted text-sm text-muted-foreground">
                    Link do vídeo inválido
                  </div>
                )}
                <div className="flex items-start justify-between gap-2 p-4">
                  <div className="min-w-0">
                    <div className="font-semibold">{v.titulo}</div>
                    {v.descricao && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {v.descricao}
                      </p>
                    )}
                  </div>
                  {podeCadastrar && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => apagar(v)}
                      title="Apagar vídeo"
                      aria-label="Apagar vídeo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={!!assistindo} onOpenChange={(v) => !v && setAssistindo(null)}>
        <DialogContent className="flex flex-col w-[96vw] max-w-2xl gap-4 p-5 sm:p-6 rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader className="space-y-1 pr-8 text-left">
            <DialogTitle className="text-lg font-semibold leading-snug tracking-tight text-foreground">
              {assistindo?.titulo}
            </DialogTitle>
            <DialogDescription className="sr-only">Reprodução do vídeo</DialogDescription>
          </DialogHeader>
          {idAssistindo && (
            <div className="mx-auto w-full max-w-xl">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black shadow-inner">
                <iframe
                  className="absolute inset-0 h-full w-full border-0"
                  src={`https://www.youtube-nocookie.com/embed/${idAssistindo}?autoplay=1&rel=0`}
                  title={assistindo?.titulo || 'Vídeo do YouTube'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
            </div>
          )}
          {assistindo?.descricao && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {assistindo.descricao}
            </p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={aberto} onOpenChange={(v) => !salvando && setAberto(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar vídeo</DialogTitle>
            <DialogDescription>
              Cole o link do vídeo no YouTube. Pode ser "não listado": só quem estiver logado na
              plataforma verá o vídeo aqui.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Link do YouTube</Label>
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              {link.trim() && !idDoLink && (
                <p className="text-xs text-destructive">
                  Não reconheci esse link. Use o endereço do vídeo no YouTube.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={titulo}
                maxLength={200}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Como cadastrar uma empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                rows={3}
                value={descricao}
                maxLength={2000}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={salvar} disabled={salvando || !idDoLink || titulo.trim().length < 2}>
              {salvando ? 'Salvando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
