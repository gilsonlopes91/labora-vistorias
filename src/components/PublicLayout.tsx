/* Layout público — navbar horizontal fixa (sem menu vertical), conteúdo em
   largura total com container centralizado e rodapé institucional. */
import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { LaboraLogoFull } from '@/components/LaboraLogo'
import { Button } from '@/components/ui/button'

const NAV = [
  { to: '/', label: 'Início', exact: true },
  { to: '/calculadora', label: 'Calculadora de multas' },
  { to: '/blog', label: 'Blog' },
]

export default function PublicLayout() {
  const location = useLocation()
  const [aberto, setAberto] = useState(false)

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === '/' : location.pathname.startsWith(to)

  const linkClass = (ativo: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
      ativo ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
    }`

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Labora Vistorias — início">
            <LaboraLogoFull />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className={linkClass(isActive(item.to, item.exact))}>
                {item.label}
              </Link>
            ))}
            <Button asChild className="ml-3 rounded-full">
              <Link to="/login">Entrar</Link>
            </Button>
          </nav>
          <button
            type="button"
            className="rounded-lg p-2 md:hidden"
            aria-label="Abrir menu"
            onClick={() => setAberto(!aberto)}
          >
            {aberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {aberto && (
          <nav className="space-y-1 border-t px-4 py-3 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={linkClass(isActive(item.to, item.exact))}
                onClick={() => setAberto(false)}
              >
                {item.label}
              </Link>
            ))}
            <Button asChild className="mt-2 w-full rounded-full">
              <Link to="/login" onClick={() => setAberto(false)}>
                Entrar
              </Link>
            </Button>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <span className="font-bold text-foreground">LABORA vistorias</span>
            <span>Gestão de vistorias e inspeções de SST</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/calculadora" className="hover:text-foreground">
              Calculadora
            </Link>
            <Link to="/blog" className="hover:text-foreground">
              Blog
            </Link>
            <Link to="/login" className="hover:text-foreground">
              Entrar
            </Link>
          </div>
          <div>© {new Date().getFullYear()} Labora Engenharia e SST</div>
        </div>
      </footer>
    </div>
  )
}
