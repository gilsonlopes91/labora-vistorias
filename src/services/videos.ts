/* Vídeos e tutoriais: todo usuário logado assiste; só o administrador da
   plataforma cadastra e apaga. Os vídeos ficam no YouTube; aqui guardamos o link. */
import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export interface VideoItem extends RecordModel {
  id: string
  titulo: string
  descricao?: string
  url?: string
  created: string
}

/** Extrai o código do vídeo de links do YouTube (watch, youtu.be, shorts, embed, live). */
export const youtubeId = (link: string): string | null => {
  const texto = link.trim()
  if (!texto) return null
  try {
    const u = new URL(texto.includes('://') ? texto : `https://${texto}`)
    const host = u.hostname.replace(/^www\.|^m\./, '')
    let id: string | null = null
    if (host === 'youtu.be') id = u.pathname.split('/')[1] || null
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v')
      else {
        const m = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?]+)/)
        id = m ? m[1] : null
      }
    }
    return id && /^[\w-]{6,20}$/.test(id) ? id : null
  } catch {
    return null
  }
}

export const getVideos = () => pb.collection('videos').getFullList<VideoItem>({ sort: '-created' })

export const cadastrarVideo = (dados: { titulo: string; descricao: string; url: string }) =>
  pb.collection('videos').create<VideoItem>(dados, { requestKey: null })

export const apagarVideo = (id: string) => pb.collection('videos').delete(id)
