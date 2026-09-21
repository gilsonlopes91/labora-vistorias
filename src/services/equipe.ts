import pb from '@/lib/pocketbase/client'

export type Papel = 'dono' | 'gerente' | 'executor'

export interface MembroEquipe {
  id: string
  name: string
  email: string
  papel: Papel
}

export const getPapelUsuarioLogado = (): Papel | 'admin_plataforma' | 'staff_labora' => {
  const record = pb.authStore.record as (Record<string, unknown> & { papel?: string }) | null
  const papel = record?.papel
  return (papel as Papel | 'admin_plataforma' | 'staff_labora') || 'dono' // usuários antigos sem papel = dono
}

export const isGestor = () => {
  if (!pb.authStore.isValid || !pb.authStore.record) return false
  return getPapelUsuarioLogado() !== 'executor'
}

/**
 * Verifica se o usuário logado possui privilégios de administrador da plataforma/sistema (SaaS admin).
 * Papéis considerados administradores: 'admin_plataforma' e 'admin'.
 * Também contempla staff_labora com acesso ao console administrativo.
 */
export const isAdmin = (): boolean => {
  if (!pb.authStore.isValid || !pb.authStore.record) return false
  const record = pb.authStore.record as Record<string, unknown> & {
    papel?: string
    acesso_console?: boolean
  }
  const papel = record?.papel
  return (
    papel === 'admin_plataforma' ||
    papel === 'admin' ||
    (papel === 'staff_labora' && Boolean(record?.acesso_console))
  )
}

export const getEquipe = async (): Promise<MembroEquipe[]> => {
  const org = await pb.collection('organizacoes').getFirstListItem('')
  const donoId = org.dono_id
  const membrosIds: string[] = org.membros || []
  const ids = [donoId, ...membrosIds]
  const usuarios = await pb.collection('users').getFullList({
    filter: pb.filter('id ?= {:ids}', { ids }),
    sort: '-papel,name',
  })
  return usuarios.map((u) => ({
    id: u.id,
    name: u.name || u.email,
    email: u.email,
    papel: (u.papel as Papel) || 'dono',
  }))
}

export interface ConviteInput {
  email: string
  nome: string
  senha: string
  papel: 'gerente' | 'executor'
}

export const convidarMembro = (data: ConviteInput) =>
  pb.send('/backend/v1/equipe/convidar', {
    method: 'POST',
    body: JSON.stringify(data),
  })
