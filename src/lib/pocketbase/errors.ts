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
    const raw = error instanceof Error ? error.message : String(error || '')
    if (raw.includes('503') || raw.toLowerCase().includes('temporarily unavailable')) {
      return 'Servidor temporariamente indisponível (503). Por favor, aguarde alguns instantes e tente novamente.'
    }
    return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
  }

  // Tratamento de códigos HTTP comuns
  if (error.status === 503) {
    return 'Servidor temporariamente indisponível (503). Por favor, aguarde alguns instantes e tente novamente.'
  }
  if (error.status === 502 || error.status === 504) {
    return 'Falha na comunicação com o servidor. Tente novamente em instantes.'
  }
  if (
    error.status === 400 &&
    (!error.response?.data || Object.keys(error.response.data).length === 0)
  ) {
    if (error.message === 'Failed to authenticate.' || error.message.includes('authenticate')) {
      return 'E-mail ou senha incorretos.'
    }
  }

  const msgs = Object.values(extractFieldErrors(error))
  if (msgs.length > 0) return msgs.join(' ')

  if (error.message === 'Failed to authenticate.') {
    return 'E-mail ou senha incorretos.'
  }
  if (error.message === 'Something went wrong.') {
    return 'Ocorreu um erro no servidor. Verifique sua conexão ou tente novamente.'
  }

  return error.message || 'Ocorreu um erro inesperado.'
}
