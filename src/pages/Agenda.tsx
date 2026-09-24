/* Agenda — calendário robusto de vistorias: visões mês, semana e ano + lista do dia. */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react'

import { useRealtime } from '@/hooks/use-realtime'
import { parseLocalDate, formatLocalDate } from '@/lib/date'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getVistorias, type Vistoria, type StatusVistoria } from '@/services/vistorias'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import { getFormularios, type Formulario } from '@/services/registrosFormulario'
import { getResponsaveisTecnicos, type ResponsavelTecnico } from '@/services/responsaveisTecnicos'
import NovaVistoriaDialog from '@/components/NovaVistoriaDialog'
import RotinasPanel from '@/components/RotinasPanel'
import AgendaExternaDialog from '@/components/AgendaExternaDialog'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

type Visao = 'mes' | 'semana' | 'ano'

const VISAO_LABEL: Record<Visao, string> = {
  mes: 'Mês',
  semana: 'Semana',
  ano: 'Ano',
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const diaKey = (d: Date) => format(d, 'yyyy-MM-dd')

export default function Agenda() {
  const [vistorias, setVistorias] = useState<Vistoria[]>([])
  const [formularios, setFormularios] = useState<Formulario[]>([])
  const [responsaveis, setResponsaveis] = useState<ResponsavelTecnico[]>([])
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('todos')
  const [visao, setVisao] = useState<Visao>('mes')
  const [selected, setSelected] = useState<Date>(new Date())
  const [cursor, setCursor] = useState<Date>(new Date())
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    try {
      const [items, forms, org] = await Promise.all([
        getVistorias(),
        getFormularios(),
        getMinhaOrganizacao(),
      ])
      setVistorias(items)
      setFormularios(forms)
      const rts = await getResponsaveisTecnicos(org.id)
      setResponsaveis(rts)
    } catch (error) {
      toast.error('Não foi possível carregar as vistorias', { description: getErrorMessage(error) })
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime<Vistoria>('vistorias', () => {
    loadData()
  })

  const filtradas = useMemo(
    () =>
      vistorias.filter(
        (v) => filtroResponsavel === 'todos' || v.responsavel_tecnico_id === filtroResponsavel,
      ),
    [vistorias, filtroResponsavel],
  )

  // Mapa dia -> eventos (todas as visões usam). Formulários avulsos entram no
  // mesmo calendário, marcados com __form = nome do modelo (agenda unificada).
  const porDia = useMemo(() => {
    const mapa = new Map<string, Vistoria[]>()
    filtradas.forEach((v) => {
      const d = parseLocalDate(v.data_agendada)
      if (!d) return
      const key = diaKey(startOfDay(d))
      const lista = mapa.get(key) || []
      lista.push(v)
      mapa.set(key, lista)
    })
    formularios.forEach((f) => {
      const d = parseLocalDate(f.data_campo || f.created)
      if (!d) return
      const key = diaKey(startOfDay(d))
      const lista = mapa.get(key) || []
      lista.push({
        id: f.id,
        data_agendada: f.data_campo || f.created,
        status: f.status === 'concluido' ? 'concluida' : 'agendada',
        __form: f.expand?.modelo_formulario_id?.nome || 'Formulário',
        expand: { empresa_id: f.expand?.empresa_id },
      } as unknown as Vistoria)
      mapa.set(key, lista)
    })
    return mapa
  }, [filtradas, formularios])

  const doDia = (d: Date) => porDia.get(diaKey(d)) || []

  const vistoriasDoDia = useMemo(() => doDia(selected), [porDia, selected])

  const defaultDateForDialog = formatLocalDate(selected)

  // Navegação por visão.
  const navegar = (direcao: -1 | 1) => {
    if (visao === 'mes') setCursor((c) => addMonths(c, direcao))
    else if (visao === 'semana') setCursor((c) => addWeeks(c, direcao))
    else setCursor((c) => addMonths(c, direcao * 12))
  }

  const tituloPeriodo =
    visao === 'mes'
      ? format(cursor, "MMMM 'de' yyyy", { locale: ptBR })
      : visao === 'semana'
        ? `${format(startOfWeek(cursor, { locale: ptBR }), 'dd MMM', { locale: ptBR })} — ${format(
            endOfWeek(cursor, { locale: ptBR }),
            'dd MMM yyyy',
            { locale: ptBR },
          )}`
        : format(cursor, 'yyyy', { locale: ptBR })

  // Grade do mês: semanas (linhas) x 7 dias, incluindo dias de meses vizinhos.
  const semanasDoMes = useMemo(
    () =>
      eachWeekOfInterval(
        { start: startOfMonth(cursor), end: endOfMonth(cursor) },
        { weekStartsOn: 0 },
      ).map((inicio) => eachDayOfInterval({ start: inicio, end: endOfWeek(inicio) })),
    [cursor],
  )

  // Dias da semana visível (visão semana).
  const diasDaSemana = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(cursor, { locale: ptBR }),
        end: endOfWeek(cursor, { locale: ptBR }),
      }),
    [cursor],
  )

  // 12 meses do ano (visão ano).
  const mesesDoAno = useMemo(() => eachMonthOfInterval({ start: cursor, end: cursor }), [cursor])

  const irParaDia = (d: Date) => {
    setSelected(d)
    setCursor(d)
    setVisao('mes')
  }

  const rotuloTipoVistoria = (v: Vistoria) =>
    (v as unknown as { __form?: string }).__form ||
    v.expand?.tipo_vistoria_id?.nr_referencia ||
    v.expand?.tipo_vistoria_id?.nome ||
    (v.expand?.checklists?.length
      ? v.expand.checklists.map((c) => c.nr_referencia || c.nome).join(', ')
      : v.expand?.formularios?.length
        ? v.expand.formularios.map((f) => f.nome).join(', ')
        : '')

  const chip = (v: Vistoria) => (
    <div
      key={v.id}
      onClick={(e) => {
        e.stopPropagation()
        if ((v as unknown as { __form?: string }).__form)
          navigate('/auditoria-formularios?aba=formularios')
        else navigate(`/vistorias/${v.id}`)
      }}
      className="cursor-pointer truncate rounded bg-accent px-1.5 py-0.5 text-[11px] leading-tight text-accent-foreground hover:bg-primary hover:text-primary-foreground"
      title={`${v.expand?.empresa_id?.nome_fantasia || v.expand?.empresa_id?.razao_social || '—'}${
        rotuloTipoVistoria(v) ? ` · ${rotuloTipoVistoria(v)}` : ''
      }${v.expand?.responsavel_tecnico_id?.nome ? ' · ' + v.expand.responsavel_tecnico_id.nome : ''}`}
    >
      {v.expand?.empresa_id?.nome_fantasia || v.expand?.empresa_id?.razao_social || '—'}
      {v.expand?.responsavel_tecnico_id?.nome ? ` · ${v.expand.responsavel_tecnico_id.nome}` : ''}
    </div>
  )

  const listaDoDia = (
    <div>
      <h2 className="mb-3 text-sm font-semibold">
        {format(selected, "EEEE, d 'de' MMMM", { locale: ptBR })}
      </h2>
      {vistoriasDoDia.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <CalendarClock className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma vistoria agendada para esse dia.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vistoriasDoDia.map((v) => (
            <Card
              key={v.id}
              className="cursor-pointer transition-colors hover:border-primary"
              onClick={() =>
                (v as unknown as { __form?: string }).__form
                  ? navigate('/auditoria-formularios?aba=formularios')
                  : navigate(`/vistorias/${v.id}`)
              }
            >
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">
                    {v.expand?.empresa_id?.nome_fantasia ||
                      v.expand?.empresa_id?.razao_social ||
                      '—'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {rotuloTipoVistoria(v) || '—'}
                    {v.expand?.responsavel_tecnico_id?.nome
                      ? ` · ${v.expand.responsavel_tecnico_id.nome}`
                      : ''}
                  </div>
                </div>
                <Badge variant={STATUS_VARIANT[v.status || 'agendada']}>
                  {STATUS_LABEL[v.status || 'agendada']}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground">Visualize e agende vistorias por data.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Quem vai fazer" />
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
          <Select value={visao} onValueChange={(v) => setVisao(v as Visao)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Visão" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(VISAO_LABEL) as Visao[]).map((v) => (
                <SelectItem key={v} value={v}>
                  {VISAO_LABEL[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AgendaExternaDialog />
          <NovaVistoriaDialog
            defaultDate={defaultDateForDialog}
            onCreated={(id) => navigate(`/vistorias/${id}`)}
          />
        </div>
      </div>

      <div className="mb-6">
        <RotinasPanel />
      </div>

      {/* Barra de navegação do calendário */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navegar(-1)} aria-label="Anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCursor(new Date())
              setSelected(new Date())
            }}
          >
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => navegar(1)} aria-label="Próximo">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-2 text-lg font-semibold capitalize">{tituloPeriodo}</span>
        </div>
      </div>

      {/* VISÃO MÊS */}
      {visao === 'mes' && (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <Card>
            <CardContent className="p-3">
              <div className="mb-1 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((wd) => (
                  <div
                    key={wd}
                    className="py-1 text-center text-xs font-semibold text-muted-foreground"
                  >
                    {wd}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {semanasDoMes.flat().map((d) => {
                  const eventos = doDia(d)
                  const foraDoMes = !isSameMonth(d, cursor)
                  const selecionado = isSameDay(d, selected)
                  return (
                    <div
                      key={d.toISOString()}
                      onClick={() => setSelected(d)}
                      className={`min-h-[92px] cursor-pointer rounded-md border p-1.5 transition-colors hover:border-primary ${
                        foraDoMes ? 'bg-muted/40 text-muted-foreground' : ''
                      } ${selecionado ? 'border-primary ring-1 ring-primary' : ''}`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold ${
                            isToday(d)
                              ? 'flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground'
                              : ''
                          }`}
                        >
                          {format(d, 'd')}
                        </span>
                        {eventos.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{eventos.length - 3}
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5">{eventos.slice(0, 3).map((v) => chip(v))}</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
          <div>{listaDoDia}</div>
        </div>
      )}

      {/* VISÃO SEMANA */}
      {visao === 'semana' && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
          {diasDaSemana.map((d) => {
            const eventos = doDia(d)
            const selecionado = isSameDay(d, selected)
            return (
              <Card
                key={d.toISOString()}
                className={`cursor-pointer transition-colors hover:border-primary ${
                  selecionado ? 'border-primary ring-1 ring-primary' : ''
                }`}
                onClick={() => setSelected(d)}
              >
                <CardContent className="p-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      {format(d, 'EEE dd', { locale: ptBR })}
                    </span>
                    {isToday(d) && (
                      <span className="flex h-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                        hoje
                      </span>
                    )}
                  </div>
                  {eventos.length === 0 ? (
                    <p className="py-4 text-center text-[11px] text-muted-foreground">—</p>
                  ) : (
                    <div className="space-y-1">
                      {eventos.map((v) => (
                        <div
                          key={v.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            if ((v as unknown as { __form?: string }).__form)
                              navigate('/auditoria-formularios?aba=formularios')
                            else navigate(`/vistorias/${v.id}`)
                          }}
                          className="cursor-pointer rounded bg-accent px-1.5 py-1 text-[11px] leading-tight text-accent-foreground hover:bg-primary hover:text-primary-foreground"
                        >
                          <div className="truncate font-medium">
                            {v.expand?.empresa_id?.nome_fantasia ||
                              v.expand?.empresa_id?.razao_social ||
                              '—'}
                          </div>
                          <div className="truncate opacity-80">
                            {v.expand?.responsavel_tecnico_id?.nome || rotuloTipoVistoria(v) || ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
          <div className="col-span-full">{listaDoDia}</div>
        </div>
      )}

      {/* VISÃO ANO */}
      {visao === 'ano' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {mesesDoAno.map((mes) => {
            const semanas = eachWeekOfInterval(
              { start: startOfMonth(mes), end: endOfMonth(mes) },
              { weekStartsOn: 0 },
            ).map((inicio) => eachDayOfInterval({ start: inicio, end: endOfWeek(inicio) }))
            return (
              <Card key={mes.toISOString()}>
                <CardContent className="p-3">
                  <div className="mb-2 text-sm font-semibold capitalize">
                    {format(mes, 'MMMM yyyy', { locale: ptBR })}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {WEEKDAYS.map((wd) => (
                      <div
                        key={wd}
                        className="text-center text-[9px] font-semibold text-muted-foreground"
                      >
                        {wd[0]}
                      </div>
                    ))}
                    {semanas.flat().map((d) => {
                      const total = doDia(d).length
                      const foraDoMes = !isSameMonth(d, mes)
                      return (
                        <div
                          key={d.toISOString()}
                          onClick={() => !foraDoMes && irParaDia(d)}
                          title={total ? `${total} vistoria(s)` : undefined}
                          className={`flex h-6 items-center justify-center rounded text-[10px] ${
                            foraDoMes
                              ? 'text-muted-foreground/30'
                              : total > 0
                                ? 'cursor-pointer bg-primary font-bold text-primary-foreground hover:bg-primary/80'
                                : 'cursor-pointer text-foreground hover:bg-accent'
                          }`}
                        >
                          {format(d, 'd')}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
