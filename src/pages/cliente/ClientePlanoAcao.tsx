/* Plano de ação do portal do cliente: acompanha e atualiza o status (só
 * status e data de conclusão — os outros campos são da organização). */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { formatBrazilianDate, toPocketBaseDate } from '@/lib/date'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useEmpresaCliente } from '@/components/LayoutCliente'
import {
  atualizarAcaoCliente,
  getAcoesPlano,
  type AcaoPlano,
  type StatusAcaoPlano,
} from '@/services/acoesPlano'
import LoadingScreen from '@/components/LoadingScreen'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STATUS_OPCOES: StatusAcaoPlano[] = ['Pendente', 'Em andamento', 'Concluída', 'Cancelada']

const STATUS_VARIANTE: Record<StatusAcaoPlano, 'default' | 'secondary' | 'outline'> = {
  Pendente: 'outline',
  'Em andamento': 'secondary',
  Concluída: 'default',
  Cancelada: 'outline',
}

export default function ClientePlanoAcao() {
  const { empresa } = useEmpresaCliente()
  const [acoes, setAcoes] = useState<AcaoPlano[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)

  const carregar = () => {
    setCarregando(true)
    getAcoesPlano(empresa.id)
      .then(setAcoes)
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [empresa.id])

  const handleStatus = async (acao: AcaoPlano, status: StatusAcaoPlano) => {
    setSalvando(acao.id)
    try {
      const dataConclusao = status === 'Concluída' ? toPocketBaseDate(new Date()) : ''
      await atualizarAcaoCliente(acao.id, { status, data_conclusao: dataConclusao })
      setAcoes((prev) =>
        prev.map((a) => (a.id === acao.id ? { ...a, status, data_conclusao: dataConclusao } : a)),
      )
    } catch (error) {
      toast.error('Não foi possível atualizar', { description: getErrorMessage(error) })
    } finally {
      setSalvando(null)
    }
  }

  if (carregando) return <LoadingScreen fullScreen={false} mensagem="Carregando..." />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Plano de ação</h1>
        <p className="text-sm text-muted-foreground">
          Medidas recomendadas para {empresa.nome_fantasia || empresa.razao_social}. Você pode
          atualizar o status conforme for aplicando.
        </p>
      </div>

      {acoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma ação registrada ainda.</p>
      ) : (
        <div className="space-y-2">
          {acoes.map((acao) => (
            <Card key={acao.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{acao.medida}</p>
                  <Badge variant={STATUS_VARIANTE[acao.status]} className="shrink-0">
                    {acao.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {acao.prioridade && <span>Prioridade: {acao.prioridade}</span>}
                  {acao.prazo && <span>Prazo: {formatBrazilianDate(acao.prazo)}</span>}
                  {acao.responsavel && <span>Responsável: {acao.responsavel}</span>}
                </div>
                <Select
                  value={acao.status}
                  onValueChange={(v) => handleStatus(acao, v as StatusAcaoPlano)}
                  disabled={salvando === acao.id}
                >
                  <SelectTrigger className="h-8 w-48 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPCOES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
