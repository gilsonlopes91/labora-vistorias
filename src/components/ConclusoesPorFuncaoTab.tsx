/* "Conclusões por função" — tela comum aos três laudos derivados do
 * inventário (insalubridade, periculosidade e LTCAT). Para cada função da
 * empresa, lista os agentes do inventário aplicáveis àquele laudo, aplica a
 * régua (src/lib/reguasLaudos.ts) e mostra a conclusão sugerida; o técnico
 * confirma ou muda com justificativa. Isso NUNCA conclui sozinho — grava a
 * sugestão em avaliacoes_risco (campo *_sugerida) e deixa o campo *_final +
 * justificativa em aberto até o técnico decidir. Ver NR-1, item 1.5.2: a
 * classificação do PGR não caracteriza estes laudos — a régua aqui é outra. */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getEmpresa, type Empresa } from '@/services/empresas'
import { getGhes, type Ghe } from '@/services/ghes'
import { getFuncoesSst, type FuncaoSst } from '@/services/funcoesSst'
import {
  getAvaliacoesRiscoPorGhes,
  updateAvaliacaoRisco,
  type AvaliacaoRisco,
} from '@/services/avaliacoesRisco'
import { getMedicoesPorAvaliacao, type Medicao } from '@/services/medicoes'
import { buscarResponsavelDoUsuario } from '@/services/responsaveisTecnicos'
import { useAuth } from '@/hooks/use-auth'
import {
  concluirInsalubridade,
  concluirPericulosidade,
  concluirLtcat,
  temNaoCumulacao,
  checklistArt276,
  AUSENCIA_AGENTE_NOCIVO,
  type ReguaConclusao,
  type ConclusaoLtcat,
} from '@/lib/reguasLaudos'
import type { TipoDocumentoSst } from '@/services/documentosSst'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const OPCOES_INSALUBRIDADE: ReguaConclusao[] = [
  'Não caracteriza',
  'Mínimo (10%)',
  'Médio (20%)',
  'Máximo (40%)',
]
const OPCOES_LTCAT: ConclusaoLtcat[] = ['Não', 'Sim - 15 anos', 'Sim - 20 anos', 'Sim - 25 anos']

interface LinhaConclusao {
  avaliacao: AvaliacaoRisco
  agenteNome: string
  temRegua: boolean
  sugestaoTexto: string
  dadoUsado: string
  regua: string
  avisos: string[]
}

interface GrupoFuncao {
  funcao: FuncaoSst
  linhas: LinhaConclusao[]
  naoCumulacao: boolean
}

export function ConclusoesPorFuncaoTab({
  empresaId,
  tipo,
  onChecklistChange,
}: {
  empresaId: string
  tipo: Extract<TipoDocumentoSst, 'insalubridade' | 'periculosidade' | 'ltcat'>
  /** Só usado para tipo='ltcat': avisa o componente pai se o checklist do
   *  art. 276 está completo, para travar a emissão enquanto não estiver. */
  onChecklistChange?: (completo: boolean) => void
}) {
  const { user } = useAuth()
  const [carregando, setCarregando] = useState(true)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [funcoes, setFuncoes] = useState<FuncaoSst[]>([])
  const [ghesMap, setGhesMap] = useState<Record<string, Ghe>>({})
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoRisco[]>([])
  const [medicoesPorAvaliacao, setMedicoesPorAvaliacao] = useState<Record<string, Medicao[]>>({})
  const [responsavelNome, setResponsavelNome] = useState('')
  const [salvandoId, setSalvandoId] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setCarregando(true)
    Promise.all([getEmpresa(empresaId), getGhes(empresaId), getFuncoesSst(empresaId)])
      .then(async ([emp, ghes, funcs]) => {
        if (cancelado) return
        setEmpresa(emp)
        setFuncoes(funcs)
        const mapGhes: Record<string, Ghe> = {}
        ghes.forEach((g) => (mapGhes[g.id] = g))
        setGhesMap(mapGhes)
        const avals = await getAvaliacoesRiscoPorGhes(ghes.map((g) => g.id))
        if (cancelado) return
        setAvaliacoes(avals)
        const relevantes = avals.filter((a) => !!a.agente_id)
        const medicoesLista = await Promise.all(
          relevantes.map((a) => getMedicoesPorAvaliacao(a.id).catch(() => [])),
        )
        if (cancelado) return
        const mm: Record<string, Medicao[]> = {}
        relevantes.forEach((a, i) => (mm[a.id] = medicoesLista[i]))
        setMedicoesPorAvaliacao(mm)
        if (user?.organizacao_id) {
          const rt = await buscarResponsavelDoUsuario(user.organizacao_id, user.id).catch(
            () => null,
          )
          if (!cancelado) setResponsavelNome(rt?.nome || '')
        }
      })
      .catch((error) =>
        toast.error('Não foi possível carregar os dados do inventário', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => !cancelado && setCarregando(false))
    return () => {
      cancelado = true
    }
  }, [empresaId, tipo, user?.id, user?.organizacao_id])

  const grupos: GrupoFuncao[] = useMemo(() => {
    return funcoes.map((funcao) => {
      const avaliacoesDoGhe = avaliacoes.filter((a) => a.ghe_id === funcao.ghe_id)
      const linhas: LinhaConclusao[] = []
      for (const a of avaliacoesDoGhe) {
        const agente = a.expand?.agente_id
        if (!agente) continue
        const medicoes = medicoesPorAvaliacao[a.id] || []
        if (tipo === 'insalubridade') {
          if (!agente.anexo_nr15) continue
          const r = concluirInsalubridade(a, agente, medicoes)
          linhas.push({
            avaliacao: a,
            agenteNome: agente.nome,
            temRegua: r.temRegua,
            sugestaoTexto: r.sugestao || '—',
            dadoUsado: r.dadoUsado,
            regua: r.regua,
            avisos: r.avisos,
          })
        } else if (tipo === 'periculosidade') {
          if (!agente.anexo_nr16) continue
          const r = concluirPericulosidade(a, agente)
          linhas.push({
            avaliacao: a,
            agenteNome: agente.nome,
            temRegua: r.temRegua,
            sugestaoTexto: r.sugestao === null ? '—' : r.sugestao ? 'Devido (30%)' : 'Não devido',
            dadoUsado: r.dadoUsado,
            regua: r.regua,
            avisos: r.avisos,
          })
        } else {
          const r = concluirLtcat(a, agente, medicoes)
          linhas.push({
            avaliacao: a,
            agenteNome: agente.nome,
            temRegua: r.temRegua,
            sugestaoTexto: r.sugestao || '—',
            dadoUsado: r.dadoUsado,
            regua: r.regua,
            avisos: r.avisos,
          })
        }
      }
      return {
        funcao,
        linhas,
        naoCumulacao: tipo !== 'ltcat' ? false : false,
      }
    })
  }, [funcoes, avaliacoes, medicoesPorAvaliacao, tipo])

  // Aviso de não-cumulação: precisa olhar insalubridade E periculosidade
  // juntas por função, então é calculado à parte (independente do tipo
  // exibido nesta tela).
  const naoCumulacaoPorFuncao = useMemo(() => {
    const mapa: Record<string, boolean> = {}
    funcoes.forEach((f) => {
      const avals = avaliacoes.filter((a) => a.ghe_id === f.ghe_id)
      mapa[f.id] = temNaoCumulacao(avals)
    })
    return mapa
  }, [funcoes, avaliacoes])

  const checklist = useMemo(() => {
    if (tipo !== 'ltcat') return null
    const avaliacoesPorFuncaoId: Record<string, AvaliacaoRisco[]> = {}
    funcoes.forEach((f) => {
      avaliacoesPorFuncaoId[f.id] = avaliacoes.filter((a) => a.ghe_id === f.ghe_id && a.agente_id)
    })
    return checklistArt276({
      empresaRazaoSocial: empresa?.razao_social,
      empresaCnpj: empresa?.cnpj,
      funcoes,
      avaliacoesPorFuncaoId,
      responsavelTecnicoNome: responsavelNome,
    })
  }, [tipo, empresa, funcoes, avaliacoes, responsavelNome])

  useEffect(() => {
    if (tipo === 'ltcat') onChecklistChange?.(checklist?.completo ?? false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, checklist?.completo])

  const salvarSugestoes = async () => {
    // Grava as sugestões calculadas em cada avaliação, para ficarem visíveis
    // no inventário e disponíveis quando o técnico voltar depois.
    const campoSugerido =
      tipo === 'insalubridade'
        ? 'insalubridade_sugerida'
        : tipo === 'periculosidade'
          ? 'periculosidade_sugerida'
          : 'ltcat_enquadra_sugerido'
    for (const grupo of grupos) {
      for (const linha of grupo.linhas) {
        if (!linha.temRegua) continue
        setSalvandoId(linha.avaliacao.id)
        try {
          if (tipo === 'periculosidade') {
            await updateAvaliacaoRisco(linha.avaliacao.id, {
              periculosidade_sugerida: linha.sugestaoTexto === 'Devido (30%)',
            })
          } else {
            await updateAvaliacaoRisco(linha.avaliacao.id, {
              [campoSugerido]: linha.sugestaoTexto === '—' ? undefined : linha.sugestaoTexto,
            } as Partial<AvaliacaoRisco>)
          }
        } catch {
          // segue tentando as outras linhas
        }
      }
    }
    setSalvandoId(null)
    toast.success('Sugestões calculadas e gravadas no inventário')
  }

  const atualizarFinal = async (
    avaliacao: AvaliacaoRisco,
    valorFinal: string,
    justificativa: string,
  ) => {
    setSalvandoId(avaliacao.id)
    try {
      const patch: Partial<AvaliacaoRisco> =
        tipo === 'insalubridade'
          ? {
              insalubridade_final: valorFinal as ReguaConclusao,
              insalubridade_justificativa: justificativa,
            }
          : tipo === 'periculosidade'
            ? {
                periculosidade_final: valorFinal === 'Devido (30%)',
                periculosidade_justificativa: justificativa,
              }
            : {
                ltcat_enquadra_final: valorFinal as ConclusaoLtcat,
                ltcat_justificativa: justificativa,
              }
      const atualizado = await updateAvaliacaoRisco(avaliacao.id, patch)
      setAvaliacoes((v) => v.map((a) => (a.id === atualizado.id ? { ...a, ...atualizado } : a)))
      toast.success('Conclusão salva')
    } catch (error) {
      toast.error('Não foi possível salvar a conclusão', { description: getErrorMessage(error) })
    } finally {
      setSalvandoId(null)
    }
  }

  if (carregando) {
    return <p className="text-sm text-muted-foreground">Carregando inventário...</p>
  }

  if (funcoes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Cadastre as funções da empresa na aba Estrutura SST para ver as conclusões por função.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Sugestão calculada a partir do inventário e das medições. A classificação do PGR não
          fundamenta este laudo — o dado técnico sim (NR-1, item 1.5.2). Confirme ou mude cada
          conclusão com justificativa.
        </p>
        <Button variant="outline" size="sm" onClick={salvarSugestoes} disabled={!!salvandoId}>
          {salvandoId ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
          Recalcular sugestões
        </Button>
      </div>

      {tipo === 'ltcat' && checklist && (
        <Card className={checklist.completo ? 'border-emerald-300' : 'border-orange-300'}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              {checklist.completo ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              )}
              Checklist do art. 276 da IN PRES/INSS 128/2022
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {checklist.itens.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                {item.ok ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                )}
                <span className={item.ok ? '' : 'text-destructive'}>{item.label}</span>
              </div>
            ))}
            {!checklist.completo && (
              <p className="mt-2 text-xs font-medium text-destructive">
                Complete os itens pendentes antes de emitir o LTCAT — a aba Documentos não deve ser
                usada para emitir enquanto houver pendência aqui.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {grupos.map((grupo) => (
        <Card key={grupo.funcao.id}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              {grupo.funcao.nome}
              <span className="text-xs font-normal text-muted-foreground">
                {ghesMap[grupo.funcao.ghe_id]?.nome}
              </span>
              {naoCumulacaoPorFuncao[grupo.funcao.id] && (
                <Badge variant="destructive" className="ml-2 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Insalubridade e periculosidade concluídas: sem cumulação, a escolha é do empregado
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tipo === 'ltcat' && grupo.linhas.length === 0 && (
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Nenhum agente do Anexo IV identificado — conclusão:{' '}
                <strong>{AUSENCIA_AGENTE_NOCIVO.descricao}</strong> (código{' '}
                {AUSENCIA_AGENTE_NOCIVO.codigo}).
              </div>
            )}
            {grupo.linhas.length === 0 && tipo !== 'ltcat' && (
              <p className="text-sm text-muted-foreground">
                Nenhum agente aplicável a este laudo no inventário desta função.
              </p>
            )}
            {grupo.linhas.map((linha) => {
              const valorFinal =
                tipo === 'insalubridade'
                  ? linha.avaliacao.insalubridade_final || ''
                  : tipo === 'periculosidade'
                    ? linha.avaliacao.periculosidade_final === undefined
                      ? ''
                      : linha.avaliacao.periculosidade_final
                        ? 'Devido (30%)'
                        : 'Não devido'
                    : linha.avaliacao.ltcat_enquadra_final || ''
              const justificativa =
                tipo === 'insalubridade'
                  ? linha.avaliacao.insalubridade_justificativa || ''
                  : tipo === 'periculosidade'
                    ? linha.avaliacao.periculosidade_justificativa || ''
                    : linha.avaliacao.ltcat_justificativa || ''
              const opcoes =
                tipo === 'insalubridade'
                  ? OPCOES_INSALUBRIDADE
                  : tipo === 'periculosidade'
                    ? ['Devido (30%)', 'Não devido']
                    : OPCOES_LTCAT
              return (
                <div key={linha.avaliacao.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{linha.agenteNome}</p>
                      <p className="text-xs text-muted-foreground">{linha.regua}</p>
                      {linha.dadoUsado && (
                        <p className="text-xs text-muted-foreground">
                          Dado usado: {linha.dadoUsado}
                        </p>
                      )}
                    </div>
                    {linha.temRegua ? (
                      <Badge variant="secondary">Sugestão: {linha.sugestaoTexto}</Badge>
                    ) : (
                      <Badge variant="outline">Sem régua automática</Badge>
                    )}
                  </div>
                  {linha.avisos.map((a, i) => (
                    <p key={i} className="mt-1 text-xs text-orange-600">
                      {a}
                    </p>
                  ))}
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[220px_minmax(0,1fr)]">
                    <div>
                      <Select
                        value={valorFinal || undefined}
                        onValueChange={(v) => atualizarFinal(linha.avaliacao, v, justificativa)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Conclusão final" />
                        </SelectTrigger>
                        <SelectContent>
                          {opcoes.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder="Justificativa (obrigatória quando a conclusão final diverge da sugestão)"
                      defaultValue={justificativa}
                      onBlur={(e) => {
                        if (e.target.value !== justificativa) {
                          atualizarFinal(linha.avaliacao, valorFinal, e.target.value)
                        }
                      }}
                      rows={2}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default ConclusoesPorFuncaoTab
