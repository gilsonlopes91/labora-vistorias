/* Inventário de riscos: uma linha por GHE x perigo/agente. Permite escolher
   a dimensão da matriz (3x3 ou 5x5, metodologia AIHA) e mostra, para cada
   avaliação, a sugestão de P/S calculada a partir do dado bruto e a célula
   resultante (categoria, cor, ação, prazo) — o técnico confirma ou ajusta.
   Ver src/lib/matrizRisco.ts para a lógica de conversão. */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useAuth } from '@/hooks/use-auth'
import { getGhes, type Ghe } from '@/services/ghes'
import { getAgentesCatalogo, type AgenteCatalogo } from '@/services/agentesCatalogo'
import { getMatrizOficial, type MatrizRisco } from '@/services/matrizesRisco'
import {
  createAvaliacaoRisco,
  deleteAvaliacaoRisco,
  getAvaliacoesRiscoPorGhes,
  updateAvaliacaoRisco,
  type AvaliacaoRisco,
  type AvaliacaoRiscoInput,
  type TrilhaProbabilidade,
} from '@/services/avaliacoesRisco'
import {
  avisosComplementares,
  resolverCelula,
  sugerirProbabilidade,
  sugerirSeveridade,
  type Dimensao,
} from '@/lib/matrizRisco'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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

const TRILHAS: TrilhaProbabilidade[] = [
  'Quantitativa (medição)',
  'Qualitativa (controle)',
  'Acidente/mecânico',
  'Ergonômica (AEP/AET)',
  'Psicossocial',
]
const NIVEIS_CONTROLE = [
  'Excelente / melhor prática',
  'Conforme, com manutenção garantida',
  'Adequado, com pequenas deficiências',
  'Deficiente ou incompleto',
  'Inexistente ou inadequado',
]
const RESULTADOS_AEP = ['Baixo', 'Médio', 'Alto', 'Não avaliado']
const FREQUENCIAS = [
  'Habitual e permanente',
  'Habitual e intermitente',
  'Eventual/ocasional',
  'Não se aplica',
]
const INSALUBRIDADE_OPCOES = ['Não caracteriza', 'Mínimo (10%)', 'Médio (20%)', 'Máximo (40%)']
const LTCAT_OPCOES = ['Não', 'Sim - 15 anos', 'Sim - 20 anos', 'Sim - 25 anos']
const EFEITO_AIHA_LABEL: Record<string, string> = {
  '0': '0 — sem efeito adverso conhecido',
  '1': '1 — leve e reversível',
  '2': '2 — moderado, pode ser irreversível',
  '3': '3 — grave, irreversível',
  '4': '4 — incapacitante ou fatal',
}
const CATEGORIA_AIHA_LABEL: Record<string, string> = {
  '0': '0 — < 10% do LEO',
  '1': '1 — 10 a 50% do LEO',
  '2': '2 — 50 a 100% do LEO',
  '3': '3 — 100 a 500% do LEO (nível de ação)',
  '4': '4 — > 500% do LEO',
}

export function InventarioRiscosTab({ empresaId }: { empresaId: string }) {
  const { user } = useAuth()
  const organizacaoId = (user?.organizacao_id as string) || ''

  const [ghes, setGhes] = useState<Ghe[]>([])
  const [agentes, setAgentes] = useState<AgenteCatalogo[]>([])
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoRisco[]>([])
  const [dimensao, setDimensao] = useState<Dimensao>(5)
  const [matriz, setMatriz] = useState<MatrizRisco | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregarBase = () =>
    Promise.all([getGhes(empresaId), getAgentesCatalogo()]).then(([g, a]) => {
      setGhes(g)
      setAgentes(a)
      return getAvaliacoesRiscoPorGhes(g.map((x) => x.id)).then(setAvaliacoes)
    })

  useEffect(() => {
    carregarBase()
      .catch((error) =>
        toast.error('Não foi possível carregar o inventário', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  useEffect(() => {
    getMatrizOficial(dimensao)
      .then(setMatriz)
      .catch((error) =>
        toast.error('Não foi possível carregar a matriz de risco', {
          description: getErrorMessage(error),
        }),
      )
  }, [dimensao])

  const recarregarAvaliacoes = () =>
    getAvaliacoesRiscoPorGhes(ghes.map((g) => g.id)).then(setAvaliacoes)

  // ---- Diálogo de avaliação ----
  const [dialogAberto, setDialogAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<AvaliacaoRisco | null>(null)
  const [paraExcluir, setParaExcluir] = useState<AvaliacaoRisco | null>(null)
  const [f, setF] = useState<Partial<AvaliacaoRiscoInput>>({})

  const abrir = (a: AvaliacaoRisco | null) => {
    setEmEdicao(a)
    setF(
      a
        ? { ...a }
        : { ghe_id: ghes[0]?.id, trilha_probabilidade: 'Qualitativa (controle)', ativo: true },
    )
    setDialogAberto(true)
  }

  const escolherAgente = (agenteId: string) => {
    const agente = agentes.find((a) => a.id === agenteId)
    setF((v) => ({
      ...v,
      agente_id: agenteId === '__nenhum' ? undefined : agenteId,
      ...(agente
        ? {
            perigo_descricao: v.perigo_descricao || agente.nome,
            fonte_geradora: v.fonte_geradora || agente.fonte_geradora_tipica,
            meio_propagacao: v.meio_propagacao || agente.meio_propagacao,
            danos_possiveis: v.danos_possiveis || agente.danos_saude_tipicos,
            efeito_saude_aiha: v.efeito_saude_aiha || agente.efeito_saude_aiha,
          }
        : {}),
    }))
  }

  // Sugestão calculada em tempo real a partir do formulário aberto.
  const sugestao = useMemo(() => {
    const p = sugerirProbabilidade(
      {
        trilha_probabilidade: f.trilha_probabilidade || 'Qualitativa (controle)',
        categoria_aiha_exposicao: f.categoria_aiha_exposicao,
        controle_nivel: f.controle_nivel,
        resultado_aep_aet: f.resultado_aep_aet,
      },
      dimensao,
    )
    const s = sugerirSeveridade(f.efeito_saude_aiha, dimensao)
    const celula = matriz && p != null && s != null ? resolverCelula(matriz, p, s) : null
    return { p, s, celula }
  }, [f, dimensao, matriz])

  const salvar = async () => {
    if (!f.ghe_id) return toast.error('Selecione o GHE')
    if (!f.trilha_probabilidade) return toast.error('Selecione a trilha de probabilidade')
    const dados: Partial<AvaliacaoRiscoInput> = {
      ...f,
      probabilidade_sugerida: sugestao.p ?? undefined,
      severidade_sugerida: sugestao.s ?? undefined,
      probabilidade_final: f.probabilidade_final ?? sugestao.p ?? undefined,
      severidade_final: f.severidade_final ?? sugestao.s ?? undefined,
    }
    try {
      if (emEdicao) await updateAvaliacaoRisco(emEdicao.id, dados)
      else
        await createAvaliacaoRisco({
          ...dados,
          organizacao_id: organizacaoId,
          ativo: true,
        } as AvaliacaoRiscoInput)
      toast.success('Avaliação salva')
      setDialogAberto(false)
      recarregarAvaliacoes()
    } catch (error) {
      toast.error('Não foi possível salvar a avaliação', { description: getErrorMessage(error) })
    }
  }

  const excluir = async () => {
    if (!paraExcluir) return
    try {
      await deleteAvaliacaoRisco(paraExcluir.id)
      toast.success('Avaliação removida')
      setParaExcluir(null)
      recarregarAvaliacoes()
    } catch (error) {
      toast.error('Não foi possível remover', { description: getErrorMessage(error) })
    }
  }

  if (carregando) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Inventário de riscos ({avaliacoes.length})</h3>
          <p className="text-sm text-muted-foreground">
            Cada linha é um GHE avaliado para um agente/perigo. A matriz escolhida abaixo é só de
            visualização aqui — a matriz usada no PGR emitido é escolhida no documento.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Matriz</Label>
          <Select
            value={String(dimensao)}
            onValueChange={(v) => setDimensao(Number(v) as Dimensao)}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 x 5</SelectItem>
              <SelectItem value="3">3 x 3</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" disabled={ghes.length === 0} onClick={() => abrir(null)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nova avaliação
          </Button>
        </div>
      </div>

      {ghes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Cadastre pelo menos um GHE na aba "Estrutura SST" antes de iniciar o inventário.
        </p>
      ) : avaliacoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
          <ListChecks className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma avaliação de risco ainda.</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y">
            {avaliacoes.map((a) => {
              const p = a.probabilidade_final ?? a.probabilidade_sugerida
              const s = a.severidade_final ?? a.severidade_sugerida
              const celula = matriz && p != null && s != null ? resolverCelula(matriz, p, s) : null
              return (
                <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">
                        {a.perigo_descricao || a.expand?.agente_id?.nome || 'Perigo sem descrição'}
                      </span>
                      {a.expand?.agente_id?.tipo && (
                        <Badge variant="outline" className="text-[10px]">
                          {a.expand.agente_id.tipo}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.expand?.ghe_id?.nome || 'GHE removido'} · {a.trilha_probabilidade}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {celula ? (
                      <Badge style={{ backgroundColor: celula.cor, color: '#fff' }}>
                        P{p} × S{s} — {celula.categoria}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">sem P/S</Badge>
                    )}
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon" onClick={() => abrir(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setParaExcluir(a)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{emEdicao ? 'Editar avaliação' : 'Nova avaliação de risco'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>GHE</Label>
                <Select
                  value={f.ghe_id || ''}
                  onValueChange={(v) => setF((s) => ({ ...s, ghe_id: v }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ghes.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Agente do catálogo</Label>
                <Select value={f.agente_id || '__nenhum'} onValueChange={escolherAgente}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Sem agente (perigo avulso)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__nenhum">Sem agente (perigo avulso)</SelectItem>
                    {agentes.map((ag) => (
                      <SelectItem key={ag.id} value={ag.id}>
                        {ag.tipo} — {ag.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Descrição do perigo</Label>
              <Input
                className="mt-1.5"
                value={f.perigo_descricao || ''}
                onChange={(e) => setF((v) => ({ ...v, perigo_descricao: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Frequência de exposição</Label>
                <Select
                  value={f.frequencia_exposicao || ''}
                  onValueChange={(v) => setF((s) => ({ ...s, frequencia_exposicao: v }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIAS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nº de expostos</Label>
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

            <div className="rounded-lg border p-3">
              <Label className="mb-2 block text-sm font-semibold">Trilha de probabilidade</Label>
              <Select
                value={f.trilha_probabilidade}
                onValueChange={(v) =>
                  setF((s) => ({ ...s, trilha_probabilidade: v as TrilhaProbabilidade }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRILHAS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {f.trilha_probabilidade === 'Quantitativa (medição)' && (
                <div className="mt-3">
                  <Label>Categoria de exposição AIHA (0-4)</Label>
                  <Select
                    value={f.categoria_aiha_exposicao || ''}
                    onValueChange={(v) =>
                      setF((s) => ({
                        ...s,
                        categoria_aiha_exposicao: v as '0' | '1' | '2' | '3' | '4',
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORIA_AIHA_LABEL).map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Calculada a partir das medições (Fase 3). Por ora, informe manualmente.
                  </p>
                </div>
              )}

              {(f.trilha_probabilidade === 'Qualitativa (controle)' ||
                f.trilha_probabilidade === 'Acidente/mecânico') && (
                <div className="mt-3 space-y-3">
                  <div>
                    <Label>Nível de controle existente</Label>
                    <Select
                      value={f.controle_nivel || ''}
                      onValueChange={(v) => setF((s) => ({ ...s, controle_nivel: v }))}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {NIVEIS_CONTROLE.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Descrição do controle</Label>
                    <Textarea
                      className="mt-1.5"
                      value={f.controle_descricao || ''}
                      onChange={(e) => setF((v) => ({ ...v, controle_descricao: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {(f.trilha_probabilidade === 'Ergonômica (AEP/AET)' ||
                f.trilha_probabilidade === 'Psicossocial') && (
                <div className="mt-3 space-y-3">
                  <div>
                    <Label>Resultado da análise (AEP/AET)</Label>
                    <Select
                      value={f.resultado_aep_aet || ''}
                      onValueChange={(v) =>
                        setF((s) => ({
                          ...s,
                          resultado_aep_aet: v as 'Baixo' | 'Médio' | 'Alto' | 'Não avaliado',
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESULTADOS_AEP.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      className="mt-1.5"
                      value={f.observacoes_aep_aet || ''}
                      onChange={(e) => setF((v) => ({ ...v, observacoes_aep_aet: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="mt-3">
                <Label>Incerteza da avaliação</Label>
                <Select
                  value={f.incerteza || '0'}
                  onValueChange={(v) =>
                    setF((s) => ({ ...s, incerteza: v as '0' | '1' | '2' | '3' }))
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 — baixa</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3 — alta (poucos dados)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <Label className="mb-2 block text-sm font-semibold">
                Efeito à saúde e severidade
              </Label>
              <Select
                value={f.efeito_saude_aiha || ''}
                onValueChange={(v) =>
                  setF((s) => ({ ...s, efeito_saude_aiha: v as '0' | '1' | '2' | '3' | '4' }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o efeito à saúde (AIHA)" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EFEITO_AIHA_LABEL).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                className="mt-2"
                placeholder="Danos possíveis à saúde"
                value={f.danos_possiveis || ''}
                onChange={(e) => setF((v) => ({ ...v, danos_possiveis: e.target.value }))}
              />
            </div>

            <div className="rounded-lg border bg-muted/40 p-3">
              <Label className="mb-2 block text-sm font-semibold">
                Sugestão calculada (matriz {dimensao}x{dimensao})
              </Label>
              {sugestao.p == null || sugestao.s == null ? (
                <p className="text-sm text-muted-foreground">
                  Preencha a trilha de probabilidade e o efeito à saúde para calcular a sugestão.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">P{sugestao.p}</Badge>
                  <Badge variant="outline">S{sugestao.s}</Badge>
                  {sugestao.celula && (
                    <Badge style={{ backgroundColor: sugestao.celula.cor, color: '#fff' }}>
                      {sugestao.celula.categoria}
                      {sugestao.celula.prazo_dias != null &&
                        ` · prazo ${sugestao.celula.prazo_dias}d`}
                    </Badge>
                  )}
                </div>
              )}
              {avisosComplementares({
                incerteza: f.incerteza,
                categoria_aiha_exposicao: f.categoria_aiha_exposicao,
                trilha_probabilidade: f.trilha_probabilidade || 'Qualitativa (controle)',
              }).map((aviso) => (
                <div key={aviso} className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {aviso}
                </div>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Probabilidade final (confirmar/ajustar)</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    min={1}
                    max={dimensao}
                    value={f.probabilidade_final ?? sugestao.p ?? ''}
                    onChange={(e) =>
                      setF((v) => ({
                        ...v,
                        probabilidade_final: Number(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Severidade final (confirmar/ajustar)</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    min={1}
                    max={dimensao}
                    value={f.severidade_final ?? sugestao.s ?? ''}
                    onChange={(e) =>
                      setF((v) => ({ ...v, severidade_final: Number(e.target.value) || undefined }))
                    }
                  />
                </div>
              </div>
              {(f.probabilidade_final != null && f.probabilidade_final !== sugestao.p) ||
              (f.severidade_final != null && f.severidade_final !== sugestao.s) ? (
                <div className="mt-2">
                  <Label className="text-xs">Justificativa do ajuste</Label>
                  <Textarea
                    className="mt-1"
                    value={f.justificativa_ajuste || ''}
                    onChange={(e) => setF((v) => ({ ...v, justificativa_ajuste: e.target.value }))}
                  />
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border p-3">
              <Label className="mb-2 block text-sm font-semibold">Medidas de controle e EPI</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={!!f.epc_eficaz}
                    onCheckedChange={(c) => setF((v) => ({ ...v, epc_eficaz: !!c }))}
                  />
                  EPC eficaz
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={!!f.epc_plano_manutencao}
                    onCheckedChange={(c) => setF((v) => ({ ...v, epc_plano_manutencao: !!c }))}
                  />
                  Tem plano de manutenção
                </label>
              </div>
              <Textarea
                className="mt-2"
                placeholder="EPIs utilizados"
                value={f.epis_utilizados || ''}
                onChange={(e) => setF((v) => ({ ...v, epis_utilizados: e.target.value }))}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(
                  [
                    ['epi_condicao_funcionamento', 'Em condição de funcionamento'],
                    ['epi_uso_ininterrupto', 'Uso ininterrupto na exposição'],
                    ['epi_validade_ca_ok', 'CA dentro da validade'],
                    ['epi_periodicidade_troca_ok', 'Troca respeita periodicidade'],
                    ['epi_higienizacao_ok', 'Higienização adequada'],
                  ] as const
                ).map(([campo, label]) => (
                  <label key={campo} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={!!f[campo]}
                      onCheckedChange={(c) => setF((v) => ({ ...v, [campo]: !!c }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <Label className="mb-2 block text-sm font-semibold">
                Conclusões dos documentos (sugestão do técnico)
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Insalubridade (NR-15)</Label>
                  <Select
                    value={f.insalubridade_final || '__vazio'}
                    onValueChange={(v) =>
                      setF((s) => ({ ...s, insalubridade_final: v === '__vazio' ? undefined : v }))
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__vazio">—</SelectItem>
                      {INSALUBRIDADE_OPCOES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Periculosidade (NR-16)</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Checkbox
                      checked={!!f.periculosidade_final}
                      onCheckedChange={(c) => setF((v) => ({ ...v, periculosidade_final: !!c }))}
                    />
                    <span className="text-sm">Enquadra</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">LTCAT / aposentadoria especial</Label>
                  <Select
                    value={f.ltcat_enquadra_final || '__vazio'}
                    onValueChange={(v) =>
                      setF((s) => ({ ...s, ltcat_enquadra_final: v === '__vazio' ? undefined : v }))
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__vazio">—</SelectItem>
                      {LTCAT_OPCOES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
            <AlertDialogTitle>Remover avaliação</AlertDialogTitle>
            <AlertDialogDescription>
              A avaliação será marcada como inativa e sai do inventário. O histórico é mantido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluir}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default InventarioRiscosTab
