/* Vídeos e tutoriais: todo usuário logado assiste; só o administrador da
   plataforma envia e apaga. */
import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export interface VideoItem extends RecordModel {
  id: string
  titulo: string
  descricao?: string
  arquivo: string
  created: string
}

export const TAMANHO_MAXIMO_VIDEO_MB = 300

export const getVideos = () => pb.collection('videos').getFullList<VideoItem>({ sort: '-created' })

export const enviarVideo = (dados: { titulo: string; descricao: string; arquivo: File }) => {
  const form = new FormData()
  form.append('titulo', dados.titulo)
  form.append('descricao', dados.descricao)
  form.append('arquivo', dados.arquivo)
  return pb.collection('videos').create<VideoItem>(form, { requestKey: null })
}

export const apagarVideo = (id: string) => pb.collection('videos').delete(id)

export const urlVideo = (v: VideoItem) => pb.files.getURL(v, v.arquivo)
