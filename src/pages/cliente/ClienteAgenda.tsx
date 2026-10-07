/* Agenda do portal do cliente: vistorias agendadas ou em andamento nesta
 * empresa. Os dados vêm de um endpoint próprio do servidor, que entrega só
 * data, hora, situação e nome — sem os detalhes internos da operação
 * (equipe, equipamentos, orientações, valores). */
import { useEffect, useState } from 'react'

import { formatBrazilianDate } from '@/lib/date'
import { useEmpresaCliente } from '@/components/LayoutCliente'
import { getAgendaCliente, type VistoriaAgendaCliente } from '@/services/portalCliente'
import LoadingScreen from '@/components/LoadingScreen'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STATUS_LABEL: Record<string, string> = {
  agendada: 'Agendada',
  em_andamento: 'Em andamento',
}

export default function ClienteAgenda() {
  const { empresa } = useEmpresaCliente()
  const [vistorias, setVistorias] = useState<VistoriaAgendaCliente[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    setCarregando(true)
    getAgendaCliente(empresa.id)
      .then((lista) =>
        setVistorias(
          [...lista].sort((a, b) => (a.data_agendada || '').localeCompare(b.data_agendada || '')),
        ),
      )
      .catch(() => setVistorias([]))
      .finally(() => setCarregando(false))
  }, [empresa.id])

  if (carregando) return <LoadingScreen fullScreen={false} mensagem="Carregando..." />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Agenda</h1>
        <p className="text-sm text-muted-foreground">Próximas vistorias marcadas.</p>
      </div>

      {vistorias.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma vistoria agendada no momento.</p>
      ) : (
        <div className="space-y-2">
          {vistorias.map((v) => (
            <Card key={v.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{v.nome || 'Vistoria'}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.data_agendada ? formatBrazilianDate(v.data_agendada) : 'data a combinar'}
                    {v.hora_inicio ? ` · ${v.hora_inicio}` : ''}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {STATUS_LABEL[v.status] || 'Agendada'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
