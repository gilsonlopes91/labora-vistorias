/* Lê o conteúdo PUBLICADO de uma página do site e junta ao padrão do código.
   Guarda a última versão no aparelho para abrir sem piscar; se nunca foi
   publicado nada, guarda um objeto vazio (= usa o padrão). */
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { mesclar, type ChaveSite } from '@/lib/siteConteudo'

const PREFIXO = 'labora:site:'

function lerCache(chave: string): unknown {
  try {
    const texto = localStorage.getItem(PREFIXO + chave)
    return texto ? JSON.parse(texto) : null
  } catch {
    return null
  }
}

function gravarCache(chave: string, valor: unknown) {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor))
  } catch {
    // sem armazenamento local: segue sem cache
  }
}

export function useSiteConteudo<T>(
  chave: ChaveSite,
  padrao: T,
): { conteudo: T; carregando: boolean } {
  const [salvo, setSalvo] = useState<unknown>(() => lerCache(chave))
  const [carregando, setCarregando] = useState(() => lerCache(chave) === null)

  useEffect(() => {
    let vivo = true
    pb.send(`/backend/v1/public/conteudo-pagina/${chave}`, { method: 'GET' })
      .then((r: { conteudo: unknown }) => {
        if (!vivo) return
        const conteudo = r?.conteudo ?? {}
        setSalvo(conteudo)
        gravarCache(chave, conteudo)
      })
      .catch(() => {
        // sem rede: fica com o cache ou com o padrão
      })
      .finally(() => {
        if (vivo) setCarregando(false)
      })
    return () => {
      vivo = false
    }
  }, [chave])

  return { conteudo: mesclar(padrao, salvo), carregando }
}
