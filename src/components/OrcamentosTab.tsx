/* Gerenciador de orçamentos — reaproveitável tanto na tela de Empresas como em rota dedicada.
   Indicadores no topo, busca e filtro por status, e a lista com troca rápida de
   status direto na linha. Criar e editar ficam no OrcamentoDialog. */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { FileSpreadsheet, Pencil, Plus, Search, Trash2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  calcularIndicadores,
  deleteOrcamento,
  getOrcamentos,
  updateOrcamento,
  STATUS_LABEL,
  STATUS_ORDEM,
  type Orcamento,
  type StatusOrcamento,
} from '@/services/orcamentos'
import { OrcamentoDialog } from '@/components/OrcamentoDialog'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const brlCurto = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const VARIANTE_STATUS: Record<StatusOrcamento, 'default' | 'secondary' | 'destructive'> = {
  rascunho: 'secondary',
  enviado: 'secondary',
  em_negociacao: 'secondary',
  aprovado: 'default',
  recusado: 'destructive',
  cancelado: 'destructive',
  em_execucao: 'default',
  concluido: 'default',
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {rotulo}
        </div>
        <div className="mt-1 text-xl font-bold tabular-nums">{valor}</div>
      </CardContent>
    </Card>
  )
}

interface OrcamentosTabProps {
  empresaIdInicial?: string
}

export function OrcamentosTab({ empresaIdInicial }: OrcamentosTabProps = {}) {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [dialogAberto, setDialogAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<Orcamento | null>(null)
  const [paraExcluir, setParaExcluir] = useState<Orcamento | null>(null)

  const carregar = () =>
    getOrcamentos()
      .then(setOrcamentos)
      .catch((error) =>
        toast.error('Não foi possível carregar os orçamentos', {
          description: getErrorMessage(error),
        }),
      )

  useEffect(() => {
    carregar().finally(() => setCarregando(false))
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return orcamentos.filter((o) => {
      if (empresaIdInicial && o.empresa_id !== empresaIdInicial) return false
      if (filtroStatus !== 'todos' && o.status !== filtroStatus) return false
      if (!termo) return true
      const empresa = o.expand?.empresa_id
      return (
        o.titulo.toLowerCase().includes(termo) ||
        (o.numero || '').toLowerCase().includes(termo) ||
        (empresa?.razao_social || '').toLowerCase().includes(termo) ||
        (empresa?.nome_fantasia || '').toLowerCase().includes(termo)
      )
    })
  }, [orcamentos, busca, filtroStatus, empresaIdInicial])

  const indicadores = useMemo(() => calcularIndicadores(filtrados), [filtrados])

  const trocarStatus = async (orcamento: Orcamento, status: StatusOrcamento) => {
    try {
      await updateOrcamento(orcamento.id, { status })
      setOrcamentos((atual) => atual.map((o) => (o.id === orcamento.id ? { ...o, status } : o)))
    } catch (error) {
      toast.error('Não foi possível atualizar o status', {
        description: getErrorMessage(error),
      })
    }
  }

  const confirmarExclusao = async () => {
    if (!paraExcluir) return
    try {
      await deleteOrcamento(paraExcluir.id)
      toast.success('Orçamento excluído')
      setParaExcluir(null)
      carregar()
    } catch (error) {
      toast.error('Não foi possível excluir', { description: getErrorMessage(error) })
    }
  }

  const abrirNovo = () => {
    setEmEdicao(null)
    setDialogAberto(true)
  }

  const abrirEdicao = (orcamento: Orcamento) => {
    setEmEdicao(orcamento)
    setDialogAberto(true)
  }

  const formatarData = (iso?: string) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString('pt-BR')
    } catch {
      return '—'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Gestão de Orçamentos</h2>
          <p className="text-sm text-muted-foreground">
            Propostas comerciais emitidas para as empresas cadastradas, do rascunho ao serviço
            concluído.
          </p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Novo orçamento
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador rotulo="Orçamentos" valor={String(indicadores.quantidade)} />
        <Indicador rotulo="Valor orçado" valor={brlCurto.format(indicadores.valorOrcado)} />
        <Indicador rotulo="Aprovado" valor={brlCurto.format(indicadores.valorAprovado)} />
        <Indicador rotulo="Conversão" valor={`${indicadores.taxaConversao.toFixed(0)}%`} />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por número, título ou empresa..."
            className="pl-9"
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {STATUS_ORDEM.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {carregando ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
          <FileSpreadsheet className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {orcamentos.length === 0
              ? 'Nenhum orçamento criado ainda.'
              : 'Nenhum orçamento para esse filtro.'}
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y">
            {filtrados.map((orcamento) => {
              const empresa = orcamento.expand?.empresa_id
              return (
                <div
                  key={orcamento.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-accent/30"
                >
                  <div className="min-w-48 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        {orcamento.numero || '—'}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {orcamento.tipo === 'treinamento' ? 'Treinamento' : 'Serviço'}
                      </Badge>
                    </div>
                    <div className="font-medium leading-snug">{orcamento.titulo}</div>
                    <div className="text-xs text-muted-foreground">
                      {empresa?.nome_fantasia || empresa?.razao_social || 'Empresa removida'} ·{' '}
                      {formatarData(orcamento.data_proposta)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold tabular-nums">
                      {brl.format(orcamento.valor_total || 0)}
                    </div>
                    <Badge variant={VARIANTE_STATUS[orcamento.status]} className="mt-1">
                      {STATUS_LABEL[orcamento.status]}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <Select
                      value={orcamento.status}
                      onValueChange={(v) => trocarStatus(orcamento, v as StatusOrcamento)}
                    >
                      <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_ORDEM.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => abrirEdicao(orcamento)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setParaExcluir(orcamento)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <OrcamentoDialog
        orcamento={emEdicao}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        onSalvo={carregar}
      />

      <AlertDialog open={!!paraExcluir} onOpenChange={(aberto) => !aberto && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              O orçamento {paraExcluir?.numero} e seus itens serão removidos. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
