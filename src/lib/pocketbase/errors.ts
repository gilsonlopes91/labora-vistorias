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

/** Mensagens padrão do PocketBase (em inglês) traduzidas para o usuário. */
const TRADUCOES: Array<[RegExp, string]> = [
  [/failed to authenticate/i, 'E-mail ou senha incorretos.'],
  [/something went wrong/i, 'Não foi possível concluir agora. Tente de novo em instantes.'],
  [/the requested resource wasn't found/i, 'Registro não encontrado ou sem permissão de acesso.'],
  [/you are not allowed to perform this request/i, 'Seu perfil não tem permissão para esta ação.'],
  [/only superusers can perform this action/i, 'Seu perfil não tem permissão para esta ação.'],
  [/failed to create record/i, 'Não foi possível salvar. Confira os dados e tente de novo.'],
  [/failed to update record/i, 'Não foi possível salvar. Confira os dados e tente de novo.'],
  [/failed to delete record/i, 'Não foi possível excluir este registro.'],
  [/cannot be blank/i, 'Campo obrigatório.'],
  [/an unexpected error occurred/i, 'Não foi possível concluir agora. Tente de novo em instantes.'],
]

function traduzir(msg: string): string {
  for (const [re, pt] of TRADUCOES) if (re.test(msg)) return pt
  return msg
}

/** Verdadeiro quando a falha foi de conexão (sem internet, servidor fora do ar). */
export function isErroDeConexao(error: unknown): boolean {
  if (error instanceof ClientResponseError) return error.status === 0 && !error.isAbort
  if (error instanceof TypeError) return /fetch|network|load failed/i.test(error.message)
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

export function getErrorMessage(error: unknown): string {
  if (isErroDeConexao(error)) {
    return 'Sem conexão com a internet. Confira o sinal e tente de novo.'
  }
  if (!(error instanceof ClientResponseError)) {
    return traduzir(error instanceof Error ? error.message : 'An unexpected error occurred.')
  }
  const msgs = Object.values(extractFieldErrors(error)).map(traduzir)
  if (msgs.length > 0) return msgs.join(' ')
  // Rotas próprias (hooks) devolvem { error: '...' } ou { message: '...' } em português.
  const resp = (error.response || {}) as { error?: unknown; message?: unknown }
  if (typeof resp.error === 'string' && resp.error) return resp.error
  if (typeof resp.message === 'string' && resp.message) return traduzir(resp.message)
  return traduzir(error.message || 'An unexpected error occurred.')
}
