/* Painel de indicadores da carteira de orçamentos.
   Os valores respeitam os filtros aplicados na lista, então dá para ver os
   números de um período, de um cliente ou de um status específico. */
import {
  AlarmClock,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Handshake,
  Percent,
  Send,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { IndicadoresOrcamento } from '@/services/orcamentos'

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

interface Indicador {
  rotulo: string
  valor: string
  icone: typeof FileText
  cor: string
  destaque?: boolean
}

export function OrcamentoKpis({ dados }: { dados: IndicadoresOrcamento }) {
  const itens: Indicador[] = [
    { rotulo: 'Orçamentos', valor: String(dados.quantidade), icone: FileText, cor: 'bg-slate-500' },
    {
      rotulo: 'Total orçado',
      valor: brl.format(dados.valorOrcado),
      icone: DollarSign,
      cor: 'bg-blue-500',
    },
    {
      rotulo: 'Aprovado',
      valor: brl.format(dados.valorAprovado),
      icone: TrendingUp,
      cor: 'bg-green-600',
    },
    {
      rotulo: 'Recebido',
      valor: brl.format(dados.valorRecebido),
      icone: Wallet,
      cor: 'bg-emerald-500',
    },
    {
      rotulo: 'A receber',
      valor: brl.format(dados.valorAReceber),
      icone: Clock,
      cor: 'bg-amber-500',
    },
    {
      rotulo: 'Ticket médio',
      valor: brl.format(dados.ticketMedio),
      icone: BarChart3,
      cor: 'bg-indigo-500',
    },
    {
      rotulo: 'Conversão',
      valor: `${dados.taxaConversao.toFixed(1)}%`,
      icone: Percent,
      cor: 'bg-teal-600',
    },
    { rotulo: 'Enviados', valor: String(dados.enviados), icone: Send, cor: 'bg-cyan-600' },
    {
      rotulo: 'Aguardando retorno',
      valor: String(dados.aguardandoRetorno),
      icone: Clock,
      cor: 'bg-orange-500',
    },
    {
      rotulo: 'Em negociação',
      valor: String(dados.emNegociacao),
      icone: Handshake,
      cor: 'bg-purple-500',
    },
    {
      rotulo: 'Aprovados',
      valor: String(dados.aprovados),
      icone: CheckCircle2,
      cor: 'bg-green-700',
    },
    { rotulo: 'Recusados', valor: String(dados.recusados), icone: XCircle, cor: 'bg-red-500' },
    {
      rotulo: 'Vencendo em 7 dias',
      valor: String(dados.vencendoEm7Dias),
      icone: CalendarClock,
      cor: 'bg-yellow-600',
      destaque: dados.vencendoEm7Dias > 0,
    },
    {
      rotulo: 'Pagamento em atraso',
      valor: String(dados.emAtraso),
      icone: AlarmClock,
      cor: 'bg-rose-600',
      destaque: dados.emAtraso > 0,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
      {itens.map((item) => {
        const Icone = item.icone
        return (
          <Card
            key={item.rotulo}
            className={`transition-all duration-150 hover:shadow-sm ${
              item.destaque
                ? 'border-amber-400/80 bg-amber-500/[0.03] shadow-xs dark:bg-amber-500/[0.05]'
                : 'border-border/70 hover:border-border'
            }`}
          >
            <CardContent className="flex min-h-[72px] items-center gap-2.5 p-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-xs ${item.cor}`}
              >
                <Icone className="h-4 w-4 text-white" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <p
                  className="text-[11px] font-medium leading-tight text-muted-foreground line-clamp-2"
                  title={item.rotulo}
                >
                  {item.rotulo}
                </p>
                <p className="mt-0.5 text-sm font-bold tracking-tight text-foreground tabular-nums break-words leading-tight">
                  {item.valor}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
