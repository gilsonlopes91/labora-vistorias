/* Player do YouTube controlado pela API oficial (IFrame API): permite ler o momento
   atual, levar o vídeo a um tempo específico e reproduzir/pausar. O iframe é criado
   dentro de um elemento filho do contêiner, para o React não disputar o nó que o
   YouTube troca. */
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

export interface YoutubePlayer {
  getCurrentTime(): number
  seekTo(segundos: number, permitirNova: boolean): void
  playVideo(): void
  pauseVideo(): void
  getPlayerState(): number
  getIframe(): HTMLIFrameElement
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
  const [tocando, setTocando] = useState(false)
  const [erro, setErro] = useState(false)

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
              // A API troca o <div> do elemento por um <iframe>. Blindamos
              // tamanho e posição DIRETO no atributo (style do React não
              // alcança esse nó), para o vídeo nunca aparecer com altura
              // zerada, escondido ou atrás do resto — inclusive no mini
              // player flutuante, que só troca classes do antepassado.
              const iframe = player.getIframe()
              iframe.style.position = 'absolute'
              iframe.style.inset = '0'
              iframe.style.width = '100%'
              iframe.style.height = '100%'
              iframe.style.minHeight = '1px'
              iframe.style.border = '0'
              iframe.style.opacity = '1'
              iframe.style.visibility = 'visible'
              iframe.setAttribute('title', 'Player de vídeo do YouTube')
              setPronto(true)
            },
          },
        })
      })
      .catch(() => {
        if (cancelado) return
        // Sem a API o vídeo não carrega; sinalizamos para a UI mostrar o
        // fallback (link para assistir no YouTube) em vez de uma caixa preta.
        setErro(true)
      })

    return () => {
      cancelado = true
      setPronto(false)
      setTocando(false)
      setErro(false)
      playerRef.current = null
      player?.destroy()
      elemento.remove()
    }
  }, [wrapperRef, videoId])

  // Acompanha o estado do player (1 = tocando) para os controles do mini player.
  useEffect(() => {
    if (!pronto) return
    const id = window.setInterval(() => {
      setTocando(playerRef.current?.getPlayerState() === 1)
    }, 500)
    return () => window.clearInterval(id)
  }, [pronto])

  const getTempo = useCallback(() => playerRef.current?.getCurrentTime() ?? 0, [])
  const irPara = useCallback((segundos: number) => {
    playerRef.current?.seekTo(segundos, true)
  }, [])
  const alternar = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (p.getPlayerState() === 1) p.pauseVideo()
    else p.playVideo()
  }, [])

  return { pronto, tocando, erro, getTempo, irPara, alternar }
}
