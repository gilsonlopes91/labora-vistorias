/* Host do player global: UM componente com árvore estável que renderiza OU o
   modal completo (vídeo 16:9 à ESQUERDA, anotações no painel à DIREITA) OU o
   mini player flutuante (picture-in-picture no canto inferior direito). O
   wrapper do iframe é o MESMO nó do DOM nas duas formas — minimizar/expandir
   só troca classes, o React não remonta nada e o vídeo/áudio nunca param. */
import { useEffect } from 'react'
import { Maximize2, Minimize2, Pause, Play, X } from 'lucide-react'

import { useVideoPlayer } from '@/hooks/use-video-player'
import { VideoNotas } from '@/components/video/VideoNotas'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function VideoPlayerHost() {
  const {
    video,
    videoId,
    expandido,
    tocando,
    erro,
    wrapperRef,
    fechar,
    minimizar,
    expandir,
    alternar,
  } = useVideoPlayer()

  // Esc fecha o modal completo (mantém o comportamento esperado de um diálogo).
  useEffect(() => {
    if (!video || !expandido) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [video, expandido, fechar])

  if (!video || !videoId) return null

  return (
    <div
      className={cn(
        expandido
          ? 'fixed inset-0 z-50 overflow-y-auto bg-black/80 p-2 backdrop-blur-sm sm:p-6'
          : 'fixed bottom-4 right-4 z-[60] w-72 sm:w-80',
      )}
      role="dialog"
      aria-modal={expandido}
      aria-label={`Reprodução: ${video.titulo}`}
    >
      <div
        className={cn(
          'flex min-h-0 flex-col overflow-hidden rounded-2xl bg-card shadow-2xl',
          expandido ? 'mx-auto my-auto w-full max-w-7xl' : 'w-full',
        )}
      >
        {/* Cabeçalho (só no modal completo). */}
        <div
          className={cn(
            'flex items-center gap-3 border-b px-4 py-3 sm:px-5',
            !expandido && 'hidden',
          )}
        >
          <h2 className="min-w-0 flex-1 truncate text-lg font-semibold leading-snug tracking-tight text-foreground">
            {video.titulo}
          </h2>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            onClick={minimizar}
            aria-label="Minimizar (continuar assistindo em miniatura)"
            title="Minimizar (continuar assistindo em miniatura)"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            onClick={alternar}
            aria-label={tocando ? 'Pausar' : 'Reproduzir'}
            title={tocando ? 'Pausar' : 'Reproduzir'}
          >
            {tocando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={fechar}
            aria-label="Fechar"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Corpo em duas colunas no modal completo: vídeo à esquerda, anotações
            à direita. No mini player volta a empilhar (só o vídeo aparece). */}
        <div className={cn('flex min-h-0 flex-1', expandido ? 'flex-col lg:flex-row' : 'flex-col')}>
          {/* Coluna esquerda: VÍDEO — nó persistente, o iframe criado pelo hook
              nunca sai daqui. Altura garantida (aspect-video + min-h) para
              nunca colapsar a zero, com fundo preto visível enquanto o YouTube
              carrega. */}
          <div className={cn('flex min-h-0 min-w-0 flex-col', expandido ? 'flex-1' : 'w-full')}>
            <div className="relative w-full shrink-0 overflow-hidden bg-black h-0 pb-[56.25%]">
              <div ref={wrapperRef} className="absolute inset-0 h-full w-full" />
              {/* Fallback quando a API do YouTube não carrega (rede bloqueada,
                  extensão etc.): em vez de uma caixa preta muda, oferecemos o
                  caminho direto para o vídeo. */}
              {erro && (
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/90 p-4 text-center text-sm text-white"
                >
                  <span>Não foi possível carregar o player aqui.</span>
                  <span className="font-semibold underline">Assistir no YouTube</span>
                </a>
              )}
            </div>

            {/* Controles do mini player. */}
            <div className={cn('flex items-center gap-1 px-2 py-1.5', expandido && 'hidden')}>
              <span className="min-w-0 flex-1 truncate text-xs font-medium" title={video.titulo}>
                {video.titulo}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={alternar}
                aria-label={tocando ? 'Pausar' : 'Reproduzir'}
                title={tocando ? 'Pausar' : 'Reproduzir'}
              >
                {tocando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={expandir}
                aria-label="Expandir"
                title="Expandir"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={fechar}
                aria-label="Fechar"
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Coluna direita: descrição + anotações privadas (só visível no modal,
              mas permanece montado para não perder as notas ao minimizar). */}
          <div
            className={cn(
              'min-h-0 shrink-0 space-y-3 overflow-y-auto p-4 sm:p-5',
              expandido
                ? 'w-full border-t lg:w-[360px] lg:border-l lg:border-t-0 lg:max-h-[calc(100dvh-9rem)] xl:w-[400px]'
                : 'hidden',
            )}
          >
            {video.descricao && (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{video.descricao}</p>
            )}
            <VideoNotas />
          </div>
        </div>
      </div>
    </div>
  )
}
