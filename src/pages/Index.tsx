/* Painel inicial — saudação, atalhos rápidos e indicadores gerais do app. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  Plus,
  FileSpreadsheet,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getEmpresas } from '@/services/empresas'
import { getVistorias } from '@/services/vistorias'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function getSaudacao() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

const Index = () => {
  const { user } = useAuth()
  const [totalEmpresas, setTotalEmpresas] = useState<number | null>(null)
  const [totalVistorias, setTotalVistorias] = useState<number | null>(null)
  const [totalConcluidas, setTotalConcluidas] = useState<number | null>(null)

  useEffect(() => {
    getEmpresas()
      .then((items) => setTotalEmpresas(items.length))
      .catch(() => setTotalEmpresas(null))
    getVistorias()
      .then((items) => {
        setTotalVistorias(items.length)
        setTotalConcluidas(items.filter((v) => v.status === 'concluida').length)
      })
      .catch(() => {
        setTotalVistorias(null)
        setTotalConcluidas(null)
      })
  }, [])

  const atalhos = [
    { to: '/empresas', icon: Plus, label: 'Nova empresa' },
    { to: '/vistorias', icon: ClipboardCheck, label: 'Nova vistoria' },
    { to: '/agenda', icon: CalendarClock, label: 'Ver agenda' },
  ]

  const stats = [
    {
      icon: Building2,
      label: 'Empresas cadastradas',
      value: totalEmpresas === null ? '—' : totalEmpresas,
    },
    {
      icon: ClipboardCheck,
      label: 'Vistorias no total',
      value: totalVistorias === null ? '—' : totalVistorias,
    },
    {
      icon: FileSpreadsheet,
      label: 'Vistorias concluídas',
      value: totalConcluidas === null ? '—' : totalConcluidas,
    },
  ]

  const areas = [
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
      <h1 className="mb-1 text-2xl font-bold">
        {getSaudacao()}
        {user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Bem-vindo ao Labora Vistoria — gestão de vistorias e inspeções de SST.
      </p>

      <p className="mb-3 text-sm font-medium text-foreground">O que você gostaria de fazer?</p>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {atalhos.map((atalho) => (
          <Link key={atalho.label} to={atalho.to}>
            <Card className="flex h-full flex-row items-center gap-3 rounded-2xl border-none p-4 shadow-subtle transition-shadow hover:shadow-elevation">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <atalho.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{atalho.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      <p className="mb-3 text-sm font-medium text-foreground">Seus números</p>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-2xl border-none p-5 shadow-subtle">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <stat.icon className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {areas.map((card) => (
          <Link key={card.to} to={card.to}>
            <Card className="h-full rounded-2xl border-none shadow-subtle transition-shadow hover:shadow-elevation">
              <CardHeader>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <card.icon className="h-4 w-4" />
                </div>
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
