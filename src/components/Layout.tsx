/* Layout — barra lateral minimalista + área de conteúdo, presente em todas as páginas protegidas. */
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Building2, Home, ClipboardCheck, CalendarClock } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
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

const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/empresas', label: 'Empresas', icon: Building2 },
  { to: '/vistorias', label: 'Vistorias', icon: ClipboardCheck },
  { to: '/agenda', label: 'Agenda', icon: CalendarClock },
]

export default function Layout() {
  const { isAuthenticated, user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  const currentLabel = NAV_ITEMS.find(
    (item) =>
      item.to === location.pathname || (item.to !== '/' && location.pathname.startsWith(item.to)),
  )?.label

  if (!isAuthenticated) {
    return <Outlet />
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-1 py-1">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-foreground text-[10px] font-bold text-background">
              LV
            </div>
            <span className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden">
              Labora Vistoria
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active =
                  item.to === '/'
                    ? location.pathname === '/'
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
          {user?.email && (
            <div className="truncate px-2 pb-1 pt-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              {user.email}
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <SidebarTrigger />
          {currentLabel && (
            <span className="text-sm font-medium text-muted-foreground">{currentLabel}</span>
          )}
        </header>
        <div className="flex-1">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
