/* Editor de documentos por seções: lista as versões de cada tipo de
 * documento (PGR, LTCAT, Laudo de Insalubridade, Laudo de Periculosidade)
 * de uma empresa e permite editar um rascunho seção a seção antes de
 * emitir. Um novo documento já nasce com o conteúdo básico (fundamentação
 * legal e metodologia) preenchido — só as partes que dependem dos dados da
 * empresa ficam com um texto-guia entre colchetes. O rascunho é salvo
 * automaticamente enquanto a pessoa edita, sem precisar clicar em nada; o
 * botão "Salvar rascunho" continua existindo para quem quiser confirmar na
 * hora. A emissão em PDF (gerarPdfPgr.ts) trava a versão — documento
 * emitido não pode mais ser editado, só uma nova revisão.
 *
 * Ponto 1 (risco direto no cargo, GHE opcional): o inventário e as
 * conclusões por função usam o "risco efetivo" de cada função — diretos do
 * cargo ∪ herdados do GHE, quando houver. Ver src/lib/riscoFuncao.ts. */
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  FileText,
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Check,
  Loader2,
  ClipboardList,
} from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { carregarIdentidade } from '@/lib/identidadeVisual'
import { resolverCelula } from '@/lib/matrizRisco'
import {
  gerarPdfPgr,
  nomeArquivoDocumentoSst,
  hashSha256,
  type GrupoPlanoAcaoPgr,
} from '@/lib/gerarPdfPgr'
import { getEmpresa, urlLogoEmpresa } from '@/services/empresas'
import { getGhes } from '@/services/ghes'
import { getFuncoesSst } from '@/services/funcoesSst'
import { getAvaliacoesRiscoDaEmpresa } from '@/services/avaliacoesRisco'
import { avaliacoesDaFuncao } from '@/lib/riscoFuncao'
import { getAcoesPlano, getAcoesDosPlanos, type AcaoPlano } from '@/services/acoesPlano'
import { getPlanosAcao, type PlanoAcao } from '@/services/planosAcao'
import { getMatrizOficial } from '@/services/matrizesRisco'
import { buscarResponsavelDoUsuario, formatarRegistroRT } from '@/services/responsaveisTecnicos'
import {
  getDocumentosSst,
  createDocumentoSst,
  updateDocumentoSst,
  revisarDocumentoSst,
  emitirDocumentoSst,
  getTokenArquivos,
  pdfUrlDocumentoSst,
  secoesPadrao,
  TIPO_DOCUMENTO_LABEL,
  TIPO_DOCUMENTO_TITULO_PADRAO,
  type DocumentoSst,
  type SecaoDocumento,
  type TipoDocumentoSst,
} from '@/services/documentosSst'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from '@/components/RichTextEditor'
import { ConclusoesPorFuncaoTab } from '@/components/ConclusoesPorFuncaoTab'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const STATUS_LABEL: Record<DocumentoSst['status'], string> = {
  rascunho: 'Rascunho',
  em_revisao: 'Em revisão',
  emitido: 'Emitido',
  substituido: 'Substituído',
}

const STATUS_VARIANTE: Record<DocumentoSst['status'], 'secondary' | 'default' | 'outline'> = {
  rascunho: 'secondary',
  em_revisao: 'secondary',
  emitido: 'default',
  substituido: 'outline',
}

const TIPOS: TipoDocumentoSst[] = ['pgr', 'ltcat', 'insalubridade', 'periculosidade']

/** Tempo de inatividade antes de salvar automaticamente o rascunho. */
const AUTOSAVE_DEBOUNCE_MS = 1500

export function DocumentosSstTab({ empresaId }: { empresaId: string }) {
  const { user } = useAuth()
  // A organização do documento é sempre a da empresa, não a do usuário
  // logado: admin_plataforma e staff (via staff_ids) não têm organizacao_id
  // próprio, e usar o do usuário fazia o create() falhar com 400 (campo
  // obrigatório vazio) toda vez que um deles criava um PGR/LTCAT.
  const [organizacaoId, setOrganizacaoId] = useState('')

  const [tipo, setTipo] = useState<TipoDocumentoSst>('pgr')
  const [documentos, setDocumentos] = useState<DocumentoSst[]>([])
  const [carregando, setCarregando] = useState(true)
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [f, setF] = useState<Partial<DocumentoSst>>({})
  const [salvando, setSalvando] = useState(false)
  const [autosalvando, setAutosalvando] = useState(false)
  const [ultimoAutosalvamento, setUltimoAutosalvamento] = useState<Date | null>(null)
  const [dialogRevisao, setDialogRevisao] = useState(false)
  const [motivoRevisao, setMotivoRevisao] = useState('')
  const [emitindo, setEmitindo] = useState(false)
  const [urlPdf, setUrlPdf] = useState<string | null>(null)
  // Assinatura eletrônica: confirma a identidade por senha antes de emitir.
  const [dialogSenhaAberto, setDialogSenhaAberto] = useState(false)
  const [senha, setSenha] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  // Sub-view dentro de um tipo de laudo: "Conclusões por função" (motor de
  // insalubridade/periculosidade/LTCAT) e "Documento" (editor + emissão).
  // O PGR não tem "Conclusões por função" — a classificação dele é outra
  // (NR-1, item 1.5.2).
  const [subVista, setSubVista] = useState<'conclusoes' | 'documento'>('documento')
  // LTCAT: o checklist do art. 276 da IN 128/2022 trava a emissão enquanto
  // não estiver completo (ConclusoesPorFuncaoTab calcula e avisa aqui).
  const [checklistLtcatCompleto, setChecklistLtcatCompleto] = useState(true)
  // Planos de ação da empresa, para o técnico escolher quais entram neste
  // documento (vazio = entram todos, comportamento anterior).
  const [planosDisponiveis, setPlanosDisponiveis] = useState<PlanoAcao[]>([])

  useEffect(() => {
    getPlanosAcao(empresaId)
      .then(setPlanosDisponiveis)
      .catch(() => setPlanosDisponiveis([]))
  }, [empresaId])

  useEffect(() => {
    let cancelado = false
    getEmpresa(empresaId)
      .then((empresa) => {
        if (!cancelado) setOrganizacaoId(empresa.organizacao_id || '')
      })
      .catch(() => {
        // Sem permissão de ler a empresa (raro): cai para a organização do
        // usuário, que ao menos funciona para dono/gerente/gestor.
        if (!cancelado) setOrganizacaoId((user?.organizacao_id as string) || '')
      })
    return () => {
      cancelado = true
    }
  }, [empresaId, user?.organizacao_id])

  const carregar = () => {
    setCarregando(true)
    setSelecionadoId(null)
    getDocumentosSst(empresaId, tipo)
      .then((lista) => {
        setDocumentos(lista)
        if (lista.length > 0) setSelecionadoId(lista[0].id)
      })
      .catch((error) =>
        toast.error('Não foi possível carregar os documentos', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [empresaId, tipo])

  useEffect(() => {
    setSubVista(tipo === 'pgr' ? 'documento' : 'conclusoes')
  }, [tipo])

  useEffect(() => {
    const doc = documentos.find((d) => d.id === selecionadoId)
    setF(doc || {})
  }, [selecionadoId, documentos])

  const selecionado = documentos.find((d) => d.id === selecionadoId)
  const travado = selecionado?.status === 'emitido' || selecionado?.status === 'substituido'

  // Autosave: salva sozinho pouco tempo depois da última alteração, sem
  // exigir clique no botão "Salvar rascunho". Só roda em documentos que
  // ainda podem ser editados, e não roda na carga inicial de cada seleção.
  const carregadoRef = useRef<string | null>(null)
  useEffect(() => {
    carregadoRef.current = selecionado ? selecionado.id : null
  }, [selecionado?.id])

  useEffect(() => {
    if (!selecionado || travado) return
    if (carregadoRef.current !== selecionado.id) return
    const t = setTimeout(async () => {
      setAutosalvando(true)
      try {
        const atualizado = await updateDocumentoSst(selecionado.id, {
          titulo: f.titulo,
          elaboradores: f.elaboradores,
          secoes: f.secoes,
          planos_acao_ids: f.planos_acao_ids,
        })
        setDocumentos((v) => v.map((d) => (d.id === atualizado.id ? atualizado : d)))
        setUltimoAutosalvamento(new Date())
      } catch (error) {
        toast.error('Não foi possível salvar automaticamente', {
          description: getErrorMessage(error),
        })
      } finally {
        setAutosalvando(false)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, AUTOSAVE_DEBOUNCE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.titulo, f.elaboradores, f.secoes, f.planos_acao_ids])

  useEffect(() => {
    setUrlPdf(null)
    if (selecionado?.pdf) {
      getTokenArquivos()
        .then((token) => setUrlPdf(pdfUrlDocumentoSst(selecionado, token)))
        .catch(() => setUrlPdf(pdfUrlDocumentoSst(selecionado)))
    }
  }, [selecionado?.id, selecionado?.pdf])

  // Abre o diálogo de senha; a emissão em si só roda depois de confirmada.
  const abrirDialogEmissao = () => {
    if (selecionado?.tipo === 'ltcat' && !checklistLtcatCompleto) {
      toast.error('Complete o checklist do art. 276 (aba Conclusões por função) antes de emitir')
      return
    }
    setSenha('')
    setErroSenha('')
    setDialogSenhaAberto(true)
  }

  const confirmarSenhaEEmitir = async () => {
    if (!senha.trim()) {
      setErroSenha('Informe sua senha')
      return
    }
    setEmitindo(true)
    setErroSenha('')
    try {
      // Reautentica o próprio usuário: confirma que é ele mesmo, sem trocar de conta.
      await pb.collection('users').authWithPassword(user?.email || '', senha)
    } catch (error) {
      setEmitindo(false)
      setErroSenha('Senha incorreta')
      return
    }
    setDialogSenhaAberto(false)
    await emitirPdf()
  }

  const emitirPdf = async () => {
    if (!selecionado) return
    if (selecionado.tipo === 'ltcat' && !checklistLtcatCompleto) {
      toast.error('Complete o checklist do art. 276 (aba Conclusões por função) antes de emitir')
      return
    }
    setEmitindo(true)
    try {
      const confirmadaEm = new Date()
      const chaveVerificacao = crypto.randomUUID()
      const rtEmissor = await buscarResponsavelDoUsuario(organizacaoId, user?.id || '').catch(
        () => null,
      )
      const empresa = await getEmpresa(empresaId)
      const nomeEmpresa = empresa.nome_fantasia || empresa.razao_social
      const ghes = await getGhes(empresaId)
      const funcoes = await getFuncoesSst(empresaId)
      const avaliacoes = await getAvaliacoesRiscoDaEmpresa(
        ghes.map((g) => g.id),
        funcoes.map((fn) => fn.id),
      )
      // Planos de ação: se o documento tem planos_acao_ids selecionados,
      // só essas ações entram no PDF; vazio = entram todas as ações da
      // empresa (planos + ações avulsas sem plano).
      const planosSelecionadosIds =
        f.planos_acao_ids && f.planos_acao_ids.length > 0 ? f.planos_acao_ids : null
      const [acoes, planosAcaoTodos] = await Promise.all([
        planosSelecionadosIds
          ? getAcoesDosPlanos(empresaId, planosSelecionadosIds)
          : getAcoesPlano(empresaId),
        getPlanosAcao(empresaId),
      ])
      const dimensao = (Number(empresa.pgr_matriz_padrao_dimensao) || 5) as 3 | 5
      const metodologia = empresa.pgr_matriz_padrao_metodologia || 'AIHA'
      const matriz = await getMatrizOficial(dimensao, metodologia)
      const identidade = await carregarIdentidade()

      const funcoesMap: Record<string, string> = {}
      funcoes.forEach((fn) => (funcoesMap[fn.id] = fn.nome))

      const inventario = avaliacoes.map((a) => {
        const s = a.severidade_final ?? a.severidade_sugerida
        const p = a.probabilidade_final ?? a.probabilidade_sugerida
        const celula = matriz && s != null && p != null ? resolverCelula(matriz, p, s) : null
        return {
          unidade:
            a.expand?.ghe_id?.nome || (a.funcao_id ? funcoesMap[a.funcao_id] : undefined) || '—',
          agente: a.expand?.agente_id?.nome || a.perigo_descricao || '—',
          trilha: a.trilha_probabilidade,
          severidade: s ?? '—',
          probabilidade: p ?? '—',
          categoria: celula?.categoria || '—',
        }
      })
      // Cada ação vira uma linha 5W2H — o quê (medida), quem (responsavel),
      // quando (prazo) e status/prioridade em colunas próprias; por quê,
      // onde, como e quanto custa entram compactados numa coluna "Detalhes"
      // (ver src/lib/gerarPdfPgr.ts).
      const linhaDaAcao = (a: AcaoPlano) => {
        const detalhes = [
          a.justificativa ? `Por quê: ${a.justificativa}` : null,
          a.local ? `Onde: ${a.local}` : null,
          a.como ? `Como: ${a.como}` : null,
          a.custo_estimado != null
            ? `Custo estimado: R$ ${a.custo_estimado.toLocaleString('pt-BR')}`
            : null,
        ]
          .filter(Boolean)
          .join('\n')
        return {
          medida: a.medida,
          detalhes,
          responsavel: a.responsavel || '—',
          prazo: a.prazo ? new Date(a.prazo).toLocaleDateString('pt-BR') : '—',
          status: a.status,
          prioridade: a.prioridade || '—',
        }
      }
      const planosParaExibir = planosSelecionadosIds
        ? planosAcaoTodos.filter((p) => planosSelecionadosIds.includes(p.id))
        : planosAcaoTodos
      const planoAcao: GrupoPlanoAcaoPgr[] = []
      for (const plano of planosParaExibir) {
        const itens = acoes.filter((a) => a.plano_id === plano.id).map(linhaDaAcao)
        planoAcao.push({ nome: plano.nome, descricao: plano.descricao, itens })
      }
      const acoesSemPlano = acoes.filter((a) => !a.plano_id)
      if (acoesSemPlano.length > 0) {
        planoAcao.push({
          nome: 'Ações gerais (sem plano)',
          itens: acoesSemPlano.map(linhaDaAcao),
        })
      }

      // Laudos derivados (insalubridade/periculosidade/LTCAT): a conclusão
      // por função, já confirmada ou ajustada na aba "Conclusões por
      // função" — nunca a classificação do PGR (NR-1, item 1.5.2). O
      // "risco efetivo" da função é diretos do cargo ∪ herdados do GHE
      // (src/lib/riscoFuncao.ts).
      let conclusoesFuncao: import('@/lib/gerarPdfPgr').LinhaConclusaoLaudo[] | undefined
      if (selecionado.tipo !== 'pgr') {
        conclusoesFuncao = []
        for (const funcao of funcoes) {
          const avaliacoesDaFuncaoAtual = avaliacoesDaFuncao(funcao, avaliacoes).filter(
            (a) => a.agente_id,
          )
          if (avaliacoesDaFuncaoAtual.length === 0 && selecionado.tipo === 'ltcat') {
            conclusoesFuncao.push({
              funcao: funcao.nome,
              agente: '—',
              regua: 'Decreto 3.048/1999, Anexo IV',
              dadoUsado: 'sem agente do Anexo IV identificado',
              conclusao: 'Ausência de agente nocivo (código 09.01.001)',
              justificativa: '',
            })
            continue
          }
          for (const a of avaliacoesDaFuncaoAtual) {
            const agenteNome = a.expand?.agente_id?.nome || a.perigo_descricao || '—'
            if (selecionado.tipo === 'insalubridade' && a.expand?.agente_id?.anexo_nr15) {
              conclusoesFuncao.push({
                funcao: funcao.nome,
                agente: agenteNome,
                regua: `NR-15, Anexo ${a.expand.agente_id.anexo_nr15}`,
                dadoUsado: a.insalubridade_justificativa || '—',
                conclusao: a.insalubridade_final || a.insalubridade_sugerida || 'Não avaliado',
                justificativa: a.insalubridade_justificativa || '',
              })
            } else if (selecionado.tipo === 'periculosidade' && a.expand?.agente_id?.anexo_nr16) {
              const final = a.periculosidade_final ?? a.periculosidade_sugerida
              conclusoesFuncao.push({
                funcao: funcao.nome,
                agente: agenteNome,
                regua: `NR-16, Anexo ${a.expand.agente_id.anexo_nr16}`,
                dadoUsado: a.periculosidade_justificativa || '—',
                conclusao:
                  final === undefined ? 'Não avaliado' : final ? 'Devido (30%)' : 'Não devido',
                justificativa: a.periculosidade_justificativa || '',
              })
            } else if (selecionado.tipo === 'ltcat') {
              conclusoesFuncao.push({
                funcao: funcao.nome,
                agente: agenteNome,
                regua: 'Decreto 3.048/1999, Anexo IV',
                dadoUsado: a.ltcat_justificativa || '—',
                conclusao: a.ltcat_enquadra_final || a.ltcat_enquadra_sugerido || 'Não avaliado',
                justificativa: a.ltcat_justificativa || '',
              })
            }
          }
        }
      }

      const proximaVersao = (selecionado.versao || 0) + 1
      const pdf = await gerarPdfPgr({
        organizacaoNome: identidade.nome,
        logoUrl: identidade.logoUrl,
        empresaNome: nomeEmpresa,
        empresaCnpj: empresa.cnpj,
        empresaLogoUrl: urlLogoEmpresa(empresa),
        siglaDocumento: TIPO_DOCUMENTO_LABEL[selecionado.tipo],
        titulo: f.titulo || TIPO_DOCUMENTO_TITULO_PADRAO[selecionado.tipo],
        versao: proximaVersao,
        dataEmissao: new Date(),
        vigenciaInicio: new Date(),
        elaboradores: f.elaboradores,
        secoes: f.secoes || [],
        unidadesAvaliacao: ghes.map((g) => g.nome),
        inventario,
        planoAcao,
        conclusoesFuncao,
        assinatura: {
          nome: rtEmissor?.nome || user?.name || 'Responsável',
          registro: rtEmissor ? formatarRegistroRT(rtEmissor) : undefined,
          confirmadaEm,
          linkVerificacao: `${window.location.origin}/verificar/${chaveVerificacao}`,
        },
      })
      const blob = pdf.output('blob')
      const nomeArquivo = nomeArquivoDocumentoSst(selecionado.tipo, nomeEmpresa, proximaVersao)
      const hash = await hashSha256(blob)

      const emitido = await emitirDocumentoSst(
        selecionado,
        {
          matriz_id: matriz?.id,
          matriz_snapshot: matriz
            ? {
                nome: matriz.nome,
                metodologia: matriz.metodologia,
                dimensao: matriz.dimensao,
                categorias: matriz.categorias,
                celulas: matriz.celulas,
              }
            : undefined,
          dados_emissao: {
            unidades_avaliacao: ghes.length,
            avaliacoes_risco: avaliacoes.length,
            acoes_plano: acoes.length,
          },
          emitido_por: user?.id || '',
          assinatura_confirmada_em: confirmadaEm.toISOString(),
          link_publico_chave: chaveVerificacao,
        },
        blob,
        nomeArquivo,
        hash,
      )
      setDocumentos((v) =>
        v.map((d) => {
          if (d.id === emitido.id) return emitido
          if (selecionado.documento_anterior_id && d.id === selecionado.documento_anterior_id) {
            return { ...d, status: 'substituido' }
          }
          return d
        }),
      )
      setSelecionadoId(emitido.id)
      toast.success(`${TIPO_DOCUMENTO_LABEL[selecionado.tipo]} emitido em PDF`)
    } catch (error) {
      toast.error('Não foi possível emitir o PDF', { description: getErrorMessage(error) })
    } finally {
      setEmitindo(false)
    }
  }

  const novoDocumento = async () => {
    if (!organizacaoId) {
      toast.error('Ainda carregando os dados da empresa, tente de novo em instantes')
      return
    }
    try {
      const criado = await createDocumentoSst({
        organizacao_id: organizacaoId,
        empresa_id: empresaId,
        tipo,
        titulo: TIPO_DOCUMENTO_TITULO_PADRAO[tipo],
        status: 'rascunho',
        secoes: secoesPadrao(tipo),
      })
      toast.success(`Rascunho de ${TIPO_DOCUMENTO_LABEL[tipo]} criado com o modelo básico`)
      setDocumentos((v) => [criado, ...v])
      setSelecionadoId(criado.id)
    } catch (error) {
      toast.error('Não foi possível criar o documento', { description: getErrorMessage(error) })
    }
  }

  const salvar = async () => {
    if (!selecionado) return
    setSalvando(true)
    try {
      const atualizado = await updateDocumentoSst(selecionado.id, {
        titulo: f.titulo,
        elaboradores: f.elaboradores,
        secoes: f.secoes,
        planos_acao_ids: f.planos_acao_ids,
      })
      setDocumentos((v) => v.map((d) => (d.id === atualizado.id ? atualizado : d)))
      setUltimoAutosalvamento(new Date())
      toast.success('Rascunho salvo')
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  const criarRevisao = async () => {
    if (!selecionado) return
    setSalvando(true)
    try {
      const criado = await revisarDocumentoSst(selecionado, motivoRevisao)
      toast.success('Nova revisão criada')
      setDocumentos((v) => [criado, ...v])
      setSelecionadoId(criado.id)
      setDialogRevisao(false)
      setMotivoRevisao('')
    } catch (error) {
      toast.error('Não foi possível criar a revisão', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  const secoes = (f.secoes || []).slice().sort((a, b) => a.ordem - b.ordem)

  const atualizarSecao = (id: string, patch: Partial<SecaoDocumento>) => {
    setF((v) => ({
      ...v,
      secoes: (v.secoes || []).map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }))
  }

  const moverSecao = (id: string, direcao: -1 | 1) => {
    const ordenadas = (f.secoes || []).slice().sort((a, b) => a.ordem - b.ordem)
    const i = ordenadas.findIndex((s) => s.id === id)
    const j = i + direcao
    if (i < 0 || j < 0 || j >= ordenadas.length) return
    const troca = ordenadas[i].ordem
    ordenadas[i].ordem = ordenadas[j].ordem
    ordenadas[j].ordem = troca
    setF((v) => ({ ...v, secoes: ordenadas }))
  }

  const removerSecao = (id: string) => {
    setF((v) => ({ ...v, secoes: (v.secoes || []).filter((s) => s.id !== id) }))
  }

  const adicionarSecao = () => {
    const ordenadas = f.secoes || []
    const nova: SecaoDocumento = {
      id: crypto.randomUUID(),
      titulo: 'Nova seção',
      ativo: true,
      ordem: ordenadas.length,
      texto: '',
    }
    setF((v) => ({ ...v, secoes: [...(v.secoes || []), nova] }))
  }

  return (
    <div className="space-y-4">
      <Tabs value={tipo} onValueChange={(v) => setTipo(v as TipoDocumentoSst)}>
        <TabsList className="flex-wrap h-auto">
          {TIPOS.map((t) => (
            <TabsTrigger key={t} value={t}>
              {TIPO_DOCUMENTO_LABEL[t]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tipo !== 'pgr' && (
        <Tabs value={subVista} onValueChange={(v) => setSubVista(v as 'conclusoes' | 'documento')}>
          <TabsList>
            <TabsTrigger value="conclusoes">Conclusões por função</TabsTrigger>
            <TabsTrigger value="documento">Documento</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {tipo !== 'pgr' && subVista === 'conclusoes' ? (
        <ConclusoesPorFuncaoTab
          key={`${empresaId}-${tipo}`}
          empresaId={empresaId}
          tipo={tipo}
          onChecklistChange={tipo === 'ltcat' ? setChecklistLtcatCompleto : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-3">
            <Button onClick={novoDocumento} className="w-full" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Novo {TIPO_DOCUMENTO_LABEL[tipo]}
            </Button>
            {carregando ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : documentos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum {TIPO_DOCUMENTO_LABEL[tipo]} criado ainda para esta empresa.
              </p>
            ) : (
              <div className="space-y-2">
                {documentos.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelecionadoId(d.id)}
                    className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                      d.id === selecionadoId ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{d.titulo}</span>
                      <Badge variant={STATUS_VARIANTE[d.status]}>{STATUS_LABEL[d.status]}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {d.versao ? `Versão ${d.versao}` : 'Sem versão emitida'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {!selecionado ? (
              <div className="rounded-2xl border border-dashed bg-card py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  Crie um novo {TIPO_DOCUMENTO_LABEL[tipo]} ou escolha um existente na lista ao
                  lado. O documento já nasce com o texto normativo e a metodologia básica
                  preenchidos — só é preciso completar as partes específicas desta empresa.
                </p>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {f.titulo}
                      <Badge variant={STATUS_VARIANTE[selecionado.status]}>
                        {STATUS_LABEL[selecionado.status]}
                      </Badge>
                    </CardTitle>
                    {!travado && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {autosalvando ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...
                          </>
                        ) : ultimoAutosalvamento ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Salvo automaticamente às{' '}
                            {ultimoAutosalvamento.toLocaleTimeString('pt-BR')}
                          </>
                        ) : null}
                      </span>
                    )}
                  </div>
                  {travado && (
                    <p className="text-sm text-muted-foreground">
                      Este documento está {STATUS_LABEL[selecionado.status].toLowerCase()} e não
                      pode mais ser editado.{' '}
                      {selecionado.status === 'emitido' &&
                        'Para mudar algo, crie uma nova revisão.'}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Título</Label>
                      <Input
                        className="mt-1.5"
                        disabled={travado}
                        value={f.titulo || ''}
                        onChange={(e) => setF((v) => ({ ...v, titulo: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Elaboradores</Label>
                      <Input
                        className="mt-1.5"
                        disabled={travado}
                        placeholder="Nome e registro profissional"
                        value={f.elaboradores || ''}
                        onChange={(e) => setF((v) => ({ ...v, elaboradores: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {secoes.map((secao, i) => (
                      <div key={secao.id} className="rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={secao.ativo}
                            disabled={travado}
                            onCheckedChange={(v) => atualizarSecao(secao.id, { ativo: v })}
                          />
                          <Input
                            className="flex-1 font-medium"
                            disabled={travado}
                            value={secao.titulo}
                            onChange={(e) => atualizarSecao(secao.id, { titulo: e.target.value })}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={travado || i === 0}
                            onClick={() => moverSecao(secao.id, -1)}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={travado || i === secoes.length - 1}
                            onClick={() => moverSecao(secao.id, 1)}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={travado}
                            onClick={() => removerSecao(secao.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {secao.ativo && (
                          <div className="mt-3">
                            {travado ? (
                              <div
                                className="prose prose-sm max-w-none rounded border bg-muted/30 p-3"
                                dangerouslySetInnerHTML={{
                                  __html: secao.texto || '<p><em>Vazio</em></p>',
                                }}
                              />
                            ) : (
                              <RichTextEditor
                                value={secao.texto}
                                onChange={(html) => atualizarSecao(secao.id, { texto: html })}
                                placeholder="Texto desta seção..."
                                minHeight="120px"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {!travado && (
                      <Button variant="outline" size="sm" onClick={adicionarSecao}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar seção
                      </Button>
                    )}
                  </div>

                  <div className="rounded-lg border p-3">
                    <Label className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      Planos de ação neste documento
                    </Label>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Escolha quais planos de ação (aba Plano de ação) entram no PDF. Nenhum marcado
                      = entram todos os planos e as ações avulsas da empresa.
                    </p>
                    {planosDisponiveis.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Nenhum plano de ação cadastrado ainda para esta empresa.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {planosDisponiveis.map((p) => {
                          const marcado = (f.planos_acao_ids || []).includes(p.id)
                          return (
                            <label
                              key={p.id}
                              className="flex items-center gap-2 text-sm"
                              aria-disabled={travado}
                            >
                              <Checkbox
                                checked={marcado}
                                disabled={travado}
                                onCheckedChange={(c) =>
                                  setF((v) => {
                                    const atuais = v.planos_acao_ids || []
                                    return {
                                      ...v,
                                      planos_acao_ids: c
                                        ? [...atuais, p.id]
                                        : atuais.filter((id) => id !== p.id),
                                    }
                                  })
                                }
                              />
                              {p.nome}
                              <Badge variant="outline" className="text-[10px]">
                                {p.status}
                              </Badge>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {selecionado.status === 'emitido' && urlPdf && (
                    <a
                      href={urlPdf}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary underline"
                    >
                      Baixar PDF emitido (versão {selecionado.versao})
                    </a>
                  )}
                  <div className="flex justify-end gap-2">
                    {selecionado.status === 'emitido' && (
                      <Button variant="outline" onClick={() => setDialogRevisao(true)}>
                        Nova revisão
                      </Button>
                    )}
                    {!travado && (
                      <>
                        <Button variant="outline" onClick={salvar} disabled={salvando || emitindo}>
                          Salvar rascunho
                        </Button>
                        <Button onClick={abrirDialogEmissao} disabled={salvando || emitindo}>
                          {emitindo ? 'Emitindo...' : 'Emitir PDF'}
                        </Button>
                      </>
                    )}
                  </div>
                  {!travado && (
                    <p className="text-xs text-muted-foreground">
                      O rascunho é salvo automaticamente enquanto você edita. Emitir gera o PDF a
                      partir das seções e dos dados atuais de estrutura, inventário e plano de ação,
                      e trava esta versão — se você alterar algo depois, será preciso gerar o
                      documento de novo (criando uma nova revisão) para que a mudança valha
                      oficialmente.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <Dialog open={dialogRevisao} onOpenChange={setDialogRevisao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova revisão do {TIPO_DOCUMENTO_LABEL[tipo]}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Motivo da revisão</Label>
            <Textarea
              className="mt-1.5"
              placeholder="O que mudou desde a última versão emitida?"
              value={motivoRevisao}
              onChange={(e) => setMotivoRevisao(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={criarRevisao} disabled={salvando}>
              Criar revisão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogSenhaAberto} onOpenChange={setDialogSenhaAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirme sua senha para emitir</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            A emissão assina eletronicamente o documento em seu nome. Digite sua senha para
            confirmar que é você.
          </p>
          <div>
            <Label htmlFor="senha-emissao">Senha</Label>
            <Input
              id="senha-emissao"
              type="password"
              className="mt-1.5"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmarSenhaEEmitir()}
              autoFocus
            />
            {erroSenha && <p className="mt-1.5 text-xs text-destructive">{erroSenha}</p>}
          </div>
          <DialogFooter>
            <Button onClick={confirmarSenhaEEmitir} disabled={emitindo}>
              {emitindo ? 'Confirmando...' : 'Confirmar e emitir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DocumentosSstTab
