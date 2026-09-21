import type { LucideIcon } from 'lucide-react'
import {
  Home,
  Building2,
  ClipboardCheck,
  ListChecks,
  CalendarClock,
  Scale,
  Newspaper,
  Users,
  Settings,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'

export interface NavSubItemConfig {
  to: string
  label: string
  icon?: LucideIcon
  gestor?: boolean
  /** Módulo opcional necessário da organização (ex.: 'auditoria' ou 'formularios') */
  moduloKey?: 'auditoria' | 'formularios'
}

export interface NavItemConfig {
  to: string
  label: string
  icon: LucideIcon
  gestor?: boolean
  children?: NavSubItemConfig[]
}

/**
 * Fonte única da verdade para itens de navegação e restrição de permissão por rota.
 * Itens com `gestor: true` só podem ser visualizados no menu e acessados por usuários com papel gestor/admin.
 */
export const NAV_ITEMS: NavItemConfig[] = [
  { to: '/painel', label: 'Início', icon: Home },
  {
    to: '/empresas',
    label: 'Empresas',
    icon: Building2,
    children: [
      {
        to: '/empresas',
        label: 'Cadastro de empresas',
        icon: Building2,
      },
      {
        to: '/empresas?aba=orcamentos',
        label: 'Orçamentos',
        icon: FileSpreadsheet,
      },
    ],
  },
  { to: '/vistorias', label: 'Vistorias', icon: ClipboardCheck },
  {
    to: '/auditoria-formularios',
    label: 'Auditoria e Formulários',
    icon: ListChecks,
    children: [
      {
        to: '/auditoria-formularios?aba=auditoria',
        label: 'Auditoria NRs',
        icon: ListChecks,
        moduloKey: 'auditoria',
      },
      {
        to: '/auditoria-formularios?aba=formularios',
        label: 'Formulários',
        icon: FileText,
        moduloKey: 'formularios',
      },
    ],
  },
  { to: '/agenda', label: 'Agenda', icon: CalendarClock },
  { to: '/multas', label: 'Multas e penalidades', icon: Scale, gestor: true },
  { to: '/artigos', label: 'Blog / Artigos', icon: Newspaper, gestor: true },
  { to: '/equipe', label: 'Equipe', icon: Users, gestor: true },
  { to: '/configuracoes', label: 'Configurações', icon: Settings, gestor: true },
]

/**
 * Conjunto de caminhos restritos apenas a gestores baseados no NAV_ITEMS (itens de rota inteira restrita).
 * Nota: rotas onde apenas uma sub-aba é gestor (ex: /empresas com sub-item orcamentos)
 * são protegidas na própria página/aba, não bloqueando a rota /empresas como um todo.
 */
export const GESTOR_ONLY_PATHS = new Set<string>([
  ...NAV_ITEMS.filter((item) => item.gestor).map((item) => item.to.split('?')[0]),
])

/**
 * Verifica se um caminho de rota deve ser restrito exclusivamente a gestores.
 */
export function isGestorOnlyPath(path: string): boolean {
  const cleanPath = path.split('?')[0]
  if (GESTOR_ONLY_PATHS.has(cleanPath)) return true
  // Trata sub-rotas como /artigos/novo, /artigos/:id/editar
  for (const restricted of GESTOR_ONLY_PATHS) {
    if (cleanPath === restricted || cleanPath.startsWith(`${restricted}/`)) {
      return true
    }
  }
  return false
}
