/* Player do YouTube controlado pela API oficial (IFrame API): permite ler o momento
   atual e levar o vídeo a um tempo específico. O iframe é criado dentro de um
   elemento filho do contêiner, para o React não disputar o nó que o YouTube troca. */
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

export interface YoutubePlayer {
  getCurrentTime(): number
  seekTo(segundos: number, permitirNova: boolean): void
  destroy(): void
}

interface YoutubeNamespace {
  Player: new (
    elemento: HTMLElement,
    opcoes: {
      videoId: string
      width?: string
      height?: string
      playerVars?: Record<string, string | number>
      events?: { onReady?: () => void }
    },
  ) => YoutubePlayer
}

declare global {
  interface Window {
    YT?: YoutubeNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let promessaApi: Promise<void> | null = null

/** Carrega o script da IFrame API uma única vez. */
const carregarYoutubeApi = (): Promise<void> => {
  if (window.YT?.Player) return Promise.resolve()
  if (!promessaApi) {
    promessaApi = new Promise<void>((resolve, reject) => {
      const anterior = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        anterior?.()
        resolve()
      }
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.onerror = () => {
        promessaApi = null
        reject(new Error('Não foi possível carregar o player do YouTube.'))
      }
      document.head.appendChild(script)
    })
  }
  return promessaApi
}

export function useYoutubePlayer(wrapperRef: RefObject<HTMLDivElement>, videoId: string | null) {
  const playerRef = useRef<YoutubePlayer | null>(null)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!videoId || !wrapper) return

    const elemento = document.createElement('div')
    elemento.className = 'absolute inset-0 h-full w-full'
    wrapper.appendChild(elemento)

    let cancelado = false
    let player: YoutubePlayer | null = null

    carregarYoutubeApi()
      .then(() => {
        if (cancelado || !window.YT) return
        player = new window.YT.Player(elemento, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (cancelado) return
              playerRef.current = player
              setPronto(true)
            },
          },
        })
      })
      .catch(() => {
        // Sem a API o vídeo não carrega; o usuário continua vendo o cabeçalho.
      })

    return () => {
      cancelado = true
      setPronto(false)
      playerRef.current = null
      player?.destroy()
      elemento.remove()
    }
  }, [wrapperRef, videoId])

  const getTempo = useCallback(() => playerRef.current?.getCurrentTime() ?? 0, [])
  const irPara = useCallback((segundos: number) => {
    playerRef.current?.seekTo(segundos, true)
  }, [])

  return { pronto, getTempo, irPara }
}
