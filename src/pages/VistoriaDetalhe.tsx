/* Execução da vistoria: checklist item a item, com cálculo automático de multa. */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  getVistoria,
  updateVistoria,
  type Vistoria,
  type StatusVistoria,
} from '@/services/vistorias'
import { getItensChecklist, type ItemChecklist } from '@/services/itensChecklist'
import {
  getRespostasByVistoria,
  createResposta,
  updateResposta,
  type RespostaVistoria,
  type Situacao,
} from '@/services/respostasVistoria'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'

const STATUS_LABEL: Record<StatusVistoria, string> = {
  agendada: 'Agendada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function VistoriaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [vistoria, setVistoria] = useState<Vistoria | null>(null)
  const [itens, setItens] = useState<ItemChecklist[]>([])
  const [respostas, setRespostas] = useState<Record<string, RespostaVistoria>>({})
  const [loading, setLoading] = useState(true)
  const [savingStatus, setSavingStatus] = useState(false)

  const loadData = useCallback(async () => {
    if (!id) return
    try {
      const v = await getVistoria(id)
      setVistoria(v)
      const [itensChecklist, respostasVistoria] = await Promise.all([
        getItensChecklist(v.tipo_vistoria_id),
        getRespostasByVistoria(v.id),
      ])
      setItens(itensChecklist)
      const map: Record<string, RespostaVistoria> = {}
      for (const r of respostasVistoria) map[r.item_checklist_id] = r
      setRespostas(map)
    } catch (error) {
      toast.error('Não foi possível carregar a vistoria', { description: getErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSituacaoChange = async (item: ItemChecklist, situacao: Situacao) => {
    if (!vistoria) return
    const existing = respostas[item.id]
    try {
      const updated = existing
        ? await updateResposta(existing.id, { situacao })
        : await createResposta({
            vistoria_id: vistoria.id,
            item_checklist_id: item.id,
            situacao,
            client_uuid: crypto.randomUUID(),
          })
      setRespostas((prev) => ({ ...prev, [item.id]: updated }))
    } catch (error) {
      toast.error('Não foi possível salvar a resposta', { description: getErrorMessage(error) })
    }
  }

  const handleObservacaoBlur = async (item: ItemChecklist, observacao: string) => {
    const existing = respostas[item.id]
    if (!existing || existing.observacao === observacao) return
    try {
      const updated = await updateResposta(existing.id, { observacao })
      setRespostas((prev) => ({ ...prev, [item.id]: updated }))
    } catch (error) {
      toast.error('Não foi possível salvar a observação', { description: getErrorMessage(error) })
    }
  }

  const handleStatusChange = async (status: StatusVistoria) => {
    if (!vistoria) return
    setSavingStatus(true)
    try {
      const updated = await updateVistoria(vistoria.id, { status })
      setVistoria((prev) => (prev ? { ...prev, status: updated.status } : prev))
      toast.success('Status atualizado')
    } catch (error) {
      toast.error('Não foi possível atualizar o status', { description: getErrorMessage(error) })
    } finally {
      setSavingStatus(false)
    }
  }

  const resumo = useMemo(() => {
    let conforme = 0
    let naoConforme = 0
    let naoAplica = 0
    let semResposta = 0
    let multaMin = 0
    let multaMax = 0
    for (const item of itens) {
      const r = respostas[item.id]
      if (!r?.situacao) {
        semResposta++
        continue
      }
      if (r.situacao === 'C') conforme++
      else if (r.situacao === 'N/A') naoAplica++
      else if (r.situacao === 'N/C') {
        naoConforme++
        multaMin += r.valor_multa_min || 0
        multaMax += r.valor_multa_max || 0
      }
    }
    return { conforme, naoConforme, naoAplica, semResposta, multaMin, multaMax }
  }, [itens, respostas])

  const grupos = useMemo(() => {
    const map = new Map<string, ItemChecklist[]>()
    for (const item of itens) {
      const key = item.secao || 'Disposições gerais'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    return Array.from(map.entries())
  }, [itens])

  if (loading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
  }

  if (!vistoria) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Vistoria não encontrada.
      </div>
    )
  }

  const empresa = vistoria.expand?.empresa_id
  const tipo = vistoria.expand?.tipo_vistoria_id

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link
        to="/vistorias"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para vistorias
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {empresa?.nome_fantasia || empresa?.razao_social || 'Vistoria'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tipo?.nr_referencia ? `${tipo.nr_referencia} — ${tipo.nome}` : tipo?.nome}
            {vistoria.data_agendada && (
              <> · {format(parseISO(vistoria.data_agendada), 'dd/MM/yyyy', { locale: ptBR })}</>
            )}
          </p>
        </div>
        <Select
          value={vistoria.status || 'agendada'}
          onValueChange={(v) => handleStatusChange(v as StatusVistoria)}
          disabled={savingStatus}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_LABEL) as StatusVistoria[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="mb-6">
        <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
          <div>
            <div className="text-2xl font-semibold text-emerald-600">{resumo.conforme}</div>
            <div className="text-xs text-muted-foreground">Conforme</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-destructive">{resumo.naoConforme}</div>
            <div className="text-xs text-muted-foreground">Não conforme</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-muted-foreground">{resumo.naoAplica}</div>
            <div className="text-xs text-muted-foreground">Não se aplica</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{resumo.semResposta}</div>
            <div className="text-xs text-muted-foreground">Sem resposta ({itens.length} itens)</div>
          </div>
        </CardContent>
        {resumo.naoConforme > 0 && (
          <>
            <Separator />
            <CardContent className="flex items-center gap-3 pt-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <div className="text-sm font-medium">
                  Estimativa de multa: {currency.format(resumo.multaMin)} a{' '}
                  {currency.format(resumo.multaMax)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Soma dos itens marcados como não conforme, pela gradação do Anexo I da NR-28.
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      <div className="space-y-8">
        {grupos.map(([secao, itensGrupo]) => (
          <div key={secao}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {secao}
            </h2>
            <div className="space-y-3">
              {itensGrupo.map((item) => {
                const resposta = respostas[item.id]
                return (
                  <Card key={item.id}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="border-primary/40 font-mono text-xs text-primary"
                            >
                              Item {item.item_ref}
                            </Badge>
                            {item.grau && (
                              <Badge variant="outline" className="text-xs">
                                Grau {item.grau} · {item.tipo === 'S' ? 'Severidade' : 'Moderada'}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-sm font-medium leading-snug">
                            {item.descricao}
                          </CardTitle>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Código {item.codigo}
                          </div>
                          {item.observacao && (
                            <p className="mt-1 text-xs italic text-muted-foreground">
                              {item.observacao}
                            </p>
                          )}
                        </div>
                        <ToggleGroup
                          type="single"
                          value={resposta?.situacao}
                          onValueChange={(v) => v && handleSituacaoChange(item, v as Situacao)}
                          className="shrink-0"
                        >
                          <ToggleGroupItem
                            value="C"
                            className="data-[state=on]:bg-emerald-100 data-[state=on]:text-emerald-700"
                          >
                            C
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="N/C"
                            className="data-[state=on]:bg-red-100 data-[state=on]:text-red-700"
                          >
                            N/C
                          </ToggleGroupItem>
                          <ToggleGroupItem value="N/A" className="data-[state=on]:bg-muted">
                            N/A
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </CardHeader>
                    {resposta?.situacao === 'N/C' && (
                      <CardContent className="pt-0">
                        {(resposta.valor_multa_min || resposta.valor_multa_max) && (
                          <div className="mb-2 text-sm font-medium text-destructive">
                            Multa estimada: {currency.format(resposta.valor_multa_min || 0)} a{' '}
                            {currency.format(resposta.valor_multa_max || 0)}
                          </div>
                        )}
                        <Textarea
                          placeholder="Observação sobre a não conformidade (opcional)"
                          defaultValue={resposta.observacao}
                          onBlur={(e) => handleObservacaoBlur(item, e.target.value)}
                          className="text-sm"
                        />
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
