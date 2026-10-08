/* Serviço do console de contas (camada plataforma). Todas as leituras vêm
   prontas do backend numa chamada só; as ações passam pelo hook admin_usuario
   para ficarem registradas no histórico. */
import pb from '@/lib/pocketbase/client'

export type StatusOrg = 'ativa' | 'trial' | 'bloqueada' | 'vencida'
export type PlanoOrg = 'individual' | 'equipe' | 'escritorio' | 'empresa'

export const PLANOS: { value: PlanoOrg; label: string; vagas: string }[] = [
  { value: 'individual', label: 'Individual', vagas: '0 vagas' },
  { value: 'equipe', label: 'Equipe', vagas: 'até 3 vagas' },
  { value: 'escritorio', label: 'Escritório', vagas: 'até 8 vagas' },
  { value: 'empresa', label: 'Empresa', vagas: 'negociado' },
]

export const STATUS_LABEL: Record<string, string> = {
  ativa: 'Ativa',
  trial: 'Teste',
  bloqueada: 'Bloqueada',
  vencida: 'Vencida',
}

export interface OrgResumo {
  id: string
  nome: string
  status: StatusOrg | string
  created: string
  dono_id: string
  dono_nome: string
  dono_email: string
  plano: PlanoOrg | ''
  limite_usuarios: number
  vencimento: string
  usuarios: number
  empresas: number
  vistorias: number
  perguntas_ia: number
}

export interface ListaOrgs {
  pagina: number
  por_pagina: number
  total: number
  total_paginas: number
  itens: OrgResumo[]
}

export interface Modulos {
  auditoria: boolean
  relatorios: boolean
  formularios: boolean
  ia: boolean
  orcamentos: boolean
  documentos: boolean
}

export interface Atividade {
  id: string
  organizacao_id?: string
  organizacao_nome?: string
  usuario_nome: string
  acao: string
  descricao: string
  detalhes?: unknown
  created: string
}

export interface Membro {
  id: string
  name: string
  email: string
  papel: string
  nivel_acesso: string
  created: string
  eh_dono: boolean
}

export interface OrgDetalhe {
  id: string
  nome: string
  status: StatusOrg | string
  created: string
  plano: PlanoOrg | ''
  limite_usuarios: number
  vencimento: string
  logo: string
  dono: { id: string; name: string; email: string } | null
  modulos: Partial<Modulos>
  contagens: {
    usuarios: number
    empresas: number
    vistorias: number
    vistorias_concluidas: number
    perguntas_ia: number
    documentos: number
    orcamentos: number
  }
  uso_mensal: { mes: string; vistorias: number; perguntas_ia: number }[]
  membros: Membro[]
  staff: { id: string; name: string; email: string }[]
  atividades: Atividade[]
  pode_editar: boolean
}

export interface Resumo {
  organizacoes: number
  ativas: number
  bloqueadas: number
  vencidas: number
  trial: number
  vencem_30_dias: number
  usuarios: number
  empresas: number
  vistorias: number
  perguntas_ia: number
  lista_espera: number
  atividades: Atividade[]
}

export interface FiltrosOrgs {
  pagina?: number
  por_pagina?: number
  busca?: string
  status?: string
  plano?: string
}

export async function listarOrganizacoes(f: FiltrosOrgs = {}): Promise<ListaOrgs> {
  const q = new URLSearchParams()
  if (f.pagina) q.set('pagina', String(f.pagina))
  if (f.por_pagina) q.set('por_pagina', String(f.por_pagina))
  if (f.busca) q.set('busca', f.busca)
  if (f.status) q.set('status', f.status)
  if (f.plano) q.set('plano', f.plano)
  const qs = q.toString()
  return pb.send(`/backend/v1/admin/organizacoes${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

export async function obterOrganizacao(id: string): Promise<OrgDetalhe> {
  return pb.send(`/backend/v1/admin/organizacoes/${id}`, { method: 'GET' })
}

export async function obterResumo(): Promise<Resumo> {
  return pb.send('/backend/v1/admin/resumo', { method: 'GET' })
}

function acao(body: Record<string, unknown>) {
  return pb.send('/backend/v1/admin/usuario', { method: 'POST', body: JSON.stringify(body) })
}

/** Cria um cliente: usuário + organização própria, com a senha padrão e troca
 *  obrigatória no primeiro acesso. */
export async function criarConta(dados: {
  nome: string
  email: string
  org_nome?: string
  plano: PlanoOrg
  /** true: sem senha padrão (a pessoa cria a senha pelo link do e-mail). */
  sem_senha?: boolean
}): Promise<{ ok: boolean; user_id: string; org_id: string }> {
  return acao({ acao: 'nova_conta', ...dados })
}

export async function alternarBloqueio(orgId: string): Promise<{ status: string }> {
  return acao({ acao: 'bloqueio', org_id: orgId })
}

export async function salvarPlano(
  orgId: string,
  dados: { plano: PlanoOrg; limite_usuarios: number; vencimento: string },
) {
  return acao({ acao: 'plano', org_id: orgId, ...dados })
}

export async function salvarPacote(orgId: string, modulos: Partial<Modulos>) {
  return acao({ acao: 'pacotes', org_id: orgId, modulos })
}

export async function definirNovaSenha(userId: string, senha: string) {
  return acao({ acao: 'nova_senha', user_id: userId, senha })
}

export async function alternarAcessoConsole(userId: string, acesso: boolean) {
  return acao({ acao: 'staff_console', user_id: userId, acesso })
}

export function gerarSenhaForte(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export const ACAO_LABEL: Record<string, string> = {
  nova_conta: 'Conta criada',
  bloqueio: 'Bloqueio',
  desbloqueio: 'Desbloqueio',
  plano: 'Plano',
  pacote: 'Pacote',
  nova_senha: 'Nova senha',
  staff_console: 'Acesso ao console',
}
