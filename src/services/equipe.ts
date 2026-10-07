import pb from '@/lib/pocketbase/client'
import { getVisaoCliente } from '@/lib/visaoCliente'

export type Papel = 'dono' | 'gerente' | 'gestor' | 'executor' | 'administrativo'

export interface MembroEquipe {
  id: string
  name: string
  email: string
  papel: Papel | 'admin_plataforma' | 'staff_labora'
}

export const getPapelUsuarioLogado = (): Papel | 'admin_plataforma' | 'staff_labora' => {
  const record = pb.authStore.record as (Record<string, unknown> & { papel?: string }) | null
  const papel = record?.papel
  // Administrador com "ver como cliente" ligado enxerga como um dono comum.
  if (papel === 'admin_plataforma' && getVisaoCliente()) return 'dono'
  return (papel as Papel | 'admin_plataforma' | 'staff_labora') || 'dono' // usuários antigos sem papel = dono
}

// Lista explícita (não "tudo que não é executor"): um papel novo (ex.: um
// futuro perfil de cliente ou administrativo) não deve herdar acesso de
// gestor só por omissão.
const PAPEIS_GESTOR = new Set(['dono', 'gerente', 'gestor', 'admin_plataforma', 'staff_labora'])

export const isGestor = () => {
  if (!pb.authStore.isValid || !pb.authStore.record) return false
  return PAPEIS_GESTOR.has(getPapelUsuarioLogado())
}

/**
 * Verifica se o usuário logado possui privilégios de administrador da plataforma/sistema (SaaS admin).
 * Papéis considerados administradores: 'admin_plataforma' e 'admin'.
 * Também contempla staff_labora com acesso ao console administrativo.
 */
export const isAdmin = (): boolean => {
  if (!pb.authStore.isValid || !pb.authStore.record) return false
  if (getVisaoCliente()) return false
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

export const getEquipe = async (): Promise<{ membros: MembroEquipe[]; donoId: string }> => {
  const r = await pb.send<{ membros: MembroEquipe[]; dono_id: string }>(
    '/backend/v1/equipe/membros',
    { method: 'GET' },
  )
  const membros = (r.membros || []).sort(
    (a, b) =>
      (ORDEM_PAPEL[a.papel] ?? 3) - (ORDEM_PAPEL[b.papel] ?? 3) ||
      a.name.localeCompare(b.name, 'pt-BR'),
  )
  return { membros, donoId: r.dono_id || '' }
}

export interface ConviteInput {
  email: string
  nome: string
  papel: 'gerente' | 'gestor' | 'executor' | 'administrativo'
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

/** Só o titular transfere: quem recebe vira titular (vagas, plano, cobrança);
 *  quem transferiu vira um gestor comum. */
export const transferirTitularidade = (id: string) =>
  pb.send<{ ok: boolean }>('/backend/v1/equipe/transferir', {
    method: 'POST',
    body: JSON.stringify({ id }),
  })

/** Manda para a pessoa o e-mail com o link para criar (ou trocar) a senha.
 *  É o mesmo e-mail do "Esqueci minha senha". */
export const enviarLinkDeAcesso = (email: string) =>
  pb.collection('users').requestPasswordReset(email)
