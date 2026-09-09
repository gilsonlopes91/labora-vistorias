/* Painel inicial — visão geral rápida e atalho para as áreas do app. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ArrowRight, CalendarClock, ClipboardCheck } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getEmpresas } from '@/services/empresas'
import { getVistorias } from '@/services/vistorias'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const Index = () => {
  const { user } = useAuth()
  const [totalEmpresas, setTotalEmpresas] = useState<number | null>(null)
  const [totalVistorias, setTotalVistorias] = useState<number | null>(null)

  useEffect(() => {
    getEmpresas()
      .then((items) => setTotalEmpresas(items.length))
      .catch(() => setTotalEmpresas(null))
    getVistorias()
      .then((items) => setTotalVistorias(items.length))
      .catch(() => setTotalVistorias(null))
  }, [])

  const cards = [
    {
      to: '/empresas',
      icon: Building2,
      title: 'Empresas',
      description:
        totalEmpresas === null ? 'Carregando...' : `${totalEmpresas} empresa(s) cadastrada(s)`,
      cta: 'Gerenciar empresas',
    },
    {
      to: '/vistorias',
      icon: ClipboardCheck,
      title: 'Vistorias',
      description:
        totalVistorias === null ? 'Carregando...' : `${totalVistorias} vistoria(s) no total`,
      cta: 'Ver vistorias',
    },
    {
      to: '/agenda',
      icon: CalendarClock,
      title: 'Agenda',
      description: 'Calendário de vistorias por cliente',
      cta: 'Abrir agenda',
    },
  ]

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Olá{user?.name ? `, ${user.name}` : ''}</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Bem-vindo ao Labora Vistoria — gestão de vistorias e inspeções de SST.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.to} to={card.to}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <card.icon className="mb-2 h-6 w-6 text-primary" />
                <CardTitle className="text-base">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" className="px-0">
                  {card.cta} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Index
