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
} from 'lucide-react'

export interface NavItemConfig {
  to: string
  label: string
  icon: LucideIcon
  gestor?: boolean
}

/**
 * Fonte única da verdade para itens de navegação e restrição de permissão por rota.
 * Itens com `gestor: true` só podem ser visualizados no menu e acessados por usuários com papel gestor/admin.
 */
export const NAV_ITEMS: NavItemConfig[] = [
  { to: '/painel', label: 'Início', icon: Home },
  { to: '/empresas', label: 'Empresas', icon: Building2 },
  { to: '/vistorias', label: 'Vistorias', icon: ClipboardCheck },
  { to: '/auditoria-formularios', label: 'Auditoria e Formulários', icon: ListChecks },
  { to: '/agenda', label: 'Agenda', icon: CalendarClock },
  { to: '/multas', label: 'Multas e penalidades', icon: Scale, gestor: true },
  { to: '/artigos', label: 'Blog / Artigos', icon: Newspaper, gestor: true },
  { to: '/equipe', label: 'Equipe', icon: Users, gestor: true },
  { to: '/configuracoes', label: 'Configurações', icon: Settings, gestor: true },
]

/**
 * Conjunto de caminhos restritos apenas a gestores baseados no NAV_ITEMS.
 */
export const GESTOR_ONLY_PATHS = new Set(
  NAV_ITEMS.filter((item) => item.gestor).map((item) => item.to),
)

/**
 * Verifica se um caminho de rota deve ser restrito exclusivamente a gestores.
 */
export function isGestorOnlyPath(path: string): boolean {
  if (GESTOR_ONLY_PATHS.has(path)) return true
  // Trata sub-rotas como /artigos/novo, /artigos/:id/editar
  for (const restricted of GESTOR_ONLY_PATHS) {
    if (path === restricted || path.startsWith(`${restricted}/`)) {
      return true
    }
  }
  return false
}
