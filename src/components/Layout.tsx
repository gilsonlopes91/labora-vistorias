/* Layout — barra lateral com a identidade da Labora + área de conteúdo, presente em todas as páginas protegidas. */
import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { getModulos, type Modulos } from '@/services/modulos'
import {
  LogOut,
  Building2,
  Home,
  ClipboardCheck,
  CalendarClock,
  ListChecks,
  FileText,
  Settings,
  Users,
  Newspaper,
  Scale,
  FileSpreadsheet,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { LaboraLogo } from '@/components/LaboraLogo'
import AssistantWidget from '@/components/AssistantWidget'
import { isGestor } from '@/services/equipe'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const NAV_ITEMS = [
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

export default function Layout() {
  const { isAuthenticated, user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Pacotes da organização: módulos desligados saem do menu.
  const [modulos, setModulos] = useState<Modulos | null>(null)
  useEffect(() => {
    if (isAuthenticated)
      getModulos()
        .then(setModulos)
        .catch(() => {})
  }, [isAuthenticated])
  const moduloDe: Record<string, (m: Modulos) => boolean> = {
    '/auditoria-formularios': (m) => m.auditoria || m.formularios,
  }

  const handleSignOut = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  const currentLabel = NAV_ITEMS.find(
    (item) =>
      item.to === location.pathname ||
      (item.to !== '/painel' && location.pathname.startsWith(item.to)),
  )?.label

  const initials = (user?.name || user?.email || 'LV').slice(0, 2).toUpperCase()

  if (!isAuthenticated) {
    return <Outlet />
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader>
          <Link
            to="/painel"
            className="flex items-center gap-2.5 px-1 py-2 transition-opacity hover:opacity-90"
            aria-label="Labora Vistorias — painel"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 p-0.5">
              <LaboraLogo className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex flex-col items-center text-center group-data-[collapsible=icon]:hidden">
              <div className="truncate text-sm font-bold leading-tight tracking-wide">LABORA</div>
              <div className="truncate text-[10px] leading-tight tracking-widest text-muted-foreground">
                vistorias
              </div>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {NAV_ITEMS.filter((item) => !item.gestor || isGestor())
                .filter((item) => !modulos || !moduloDe[item.to] || moduloDe[item.to](modulos))
                .map((item) => {
                  const active =
                    item.to === '/painel'
                      ? location.pathname === '/painel'
                      : location.pathname.startsWith(item.to)
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut} tooltip="Sair">
                <LogOut />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="flex items-center gap-2 px-2 pb-1 pt-2 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            {user?.email && (
              <span className="truncate text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                {user.email}
              </span>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-card px-3">
          <SidebarTrigger />
          {currentLabel && (
            <span className="text-sm font-medium text-muted-foreground">{currentLabel}</span>
          )}
        </header>
        <div className="flex-1">
          <Outlet />
        </div>
        <AssistantWidget />
      </SidebarInset>
    </SidebarProvider>
  )
}
