/* Início do portal do cliente: pendências — próxima visita, ações vencendo,
 * propostas aguardando aceite. Nada de valores internos ou catálogo. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, ClipboardList, Receipt } from 'lucide-react'

import { formatBrazilianDate } from '@/lib/date'
import { useEmpresaCliente } from '@/components/LayoutCliente'
import { getAcoesPlano, type AcaoPlano } from '@/services/acoesPlano'
import { getVistorias, type Vistoria } from '@/services/vistorias'
import { getOrcamentos, STATUS_LABEL, type Orcamento } from '@/services/orcamentos'
import LoadingScreen from '@/components/LoadingScreen'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const ABERTOS = ['enviado', 'aguardando_retorno', 'em_negociacao']

export default function ClienteInicio() {
  const { empresa } = useEmpresaCliente()
  const [acoes, setAcoes] = useState<AcaoPlano[]>([])
  const [vistorias, setVistorias] = useState<Vistoria[]>([])
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    setCarregando(true)
    Promise.all([getAcoesPlano(empresa.id), getVistorias(), getOrcamentos()])
      .then(([a, v, o]) => {
        setAcoes(a)
        setVistorias(v.filter((x) => x.empresa_id === empresa.id))
        setOrcamentos(o.filter((x) => x.empresa_id === empresa.id))
      })
      .finally(() => setCarregando(false))
  }, [empresa.id])

  if (carregando) return <LoadingScreen fullScreen={false} mensagem="Carregando..." />

  const hoje = new Date().toISOString().slice(0, 10)
  const acoesVencendo = acoes.filter(
    (a) =>
      a.status !== 'Concluída' &&
      a.status !== 'Cancelada' &&
      a.prazo &&
      a.prazo.slice(0, 10) <= hoje,
  )
  const proximaVisita = vistorias
    .filter((v) => v.status === 'agendada' || v.status === 'em_andamento')
    .sort((a, b) => (a.data_agendada || '').localeCompare(b.data_agendada || ''))[0]
  const propostasAbertas = orcamentos.filter((o) => ABERTOS.includes(o.status))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{empresa.nome_fantasia || empresa.razao_social}</h1>
        <p className="text-sm text-muted-foreground">O que está pendente agora.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Próxima visita</CardTitle>
        </CardHeader>
        <CardContent>
          {proximaVisita ? (
            <p className="text-sm">
              {proximaVisita.data_agendada
                ? formatBrazilianDate(proximaVisita.data_agendada)
                : 'data a combinar'}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma vistoria agendada.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">
            Ações do plano vencendo ({acoesVencendo.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {acoesVencendo.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada vencido no momento.</p>
          ) : (
            acoesVencendo.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{a.medida}</span>
                <Badge variant="outline" className="shrink-0">
                  {a.prazo ? formatBrazilianDate(a.prazo) : ''}
                </Badge>
              </div>
            ))
          )}
          <Link to="/cliente/plano-acao" className="inline-block text-xs text-primary underline">
            Ver plano de ação completo
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">
            Propostas aguardando resposta ({propostasAbertas.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {propostasAbertas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma proposta aberta.</p>
          ) : (
            propostasAbertas.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{o.titulo}</span>
                <Badge variant="outline" className="shrink-0">
                  {STATUS_LABEL[o.status]}
                </Badge>
              </div>
            ))
          )}
          <Link to="/cliente/orcamentos" className="inline-block text-xs text-primary underline">
            Ver orçamentos
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
