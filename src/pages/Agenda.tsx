/* Agenda — calendário de vistorias agendadas por cliente. */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { CalendarClock } from 'lucide-react'

import { useRealtime } from '@/hooks/use-realtime'
import { parseLocalDate, formatLocalDate } from '@/lib/date'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getVistorias, type Vistoria, type StatusVistoria } from '@/services/vistorias'
import NovaVistoriaDialog from '@/components/NovaVistoriaDialog'

import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

export default function Agenda() {
  const [vistorias, setVistorias] = useState<Vistoria[]>([])
  const [selected, setSelected] = useState<Date>(new Date())
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    try {
      const items = await getVistorias()
      setVistorias(items)
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

  const diasComVistoria = useMemo(
    () =>
      vistorias.map((v) => parseLocalDate(v.data_agendada)).filter((d): d is Date => d !== null),
    [vistorias],
  )

  const vistoriasDoDia = useMemo(
    () =>
      vistorias.filter((v) => {
        const d = parseLocalDate(v.data_agendada)
        return d !== null && isSameDay(d, selected)
      }),
    [vistorias, selected],
  )

  const defaultDateForDialog = formatLocalDate(selected)

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground">Visualize e agende vistorias por data.</p>
        </div>
        <NovaVistoriaDialog
          defaultDate={defaultDateForDialog}
          onCreated={(id) => navigate(`/vistorias/${id}`)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <Card className="w-fit">
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(date) => date && setSelected(date)}
              locale={ptBR}
              modifiers={{ booked: diasComVistoria }}
              modifiersClassNames={{
                booked:
                  'font-semibold underline decoration-primary decoration-2 underline-offset-4',
              }}
            />
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-sm font-semibold">
            {format(selected, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h2>
          {vistoriasDoDia.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <CalendarClock className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhuma vistoria agendada para esse dia.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {vistoriasDoDia.map((v) => (
                <Card
                  key={v.id}
                  className="cursor-pointer transition-colors hover:border-primary"
                  onClick={() => navigate(`/vistorias/${v.id}`)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">
                        {v.expand?.empresa_id?.nome_fantasia ||
                          v.expand?.empresa_id?.razao_social ||
                          '—'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {v.expand?.tipo_vistoria_id?.nr_referencia ||
                          v.expand?.tipo_vistoria_id?.nome}
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
      </div>
    </div>
  )
}
