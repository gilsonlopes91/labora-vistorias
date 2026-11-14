/* Player global de vídeo: vive no nível do app (montado dentro do Layout) para
   sobreviver à troca de rota. O iframe do YouTube é criado UMA vez e apenas
   reposicionado entre o modal completo e o mini player flutuante (nunca
   recriado), então minimizar não interrompe a reprodução. */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { useYoutubePlayer } from '@/hooks/use-youtube-player'
import type { VideoItem } from '@/services/videos'

interface PlayerContexto {
  video: VideoItem | null
  videoId: string | null
  /** true quando o modal completo está aberto; false quando minimizado. */
  expandido: boolean
  tocando: boolean
  pronto: boolean
  wrapperRef: RefObject<HTMLDivElement>
  abrir: (video: VideoItem, id: string) => void
  fechar: () => void
  minimizar: () => void
  expandir: () => void
  alternar: () => void
  irPara: (segundos: number) => void
  getTempo: () => number
}

const Ctx = createContext<PlayerContexto | null>(null)

export function VideoPlayerProvider({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [video, setVideo] = useState<VideoItem | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [expandido, setExpandido] = useState(true)
  // Espelho do estado "video" para decidir sem efeitos colaterais no updater.
  const videoRef = useRef<VideoItem | null>(null)

  const trocarVideo = useCallback((novo: VideoItem, id: string) => {
    // Mesmo vídeo reaberto: NÃO troca o videoId, para o hook não destruir
    // e recriar o iframe (o vídeo continuaria de onde parou).
    if (videoRef.current?.id === novo.id) {
      setExpandido(true)
      return
    }
    videoRef.current = novo
    setVideo(novo)
    setVideoId(id)
    setExpandido(true)
  }, [])

  const abrir = useCallback(trocarVideo, [trocarVideo])

  const fechar = useCallback(() => {
    videoRef.current = null
    setVideo(null)
    setVideoId(null)
    setExpandido(true)
  }, [])

  const minimizar = useCallback(() => setExpandido(false), [])
  const expandir = useCallback(() => setExpandido(true), [])

  const { pronto, tocando, getTempo, irPara, alternar } = useYoutubePlayer(wrapperRef, videoId)

  const valor = useMemo<PlayerContexto>(
    () => ({
      video,
      videoId,
      expandido,
      tocando,
      pronto,
      wrapperRef,
      abrir,
      fechar,
      minimizar,
      expandir,
      alternar,
      irPara,
      getTempo,
    }),
    [
      video,
      videoId,
      expandido,
      tocando,
      pronto,
      abrir,
      fechar,
      minimizar,
      expandir,
      alternar,
      irPara,
      getTempo,
    ],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useVideoPlayer(): PlayerContexto {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useVideoPlayer precisa estar dentro de <VideoPlayerProvider>')
  return ctx
}
