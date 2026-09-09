/* Painel inicial — visão geral rápida e atalho para as áreas do app. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ArrowRight, CalendarClock, ClipboardCheck } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getEmpresas } from '@/services/empresas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const Index = () => {
  const { user } = useAuth()
  const [totalEmpresas, setTotalEmpresas] = useState<number | null>(null)

  useEffect(() => {
    getEmpresas()
      .then((items) => setTotalEmpresas(items.length))
      .catch(() => setTotalEmpresas(null))
  }, [])

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Olá{user?.name ? `, ${user.name}` : ''}</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Bem-vindo ao Labora Vistoria — gestão de vistorias e inspeções de SST.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/empresas">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <Building2 className="mb-2 h-6 w-6 text-primary" />
              <CardTitle className="text-base">Empresas</CardTitle>
              <CardDescription>
                {totalEmpresas === null
                  ? 'Carregando...'
                  : `${totalEmpresas} empresa(s) cadastrada(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" size="sm" className="px-0">
                Gerenciar empresas <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full opacity-60">
          <CardHeader>
            <ClipboardCheck className="mb-2 h-6 w-6 text-muted-foreground" />
            <CardTitle className="text-base">Vistorias (NR-01)</CardTitle>
            <CardDescription>Em breve — checklist e cálculo automático de multas</CardDescription>
          </CardHeader>
        </Card>

        <Card className="h-full opacity-60">
          <CardHeader>
            <CalendarClock className="mb-2 h-6 w-6 text-muted-foreground" />
            <CardTitle className="text-base">Agenda</CardTitle>
            <CardDescription>Em breve — calendário de agendamento por cliente</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}

export default Index
