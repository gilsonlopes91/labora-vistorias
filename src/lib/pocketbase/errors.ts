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

const FRIENDLY_ERROR_MAP: Record<string, string> = {
  'Failed to create record.':
    'Não foi possível criar o registro. Verifique as permissões ou se os campos obrigatórios estão preenchidos.',
  'Failed to update record.':
    'Não foi possível atualizar o registro. Verifique as permissões ou se os dados estão corretos.',
  'Failed to delete record.':
    'Não foi possível excluir o registro. Verifique as permissões de acesso.',
  'Something went wrong while processing your request.':
    'Ocorreu um erro no servidor ao processar a requisição.',
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
  }
  const fieldErrors = extractFieldErrors(error)
  const msgs = Object.entries(fieldErrors).map(([field, msg]) => `${field}: ${msg}`)
  if (msgs.length > 0) {
    return msgs.join('. ')
  }
  const originalMsg = error.message || ''
  return FRIENDLY_ERROR_MAP[originalMsg] || originalMsg || 'Ocorreu um erro inesperado.'
}
