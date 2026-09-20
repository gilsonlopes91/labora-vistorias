/* Layout público (fora do login) — sidebar com Início, Calculadora, Blog, Entrar. */
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Calculator, Home, LogIn, Newspaper } from 'lucide-react'
import { LaboraLogoFull } from '@/components/LaboraLogo'

const NAV = [
  { to: '/', label: 'Início', icon: Home, exact: true },
  { to: '/calculadora', label: 'Calculadora de multas', icon: Calculator },
  { to: '/blog', label: 'Blog', icon: Newspaper },
  { to: '/login', label: 'Entrar', icon: LogIn },
]

export default function PublicLayout() {
  const location = useLocation()
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
        <div className="px-5 py-5">
          <LaboraLogoFull />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const active = item.exact
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-5 py-4 text-xs text-muted-foreground">© Labora Engenharia e SST</div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
