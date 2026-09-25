/* Modo offline, etapa 2: cópia local das leituras feitas ao servidor.
   Toda consulta (GET) que dá certo fica guardada no IndexedDB do aparelho,
   por usuário. Sem internet, a mesma consulta devolve a última cópia
   guardada, e o app abre as telas e as vistorias que já foram abertas (ou
   preparadas, ver prepararOffline.ts) com conexão. Gravações não passam por
   aqui: as respostas do checklist usam a fila da etapa 1 (filaOffline.ts). */

const DB_NOME = 'labora-vistorias-cache'
const DB_VERSAO = 1
const STORE = 'leituras'
// Cópias mais velhas que isso são descartadas na limpeza.
const VALIDADE_MS = 30 * 24 * 60 * 60 * 1000
// Quanto esperar o servidor antes de usar a cópia local, com sinal fraco.
const ESPERA_MS = 12000

interface Leitura {
  chave: string
  usuario: string
  corpo: string
  salvo_em: number
}

let bancoAberto: Promise<IDBDatabase> | null = null

function abrirBanco(): Promise<IDBDatabase> {
  if (bancoAberto) return bancoAberto
  bancoAberto = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('sem IndexedDB'))
      return
    }
    const req = indexedDB.open(DB_NOME, DB_VERSAO)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'chave' })
        store.createIndex('salvo_em', 'salvo_em', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('falha ao abrir o cache'))
  })
  bancoAberto.catch(() => {
    bancoAberto = null
  })
  return bancoAberto
}

async function executar<T>(
  modo: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await abrirBanco()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, modo)
    const req = fn(tx.objectStore(STORE))
    let resultado: T | undefined
    if (req) req.onsuccess = () => (resultado = req.result)
    tx.oncomplete = () => resolve(resultado)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

// Usuário dono das cópias. Definido pelo cliente do PocketBase; separa os
// dados de quem usa o mesmo aparelho.
let usuarioAtual = ''
export function definirUsuarioCache(id: string) {
  usuarioAtual = id || ''
}

const chaveDe = (url: string) => `${usuarioAtual}|${url}`

function podeGuardar(url: string, metodo: string) {
  if (metodo !== 'GET') return false
  if (!usuarioAtual) return false
  return !/\/api\/(files|realtime|health)/.test(url)
}

/** Sinaliza para a interface que a tela está mostrando dados guardados. */
function avisarCopiaLocal() {
  try {
    window.dispatchEvent(new CustomEvent('labora:copia-local'))
  } catch {
    // sem window (teste) — ignora
  }
}

/** fetch usado pelo cliente do PocketBase: rede primeiro, cópia local se não houver conexão. */
export async function fetchComCache(
  url: RequestInfo | URL,
  config?: RequestInit,
): Promise<Response> {
  const endereco = String(url)
  const metodo = String(config?.method || 'GET').toUpperCase()
  if (!podeGuardar(endereco, metodo)) return fetch(url, config)

  const chave = chaveDe(endereco)
  const semRede = typeof navigator !== 'undefined' && navigator.onLine === false

  if (!semRede) {
    // Sinal fraco: se o servidor demorar e houver cópia, usa a cópia.
    const guardadaAntes = lerLeitura(chave)
    try {
      const rede = fetch(url, config)
      const resposta = await Promise.race([
        rede,
        new Promise<'demorou'>((ok) => setTimeout(() => ok('demorou'), ESPERA_MS)),
      ]).then(async (r) => {
        if (r !== 'demorou') return r
        const copia = await guardadaAntes
        if (!copia) return rede
        rede.catch(() => {})
        return null
      })
      if (resposta === null) {
        const copia = (await guardadaAntes) as Leitura
        avisarCopiaLocal()
        return respostaDaCopia(copia)
      }
      if (resposta.ok) {
        const copia = resposta.clone()
        copia
          .text()
          .then((corpo) =>
            executar('readwrite', (s) =>
              s.put({ chave, usuario: usuarioAtual, corpo, salvo_em: Date.now() } as Leitura),
            ),
          )
          .catch(() => {})
      }
      return resposta
    } catch (erro) {
      if ((erro as Error)?.name === 'AbortError') throw erro
      const guardada = await lerLeitura(chave)
      if (guardada) {
        avisarCopiaLocal()
        return respostaDaCopia(guardada)
      }
      throw erro
    }
  }

  const guardada = await lerLeitura(chave)
  if (guardada) {
    avisarCopiaLocal()
    return respostaDaCopia(guardada)
  }
  // Sem cópia: deixa a requisição falhar do jeito normal.
  return fetch(url, config)
}

async function lerLeitura(chave: string): Promise<Leitura | undefined> {
  try {
    return await executar<Leitura>('readonly', (s) => s.get(chave))
  } catch {
    return undefined
  }
}

function respostaDaCopia(l: Leitura) {
  return new Response(l.corpo, {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'X-Copia-Local': String(l.salvo_em) },
  })
}

/** Apaga todas as cópias (ao sair da conta). */
export async function limparCacheOffline() {
  try {
    localStorage.removeItem('labora-offline-preparado-em')
  } catch {
    // ignora
  }
  try {
    await executar('readwrite', (s) => s.clear())
  } catch {
    // nada a limpar
  }
}

/** Remove cópias antigas. Roda de vez em quando, sem bloquear nada. */
export async function podarCacheOffline() {
  try {
    const limite = Date.now() - VALIDADE_MS
    await executar('readwrite', (s) => {
      const req = s.index('salvo_em').openCursor(IDBKeyRange.upperBound(limite))
      req.onsuccess = () => {
        const cursor = req.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }
    })
  } catch {
    // ignora
  }
}
