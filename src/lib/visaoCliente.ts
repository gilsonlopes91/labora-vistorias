/* "Ver como cliente": o administrador da plataforma pode ligar uma visão que
 * esconde tudo do console e mostra o app como um cliente comum (dono de uma
 * organização) veria. É só de tela: o servidor continua com as permissões reais. */
const CHAVE = 'labora_visao_cliente'

export const getVisaoCliente = (): boolean => {
  try {
    return localStorage.getItem(CHAVE) === '1'
  } catch {
    return false
  }
}

export const setVisaoCliente = (ligada: boolean) => {
  try {
    if (ligada) localStorage.setItem(CHAVE, '1')
    else localStorage.removeItem(CHAVE)
  } catch {
    /* sem armazenamento: ignora */
  }
}
