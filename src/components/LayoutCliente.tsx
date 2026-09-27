/* Casca do portal do cliente (empresa vistoriada) — menu simples, sem os
 * itens do app interno (nada de módulos, equipe, catálogo, valores internos).
 * Carrega os acessos do usuário uma vez e passa a empresa selecionada para
 * as páginas via contexto de rota (useOutletContext). */
import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import { CalendarClock, ClipboardList, FileBadge, Home, LogOut, Receipt } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getMeusAcessosCliente, type AcessoCliente } from '@/services/acessosCliente'
import type { Empresa } from '@/services/empresas'
import LoadingScreen from '@/components/LoadingScreen'
import { LaboraLogoFull } from '@/components/LaboraLogo'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface ClientePortalContexto {
  empresa: Empresa
}

/** Usado dentro das páginas do portal para pegar a empresa selecionada. */
export const useEmpresaCliente = () => useOutletContext<ClientePortalContexto>()

const ITENS = [
  { to: '/cliente', label: 'Início', icone: Home, fim: true },
  { to: '/cliente/documentos', label: 'Documentos', icone: FileBadge },
  { to: '/cliente/plano-acao', label: 'Plano de ação', icone: ClipboardList },
  { to: '/cliente/orcamentos', label: 'Orçamentos', icone: Receipt },
  { to: '/cliente/agenda', label: 'Agenda', icone: CalendarClock },
]

export default function LayoutCliente() {
  const { user, signOut } = useAuth()
  const [acessos, setAcessos] = useState<AcessoCliente[]>([])
  const [empresaId, setEmpresaId] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    getMeusAcessosCliente()
      .then((lista) => {
        setAcessos(lista)
        if (lista[0]?.empresa_id) setEmpresaId(lista[0].empresa_id)
      })
      .catch((error) =>
        toast.error('Não foi possível carregar seu acesso', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregando(false))
  }, [])

  const empresas = useMemo(
    () => acessos.map((a) => a.expand?.empresa_id).filter((e): e is Empresa => !!e),
    [acessos],
  )
  const empresaAtual = empresas.find((e) => e.id === empresaId)

  if (carregando) {
    return <LoadingScreen fullScreen mensagem="Carregando seu acesso..." />
  }

  if (empresas.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 text-center">
        <div>
          <p className="font-medium">Nenhum acesso ativo encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Fale com quem cuida da sua vistoria para liberar o acesso de novo.
          </p>
          <Button variant="outline" className="mt-4" onClick={signOut}>
            Sair
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <LaboraLogoFull size="sm" />
          <div className="flex items-center gap-3">
            {empresas.length > 1 && (
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger className="h-9 w-56">
                  <SelectValue placeholder="Escolha a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nome_fantasia || emp.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          {ITENS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.fim}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent'
                }`
              }
            >
              <item.icone className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        {empresaAtual && <Outlet context={{ empresa: empresaAtual } as ClientePortalContexto} />}
      </main>
    </div>
  )
}
