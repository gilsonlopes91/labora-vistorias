/* Plano de ação: as medidas de controle, priorizadas pela categoria de risco
   e pelo nº de expostos (NR-01 1.5.5.2.1.1). Um botão gera sugestões a
   partir das avaliações do inventário classificadas como Substancial ou
   Intolerável que ainda não têm nenhuma ação vinculada. */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ClipboardList, Pencil, Sparkles, Trash2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { formatBrazilianDate } from '@/lib/date'
import { useAuth } from '@/hooks/use-auth'
import { getGhes } from '@/services/ghes'
import { getMatrizOficial } from '@/services/matrizesRisco'
import { getAvaliacoesRiscoPorGhes, type AvaliacaoRisco } from '@/services/avaliacoesRisco'
import { resolverCelula } from '@/lib/matrizRisco'
import {
  createAcaoPlano,
  deleteAcaoPlano,
  getAcoesPlano,
  updateAcaoPlano,
  type AcaoPlano,
  type AcaoPlanoInput,
  type PrioridadeAcaoPlano,
  type StatusAcaoPlano,
} from '@/services/acoesPlano'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

const STATUS_OPCOES: StatusAcaoPlano[] = ['Pendente', 'Em andamento', 'Concluída', 'Cancelada']
const PRIORIDADE_OPCOES: PrioridadeAcaoPlano[] = [
  'Intolerável',
  'Substancial',
  'Moderado',
  'Tolerável',
  'Trivial',
]
const NIVEIS_HIERARQUIA = [
  'Eliminação',
  'Substituição',
  'Engenharia',
  'Administrativa',
  'EPI',
] as const
const COR_PRIORIDADE: Record<string, string> = {
  Intolerável: '#ef4444',
  Substancial: '#f97316',
  Moderado: '#eab308',
  Tolerável: '#84cc16',
  Trivial: '#22c55e',
}
const VARIANTE_STATUS: Record<StatusAcaoPlano, 'default' | 'secondary' | 'destructive'> = {
  Pendente: 'secondary',
  'Em andamento': 'default',
  Concluída: 'default',
  Cancelada: 'destructive',
}

export function PlanoAcaoTab({ empresaId }: { empresaId: string }) {
  const { user } = useAuth()
  const organizacaoId = (user?.organizacao_id as string) || ''

  const [acoes, setAcoes] = useState<AcaoPlano[]>([])
  const [avaliacoesCriticas, setAvaliacoesCriticas] = useState<
    (AvaliacaoRisco & { _categoria: PrioridadeAcaoPlano })[]
  >([])
  const [carregando, setCarregando] = useState(true)
  const [gerando, setGerando] = useState(false)

  const carregar = () => getAcoesPlano(empresaId).then(setAcoes)

  // Avaliações Substancial/Intolerável sem nenhuma ação vinculada ainda —
  // a base para o botão "gerar sugestões".
  const carregarCriticas = async () => {
    const ghes = await getGhes(empresaId)
    const [avaliacoes, matriz5] = await Promise.all([
      getAvaliacoesRiscoPorGhes(ghes.map((g) => g.id)),
      getMatrizOficial(5),
    ])
    if (!matriz5) return setAvaliacoesCriticas([])
    const comAcao = new Set(acoes.map((a) => a.avaliacao_id).filter(Boolean))
    const criticas: (AvaliacaoRisco & { _categoria: PrioridadeAcaoPlano })[] = []
    for (const a of avaliacoes) {
      const p = a.probabilidade_final ?? a.probabilidade_sugerida
      const s = a.severidade_final ?? a.severidade_sugerida
      if (p == null || s == null) continue
      const celula = resolverCelula(matriz5, p, s)
      if (
        celula &&
        (celula.categoria === 'Substancial' || celula.categoria === 'Intolerável') &&
        !comAcao.has(a.id)
      ) {
        criticas.push({ ...a, _categoria: celula.categoria as PrioridadeAcaoPlano })
      }
    }
    setAvaliacoesCriticas(criticas)
  }

  useEffect(() => {
    carregar()
      .catch((error) =>
        toast.error('Não foi possível carregar o plano de ação', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  useEffect(() => {
    if (!carregando) carregarCriticas().catch(() => setAvaliacoesCriticas([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando, acoes])

  const gerarSugeridas = async () => {
    if (avaliacoesCriticas.length === 0) return
    setGerando(true)
    try {
      await Promise.all(
        avaliacoesCriticas.map((a) =>
          createAcaoPlano({
            organizacao_id: organizacaoId,
            empresa_id: empresaId,
            avaliacao_id: a.id,
            medida: `Reduzir o risco: ${a.perigo_descricao || a.expand?.agente_id?.nome || 'perigo do inventário'} (${a.expand?.ghe_id?.nome || 'GHE'})`,
            status: 'Pendente' as StatusAcaoPlano,
            prioridade: a._categoria,
            numero_expostos: a.numero_expostos,
            origem: 'Sugerida',
          }),
        ),
      )
      toast.success(`${avaliacoesCriticas.length} ação(ões) sugerida(s) criada(s)`)
      carregar()
    } catch (error) {
      toast.error('Não foi possível gerar as sugestões', { description: getErrorMessage(error) })
    } finally {
      setGerando(false)
    }
  }

  // ---- Diálogo ----
  const [dialogAberto, setDialogAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<AcaoPlano | null>(null)
  const [paraExcluir, setParaExcluir] = useState<AcaoPlano | null>(null)
  const [f, setF] = useState<Partial<AcaoPlanoInput>>({})

  const abrir = (a: AcaoPlano | null) => {
    setEmEdicao(a)
    setF(a ? { ...a } : { status: 'Pendente' })
    setDialogAberto(true)
  }

  const salvar = async () => {
    if (!f.medida?.trim()) return toast.error('Descreva a medida')
    try {
      if (emEdicao) await updateAcaoPlano(emEdicao.id, f)
      else
        await createAcaoPlano({
          ...f,
          organizacao_id: organizacaoId,
          empresa_id: empresaId,
        } as AcaoPlanoInput)
      toast.success('Ação salva')
      setDialogAberto(false)
      carregar()
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    }
  }

  const excluir = async () => {
    if (!paraExcluir) return
    try {
      await deleteAcaoPlano(paraExcluir.id)
      toast.success('Ação excluída')
      setParaExcluir(null)
      carregar()
    } catch (error) {
      toast.error('Não foi possível excluir', { description: getErrorMessage(error) })
    }
  }

  const trocarStatus = async (acao: AcaoPlano, status: StatusAcaoPlano) => {
    try {
      const extra: Partial<AcaoPlanoInput> =
        status === 'Concluída' ? { status, data_conclusao: new Date().toISOString() } : { status }
      await updateAcaoPlano(acao.id, extra)
      setAcoes((atual) => atual.map((a) => (a.id === acao.id ? { ...a, ...extra } : a)))
    } catch (error) {
      toast.error('Não foi possível atualizar o status', { description: getErrorMessage(error) })
    }
  }

  // getAcoesPlano já devolve ordenado por prioridade e, dentro dela, por nº
  // de expostos (NR-01, 1.5.5.2.1.1) — ver src/services/acoesPlano.ts.
  const resumo = useMemo(() => {
    const pendentes = acoes.filter((a) => a.status === 'Pendente').length
    const emAndamento = acoes.filter((a) => a.status === 'Em andamento').length
    const concluidas = acoes.filter((a) => a.status === 'Concluída').length
    return { pendentes, emAndamento, concluidas }
  }, [acoes])

  if (carregando) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Plano de ação ({acoes.length})</h3>
          <p className="text-sm text-muted-foreground">
            {resumo.pendentes} pendente(s) · {resumo.emAndamento} em andamento · {resumo.concluidas}{' '}
            concluída(s)
          </p>
        </div>
        <div className="flex gap-2">
          {avaliacoesCriticas.length > 0 && (
            <Button variant="outline" size="sm" disabled={gerando} onClick={gerarSugeridas}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Gerar {avaliacoesCriticas.length} sugestão(ões)
            </Button>
          )}
          <Button size="sm" onClick={() => abrir(null)}>
            Nova ação
          </Button>
        </div>
      </div>

      {acoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
          <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma ação cadastrada ainda.</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y">
            {acoes.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div
                  className="h-full w-1 shrink-0 self-stretch rounded"
                  style={{
                    backgroundColor: a.prioridade ? COR_PRIORIDADE[a.prioridade] : '#cbd5e1',
                  }}
                />
                <div className="min-w-56 flex-1">
                  <div className="font-medium leading-snug">{a.medida}</div>
                  <div className="text-xs text-muted-foreground">
                    {[
                      a.nivel_hierarquia,
                      a.responsavel,
                      a.prazo ? `prazo ${formatBrazilianDate(a.prazo)}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'sem detalhes'}
                    {a.origem === 'Sugerida' && ' · sugerida pelo inventário'}
                  </div>
                </div>
                {a.prioridade && (
                  <Badge style={{ backgroundColor: COR_PRIORIDADE[a.prioridade], color: '#fff' }}>
                    {a.prioridade}
                  </Badge>
                )}
                <Select
                  value={a.status}
                  onValueChange={(v) => trocarStatus(a, v as StatusAcaoPlano)}
                >
                  <SelectTrigger className="h-8 w-40 text-xs">
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
                <Badge variant={VARIANTE_STATUS[a.status]} className="hidden xl:inline-flex">
                  {a.status}
                </Badge>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" onClick={() => abrir(a)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setParaExcluir(a)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{emEdicao ? 'Editar ação' : 'Nova ação'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Medida</Label>
              <Textarea
                className="mt-1.5"
                value={f.medida || ''}
                onChange={(e) => setF((v) => ({ ...v, medida: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nível hierárquico</Label>
                <Select
                  value={f.nivel_hierarquia || '__vazio'}
                  onValueChange={(v) =>
                    setF((s) => ({
                      ...s,
                      nivel_hierarquia:
                        v === '__vazio' ? undefined : (v as (typeof NIVEIS_HIERARQUIA)[number]),
                    }))
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__vazio">—</SelectItem>
                    {NIVEIS_HIERARQUIA.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select
                  value={f.prioridade || '__vazio'}
                  onValueChange={(v) =>
                    setF((s) => ({
                      ...s,
                      prioridade: v === '__vazio' ? undefined : (v as PrioridadeAcaoPlano),
                    }))
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__vazio">—</SelectItem>
                    {PRIORIDADE_OPCOES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Responsável</Label>
                <Input
                  className="mt-1.5"
                  value={f.responsavel || ''}
                  onChange={(e) => setF((v) => ({ ...v, responsavel: e.target.value }))}
                />
              </div>
              <div>
                <Label>Prazo</Label>
                <Input
                  className="mt-1.5"
                  type="date"
                  value={f.prazo ? f.prazo.slice(0, 10) : ''}
                  onChange={(e) => setF((v) => ({ ...v, prazo: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select
                  value={f.status || 'Pendente'}
                  onValueChange={(v) => setF((s) => ({ ...s, status: v as StatusAcaoPlano }))}
                >
                  <SelectTrigger className="mt-1.5">
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
              </div>
              <div>
                <Label>Nº de expostos beneficiados</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  value={f.numero_expostos ?? ''}
                  onChange={(e) =>
                    setF((v) => ({ ...v, numero_expostos: Number(e.target.value) || undefined }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Forma de acompanhamento</Label>
                <Textarea
                  className="mt-1.5"
                  value={f.forma_acompanhamento || ''}
                  onChange={(e) => setF((v) => ({ ...v, forma_acompanhamento: e.target.value }))}
                />
              </div>
              <div>
                <Label>Forma de aferição do resultado</Label>
                <Textarea
                  className="mt-1.5"
                  placeholder="Como será medido se a medida funcionou (nova medição, checklist, inspeção...)"
                  value={f.forma_afericao_resultado || ''}
                  onChange={(e) =>
                    setF((v) => ({ ...v, forma_afericao_resultado: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!paraExcluir} onOpenChange={(o) => !o && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ação</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação do plano será removida definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default PlanoAcaoTab
