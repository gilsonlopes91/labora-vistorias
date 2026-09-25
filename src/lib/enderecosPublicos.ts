/* Endereço do servidor que aparece para fora do app (item 47): link da agenda
   (.ics) e imagens do blog. Hoje é o endereço interno do Skip. Quando o
   domínio próprio estiver apontado (ex.: https://api.laboravistorias.com.br),
   basta definir VITE_URL_PUBLICA_SERVIDOR com ele: os links novos e as imagens
   já gravadas passam a sair pelo domínio próprio. */
import pb from '@/lib/pocketbase/client'

const INTERNO = pb.baseURL.replace(/\/$/, '')

export const urlServidorPublico = (): string => {
  const configurado = (import.meta.env.VITE_URL_PUBLICA_SERVIDOR as string | undefined) || ''
  return (configurado.trim() || INTERNO).replace(/\/$/, '')
}

/** Troca o endereço interno pelo público num texto (HTML de artigo, URL). */
export const trocarServidorInterno = (texto: string): string => {
  const publico = urlServidorPublico()
  if (!texto || publico === INTERNO) return texto
  return texto.split(INTERNO).join(publico)
}
