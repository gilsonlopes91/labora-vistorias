/* Orçamentos do portal do cliente: acompanha a situação e aceita a proposta
 * (autenticado — diferente do link público de compartilhamento). */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'

import { formatBrazilianDate } from '@/lib/date'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useEmpresaCliente } from '@/components/LayoutCliente'
import {
  aceitarOrcamentoCliente,
  getOrcamentos,
  STATUS_LABEL,
  totalItens,
  type Orcamento,
} from '@/services/orcamentos'
import LoadingScreen from '@/components/LoadingScreen'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const ABERTOS = ['enviado', 'aguardando_retorno', 'em_negociacao']

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ClienteOrcamentos() {
  const { empresa } = useEmpresaCliente()
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aceitando, setAceitando] = useState<string | null>(null)

  const carregar = () => {
    setCarregando(true)
    getOrcamentos()
      .then((lista) => setOrcamentos(lista.filter((o) => o.empresa_id === empresa.id)))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [empresa.id])

  const handleAceitar = async (orcamento: Orcamento) => {
    setAceitando(orcamento.id)
    try {
      await aceitarOrcamentoCliente(orcamento.id)
      toast.success('Proposta aceita')
      carregar()
    } catch (error) {
      toast.error('Não foi possível aceitar a proposta', { description: getErrorMessage(error) })
    } finally {
      setAceitando(null)
    }
  }

  if (carregando) return <LoadingScreen fullScreen={false} mensagem="Carregando..." />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Orçamentos</h1>
        <p className="text-sm text-muted-foreground">
          Propostas enviadas para {empresa.nome_fantasia || empresa.razao_social}.
        </p>
      </div>

      {orcamentos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma proposta ainda.</p>
      ) : (
        <div className="space-y-2">
          {orcamentos.map((o) => {
            const total = o.valor_total ?? (o.itens ? totalItens(o.itens) : 0)
            return (
              <Card key={o.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{o.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.numero ? `Proposta ${o.numero}` : ''}
                        {o.data_proposta && <> · {formatBrazilianDate(o.data_proposta)}</>}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {STATUS_LABEL[o.status]}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold">{brl.format(total)}</p>
                  {ABERTOS.includes(o.status) && (
                    <Button
                      size="sm"
                      onClick={() => handleAceitar(o)}
                      disabled={aceitando === o.id}
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      {aceitando === o.id ? 'Aceitando...' : 'Aceitar proposta'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
