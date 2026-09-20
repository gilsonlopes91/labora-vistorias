import pb from '@/lib/pocketbase/client'

export type StatusArtigo = 'rascunho' | 'publicado'

export interface Artigo {
  id: string
  titulo: string
  slug: string
  resumo: string
  conteudo: string
  capa?: string
  status: StatusArtigo
  autor_id?: string
  created: string
  updated: string
  expand?: {
    autor_id?: {
      id: string
      name: string
      email: string
      avatar?: string
    }
  }
}

export interface ArtigoInput {
  titulo: string
  slug: string
  resumo: string
  conteudo: string
  status: StatusArtigo
  autor_id?: string
  capa?: File | null
}

export function gerarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos/acentos
    .replace(/[^a-z0-9\s-]/g, '') // remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-') // substitui espaços por traço
    .replace(/-+/g, '-') // remove múltiplos traços seguidos
}

export function getUrlCapaArtigo(artigo: { id: string; capa?: string }): string | null {
  if (!artigo.capa) return null
  return pb.files.getURL(artigo as any, artigo.capa)
}

/**
 * Busca lista de artigos para o blog público (apenas publicados).
 */
export async function getArtigosPublicos(): Promise<Artigo[]> {
  const records = await pb.collection('artigos').getFullList<Artigo>({
    filter: "status = 'publicado'",
    sort: '-created',
    expand: 'autor_id',
  })
  return records
}

/**
 * Busca um artigo público pelo seu slug único.
 */
export async function getArtigoPorSlug(slug: string): Promise<Artigo | null> {
  try {
    const record = await pb
      .collection('artigos')
      .getFirstListItem<Artigo>(`slug = "${slug}" && status = "publicado"`, { expand: 'autor_id' })
    return record
  } catch {
    return null
  }
}

/**
 * Busca todos os artigos para o painel administrativo (rascunhos e publicados).
 */
export async function getTodosArtigos(): Promise<Artigo[]> {
  const records = await pb.collection('artigos').getFullList<Artigo>({
    sort: '-updated',
    expand: 'autor_id',
  })
  return records
}

/**
 * Busca um artigo pelo id (área admin).
 */
export async function getArtigoPorId(id: string): Promise<Artigo> {
  const record = await pb.collection('artigos').getOne<Artigo>(id, {
    expand: 'autor_id',
  })
  return record
}

/**
 * Cria um novo artigo.
 */
export async function createArtigo(dados: ArtigoInput): Promise<Artigo> {
  const formData = new FormData()
  formData.append('titulo', dados.titulo)
  formData.append('slug', dados.slug || gerarSlug(dados.titulo))
  formData.append('resumo', dados.resumo)
  formData.append('conteudo', dados.conteudo)
  formData.append('status', dados.status)

  if (dados.autor_id) {
    formData.append('autor_id', dados.autor_id)
  }

  if (dados.capa) {
    formData.append('capa', dados.capa)
  }

  const record = await pb.collection('artigos').create<Artigo>(formData, {
    expand: 'autor_id',
  })
  return record
}

/**
 * Atualiza um artigo existente.
 */
export async function updateArtigo(id: string, dados: Partial<ArtigoInput>): Promise<Artigo> {
  const formData = new FormData()

  if (dados.titulo !== undefined) formData.append('titulo', dados.titulo)
  if (dados.slug !== undefined) formData.append('slug', dados.slug)
  if (dados.resumo !== undefined) formData.append('resumo', dados.resumo)
  if (dados.conteudo !== undefined) formData.append('conteudo', dados.conteudo)
  if (dados.status !== undefined) formData.append('status', dados.status)
  if (dados.autor_id !== undefined) formData.append('autor_id', dados.autor_id)

  if (dados.capa instanceof File) {
    formData.append('capa', dados.capa)
  } else if (dados.capa === null) {
    formData.append('capa', '')
  }

  const record = await pb.collection('artigos').update<Artigo>(id, formData, {
    expand: 'autor_id',
  })
  return record
}

/**
 * Altera rapidamente o status (publicado <-> rascunho)
 */
export async function toggleStatusArtigo(id: string, statusAtual: StatusArtigo): Promise<Artigo> {
  const novoStatus: StatusArtigo = statusAtual === 'publicado' ? 'rascunho' : 'publicado'
  const record = await pb.collection('artigos').update<Artigo>(id, {
    status: novoStatus,
  })
  return record
}

/**
 * Exclui um artigo.
 */
export async function deleteArtigo(id: string): Promise<boolean> {
  await pb.collection('artigos').delete(id)
  return true
}
