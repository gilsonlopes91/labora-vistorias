/* Classificação dos erros de rede, usada pelo modo offline da vistoria.
   Fica fora de src/lib/pocketbase/ porque a plataforma Skip restaura aquela
   pasta para o modelo original e apaga o que for acrescentado nela. */
import { ClientResponseError } from 'pocketbase'

/** Sem conexão: a requisição nem chegou ao servidor (status 0), exceto cancelamento. */
export function isErroDeConexao(error: unknown): boolean {
  if (error instanceof ClientResponseError) return error.status === 0 && !error.isAbort
  return error instanceof TypeError
}

/** Falha que vale tentar de novo depois: sem conexão, servidor indisponível ou limite de requisições. */
export function isErroTemporario(error: unknown): boolean {
  if (isErroDeConexao(error)) return true
  if (error instanceof ClientResponseError) {
    return error.status >= 500 || error.status === 408 || error.status === 429
  }
  return false
}
