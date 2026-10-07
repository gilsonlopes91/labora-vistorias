/* Menu do console de contas — separa o que antes vivia numa página só. */
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  ListChecks,
  BookOpen,
  FileText,
  GraduationCap,
  MessageSquarePlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

const ITENS = [
  { to: '/admin', label: 'Visão geral', icon: LayoutDashboard, fim: true, soAdmin: false },
  { to: '/admin/organizacoes', label: 'Organizações', icon: Building2, fim: false, soAdmin: false },
  { to: '/admin/staff', label: 'Staff Labora', icon: Users, fim: false, soAdmin: true },
  {
    to: '/admin/lista-espera',
    label: 'Lista de espera',
    icon: ListChecks,
    fim: false,
    soAdmin: true,
  },
  {
    to: '/admin/quiz-beta',
    label: 'Questionário beta',
    icon: GraduationCap,
    fim: false,
    soAdmin: true,
  },
  {
    to: '/admin/feedbacks',
    label: 'Sugestões',
    icon: MessageSquarePlus,
    fim: false,
    soAdmin: true,
  },
  { to: '/admin/normas', label: 'Normas', icon: BookOpen, fim: false, soAdmin: true },
  { to: '/admin/conteudo', label: 'Textos do site', icon: FileText, fim: false, soAdmin: true },
]

export default function AdminNav() {
  const { user } = useAuth()
  const ehAdmin = user?.papel === 'admin_plataforma'
  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b pb-2">
      {ITENS.filter((i) => ehAdmin || !i.soAdmin).map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.fim}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors',
              isActive
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )
          }
        >
          <i.icon className="h-4 w-4" />
          {i.label}
        </NavLink>
      ))}
    </nav>
  )
}
