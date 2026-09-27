/* Agenda do portal do cliente: vistorias agendadas ou em andamento nesta
 * empresa — sem os detalhes internos da operação (equipe, valores). */
import { useEffect, useState } from 'react'

import { formatBrazilianDate } from '@/lib/date'
import { rotuloCurtoNorma } from '@/lib/normas'
import { useEmpresaCliente } from '@/components/LayoutCliente'
import { getVistorias, type Vistoria } from '@/services/vistorias'
import LoadingScreen from '@/components/LoadingScreen'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STATUS_LABEL: Record<string, string> = {
  agendada: 'Agendada',
  em_andamento: 'Em andamento',
}

export default function ClienteAgenda() {
  const { empresa } = useEmpresaCliente()
  const [vistorias, setVistorias] = useState<Vistoria[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    setCarregando(true)
    getVistorias()
      .then((lista) =>
        setVistorias(
          lista
            .filter(
              (v) =>
                v.empresa_id === empresa.id &&
                (v.status === 'agendada' || v.status === 'em_andamento'),
            )
            .sort((a, b) => (a.data_agendada || '').localeCompare(b.data_agendada || '')),
        ),
      )
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
          {vistorias.map((v) => {
            const nome = v.expand?.tipo_vistoria_id
              ? rotuloCurtoNorma(v.expand.tipo_vistoria_id)
              : 'Vistoria'
            return (
              <Card key={v.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.data_agendada ? formatBrazilianDate(v.data_agendada) : 'data a combinar'}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {STATUS_LABEL[v.status || 'agendada']}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
