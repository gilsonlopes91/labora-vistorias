import type { LucideIcon } from 'lucide-react'
import {
  Home,
  Building2,
  ClipboardCheck,
  ListChecks,
  CalendarClock,
  Newspaper,
  Users,
  Settings,
  FileSpreadsheet,
  FileText,
  BookOpenCheck,
  Palette,
  KeyRound,
  FileBadge,
  HelpCircle,
  Layers,
  FlaskConical,
  Grid3x3,
  Video,
} from 'lucide-react'

export interface NavSubItemConfig {
  to: string
  label: string
  icon?: LucideIcon
  gestor?: boolean
  /** Módulo opcional necessário da organização (ex.: 'auditoria' ou 'formularios') */
  moduloKey?: 'auditoria' | 'formularios' | 'documentos'
}

export interface NavItemConfig {
  to: string
  label: string
  icon: LucideIcon
  gestor?: boolean
  /** Só aparece para o admin da plataforma (papel admin_plataforma). */
  adminOnly?: boolean
  /** Oculto do papel administrativo (agenda/orçamentos/empresas apenas). */
  escondaAdministrativo?: boolean
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
      {
        to: '/orcamentos/modelos',
        label: 'Modelos de proposta',
        icon: Palette,
        gestor: true,
      },
    ],
  },
  { to: '/vistorias', label: 'Vistorias', icon: ClipboardCheck, escondaAdministrativo: true },
  {
    to: '/auditoria-formularios',
    label: 'Auditoria e Formulários',
    icon: ListChecks,
    escondaAdministrativo: true,
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
  // Documentação SST (PGR, LTCAT, laudos): módulo separado, controlado pelo
  // pacote "documentos" da organização.
  {
    to: '/documentacao',
    label: 'Documentação SST',
    icon: FileBadge,
    escondaAdministrativo: true,
    children: [
      {
        to: '/documentacao?aba=levantamento',
        label: 'Levantamento',
        icon: Layers,
        moduloKey: 'documentos',
      },
      {
        to: '/documentacao?aba=catalogo',
        label: 'Catálogo de agentes',
        icon: FlaskConical,
        moduloKey: 'documentos',
      },
      {
        to: '/documentacao?aba=matrizes',
        label: 'Matrizes de risco',
        icon: Grid3x3,
        moduloKey: 'documentos',
      },
      {
        to: '/documentacao?aba=como-funciona',
        label: 'Como funciona',
        icon: HelpCircle,
        moduloKey: 'documentos',
      },
    ],
  },
  // Vídeos: item de nível único, de propósito próprio — não é uma aba de
  // "Documentação SST" nem tem relação com levantamento/catálogo/matrizes.
  { to: '/videos', label: 'Vídeos', icon: Video, escondaAdministrativo: true },
  { to: '/agenda', label: 'Agenda', icon: CalendarClock },
  // Blog e Normas são ferramentas da administração da plataforma (Labora),
  // não da operação de uma organização cliente — nenhum gestor de cliente
  // deve ver esses itens.
  { to: '/artigos', label: 'Blog / Artigos', icon: Newspaper, adminOnly: true },
  { to: '/equipe', label: 'Equipe', icon: Users, gestor: true },
  // Aberto a todos: o dono da conta sempre edita a identidade visual; o resto
  // da página é controlado por perfil dentro dela.
  { to: '/configuracoes', label: 'Configurações', icon: Settings, gestor: true },
  // A página já existia (troca obrigatória no primeiro acesso), mas não tinha link.
  { to: '/trocar-senha', label: 'Trocar senha', icon: KeyRound },
  { to: '/admin/normas', label: 'Normas (catálogo NR)', icon: BookOpenCheck, adminOnly: true },
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
