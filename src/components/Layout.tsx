/* Layout — barra lateral com a identidade da Labora + navegação em árvore por níveis (com chevron rotativo e subitens indentados). */
import { useEffect, useMemo, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { getModulos, type Modulos } from '@/services/modulos'
import { LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { LaboraLogo } from '@/components/LaboraLogo'
import AssistantWidget from '@/components/AssistantWidget'
import { isGestor } from '@/services/equipe'
import { NAV_ITEMS, type NavItemConfig, type NavSubItemConfig } from '@/config/navigation'
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'

/**
 * Avalia se um sub-item está ativo comparando pathname e search (aba)
 */
function isSubItemActive(subTo: string, pathname: string, search: string): boolean {
  const [subPath, subQuery] = subTo.split('?')
  const currentParams = new URLSearchParams(search)

  // Tratamento para a rota /empresas
  if (subPath === '/empresas') {
    if (pathname !== '/empresas') return false
    const currentAba = currentParams.get('aba')
    if (subQuery) {
      const targetParams = new URLSearchParams(subQuery)
      return currentAba === targetParams.get('aba')
    }
    // Subitem principal /empresas fica ativo se não há aba ou aba=empresas
    return !currentAba || currentAba === 'empresas'
  }

  // Tratamento para /auditoria-formularios
  if (subPath === '/auditoria-formularios') {
    if (
      pathname !== '/auditoria-formularios' &&
      pathname !== '/modelos' &&
      pathname !== '/formularios'
    ) {
      return false
    }
    const currentAba = currentParams.get('aba')
    const targetParams = new URLSearchParams(subQuery || '')
    const targetAba = targetParams.get('aba')

    if (targetAba === 'formularios') {
      return currentAba === 'formularios' || pathname === '/formularios'
    }
    if (targetAba === 'auditoria') {
      return !currentAba || currentAba === 'auditoria' || pathname === '/modelos'
    }
  }

  // Padrão genérico
  if (!subQuery) {
    return pathname === subPath
  }
  const targetParams = new URLSearchParams(subQuery)
  for (const [key, value] of targetParams.entries()) {
    if (currentParams.get(key) !== value) return false
  }
  return pathname === subPath
}

/**
 * Avalia se o item pai ou alguma rota pertencente ao grupo está ativa
 */
function isGroupActive(item: NavItemConfig, pathname: string, search: string): boolean {
  if (item.to === '/painel') {
    return pathname === '/painel'
  }

  if (item.to === '/empresas') {
    return pathname === '/empresas' || pathname.startsWith('/orcamentos')
  }

  if (item.to === '/auditoria-formularios') {
    return (
      pathname.startsWith('/auditoria-formularios') ||
      pathname.startsWith('/modelos') ||
      pathname === '/formularios'
    )
  }

  if (item.children && item.children.length > 0) {
    return item.children.some((child) => isSubItemActive(child.to, pathname, search))
  }

  return pathname.startsWith(item.to)
}

function NavItemTree({
  item,
  pathname,
  search,
  userGestor,
  modulos,
  badge,
}: {
  item: NavItemConfig
  pathname: string
  search: string
  userGestor: boolean
  modulos: Modulos | null
  badge?: number
}) {
  const { state: sidebarState, setOpen } = useSidebar()

  // Filtra sub-itens disponíveis de acordo com perfil e módulos
  const visibleChildren = useMemo(() => {
    if (!item.children) return []
    return item.children.filter((sub) => {
      if (sub.gestor && !userGestor) return false
      if (sub.moduloKey && modulos && !modulos[sub.moduloKey]) return false
      return true
    })
  }, [item.children, userGestor, modulos])

  const hasChildren = visibleChildren.length > 0
  const groupActive = isGroupActive(item, pathname, search)

  // Estado de expansão do grupo (inicia expandido se ativo)
  const [isOpen, setIsOpen] = useState<boolean>(groupActive)

  // Quando a URL muda para uma rota filha, garante que o grupo expanda automaticamente
  useEffect(() => {
    if (groupActive) {
      setIsOpen(true)
    }
  }, [groupActive])

  // Se não tem filhos, renderiza item simples
  if (!hasChildren) {
    const active = item.to === '/painel' ? pathname === '/painel' : pathname.startsWith(item.to)
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
          <Link to={item.to}>
            <span className="relative shrink-0">
              <item.icon className="h-4 w-4" />
              {!!badge && (
                <span className="absolute -right-1 -top-1 hidden h-2 w-2 rounded-full bg-amber-500 group-data-[collapsible=icon]:block" />
              )}
            </span>
            <span className="truncate">{item.label}</span>
            {!!badge && (
              <span
                className="ml-auto rounded-full bg-amber-500 px-1.5 text-[10px] font-bold leading-4 text-white group-data-[collapsible=icon]:hidden"
                title={`${badge} norma(s) com possível atualização no gov.br`}
              >
                {badge}
              </span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  // Item pai com filhos: Collapsible com chevron rotativo
  return (
    <SidebarMenuItem>
      <Collapsible
        open={isOpen}
        onOpenChange={(nextOpen) => {
          // Se a sidebar estiver colapsada em modo ícones, ao clicar expande a sidebar inteira para melhor UX
          if (sidebarState === 'collapsed') {
            setOpen(true)
          }
          setIsOpen(nextOpen)
        }}
        className="group/collapsible"
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={groupActive}
            tooltip={item.label}
            className="w-full justify-between"
          >
            <div className="flex min-w-0 items-center gap-2">
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 shrink-0 text-muted-foreground/80 transition-transform duration-200 group-data-[collapsible=icon]:hidden',
                isOpen && 'rotate-180 text-foreground',
              )}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="my-1 ml-4 border-l border-border/60 pl-2">
            {visibleChildren.map((sub: NavSubItemConfig) => {
              const SubIcon = sub.icon
              const active = isSubItemActive(sub.to, pathname, search)
              return (
                <SidebarMenuSubItem key={sub.to}>
                  <SidebarMenuSubButton
                    asChild
                    size="sm"
                    isActive={active}
                    className={cn(
                      'h-8 text-xs font-normal transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      active &&
                        'bg-sidebar-accent/80 font-semibold text-primary shadow-xs data-[active=true]:text-primary',
                    )}
                  >
                    <Link to={sub.to} className="flex items-center gap-2">
                      {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />}
                      <span className="truncate">{sub.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}

export default function Layout() {
  const { isAuthenticated, user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const userGestor = isGestor()

  // Pacotes da organização: módulos desligados saem do menu.
  const [modulos, setModulos] = useState<Modulos | null>(null)
  useEffect(() => {
    if (isAuthenticated)
      getModulos()
        .then(setModulos)
        .catch(() => {})
  }, [isAuthenticated])

  // Selo do menu Normas: NRs com possível atualização encontrada no gov.br.
  const ehAdmin = user?.papel === 'admin_plataforma'
  const [alertasNormas, setAlertasNormas] = useState(0)
  useEffect(() => {
    if (!isAuthenticated || !ehAdmin) return
    pb.collection('normas_monitor')
      .getList(1, 1, { filter: "status = 'mudou'", requestKey: null })
      .then((r) => setAlertasNormas(r.totalItems))
      .catch(() => setAlertasNormas(0))
  }, [isAuthenticated, ehAdmin, location.pathname])

  const moduloDe: Record<string, (m: Modulos) => boolean> = {
    '/auditoria-formularios': (m) => m.auditoria || m.formularios,
  }

  const handleSignOut = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  // Encontra o rótulo atual para o topo (cabeçalho)
  const currentLabel = useMemo(() => {
    // 1. Tenta encontrar sub-item correspondente
    for (const item of NAV_ITEMS) {
      if (item.children) {
        for (const sub of item.children) {
          if (isSubItemActive(sub.to, location.pathname, location.search)) {
            return `${item.label} · ${sub.label}`
          }
        }
      }
    }
    // 2. Se não encontrou sub-item, tenta pelo item pai
    return NAV_ITEMS.find((item) =>
      item.to === '/painel'
        ? location.pathname === '/painel'
        : location.pathname.startsWith(item.to),
    )?.label
  }, [location.pathname, location.search])

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
              {NAV_ITEMS.filter((item) => !item.gestor || userGestor)
                .filter((item) => !item.adminOnly || user?.papel === 'admin_plataforma')
                .filter((item) => !modulos || !moduloDe[item.to] || moduloDe[item.to](modulos))
                .map((item) => (
                  <NavItemTree
                    key={item.to}
                    item={item}
                    pathname={location.pathname}
                    search={location.search}
                    userGestor={userGestor}
                    modulos={modulos}
                    badge={item.to === '/admin/normas' ? alertasNormas : undefined}
                  />
                ))}
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
