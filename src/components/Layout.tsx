/* Layout Component - cabeçalho com navegação, visível em todas as páginas protegidas */
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Building2, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: LayoutDashboard },
  { to: '/empresas', label: 'Empresas', icon: Building2 },
]

export default function Layout() {
  const { isAuthenticated, user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <main className="flex min-h-screen flex-col">
      {isAuthenticated && (
        <header className="border-b bg-background">
          <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-6">
              <span className="text-lg font-bold">Labora Vistoria</span>
              <nav className="flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                  const active = location.pathname === item.to
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {user?.email && (
                <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1.5 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </header>
      )}
      <div className="flex-1">
        <Outlet />
      </div>
    </main>
  )
}
