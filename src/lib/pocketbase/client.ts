import PocketBase, { type SendOptions } from 'pocketbase'
import { definirUsuarioCache, fetchComCache } from '@/lib/cacheOffline'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// Modo offline (etapa 2): toda requisição passa pelo fetch com cópia local.
// Leituras que deram certo ficam no aparelho e são usadas sem internet.
definirUsuarioCache(pb.authStore.record?.id || '')
pb.authStore.onChange((_token, record) => definirUsuarioCache(record?.id || ''))
const sendOriginal = pb.send.bind(pb)
pb.send = ((path: string, options: SendOptions = {}) =>
  sendOriginal(path, { fetch: fetchComCache, ...options })) as typeof pb.send

export default pb
