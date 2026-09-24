import pb from '@/lib/pocketbase/client'

export interface BlogAutor {
  id: string
  nome: string
  bio?: string
  ativo?: boolean
  created: string
  updated: string
}

export interface BlogAutorInput {
  nome: string
  bio?: string
  ativo?: boolean
}

/**
 * Busca todos os autores ativos do blog ordenados por nome.
 */
export async function getAutoresBlog(): Promise<BlogAutor[]> {
  const records = await pb.collection('blog_autores').getFullList<BlogAutor>({
    filter: 'ativo = true || ativo = null',
    sort: 'nome',
  })
  return records
}

/**
 * Cria um novo autor para o blog.
 */
export async function createAutorBlog(dados: BlogAutorInput): Promise<BlogAutor> {
  const record = await pb.collection('blog_autores').create<BlogAutor>({
    nome: dados.nome.trim(),
    bio: dados.bio?.trim() || '',
    ativo: dados.ativo ?? true,
  })
  return record
}
