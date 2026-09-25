import pb from '@/lib/pocketbase/client'

export type Papel = 'dono' | 'gerente' | 'gestor' | 'executor'

export interface MembroEquipe {
  id: string
  name: string
  email: string
  papel: Papel | 'admin_plataforma' | 'staff_labora'
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

// A coleção users só deixa cada um ver o próprio registro; a lista da equipe
// vem de uma rota do servidor que devolve só nome, e-mail e papel.
const ORDEM_PAPEL: Record<string, number> = { dono: 0, gerente: 1, executor: 2 }

export const getEquipe = async (): Promise<MembroEquipe[]> => {
  const r = await pb.send<{ membros: MembroEquipe[] }>('/backend/v1/equipe/membros', {
    method: 'GET',
  })
  return (r.membros || []).sort(
    (a, b) =>
      (ORDEM_PAPEL[a.papel] ?? 3) - (ORDEM_PAPEL[b.papel] ?? 3) ||
      a.name.localeCompare(b.name, 'pt-BR'),
  )
}

export interface ConviteInput {
  email: string
  nome: string
  papel: 'gerente' | 'gestor' | 'executor'
}

export const convidarMembro = (data: ConviteInput) =>
  pb.send<{ ok: boolean; id: string }>('/backend/v1/equipe/convidar', {
    method: 'POST',
    body: JSON.stringify(data),
  })

/** Tira a pessoa da equipe: perde o acesso na hora (a conta não é apagada). */
export const removerMembro = (id: string) =>
  pb.send<{ ok: boolean }>('/backend/v1/equipe/remover', {
    method: 'POST',
    body: JSON.stringify({ id }),
  })

/** Manda para a pessoa o e-mail com o link para criar (ou trocar) a senha.
 *  É o mesmo e-mail do "Esqueci minha senha". */
export const enviarLinkDeAcesso = (email: string) =>
  pb.collection('users').requestPasswordReset(email)
