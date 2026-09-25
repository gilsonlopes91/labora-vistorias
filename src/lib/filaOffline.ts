/* Fila local das respostas de checklist feitas sem internet (etapa 1 do modo
   offline). Quando o envio de uma resposta, observação ou foto falha por falta
   de conexão, a alteração fica guardada no IndexedDB do aparelho e é enviada
   sozinha quando a internet volta. A fila guarda o estado final de cada item
   (a última situação, a última observação e todas as fotos novas), então
   marcar C e depois N/C sem sinal gera um envio só.

   Etapa 2 (ainda não feita): abrir o app e a vistoria já sem internet. */
import type { GeoLocalizacao, Situacao } from '@/services/respostasVistoria'

const DB_NOME = 'labora-vistorias-offline'
const DB_VERSAO = 1
const STORE = 'respostas_pendentes'

export interface PendenciaResposta {
  /** `${vistoria_id}:${item_checklist_id}` */
  chave: string
  vistoria_id: string
  item_checklist_id: string
  client_uuid: string
  situacao?: Situacao
  observacao?: string
  numero_funcionarios_irregulares?: number
  fotos: File[]
  localizacao?: GeoLocalizacao
  /** Plano de ação do item não conforme. */
  recomendacao?: string
  prazo_adequacao?: string
  atualizado_em: number
  /** Última falha que não foi de conexão (ex.: vistoria concluída no servidor). */
  erro?: string
}

export type AlteracaoResposta = Partial<
  Pick<
    PendenciaResposta,
    | 'situacao'
    | 'observacao'
    | 'numero_funcionarios_irregulares'
    | 'localizacao'
    | 'recomendacao'
    | 'prazo_adequacao'
  >
> & { fotos?: File[] }

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Este navegador não permite guardar dados no aparelho.'))
      return
    }
    const req = indexedDB.open(DB_NOME, DB_VERSAO)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'chave' })
        store.createIndex('vistoria_id', 'vistoria_id', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('Falha ao abrir o armazenamento local'))
  })
}

async function comStore<T>(
  modo: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await abrirBanco()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, modo)
    const store = tx.objectStore(STORE)
    const req = fn(store)
    let resultado: T | undefined
    if (req) req.onsuccess = () => (resultado = req.result)
    tx.oncomplete = () => {
      db.close()
      resolve(resultado)
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error || new Error('Falha no armazenamento local'))
    }
    tx.onabort = () => {
      db.close()
      reject(tx.error || new Error('Operação no armazenamento local cancelada'))
    }
  })
}

export const chavePendencia = (vistoriaId: string, itemId: string) => `${vistoriaId}:${itemId}`

export async function listarPendencias(vistoriaId: string): Promise<PendenciaResposta[]> {
  try {
    const todas =
      (await comStore<PendenciaResposta[]>('readonly', (s) =>
        s.index('vistoria_id').getAll(IDBKeyRange.only(vistoriaId)),
      )) || []
    return todas.sort((a, b) => a.atualizado_em - b.atualizado_em)
  } catch {
    return []
  }
}

async function lerPendencia(chave: string): Promise<PendenciaResposta | undefined> {
  return comStore<PendenciaResposta>('readonly', (s) => s.get(chave))
}

/** Guarda (ou junta com o que já estava guardado) a alteração de um item. */
export async function enfileirarAlteracao(
  vistoriaId: string,
  itemId: string,
  clientUuid: string,
  alteracao: AlteracaoResposta,
): Promise<PendenciaResposta> {
  const chave = chavePendencia(vistoriaId, itemId)
  const atual = await lerPendencia(chave)
  const nova: PendenciaResposta = {
    chave,
    vistoria_id: vistoriaId,
    item_checklist_id: itemId,
    client_uuid: atual?.client_uuid || clientUuid,
    situacao: alteracao.situacao ?? atual?.situacao,
    observacao: alteracao.observacao ?? atual?.observacao,
    numero_funcionarios_irregulares:
      alteracao.numero_funcionarios_irregulares ?? atual?.numero_funcionarios_irregulares,
    localizacao: alteracao.localizacao ?? atual?.localizacao,
    recomendacao: alteracao.recomendacao ?? atual?.recomendacao,
    prazo_adequacao: alteracao.prazo_adequacao ?? atual?.prazo_adequacao,
    fotos: [...(atual?.fotos || []), ...(alteracao.fotos || [])],
    atualizado_em: Date.now(),
  }
  await comStore('readwrite', (s) => s.put(nova))
  return nova
}

export async function removerPendencia(chave: string): Promise<void> {
  await comStore('readwrite', (s) => s.delete(chave))
}

export async function marcarErroPendencia(chave: string, erro: string): Promise<void> {
  const atual = await lerPendencia(chave)
  if (!atual) return
  await comStore('readwrite', (s) => s.put({ ...atual, erro }))
}
