/* Painel de "Riscos Ocupacionais" embutido no diálogo de uma Função ou de um
   GHE (Estrutura SST) — extraído de InventarioRiscosTab.tsx para eliminar a
   navegação em separado: o técnico já está dentro do contexto (a função ou
   o GHE que está editando), então o formulário de avaliação de risco não
   precisa mais perguntar "qual unidade" — ela já é dada por `funcaoId` ou
   `gheId` (mutuamente exclusivos). Toda a lógica de cálculo (matriz,
   sugestão de P/S, insalubridade/periculosidade) é a mesma de
   InventarioRiscosTab.tsx — só a navegação/layout mudou (lista em cards,
   sem seletor de unidade). */
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { formatBrazilianDate } from '@/lib/date'
import { useAuth } from '@/hooks/use-auth'
import { getAgentesCatalogo, type AgenteCatalogo } from '@/services/agentesCatalogo'
import { getMatrizOficial, type MatrizRisco } from '@/services/matrizesRisco'
import { EpiRiscoSeletor } from '@/components/EpiRiscoSeletor'

import {
  createAvaliacaoRisco,
  deleteAvaliacaoRisco,
  getAvaliacoesRiscoDaEmpresa,
  updateAvaliacaoRisco,
  type AvaliacaoRisco,
  type AvaliacaoRiscoInput,
  type TrilhaProbabilidade,
} from '@/services/avaliacoesRisco'
import {
  createMedicao,
  deleteMedicao,
  getMedicoesPorAvaliacao,
  updateMedicao,
  type Medicao,
  type MedicaoInput,
} from '@/services/medicoes'
import {
  avisosComplementares,
  resolverCelula,
  sugerirProbabilidade,
  sugerirSeveridade,
  type Dimensao,
} from '@/lib/matrizRisco'
import { sugerirCategoriaAihaPorMedicoes } from '@/lib/estatisticaLognormal'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
  'Sem dados suficientes',
  'Acidente/mecânico',
  'Ergonômica (AEP/AET)',
  'Psicossocial',
]
const TRILHAS_DESLIGADAS: TrilhaProbabilidade[] = ['Psicossocial']
const METODOLOGIAS_MATRIZ = [
  { valor: 'AIHA', nome: 'AIHA (adaptação BS 8800)' },
  { valor: 'ISO45002', nome: 'ISO 45002 (manual do MTE)' },
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
const METODOLOGIAS_MEDICAO = [
  'NHO 01 (ruído)',
  'NHO 02 (vapores orgânicos)',
  'NHO 03 (gravimetria)',
  'NHO 04 (fibras)',
  'NHO 06 (calor)',
  'NHO 08 (coleta de particulado)',
  'NHO 09 (vibração corpo inteiro)',
  'NHO 10 (vibração mãos e braços)',
  'NR-15 (critério trabalhista)',
  'Outra',
]
const CATEGORIA_AIHA_LABEL: Record<string, string> = {
  '0': '0 — < 10% do LEO',
  '1': '1 — 10 a 50% do LEO',
  '2': '2 — 50 a 100% do LEO',
  '3': '3 — 100 a 500% do LEO (nível de ação)',
  '4': '4 — > 500% do LEO',
}

/** Percentual entre parênteses de um rótulo tipo "Máximo (40%)" -> "40%". */
function percentualDoRotulo(rotulo?: string): string | null {
  if (!rotulo) return null
  const m = rotulo.match(/\((\d+%)\)/)
  return m ? m[1] : null
}

const NOMES_PROBABILIDADE_5 = [
  'Quase impossível',
  'Improvável',
  'Possível',
  'Provável',
  'Quase certo',
]
const NOMES_SEVERIDADE_5 = ['Insignificante', 'Menor', 'Moderada', 'Maior', 'Catastrófica']
const NOMES_3 = ['Baixa', 'Média', 'Alta']

/** Seção numerada e recolhível do formulário de risco (1. Identificação, 2. Caracterização...). */
function SecaoRisco({
  numero,
  titulo,
  defaultOpen = false,
  children,
}: {
  numero: number
  titulo: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [aberta, setAberta] = useState(defaultOpen)
  return (
    <Collapsible open={aberta} onOpenChange={setAberta} className="border-b last:border-b-0">
      <CollapsibleTrigger className="flex w-full items-center justify-between py-4 text-left">
        <span className="text-base font-semibold">
          {numero}. {titulo}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${aberta ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pb-5">{children}</CollapsibleContent>
    </Collapsible>
  )
}

interface RiscosOcupacionaisPainelProps {
  empresaId: string
  /** Nome da função ou do GHE em edição, mostrado na seção de identificação. */
  nomeContexto?: string
  /** Informe exatamente um dos dois: a função OU o GHE sendo editado. */
  funcaoId?: string
  gheId?: string
}

export function RiscosOcupacionaisPainel({
  empresaId,
  nomeContexto,
  funcaoId,
  gheId,
}: RiscosOcupacionaisPainelProps) {
  const { user } = useAuth()
  const organizacaoId = (user?.organizacao_id as string) || ''
  const contextoBadge = funcaoId ? 'Específico da Função' : 'Geral'

  const [agentes, setAgentes] = useState<AgenteCatalogo[]>([])
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoRisco[]>([])
  const [dimensao, setDimensao] = useState<Dimensao>(5)
  const [metodologia, setMetodologia] = useState<string>('AIHA')
  const [matriz, setMatriz] = useState<MatrizRisco | null>(null)
  const [carregando, setCarregando] = useState(true)

  const recarregarAvaliacoes = () =>
    getAvaliacoesRiscoDaEmpresa(gheId ? [gheId] : [], funcaoId ? [funcaoId] : []).then(
      setAvaliacoes,
    )

  useEffect(() => {
    Promise.all([getAgentesCatalogo(), recarregarAvaliacoes()])
      .then(([a]) => setAgentes(a))
      .catch((error) =>
        toast.error('Não foi possível carregar os riscos', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funcaoId, gheId])

  useEffect(() => {
    getMatrizOficial(dimensao, metodologia)
      .then(setMatriz)
      .catch((error) =>
        toast.error('Não foi possível carregar a matriz de risco', {
          description: getErrorMessage(error),
        }),
      )
  }, [dimensao, metodologia])

  // ---- Diálogo de avaliação ----
  const [dialogAberto, setDialogAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<AvaliacaoRisco | null>(null)
  const [paraExcluir, setParaExcluir] = useState<AvaliacaoRisco | null>(null)
  const [f, setF] = useState<Partial<AvaliacaoRiscoInput>>({})

  // ---- Medições (só existem para uma avaliação já salva) ----
  const [medicoes, setMedicoes] = useState<Medicao[]>([])
  const [medicaoDialog, setMedicaoDialog] = useState(false)
  const [medicaoEdit, setMedicaoEdit] = useState<Medicao | null>(null)
  const [medicaoExcluir, setMedicaoExcluir] = useState<Medicao | null>(null)
  const [fMedicao, setFMedicao] = useState<Partial<MedicaoInput>>({})
  const inicialRef = useRef('')
  const [descartarDialog, setDescartarDialog] = useState(false)

  const carregarMedicoes = (avaliacaoId: string) =>
    getMedicoesPorAvaliacao(avaliacaoId)
      .then(setMedicoes)
      .catch((error) =>
        toast.error('Não foi possível carregar as medições', {
          description: getErrorMessage(error),
        }),
      )

  const abrir = (a: AvaliacaoRisco | null) => {
    setEmEdicao(a)
    const novoF: Partial<AvaliacaoRiscoInput> = a
      ? { ...a }
      : { trilha_probabilidade: 'Qualitativa (controle)' as TrilhaProbabilidade, ativo: true }
    setF(novoF)
    inicialRef.current = JSON.stringify(novoF)
    setMedicoes([])
    if (a) {
      carregarMedicoes(a.id)
    }
    setDialogAberto(true)
  }

  const abrirMedicao = (m: Medicao | null) => {
    setMedicaoEdit(m)
    setFMedicao(m ? { ...m } : { data: new Date().toISOString().slice(0, 10) })
    setMedicaoDialog(true)
  }
  const salvarMedicao = async () => {
    if (!emEdicao) return
    if (!fMedicao.data) return toast.error('Informe a data da medição')
    try {
      if (medicaoEdit) await updateMedicao(medicaoEdit.id, fMedicao)
      else
        await createMedicao({
          ...fMedicao,
          organizacao_id: organizacaoId,
          avaliacao_id: emEdicao.id,
        } as MedicaoInput)
      toast.success('Medição salva')
      setMedicaoDialog(false)
      carregarMedicoes(emEdicao.id)
    } catch (error) {
      toast.error('Não foi possível salvar a medição', { description: getErrorMessage(error) })
    }
  }
  const excluirMedicao = async () => {
    if (!medicaoExcluir || !emEdicao) return
    try {
      await deleteMedicao(medicaoExcluir.id)
      toast.success('Medição removida')
      setMedicaoExcluir(null)
      carregarMedicoes(emEdicao.id)
    } catch (error) {
      toast.error('Não foi possível remover', { description: getErrorMessage(error) })
    }
  }

  // Estatística lognormal do conjunto de medições x limite do agente escolhido.
  const estatisticaMedicoes = useMemo(() => {
    const agente = agentes.find((ag) => ag.id === f.agente_id)
    if (!agente?.limite_tolerancia_valor) return null
    const valores = medicoes.map((m) => m.resultado_valor).filter((v): v is number => v != null)
    if (valores.length === 0) return null
    return sugerirCategoriaAihaPorMedicoes(valores, agente.limite_tolerancia_valor)
  }, [medicoes, f.agente_id, agentes])

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

  // "Puxar do Catálogo": copia os textos do agente escolhido para os campos,
  // sobrescrevendo o que estiver lá — todos continuam editáveis depois.
  // Enquadramentos (insalubridade, periculosidade, aposentadoria especial)
  // só são preenchidos quando ainda estão em branco.
  const puxarDoCatalogo = () => {
    const agente = agentes.find((a) => a.id === f.agente_id)
    if (!agente) return toast.error('Escolha primeiro o risco no catálogo (seção 1)')
    setF((v) => ({
      ...v,
      perigo_descricao: agente.nome,
      fonte_geradora: agente.fonte_geradora_tipica || v.fonte_geradora,
      meio_propagacao: agente.meio_propagacao || v.meio_propagacao,
      danos_possiveis: agente.danos_saude_tipicos || v.danos_possiveis,
      efeito_saude_aiha: agente.efeito_saude_aiha || v.efeito_saude_aiha,
      insalubridade_final: v.insalubridade_final ?? agente.grau_insalubridade_nr15,
      periculosidade_final: v.periculosidade_final ?? (agente.anexo_nr16 ? true : undefined),
      ltcat_enquadra_final:
        v.ltcat_enquadra_final ??
        (agente.anos_aposentadoria_especial
          ? `Sim - ${agente.anos_aposentadoria_especial} anos`
          : undefined),
    }))
    toast.success('Dados puxados do catálogo. Você pode editar o que quiser.')
  }

  // Sugestão calculada em tempo real a partir do formulário aberto.
  const sugestao = useMemo(() => {
    const p = sugerirProbabilidade(
      {
        trilha_probabilidade: f.trilha_probabilidade || 'Qualitativa (controle)',
        categoria_aiha_exposicao: f.categoria_aiha_exposicao,
        controle_nivel: f.controle_nivel,
        resultado_aep_aet: f.resultado_aep_aet,
        nr_especifica_aplicavel: f.nr_especifica_aplicavel,
        nr_especifica_atendida: f.nr_especifica_atendida,
      },
      dimensao,
    )
    const s = sugerirSeveridade(f.efeito_saude_aiha, dimensao)
    const celula = matriz && p != null && s != null ? resolverCelula(matriz, p, s) : null
    return { p, s, celula }
  }, [f, dimensao, matriz])

  // Valores que valem agora no formulário (o que o técnico ajustou, ou a
  // sugestão do sistema) e o grau de risco resultante, mostrado na seção 3.
  const pAtual = f.probabilidade_final ?? sugestao.p ?? null
  const sAtual = f.severidade_final ?? sugestao.s ?? null
  const celulaAtual =
    matriz && pAtual != null && sAtual != null ? resolverCelula(matriz, pAtual, sAtual) : null
  const pontuacaoAtual =
    matriz && pAtual != null && sAtual != null
      ? (matriz.celulas.find((c) => c.p === pAtual && c.s === sAtual)?.pontuacao ?? pAtual * sAtual)
      : null
  const nomesP = dimensao === 5 ? NOMES_PROBABILIDADE_5 : NOMES_3
  const nomesS = dimensao === 5 ? NOMES_SEVERIDADE_5 : NOMES_3

  const salvar = async () => {
    if (!f.trilha_probabilidade) return toast.error('Selecione a trilha de probabilidade')
    const dados: Partial<AvaliacaoRiscoInput> = {
      ...f,
      ghe_id: gheId || undefined,
      funcao_id: funcaoId || undefined,
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
      toast.success('Risco salvo')
      setDialogAberto(false)
      recarregarAvaliacoes()
    } catch (error) {
      toast.error('Não foi possível salvar o risco', { description: getErrorMessage(error) })
    }
  }

  const excluir = async () => {
    if (!paraExcluir) return
    try {
      await deleteAvaliacaoRisco(paraExcluir.id)
      toast.success('Risco removido')
      setParaExcluir(null)
      recarregarAvaliacoes()
    } catch (error) {
      toast.error('Não foi possível remover', { description: getErrorMessage(error) })
    }
  }

  const sujo = dialogAberto && JSON.stringify(f) !== inicialRef.current
  const tentarFechar = () => {
    if (sujo) setDescartarDialog(true)
    else setDialogAberto(false)
  }

  if (carregando) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Cadastre os riscos baseados no Catálogo Mestre.
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={metodologia}
            onValueChange={(v) => {
              setMetodologia(v)
              if (v === 'ISO45002') setDimensao(5)
            }}
          >
            <SelectTrigger className="h-8 w-48 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METODOLOGIAS_MATRIZ.map((m) => (
                <SelectItem key={m.valor} value={m.valor}>
                  {m.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(dimensao)}
            onValueChange={(v) => setDimensao(Number(v) as Dimensao)}
          >
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 x 5</SelectItem>
              <SelectItem value="3" disabled={metodologia === 'ISO45002'}>
                3 x 3
              </SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" size="sm" onClick={() => abrir(null)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Adicionar Risco
          </Button>
        </div>
      </div>

      {avaliacoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-10 text-center">
          <ShieldAlert className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum risco cadastrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {avaliacoes.map((a) => {
            const p = a.probabilidade_final ?? a.probabilidade_sugerida
            const s = a.severidade_final ?? a.severidade_sugerida
            const celula = matriz && p != null && s != null ? resolverCelula(matriz, p, s) : null
            const celulaDados =
              matriz && p != null && s != null
                ? matriz.celulas.find((c) => c.p === p && c.s === s)
                : null
            const percentualInsalubridade = percentualDoRotulo(a.insalubridade_final)
            return (
              <Card key={a.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {contextoBadge}
                      </Badge>
                      <span className="font-medium">
                        {a.expand?.agente_id?.nome || 'Agente não informado'}
                      </span>
                      {a.frequencia_exposicao && (
                        <Badge variant="secondary" className="text-[10px]">
                          {a.frequencia_exposicao}
                        </Badge>
                      )}
                      {celula && p != null && s != null && (
                        <Badge style={{ backgroundColor: celula.cor, color: '#fff' }}>
                          {celulaDados?.pontuacao ?? p * s} - {celula.categoria} (P:{p} x S:{s})
                        </Badge>
                      )}
                      {a.trilha_probabilidade === 'Quantitativa (medição)' && (
                        <Badge variant="outline" className="text-[10px]">
                          Quantitativo
                        </Badge>
                      )}
                      {(a.trilha_probabilidade === 'Qualitativa (controle)' ||
                        a.trilha_probabilidade === 'Acidente/mecânico') && (
                        <Badge variant="outline" className="text-[10px]">
                          Qualitativo
                        </Badge>
                      )}
                      {a.insalubridade_final && a.insalubridade_final !== 'Não caracteriza' && (
                        <Badge variant="outline" className="text-[10px] text-amber-700">
                          Insalubridade: Sim
                          {percentualInsalubridade ? ` – ${percentualInsalubridade}` : ''}
                        </Badge>
                      )}
                      {a.periculosidade_final && (
                        <Badge variant="outline" className="text-[10px] text-red-700">
                          Periculosidade
                        </Badge>
                      )}
                    </div>
                    {(a.perigo_descricao || a.expand?.agente_id?.nome) && (
                      <p className="text-sm text-muted-foreground">{a.perigo_descricao}</p>
                    )}
                    {a.fonte_geradora && (
                      <p className="text-xs text-muted-foreground">Fonte: {a.fonte_geradora}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button variant="ghost" size="icon" onClick={() => abrir(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setParaExcluir(a)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog
        open={dialogAberto}
        onOpenChange={(o) => {
          if (!o) tentarFechar()
          else setDialogAberto(true)
        }}
      >
        <DialogContent
          className="max-h-[90vh] max-w-2xl overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{emEdicao ? 'Editar risco' : 'Adicionar risco'}</DialogTitle>
          </DialogHeader>
          <div>
            <SecaoRisco numero={1} titulo="Identificação e Vinculação" defaultOpen>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>{funcaoId ? 'Função / Cargo' : 'Grupo (GHE)'}</Label>
                  <Input className="mt-1.5" value={nomeContexto || ''} disabled />
                </div>
                <div>
                  <Label>Risco (Catálogo)</Label>
                  <Select value={f.agente_id || '__nenhum'} onValueChange={escolherAgente}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione o risco..." />
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Tipo de Exposição</Label>
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
            </SecaoRisco>

            <SecaoRisco numero={2} titulo="Caracterização do Risco" defaultOpen>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Puxe os textos do catálogo e ajuste ao caso: tudo continua editável.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="bg-green-700 text-white hover:bg-green-800"
                  onClick={puxarDoCatalogo}
                >
                  <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                  Puxar do Catálogo
                </Button>
              </div>
              <div>
                <Label>Descrição do Agente Nocivo</Label>
                <Textarea
                  className="mt-1.5"
                  value={f.perigo_descricao || ''}
                  onChange={(e) => setF((v) => ({ ...v, perigo_descricao: e.target.value }))}
                />
              </div>
              <div>
                <Label>Perigos / Fontes Geradoras</Label>
                <Textarea
                  className="mt-1.5"
                  value={f.fonte_geradora || ''}
                  onChange={(e) => setF((v) => ({ ...v, fonte_geradora: e.target.value }))}
                />
              </div>
              <div>
                <Label>Possíveis Danos à Saúde</Label>
                <Textarea
                  className="mt-1.5"
                  value={f.danos_possiveis || ''}
                  onChange={(e) => setF((v) => ({ ...v, danos_possiveis: e.target.value }))}
                />
              </div>
            </SecaoRisco>

            <SecaoRisco numero={3} titulo="Avaliação de Risco" defaultOpen>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Probabilidade (1 a {dimensao})</Label>
                  <Select
                    value={pAtual != null ? String(pAtual) : ''}
                    onValueChange={(v) => setF((s) => ({ ...s, probabilidade_final: Number(v) }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {nomesP.map((nome, i) => (
                        <SelectItem key={nome} value={String(i + 1)}>
                          {i + 1} - {nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Severidade (1 a {dimensao})</Label>
                  <Select
                    value={sAtual != null ? String(sAtual) : ''}
                    onValueChange={(v) => setF((s) => ({ ...s, severidade_final: Number(v) }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {nomesS.map((nome, i) => (
                        <SelectItem key={nome} value={String(i + 1)}>
                          {i + 1} - {nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/40 p-4">
                <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  Grau de Risco (Cálculo Automático)
                </div>
                {celulaAtual && pAtual != null && sAtual != null ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="inline-flex items-center rounded-full px-5 py-2 text-lg font-bold text-white"
                      style={{ backgroundColor: celulaAtual.cor }}
                    >
                      {pontuacaoAtual} - {celulaAtual.categoria}
                    </span>
                    {celulaAtual.prazo_dias != null && (
                      <span className="text-xs text-muted-foreground">
                        prazo sugerido para ação: {celulaAtual.prazo_dias} dias
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Escolha a probabilidade e a severidade para calcular o grau de risco.
                  </p>
                )}
                {sugestao.p != null && sugestao.s != null && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Sugestão do sistema pelos dados da seção 4: probabilidade {sugestao.p} e
                    severidade {sugestao.s}.
                    {(pAtual !== sugestao.p || sAtual !== sugestao.s) && (
                      <>
                        {' '}
                        <button
                          type="button"
                          className="underline"
                          onClick={() =>
                            setF((v) => ({
                              ...v,
                              probabilidade_final: sugestao.p ?? undefined,
                              severidade_final: sugestao.s ?? undefined,
                            }))
                          }
                        >
                          Usar a sugestão
                        </button>
                      </>
                    )}
                  </p>
                )}
                {avisosComplementares({
                  incerteza: f.incerteza,
                  categoria_aiha_exposicao: f.categoria_aiha_exposicao,
                  trilha_probabilidade: f.trilha_probabilidade || 'Qualitativa (controle)',
                  nr_especifica_aplicavel: f.nr_especifica_aplicavel,
                  nr_especifica_atendida: f.nr_especifica_atendida,
                  risco_evidente: f.risco_evidente,
                }).map((aviso) => (
                  <div key={aviso} className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {aviso}
                  </div>
                ))}
              </div>
              {sugestao.p != null &&
              sugestao.s != null &&
              (pAtual !== sugestao.p || sAtual !== sugestao.s) ? (
                <div>
                  <Label className="text-xs">Justificativa do ajuste (diferente da sugestão)</Label>
                  <Textarea
                    className="mt-1"
                    value={f.justificativa_ajuste || ''}
                    onChange={(e) => setF((v) => ({ ...v, justificativa_ajuste: e.target.value }))}
                  />
                </div>
              ) : null}
            </SecaoRisco>

            <SecaoRisco numero={4} titulo="Complementação">
              <p className="text-xs text-muted-foreground">
                Dados de apoio que ajudam o sistema a sugerir probabilidade e severidade: como o
                risco foi levantado, requisito de NR, controles existentes e efeito à saúde.
              </p>
              <div className="rounded-lg border p-3">
                <Label className="mb-2 block text-sm font-semibold">
                  Levantamento preliminar (manual do MTE, item 9)
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={!!f.risco_evidente}
                      onCheckedChange={(c) => setF((v) => ({ ...v, risco_evidente: !!c }))}
                    />
                    Risco evidente
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={!!f.perigo_externo}
                      onCheckedChange={(c) => setF((v) => ({ ...v, perigo_externo: !!c }))}
                    />
                    Perigo externo
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={!!f.atividade_nao_rotineira}
                      onCheckedChange={(c) => setF((v) => ({ ...v, atividade_nao_rotineira: !!c }))}
                    />
                    Atividade não rotineira
                  </label>
                </div>
                {f.risco_evidente && (
                  <div className="mt-3">
                    <div className="mb-2 flex items-start gap-1.5 text-xs text-amber-700">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Risco evidente exige ação imediata, antes da conclusão da avaliação formal
                      pela matriz (não espera a categoria de P × S).
                    </div>
                    <Label className="text-xs">Ação imediata adotada</Label>
                    <Textarea
                      className="mt-1"
                      value={f.risco_evidente_acao_imediata || ''}
                      onChange={(e) =>
                        setF((v) => ({ ...v, risco_evidente_acao_imediata: e.target.value }))
                      }
                    />
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-3">
                <Label className="mb-2 block text-sm font-semibold">
                  Requisito específico de NR (manual do MTE, item 11.4)
                </Label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={!!f.nr_especifica_aplicavel}
                    onCheckedChange={(c) => setF((v) => ({ ...v, nr_especifica_aplicavel: !!c }))}
                  />
                  Há um requisito específico de NR aplicável a este perigo
                </label>
                {f.nr_especifica_aplicavel && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <Label className="text-xs">Referência (ex.: NR-17, item 17.3.5)</Label>
                      <Input
                        className="mt-1"
                        value={f.nr_especifica_referencia || ''}
                        onChange={(e) =>
                          setF((v) => ({ ...v, nr_especifica_referencia: e.target.value }))
                        }
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={!!f.nr_especifica_atendida}
                        onCheckedChange={(c) =>
                          setF((v) => ({ ...v, nr_especifica_atendida: !!c }))
                        }
                      />
                      O requisito está atendido
                    </label>
                    {!f.nr_especifica_atendida && (
                      <div className="flex items-start gap-1.5 text-xs text-amber-700">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        Requisito não atendido: a probabilidade é elevada ao teto da matriz,
                        independente da trilha escolhida (exemplo dos assentos da NR-17 no manual).
                      </div>
                    )}
                    <div>
                      <Label className="text-xs">Justificativa</Label>
                      <Textarea
                        className="mt-1"
                        value={f.nr_especifica_justificativa || ''}
                        onChange={(e) =>
                          setF((v) => ({ ...v, nr_especifica_justificativa: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                )}
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
                      <SelectItem key={t} value={t} disabled={TRILHAS_DESLIGADAS.includes(t)}>
                        {t}
                        {TRILHAS_DESLIGADAS.includes(t) ? ' (em breve)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {TRILHAS_DESLIGADAS.includes(f.trilha_probabilidade as TrilhaProbabilidade) && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    A análise psicossocial ainda não é feita pelo Labora Vistorias — o campo já
                    existe para reservar o lugar dela no inventário, e será habilitado em uma versão
                    futura.
                  </p>
                )}

                {f.trilha_probabilidade === 'Quantitativa (medição)' && (
                  <div className="mt-3 space-y-3">
                    <div>
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
                    </div>

                    {!emEdicao ? (
                      <p className="text-xs text-muted-foreground">
                        Salve o risco para poder lançar medições de campo.
                      </p>
                    ) : (
                      <div className="rounded-lg border p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <Label className="text-sm font-semibold">
                            Medições ({medicoes.length})
                          </Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => abrirMedicao(null)}
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            Lançar medição
                          </Button>
                        </div>
                        {medicoes.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Nenhuma medição lançada ainda.
                          </p>
                        ) : (
                          <div className="divide-y text-sm">
                            {medicoes.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center justify-between gap-2 py-1.5"
                              >
                                <div className="min-w-0">
                                  <span className="tabular-nums">
                                    {formatBrazilianDate(m.data)}
                                  </span>
                                  {' · '}
                                  {m.resultado_valor != null
                                    ? `${m.resultado_valor} ${m.resultado_unidade || ''}`
                                    : 'sem resultado'}
                                  {m.metodologia && ` · ${m.metodologia}`}
                                </div>
                                <div className="flex shrink-0 gap-0.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => abrirMedicao(m)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setMedicaoExcluir(m)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {!f.agente_id && medicoes.length > 0 && (
                          <p className="mt-2 text-xs text-amber-700">
                            Selecione o agente do catálogo para comparar as medições com o limite de
                            tolerância.
                          </p>
                        )}
                        {estatisticaMedicoes && (
                          <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs">
                            <div>
                              n = {estatisticaMedicoes.estatistica.n}
                              {estatisticaMedicoes.estatistica.suficiente
                                ? ` · UCL95 do P95 = ${estatisticaMedicoes.estatistica.limiteSuperior95.toFixed(2)}`
                                : ' · menos de 6 amostras: usando o maior valor medido, incerteza alta'}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span>
                                Categoria calculada:{' '}
                                <strong>
                                  {CATEGORIA_AIHA_LABEL[estatisticaMedicoes.categoria]}
                                </strong>
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() =>
                                  setF((v) => ({
                                    ...v,
                                    categoria_aiha_exposicao: estatisticaMedicoes.categoria,
                                    incerteza: estatisticaMedicoes.estatistica.suficiente
                                      ? v.incerteza
                                      : '2',
                                  }))
                                }
                              >
                                Usar esta categoria
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {f.trilha_probabilidade === 'Sem dados suficientes' && (
                  <div className="mt-3 flex items-start gap-1.5 text-xs text-amber-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Sem base para avaliar ainda (nem medição, nem julgamento sobre um controle
                    existente). A probabilidade fica no teto da matriz até essa trilha ser trocada
                    por uma das outras, com dado de apoio.
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
                        onChange={(e) =>
                          setF((v) => ({ ...v, controle_descricao: e.target.value }))
                        }
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
                        onChange={(e) =>
                          setF((v) => ({ ...v, observacoes_aep_aet: e.target.value }))
                        }
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
              </div>
            </SecaoRisco>

            <SecaoRisco numero={5} titulo="Enquadramentos Legais">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label>Gera Insalubridade?</Label>
                  <Select
                    value={
                      f.insalubridade_final && f.insalubridade_final !== 'Não caracteriza'
                        ? 'sim'
                        : 'nao'
                    }
                    onValueChange={(v) =>
                      setF((s) => ({
                        ...s,
                        insalubridade_final: v === 'sim' ? 'Mínimo (10%)' : 'Não caracteriza',
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="sim">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Gera Periculosidade?</Label>
                  <Select
                    value={f.periculosidade_final ? 'sim' : 'nao'}
                    onValueChange={(v) =>
                      setF((s) => ({ ...s, periculosidade_final: v === 'sim' }))
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="sim">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Aposentadoria Especial</Label>
                  <Select
                    value={f.ltcat_enquadra_final?.startsWith('Sim') ? 'sim' : 'nao'}
                    onValueChange={(v) =>
                      setF((s) => ({
                        ...s,
                        ltcat_enquadra_final: v === 'sim' ? 'Sim - 25 anos' : 'Não',
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="sim">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(f.insalubridade_final && f.insalubridade_final !== 'Não caracteriza') ||
              f.ltcat_enquadra_final?.startsWith('Sim') ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {f.insalubridade_final && f.insalubridade_final !== 'Não caracteriza' && (
                    <div>
                      <Label className="text-xs">Grau de insalubridade (NR-15)</Label>
                      <Select
                        value={f.insalubridade_final}
                        onValueChange={(v) => setF((s) => ({ ...s, insalubridade_final: v }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INSALUBRIDADE_OPCOES.filter((o) => o !== 'Não caracteriza').map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {f.ltcat_enquadra_final?.startsWith('Sim') && (
                    <div>
                      <Label className="text-xs">Tempo para aposentadoria especial</Label>
                      <Select
                        value={f.ltcat_enquadra_final}
                        onValueChange={(v) => setF((s) => ({ ...s, ltcat_enquadra_final: v }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LTCAT_OPCOES.filter((o) => o !== 'Não').map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ) : null}
              <p className="text-xs text-muted-foreground">
                São sugestões do técnico: as conclusões entram nos laudos (insalubridade,
                periculosidade) e no LTCAT. Ao puxar do catálogo, o sistema já sugere o
                enquadramento do agente.
              </p>
            </SecaoRisco>

            <SecaoRisco numero={6} titulo="Proteções (EPC / EPI)">
              <div className="rounded-lg border p-3">
                <Label className="mb-2 block text-sm font-semibold">
                  Medidas de controle e EPI
                </Label>
                <Textarea
                  className="mb-2"
                  placeholder="EPCs existentes (proteção coletiva)"
                  value={f.epc_lista || ''}
                  onChange={(e) => setF((v) => ({ ...v, epc_lista: e.target.value }))}
                />
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
                <div className="mt-2">
                  <EpiRiscoSeletor
                    empresaId={empresaId}
                    value={f.epis_utilizados || ''}
                    onChange={(texto) => setF((v) => ({ ...v, epis_utilizados: texto }))}
                  />
                </div>{' '}
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
            </SecaoRisco>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={tentarFechar}>
              Cancelar
            </Button>
            <Button onClick={salvar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={descartarDialog} onOpenChange={setDescartarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              As alterações feitas no formulário não foram salvas e serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDescartarDialog(false)
                setDialogAberto(false)
              }}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!paraExcluir} onOpenChange={(o) => !o && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover risco</AlertDialogTitle>
            <AlertDialogDescription>
              O risco será marcado como inativo e sai da lista. O histórico é mantido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluir}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo: medição */}
      <Dialog open={medicaoDialog} onOpenChange={setMedicaoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{medicaoEdit ? 'Editar medição' : 'Nova medição'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data</Label>
                <Input
                  className="mt-1.5"
                  type="date"
                  value={fMedicao.data ? fMedicao.data.slice(0, 10) : ''}
                  onChange={(e) => setFMedicao((v) => ({ ...v, data: e.target.value }))}
                />
              </div>
              <div>
                <Label>Metodologia</Label>
                <Select
                  value={fMedicao.metodologia || '__vazio'}
                  onValueChange={(v) =>
                    setFMedicao((s) => ({
                      ...s,
                      metodologia: v === '__vazio' ? undefined : (v as Medicao['metodologia']),
                    }))
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__vazio">—</SelectItem>
                    {METODOLOGIAS_MEDICAO.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Trabalhador ou ponto</Label>
                <Input
                  className="mt-1.5"
                  value={fMedicao.trabalhador_ou_ponto || ''}
                  onChange={(e) =>
                    setFMedicao((v) => ({ ...v, trabalhador_ou_ponto: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Função avaliada</Label>
                <Input
                  className="mt-1.5"
                  value={fMedicao.funcao_avaliada || ''}
                  onChange={(e) => setFMedicao((v) => ({ ...v, funcao_avaliada: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Resultado</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  value={fMedicao.resultado_valor ?? ''}
                  onChange={(e) =>
                    setFMedicao((v) => ({
                      ...v,
                      resultado_valor: Number(e.target.value) || undefined,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Unidade</Label>
                <Input
                  className="mt-1.5"
                  placeholder="ppm, mg/m³, dB(A)..."
                  value={fMedicao.resultado_unidade || ''}
                  onChange={(e) =>
                    setFMedicao((v) => ({ ...v, resultado_unidade: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Equipamento</Label>
                <Input
                  className="mt-1.5"
                  value={fMedicao.equipamento || ''}
                  onChange={(e) => setFMedicao((v) => ({ ...v, equipamento: e.target.value }))}
                />
              </div>
              <div>
                <Label>Tempo de amostragem (min)</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  value={fMedicao.tempo_amostragem_min ?? ''}
                  onChange={(e) =>
                    setFMedicao((v) => ({
                      ...v,
                      tempo_amostragem_min: Number(e.target.value) || undefined,
                    }))
                  }
                />
              </div>
            </div>
            {fMedicao.metodologia === 'NHO 01 (ruído)' ||
            fMedicao.metodologia === 'NR-15 (critério trabalhista)' ? (
              <div className="grid grid-cols-3 gap-3 rounded-lg border p-3">
                <div>
                  <Label className="text-xs">Dose NR-15 (%)</Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    value={fMedicao.ruido_dose_nr15_pct ?? ''}
                    onChange={(e) =>
                      setFMedicao((v) => ({
                        ...v,
                        ruido_dose_nr15_pct: Number(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">NEN NR-15 (dB(A))</Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    value={fMedicao.ruido_nen_nr15_dba ?? ''}
                    onChange={(e) =>
                      setFMedicao((v) => ({
                        ...v,
                        ruido_nen_nr15_dba: Number(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">NEN NHO 01 (dB(A))</Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    value={fMedicao.ruido_nen_nho01_dba ?? ''}
                    onChange={(e) =>
                      setFMedicao((v) => ({
                        ...v,
                        ruido_nen_nho01_dba: Number(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
              </div>
            ) : null}
            <div>
              <Label>Observações</Label>
              <Textarea
                className="mt-1.5"
                value={fMedicao.observacoes || ''}
                onChange={(e) => setFMedicao((v) => ({ ...v, observacoes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMedicaoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarMedicao}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!medicaoExcluir} onOpenChange={(o) => !o && setMedicaoExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir medição</AlertDialogTitle>
            <AlertDialogDescription>
              Esta medição será removida definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluirMedicao}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default RiscosOcupacionaisPainel
