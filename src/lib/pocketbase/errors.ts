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

const KNOWN_ERROR_TRANSLATIONS: Record<string, string> = {
  'Failed to authenticate.': 'E-mail ou senha incorretos.',
  'Failed to authenticate': 'E-mail ou senha incorretos.',
  'The request requires valid record authorization token to be set.':
    'Sessão expirada ou não autorizada. Faça login novamente.',
  'Something went wrong while processing your request.':
    'Ocorreu um erro inesperado ao processar sua solicitação.',
  'Failed to create record.': 'Não foi possível criar o registro.',
  'Failed to update record.': 'Não foi possível atualizar o registro.',
  'Failed to delete record.': 'Não foi possível excluir o registro.',
  'Only superusers can perform this action.': 'Apenas administradores podem executar esta ação.',
  "The requested resource wasn't found.": 'O recurso solicitado não foi encontrado.',
}

function translateErrorMessage(msg: string): string {
  const trimmed = msg.trim()
  if (KNOWN_ERROR_TRANSLATIONS[trimmed]) {
    return KNOWN_ERROR_TRANSLATIONS[trimmed]
  }
  // Se contiver a mensagem típica de falha de autenticação do PocketBase
  if (trimmed.toLowerCase().includes('failed to authenticate')) {
    return 'E-mail ou senha incorretos.'
  }
  return msg
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    if (error instanceof Error) {
      return translateErrorMessage(error.message)
    }
    return 'Ocorreu um erro inesperado.'
  }
  const msgs = Object.values(extractFieldErrors(error))
  if (msgs.length > 0) {
    return msgs.map(translateErrorMessage).join(' ')
  }
  return translateErrorMessage(error.message || 'Ocorreu um erro inesperado.')
}
