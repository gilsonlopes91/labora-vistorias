/* Vídeos — tutoriais da plataforma. Todo usuário logado assiste; o administrador
 * da plataforma tem o botão de enviar vídeo e de apagar. */
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Upload, Video } from 'lucide-react'

import { getPapelUsuarioLogado } from '@/services/equipe'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  apagarVideo,
  enviarVideo,
  getVideos,
  TAMANHO_MAXIMO_VIDEO_MB,
  urlVideo,
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
  const podeEnviar = getPapelUsuarioLogado() === 'admin_plataforma'
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const inputArquivo = useRef<HTMLInputElement>(null)

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

  const escolher = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('video/')) {
      toast.error('Escolha um arquivo de vídeo (MP4, WebM ou MOV).')
      return
    }
    if (file.size > TAMANHO_MAXIMO_VIDEO_MB * 1024 * 1024) {
      toast.error(`O vídeo passa de ${TAMANHO_MAXIMO_VIDEO_MB} MB. Comprima e tente de novo.`)
      return
    }
    setArquivo(file)
    if (!titulo) setTitulo(file.name.replace(/\.[^.]+$/, ''))
  }

  const enviar = async () => {
    if (!arquivo) return
    setEnviando(true)
    try {
      await enviarVideo({ titulo: titulo.trim(), descricao: descricao.trim(), arquivo })
      toast.success('Vídeo enviado.')
      setAberto(false)
      setTitulo('')
      setDescricao('')
      setArquivo(null)
      await carregar()
    } catch (error) {
      toast.error('Não foi possível enviar o vídeo', { description: getErrorMessage(error) })
    } finally {
      setEnviando(false)
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
        {podeEnviar && (
          <Button onClick={() => setAberto(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Enviar vídeo
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
          {videos.map((v) => (
            <div key={v.id} className="overflow-hidden rounded-2xl border bg-card">
              <video
                controls
                preload="metadata"
                src={urlVideo(v)}
                className="aspect-video w-full bg-black"
              />
              <div className="flex items-start justify-between gap-2 p-4">
                <div className="min-w-0">
                  <div className="font-semibold">{v.titulo}</div>
                  {v.descricao && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {v.descricao}
                    </p>
                  )}
                </div>
                {podeEnviar && (
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
          ))}
        </div>
      )}

      <Dialog open={aberto} onOpenChange={(v) => !enviando && setAberto(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar vídeo</DialogTitle>
            <DialogDescription>
              MP4, WebM ou MOV, até {TAMANHO_MAXIMO_VIDEO_MB} MB. Todos os usuários logados poderão
              assistir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Arquivo</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => inputArquivo.current?.click()}
                  disabled={enviando}
                >
                  <Upload className="mr-1.5 h-4 w-4" />
                  Escolher vídeo
                </Button>
                <span className="min-w-0 truncate text-sm text-muted-foreground">
                  {arquivo
                    ? `${arquivo.name} (${(arquivo.size / 1024 / 1024).toFixed(1)} MB)`
                    : 'Nenhum arquivo escolhido'}
                </span>
              </div>
              <input
                ref={inputArquivo}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => {
                  escolher(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
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
          <DialogFooter className="items-center gap-3">
            {enviando && (
              <span className="text-xs text-muted-foreground">
                Enviando, não feche esta janela...
              </span>
            )}
            <Button onClick={enviar} disabled={enviando || !arquivo || titulo.trim().length < 2}>
              {enviando ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
