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

export function formatFriendlyErrorMessage(rawMessage: string): string {
  if (!rawMessage) return 'Ocorreu um erro inesperado.'

  // Erro de limite de upload do PocketBase:
  // ex: "Failed to upload perfil.png - the maximum allowed file size is 3145728 bytes."
  // ou "the maximum allowed file size is X bytes"
  if (/maximum allowed file size/i.test(rawMessage)) {
    const bytesMatch = rawMessage.match(/(\d+)\s*bytes/i)
    if (bytesMatch && bytesMatch[1]) {
      const bytes = parseInt(bytesMatch[1], 10)
      const mb = Math.round((bytes / (1024 * 1024)) * 10) / 10
      return `Arquivo muito grande. O limite é ${mb} MB — envie uma imagem menor.`
    }
    return 'Arquivo muito grande. O limite é 3 MB — envie uma imagem menor.'
  }

  return rawMessage
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    const raw = error instanceof Error ? error.message : 'An unexpected error occurred.'
    return formatFriendlyErrorMessage(raw)
  }
  const msgs = Object.values(extractFieldErrors(error))
  const raw = msgs.length > 0 ? msgs.join(' ') : error.message || 'An unexpected error occurred.'
  return formatFriendlyErrorMessage(raw)
}
