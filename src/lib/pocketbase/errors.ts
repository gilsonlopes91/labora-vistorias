import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ClientResponseError)) return {}
  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}
  const errors: FieldErrors = {}
  for (const [field, detail] of Object.entries(data)) {
    if (
      detail &&
      typeof detail === 'object' &&
      'message' in detail &&
      typeof (detail as { message: unknown }).message === 'string'
    ) {
      errors[field] = (detail as { message: string }).message
    }
  }
  return errors
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    return error instanceof Error ? error.message : 'An unexpected error occurred.'
  }
  const msgs = Object.values(extractFieldErrors(error))
  return msgs.length > 0 ? msgs.join(' ') : error.message || 'An unexpected error occurred.'
}

/** Retorna true quando o erro é de rede/conexão (offline, timeout, CORS). */
export function isErroDeConexao(error: unknown): boolean {
  if (error instanceof ClientResponseError) {
    // status 0 = falha de rede; sem resposta do servidor
    return error.status === 0
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return (
      msg.includes('failed to fetch') ||
      msg.includes('network') ||
      msg.includes('conexão') ||
      msg.includes('offline')
    )
  }
  return false
}

/** Retorna true quando o erro é possivelmente temporário e vale tentar novamente. */
export function isErroTemporario(error: unknown): boolean {
  if (error instanceof ClientResponseError) {
    // 0 = sem rede; 429 = rate-limit; 503 = serviço indisponível
    return error.status === 0 || error.status === 429 || error.status === 503
  }
  return isErroDeConexao(error)
}
