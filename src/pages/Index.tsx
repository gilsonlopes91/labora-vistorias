/* Painel inicial — dashboard operacional: KPIs, agenda do período, atrasos e tendência mensal. */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, isSameDay, isSameMonth, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileSpreadsheet,
  ListChecks,
  Plus,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '@/hooks/use-auth'
import { parseLocalDate } from '@/lib/date'
import { getEmpresas } from '@/services/empresas'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import { getResponsaveisTecnicos, type ResponsavelTecnico } from '@/services/responsaveisTecnicos'
import { getVistorias, type Vistoria, type StatusVistoria } from '@/services/vistorias'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STATUS_LABEL: Record<StatusVistoria, string> = {
  agendada: 'Agendada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

const STATUS_VARIANT: Record<StatusVistoria, 'secondary' | 'default' | 'outline' | 'destructive'> =
  {
    agendada: 'secondary',
    em_andamento: 'default',
    concluida: 'outline',
    cancelada: 'destructive',
  }

type Periodo = 'hoje' | 'semana' | 'mes'

const PERIODO_LABEL: Record<Periodo, string> = {
  hoje: 'Hoje',
  semana: 'Próximos 7 dias',
  mes: 'Este mês',
}

function getSaudacao() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

const isAtiva = (v: Vistoria) => v.status === 'agendada' || v.status === 'em_andamento' || !v.status

const Index = () => {
  const { user } = useAuth()
  const [vistorias, setVistorias] = useState<Vistoria[]>([])
  const [responsaveis, setResponsaveis] = useState<ResponsavelTecnico[]>([])
  const [totalEmpresas, setTotalEmpresas] = useState<number | null>(null)
  const [filtroPeriodo, setFiltroPeriodo] = useState<Periodo>('semana')
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('todos')

  useEffect(() => {
    getEmpresas()
      .then((items) => setTotalEmpresas(items.length))
      .catch(() => setTotalEmpresas(null))
    getVistorias()
      .then(setVistorias)
      .catch(() => setVistorias([]))
    getMinhaOrganizacao()
      .then((org) => getResponsaveisTecnicos(org.id))
      .then(setResponsaveis)
      .catch(() => setResponsaveis([]))
  }, [])

  const porResponsavel = useMemo(
    () =>
      vistorias.filter(
        (v) => filtroResponsavel === 'todos' || v.responsavel_tecnico_id === filtroResponsavel,
      ),
    [vistorias, filtroResponsavel],
  )

  const hoje = useMemo(() => startOfDay(new Date()), [])

  const kpis = useMemo(() => {
    const inicioHoje = hoje.getTime()
    const fim7 = inicioHoje + 7 * 86400000
    let vistoriasHoje = 0
    let atrasadas = 0
    let proximos7 = 0
    let concluidasMes = 0
    porResponsavel.forEach((v) => {
      const d = parseLocalDate(v.data_agendada)
      if (!d) return
      const t = startOfDay(d).getTime()
      if (isAtiva(v)) {
        if (t === inicioHoje) vistoriasHoje++
        if (t < inicioHoje) atrasadas++
        if (t >= inicioHoje && t < fim7) proximos7++
      }
      if (v.status === 'concluida' && isSameMonth(d, hoje)) concluidasMes++
    })
    return { vistoriasHoje, atrasadas, proximos7, concluidasMes }
  }, [porResponsavel, hoje])

  const atrasadas = useMemo(
    () =>
      porResponsavel
        .filter((v) => {
          if (!isAtiva(v)) return false
          const d = parseLocalDate(v.data_agendada)
          return d !== null && startOfDay(d).getTime() < hoje.getTime()
        })
        .sort(
          (a, b) =>
            (parseLocalDate(a.data_agendada)?.getTime() ?? 0) -
            (parseLocalDate(b.data_agendada)?.getTime() ?? 0),
        ),
    [porResponsavel, hoje],
  )

  const dentroDoPeriodo = (d: Date) => {
    if (filtroPeriodo === 'hoje') return isSameDay(d, hoje)
    if (filtroPeriodo === 'mes') return isSameMonth(d, hoje)
    const t = startOfDay(d).getTime()
    return t >= hoje.getTime() && t < hoje.getTime() + 7 * 86400000
  }

  const listaPeriodo = useMemo(
    () =>
      porResponsavel
        .filter((v) => {
          const d = parseLocalDate(v.data_agendada)
          return d !== null && dentroDoPeriodo(d)
        })
        .sort(
          (a, b) =>
            (parseLocalDate(a.data_agendada)?.getTime() ?? 0) -
            (parseLocalDate(b.data_agendada)?.getTime() ?? 0),
        )
        .slice(0, 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [porResponsavel, filtroPeriodo],
  )

  const chartData = useMemo(() => {
    const meses: { mes: string; Concluídas: number; 'Em aberto': number }[] = []
    for (let i = 5; i >= 0; i--) {
      const ref = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const noMes = porResponsavel.filter((v) => {
        const d = parseLocalDate(v.data_agendada)
        return (
          d !== null && d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()
        )
      })
      meses.push({
        mes: format(ref, 'MMM', { locale: ptBR }).replace('.', ''),
        Concluídas: noMes.filter((v) => v.status === 'concluida').length,
        'Em aberto': noMes.filter((v) => v.status !== 'concluida').length,
      })
    }
    return meses
  }, [porResponsavel, hoje])

  const atalhos = [
    { to: '/empresas', icon: Plus, label: 'Nova empresa' },
    { to: '/vistorias', icon: ClipboardCheck, label: 'Nova vistoria' },
    { to: '/agenda', icon: CalendarClock, label: 'Ver agenda' },
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
      description: `${vistorias.length} vistoria(s) no total`,
      cta: 'Ver vistorias',
    },
    {
      to: '/modelos',
      icon: ListChecks,
      title: 'Modelos',
      description: 'Tipos de vistoria/auditoria e seus checklists',
      cta: 'Ver modelos',
    },
    {
      to: '/agenda',
      icon: CalendarClock,
      title: 'Agenda',
      description: 'Calendário de vistorias por cliente',
      cta: 'Abrir agenda',
    },
  ]

  const stats = [
    {
      icon: CalendarClock,
      label: 'Vistorias hoje',
      value: kpis.vistoriasHoje,
    },
    {
      icon: AlertTriangle,
      label: 'Atrasadas',
      value: kpis.atrasadas,
      alerta: kpis.atrasadas > 0,
    },
    {
      icon: ClipboardCheck,
      label: 'Próximos 7 dias',
      value: kpis.proximos7,
    },
    {
      icon: FileSpreadsheet,
      label: 'Concluídas no mês',
      value: kpis.concluidasMes,
    },
  ]

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">
        {getSaudacao()}
        {user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Bem-vindo ao LABORA auditoria — gestão de auditorias, vistorias e inspeções de SST.
      </p>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select value={filtroPeriodo} onValueChange={(v) => setFiltroPeriodo(v as Periodo)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PERIODO_LABEL) as Periodo[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PERIODO_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os responsáveis</SelectItem>
            {responsaveis.map((rt) => (
              <SelectItem key={rt.id} value={rt.id}>
                {rt.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-2xl border-none p-5 shadow-subtle">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <stat.icon className="h-4 w-4" />
              </div>
              {'alerta' in stat && stat.alerta ? (
                <Badge variant="destructive">atenção</Badge>
              ) : null}
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Atrasadas */}
      {atrasadas.length > 0 && (
        <Card className="mb-6 border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Vistorias atrasadas ({atrasadas.length})
            </CardTitle>
            <CardDescription>Agendadas para datas passadas e ainda não concluídas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {atrasadas.slice(0, 5).map((v) => {
              const d = parseLocalDate(v.data_agendada)
              return (
                <Link key={v.id} to={`/vistorias/${v.id}`} className="block">
                  <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-3 transition-colors hover:border-destructive">
                    <div>
                      <div className="font-medium">
                        {v.expand?.empresa_id?.nome_fantasia ||
                          v.expand?.empresa_id?.razao_social ||
                          '—'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {v.expand?.tipo_vistoria_id?.nr_referencia ||
                          v.expand?.tipo_vistoria_id?.nome}
                        {v.expand?.responsavel_tecnico_id?.nome
                          ? ` · ${v.expand.responsavel_tecnico_id.nome}`
                          : ''}
                        {d ? ` · era para ${format(d, 'dd/MM', { locale: ptBR })}` : ''}
                      </div>
                    </div>
                    <Badge variant="destructive">{STATUS_LABEL[v.status || 'agendada']}</Badge>
                  </div>
                </Link>
              )
            })}
            {atrasadas.length > 5 && (
              <p className="text-xs text-muted-foreground">
                + {atrasadas.length - 5} atrasada(s) — veja a agenda para a lista completa.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agenda do período */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">Agenda — {PERIODO_LABEL[filtroPeriodo]}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {listaPeriodo.length === 0
                ? 'Nada agendado no período com os filtros atuais.'
                : `${listaPeriodo.length} vistoria(s) no período.`}
            </p>
          </div>
          <Link to="/agenda">
            <Button variant="ghost" size="sm">
              Abrir agenda <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        {listaPeriodo.length > 0 && (
          <CardContent className="space-y-2">
            {listaPeriodo.map((v) => {
              const d = parseLocalDate(v.data_agendada)
              return (
                <Link key={v.id} to={`/vistorias/${v.id}`} className="block">
                  <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:border-primary">
                    <div>
                      <div className="font-medium">
                        {v.expand?.empresa_id?.nome_fantasia ||
                          v.expand?.empresa_id?.razao_social ||
                          '—'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {d ? format(d, 'EEE, dd/MM', { locale: ptBR }) : '—'} ·{' '}
                        {v.expand?.tipo_vistoria_id?.nr_referencia ||
                          v.expand?.tipo_vistoria_id?.nome}
                        {v.expand?.responsavel_tecnico_id?.nome
                          ? ` · ${v.expand.responsavel_tecnico_id.nome}`
                          : ''}
                      </div>
                    </div>
                    <Badge variant={STATUS_VARIANT[v.status || 'agendada']}>
                      {STATUS_LABEL[v.status || 'agendada']}
                    </Badge>
                  </div>
                </Link>
              )
            })}
          </CardContent>
        )}
      </Card>

      {/* Tendência mensal */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Vistorias por mês</CardTitle>
          <CardDescription>Últimos 6 meses — concluídas x em aberto.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Concluídas" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Em aberto" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
