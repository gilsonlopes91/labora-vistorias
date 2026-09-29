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
    return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
  }
  const msgs = Object.values(extractFieldErrors(error))
  if (msgs.length > 0) return msgs.join(' ')
  // Mensagem personalizada enviada pelo hook (e.json(409, { error: '...' }))
  const custom = (error.response as { error?: unknown })?.error
  if (typeof custom === 'string' && custom) return custom
  return error.message || 'Ocorreu um erro inesperado.'
}

export function isErroTemporario(error: unknown): boolean {
  if (isErroDeConexao(error)) return true
  if (error instanceof ClientResponseError && error.status === 429) return true
  return false
}

export function isErroDeConexao(error: unknown): boolean {
  if (!error) return false
  if (error instanceof ClientResponseError) {
    return error.status === 0
  }
  if (error instanceof TypeError && /failed to fetch|networkerror/i.test(error.message)) {
    return true
  }
  return false
}
