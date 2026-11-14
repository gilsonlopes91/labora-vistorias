/* Anotações e marcações PRIVADAS de vídeo. Cada registro pertence ao usuário logado:
   a regra da coleção `video_notes` no backend já restringe ao dono, e aqui a busca
   também filtra pelo usuário logado. */
import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export type TipoVideoNota = 'nota' | 'marcacao'

export interface VideoNota extends RecordModel {
  usuario: string
  video: string
  texto?: string
  segundos: number
  tipo: TipoVideoNota
  created: string
}

const usuarioLogado = () => pb.authStore.record?.id || ''

export const getVideoNotas = (videoId: string) =>
  pb.collection('video_notes').getFullList<VideoNota>({
    filter: pb.filter('video = {:v} && usuario = {:u}', { v: videoId, u: usuarioLogado() }),
    sort: 'segundos',
  })

export const criarVideoNota = (dados: {
  video: string
  texto: string
  segundos: number
  tipo: TipoVideoNota
}) =>
  pb
    .collection('video_notes')
    .create<VideoNota>({ ...dados, usuario: usuarioLogado() }, { requestKey: null })

export const atualizarVideoNota = (id: string, texto: string) =>
  pb.collection('video_notes').update<VideoNota>(id, { texto }, { requestKey: null })

export const apagarVideoNota = (id: string) =>
  pb.collection('video_notes').delete(id, { requestKey: null })

/** Formata segundos como m:ss (ou h:mm:ss). */
export const formatarTempo = (segundos: number) => {
  const total = Math.max(0, Math.floor(segundos))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}
