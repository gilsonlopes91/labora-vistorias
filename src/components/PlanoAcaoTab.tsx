/* Plano de ação: agora organizado em planos nomeados (ex.: "Plano de Ação
   PGR 2026", "Ações emergenciais - setor de pintura"), cada um com suas
   ações no formato 5W2H (o quê / por quê / onde / quando / quem / como /
   quanto custa). Ações antigas, cadastradas antes de existir "planos_acao",
   continuam existindo soltas — aparecem em "Ações sem plano" até serem
   organizadas dentro de um plano.

   Um botão gera sugestões a partir das avaliações do inventário
   classificadas como Substancial ou Intolerável que ainda não têm nenhuma
   ação vinculada (GHE ou risco direto do cargo — Ponto 1 do plano de
   evolução, ver src/lib/riscoFuncao.ts).

   Na aba Documentos, o técnico escolhe quais destes planos entram em cada
   PGR/laudo emitido (src/components/DocumentosSstTab.tsx). */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FolderPlus,
  Pencil,
  Sparkles,
  Trash2,
} from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { formatBrazilianDate } from '@/lib/date'
import { useAuth } from '@/hooks/use-auth'
import { getGhes } from '@/services/ghes'
import { getFuncoesSst } from '@/services/funcoesSst'
import { getMatrizOficial } from '@/services/matrizesRisco'
import { getAvaliacoesRiscoDaEmpresa, type AvaliacaoRisco } from '@/services/avaliacoesRisco'
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
import {
  createPlanoAcao,
  deletePlanoAcao,
  getPlanosAcao,
  updatePlanoAcao,
  type PlanoAcao,
  type PlanoAcaoInput,
  type StatusPlanoAcao,
} from '@/services/planosAcao'

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
const STATUS_PLANO_OPCOES: StatusPlanoAcao[] = ['Ativo', 'Concluído', 'Arquivado']
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
const VARIANTE_STATUS_PLANO: Record<StatusPlanoAcao, 'default' | 'secondary' | 'outline'> = {
  Ativo: 'default',
  Concluído: 'secondary',
  Arquivado: 'outline',
}
/** Chave usada para "sem plano" nos selects — não pode ser string vazia
 *  (o Radix Select trata "" como valor reservado). */
const SEM_PLANO = '__sem_plano'

export function PlanoAcaoTab({ empresaId }: { empresaId: string }) {
  const { user } = useAuth()
  const organizacaoId = (user?.organizacao_id as string) || ''

  const [planos, setPlanos] = useState<PlanoAcao[]>([])
  const [acoes, setAcoes] = useState<AcaoPlano[]>([])
  const [avaliacoesCriticas, setAvaliacoesCriticas] = useState<
    (AvaliacaoRisco & { _categoria: PrioridadeAcaoPlano })[]
  >([])
  const [carregando, setCarregando] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [planoDestinoSugestoes, setPlanoDestinoSugestoes] = useState<string>(SEM_PLANO)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  const carregar = () =>
    Promise.all([getPlanosAcao(empresaId), getAcoesPlano(empresaId)]).then(([p, a]) => {
      setPlanos(p)
      setAcoes(a)
      // Planos recém-vistos começam expandidos; preserva o estado dos que
      // já estavam na tela.
      setExpandidos((atual) => {
        const novo = new Set(atual)
        p.forEach((plano) => {
          if (!novo.has(plano.id) && plano.status === 'Ativo') novo.add(plano.id)
        })
        return novo
      })
    })

  // Avaliações Substancial/Intolerável sem nenhuma ação vinculada ainda —
  // a base para o botão "gerar sugestões". Considera tanto risco de GHE
  // quanto risco direto do cargo (Ponto 1).
  const carregarCriticas = async () => {
    const [ghes, funcoes] = await Promise.all([getGhes(empresaId), getFuncoesSst(empresaId)])
    const [avaliacoes, matriz5] = await Promise.all([
      getAvaliacoesRiscoDaEmpresa(
        ghes.map((g) => g.id),
        funcoes.map((f) => f.id),
      ),
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
            plano_id: planoDestinoSugestoes === SEM_PLANO ? undefined : planoDestinoSugestoes,
            medida: `Reduzir o risco: ${a.perigo_descricao || a.expand?.agente_id?.nome || 'perigo do inventário'} (${a.expand?.ghe_id?.nome || a.expand?.funcao_id?.nome || 'unidade avaliada'})`,
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

  // ---- Diálogo de plano ----
  const [dialogPlanoAberto, setDialogPlanoAberto] = useState(false)
  const [planoEmEdicao, setPlanoEmEdicao] = useState<PlanoAcao | null>(null)
  const [planoParaExcluir, setPlanoParaExcluir] = useState<PlanoAcao | null>(null)
  const [fPlano, setFPlano] = useState<Partial<PlanoAcaoInput>>({})

  const abrirPlano = (p: PlanoAcao | null) => {
    setPlanoEmEdicao(p)
    setFPlano(p ? { ...p } : { status: 'Ativo' })
    setDialogPlanoAberto(true)
  }
  const salvarPlano = async () => {
    if (!fPlano.nome?.trim()) return toast.error('Dê um nome ao plano de ação')
    try {
      if (planoEmEdicao) await updatePlanoAcao(planoEmEdicao.id, fPlano)
      else
        await createPlanoAcao({
          ...fPlano,
          organizacao_id: organizacaoId,
          empresa_id: empresaId,
        } as PlanoAcaoInput)
      toast.success('Plano de ação salvo')
      setDialogPlanoAberto(false)
      carregar()
    } catch (error) {
      toast.error('Não foi possível salvar o plano', { description: getErrorMessage(error) })
    }
  }
  const excluirPlano = async () => {
    if (!planoParaExcluir) return
    try {
      await deletePlanoAcao(planoParaExcluir.id)
      toast.success('Plano de ação excluído (junto com as ações dele)')
      setPlanoParaExcluir(null)
      carregar()
    } catch (error) {
      toast.error('Não foi possível excluir', { description: getErrorMessage(error) })
    }
  }

  // ---- Diálogo de ação ----
  const [dialogAberto, setDialogAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<AcaoPlano | null>(null)
  const [paraExcluir, setParaExcluir] = useState<AcaoPlano | null>(null)
  const [f, setF] = useState<Partial<AcaoPlanoInput>>({})

  const abrir = (a: AcaoPlano | null, planoIdPadrao?: string) => {
    setEmEdicao(a)
    setF(a ? { ...a } : { status: 'Pendente', plano_id: planoIdPadrao })
    setDialogAberto(true)
  }

  const salvar = async () => {
    if (!f.medida?.trim()) return toast.error('Descreva a medida (o quê)')
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

  const moverParaPlano = async (acao: AcaoPlano, planoId: string) => {
    const novoPlanoId = planoId === SEM_PLANO ? undefined : planoId
    try {
      await updateAcaoPlano(acao.id, { plano_id: novoPlanoId })
      setAcoes((atual) =>
        atual.map((a) => (a.id === acao.id ? { ...a, plano_id: novoPlanoId } : a)),
      )
    } catch (error) {
      toast.error('Não foi possível mover a ação', { description: getErrorMessage(error) })
    }
  }

  const alternarExpandido = (planoId: string) => {
    setExpandidos((atual) => {
      const novo = new Set(atual)
      if (novo.has(planoId)) novo.delete(planoId)
      else novo.add(planoId)
      return novo
    })
  }

  const acoesPorPlano = useMemo(() => {
    const mapa: Record<string, AcaoPlano[]> = {}
    acoes.forEach((a) => {
      const chave = a.plano_id || SEM_PLANO
      if (!mapa[chave]) mapa[chave] = []
      mapa[chave].push(a)
    })
    return mapa
  }, [acoes])

  const acoesSemPlano = acoesPorPlano[SEM_PLANO] || []

  const resumoGeral = useMemo(() => {
    const pendentes = acoes.filter((a) => a.status === 'Pendente').length
    const emAndamento = acoes.filter((a) => a.status === 'Em andamento').length
    const concluidas = acoes.filter((a) => a.status === 'Concluída').length
    return { pendentes, emAndamento, concluidas }
  }, [acoes])

  if (carregando) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
  }

  const renderAcao = (a: AcaoPlano) => {
    const detalhes5w2h = [
      a.justificativa ? { rotulo: 'Por quê', valor: a.justificativa } : null,
      a.local ? { rotulo: 'Onde', valor: a.local } : null,
      a.como ? { rotulo: 'Como', valor: a.como } : null,
      a.custo_estimado != null
        ? { rotulo: 'Quanto custa', valor: `R$ ${a.custo_estimado.toLocaleString('pt-BR')}` }
        : null,
    ].filter((x): x is { rotulo: string; valor: string } => !!x)

    return (
      <div key={a.id} className="flex flex-col gap-2 px-4 py-3">
        <div className="flex flex-wrap items-start gap-3">
          <div
            className="mt-0.5 h-4 w-1.5 shrink-0 rounded"
            style={{ backgroundColor: a.prioridade ? COR_PRIORIDADE[a.prioridade] : '#cbd5e1' }}
          />
          <div className="min-w-56 flex-1">
            <div className="font-medium leading-snug">{a.medida}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {[
                a.nivel_hierarquia,
                a.responsavel ? `Quem: ${a.responsavel}` : null,
                a.prazo ? `Quando: ${formatBrazilianDate(a.prazo)}` : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'sem detalhes'}
              {a.origem === 'Sugerida' && ' · sugerida pelo inventário'}
            </div>
            {detalhes5w2h.length > 0 && (
              <div className="mt-1.5 grid grid-cols-1 gap-x-4 gap-y-0.5 text-xs text-muted-foreground sm:grid-cols-2">
                {detalhes5w2h.map((d) => (
                  <div key={d.rotulo}>
                    <span className="font-medium text-foreground/70">{d.rotulo}:</span> {d.valor}
                  </div>
                ))}
              </div>
            )}
          </div>
          {a.prioridade && (
            <Badge style={{ backgroundColor: COR_PRIORIDADE[a.prioridade], color: '#fff' }}>
              {a.prioridade}
            </Badge>
          )}
          <Select value={a.status} onValueChange={(v) => trocarStatus(a, v as StatusAcaoPlano)}>
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
        {planos.length > 0 && (
          <div className="ml-4 flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
            <span>Plano:</span>
            <Select value={a.plano_id || SEM_PLANO} onValueChange={(v) => moverParaPlano(a, v)}>
              <SelectTrigger className="h-7 w-56 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_PLANO}>Sem plano</SelectItem>
                {planos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Plano de ação ({acoes.length})</h3>
          <p className="text-sm text-muted-foreground">
            {resumoGeral.pendentes} pendente(s) · {resumoGeral.emAndamento} em andamento ·{' '}
            {resumoGeral.concluidas} concluída(s)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {avaliacoesCriticas.length > 0 && (
            <>
              <Select value={planoDestinoSugestoes} onValueChange={setPlanoDestinoSugestoes}>
                <SelectTrigger className="h-9 w-52 text-xs">
                  <SelectValue placeholder="Plano de destino" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_PLANO}>Sem plano (organizar depois)</SelectItem>
                  {planos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" disabled={gerando} onClick={gerarSugeridas}>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Gerar {avaliacoesCriticas.length} sugestão(ões)
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => abrirPlano(null)}>
            <FolderPlus className="mr-1.5 h-3.5 w-3.5" />
            Novo plano
          </Button>
          <Button size="sm" onClick={() => abrir(null, planos[0]?.id)}>
            Nova ação
          </Button>
        </div>
      </div>

      {planos.length === 0 && acoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
          <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum plano de ação ainda. Crie um plano, dê um nome (ex.: "Plano de Ação PGR 2026") e
            coloque as ações dentro dele no formato 5W2H.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {planos.map((plano) => {
            const acoesDoPlano = acoesPorPlano[plano.id] || []
            const aberto = expandidos.has(plano.id)
            return (
              <Card key={plano.id} className="overflow-hidden">
                <button
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50"
                  onClick={() => alternarExpandido(plano.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {aberto ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{plano.nome}</span>
                        <Badge variant={VARIANTE_STATUS_PLANO[plano.status]}>{plano.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {acoesDoPlano.length} ação(ões)
                        </span>
                      </div>
                      {plano.descricao && (
                        <p className="truncate text-xs text-muted-foreground">{plano.descricao}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrir(null, plano.id)}
                      className="text-xs"
                    >
                      + Ação
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => abrirPlano(plano)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setPlanoParaExcluir(plano)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </button>
                {aberto && (
                  <div className="divide-y border-t">
                    {acoesDoPlano.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-muted-foreground">
                        Nenhuma ação neste plano ainda.
                      </p>
                    ) : (
                      acoesDoPlano.map(renderAcao)
                    )}
                  </div>
                )}
              </Card>
            )
          })}

          {acoesSemPlano.length > 0 && (
            <Card className="overflow-hidden border-dashed">
              <div className="flex items-center gap-2 bg-muted/40 px-4 py-2.5">
                <span className="text-sm font-semibold text-muted-foreground">
                  Ações sem plano ({acoesSemPlano.length})
                </span>
                <span className="text-xs text-muted-foreground">
                  — organize dentro de um plano usando o seletor de cada ação
                </span>
              </div>
              <div className="divide-y">{acoesSemPlano.map(renderAcao)}</div>
            </Card>
          )}
        </div>
      )}

      {/* Diálogo: plano de ação */}
      <Dialog open={dialogPlanoAberto} onOpenChange={setDialogPlanoAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {planoEmEdicao ? 'Editar plano de ação' : 'Novo plano de ação'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome do plano</Label>
              <Input
                className="mt-1.5"
                placeholder='Ex.: "Plano de Ação PGR 2026"'
                value={fPlano.nome || ''}
                onChange={(e) => setFPlano((v) => ({ ...v, nome: e.target.value }))}
              />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                className="mt-1.5"
                placeholder="Contexto do plano: de onde vem, o que cobre..."
                value={fPlano.descricao || ''}
                onChange={(e) => setFPlano((v) => ({ ...v, descricao: e.target.value }))}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={fPlano.status || 'Ativo'}
                onValueChange={(v) => setFPlano((s) => ({ ...s, status: v as StatusPlanoAcao }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_PLANO_OPCOES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPlanoAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarPlano}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: ação (5W2H) */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{emEdicao ? 'Editar ação' : 'Nova ação'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Plano de ação</Label>
              <Select
                value={f.plano_id || SEM_PLANO}
                onValueChange={(v) =>
                  setF((s) => ({ ...s, plano_id: v === SEM_PLANO ? undefined : v }))
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Sem plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_PLANO}>Sem plano</SelectItem>
                  {planos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border p-3">
              <Label className="mb-2 block text-sm font-semibold">5W2H</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">O quê (a medida)</Label>
                  <Textarea
                    className="mt-1"
                    value={f.medida || ''}
                    onChange={(e) => setF((v) => ({ ...v, medida: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Por quê (justificativa)</Label>
                  <Textarea
                    className="mt-1"
                    placeholder="Por que essa medida é necessária"
                    value={f.justificativa || ''}
                    onChange={(e) => setF((v) => ({ ...v, justificativa: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Onde</Label>
                    <Input
                      className="mt-1"
                      placeholder="Setor, ambiente, GHE..."
                      value={f.local || ''}
                      onChange={(e) => setF((v) => ({ ...v, local: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Quando (prazo)</Label>
                    <Input
                      className="mt-1"
                      type="date"
                      value={f.prazo ? f.prazo.slice(0, 10) : ''}
                      onChange={(e) => setF((v) => ({ ...v, prazo: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Quem (responsável)</Label>
                    <Input
                      className="mt-1"
                      value={f.responsavel || ''}
                      onChange={(e) => setF((v) => ({ ...v, responsavel: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Quanto custa (estimado, R$)</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      value={f.custo_estimado ?? ''}
                      onChange={(e) =>
                        setF((v) => ({ ...v, custo_estimado: Number(e.target.value) || undefined }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Como (método de execução)</Label>
                  <Textarea
                    className="mt-1"
                    placeholder="Como a medida será executada, na prática"
                    value={f.como || ''}
                    onChange={(e) => setF((v) => ({ ...v, como: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nível hierárquico de controle</Label>
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

      <AlertDialog open={!!planoParaExcluir} onOpenChange={(o) => !o && setPlanoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano de ação</AlertDialogTitle>
            <AlertDialogDescription>
              O plano "{planoParaExcluir?.nome}" e todas as ações dentro dele serão removidos
              definitivamente. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluirPlano}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default PlanoAcaoTab
