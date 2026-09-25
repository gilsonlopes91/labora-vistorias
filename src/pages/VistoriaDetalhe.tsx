/* Execução da vistoria: checklist item a item, com cálculo automático de multa. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  ArrowLeft,
  AlertTriangle,
  Camera,
  MapPin,
  UserCog,
  FileCheck2,
  Lock,
  RotateCcw,
  CloudOff,
  RefreshCw,
  Search,
  ImagePlus,
} from 'lucide-react'

import { formatBrazilianDate, formatLocalDate, toPocketBaseDate } from '@/lib/date'
import { rotuloCurtoNorma, rotuloItemRef } from '@/lib/normas'
import { getErrorMessage, isErroDeConexao } from '@/lib/pocketbase/errors'
import {
  listarPendencias,
  enfileirarAlteracao,
  removerPendencia,
  marcarErroPendencia,
  type PendenciaResposta,
  type AlteracaoResposta,
} from '@/lib/filaOffline'
import { aplicarMarcaDagua } from '@/lib/marcaDagua'
import { gerarPdfVistoria } from '@/lib/relatorioVistoria'
import { METODOLOGIA_PADRAO, rascunhoConclusao } from '@/lib/textosRelatorio'
import { ehOrganizacaoLabora } from '@/lib/identidadeVisual'
import LoadingScreen from '@/components/LoadingScreen'
import TextoNorma from '@/components/TextoNorma'
import laboraLogoUrl from '@/assets/projeto-labora-engenharia-e-sst-07-83499.png'
import {
  getVistoria,
  updateVistoria,
  reabrirVistoria,
  marcarPendentesComoNA,
  type Vistoria,
  type StatusVistoria,
} from '@/services/vistorias'
import { updateEmpresa } from '@/services/empresas'
import { getPapelUsuarioLogado } from '@/services/equipe'
import { getItensChecklist, type ItemChecklist } from '@/services/itensChecklist'
import type { RegimeMulta } from '@/services/tiposVistoria'
import {
  getRespostasByVistoria,
  createResposta,
  updateResposta,
  buscarResposta,
  fotoUrl,
  getTokenArquivos,
  type RespostaVistoria,
  type Situacao,
  type GeoLocalizacao,
} from '@/services/respostasVistoria'
import { getMinhaOrganizacao, urlLogoOrganizacao } from '@/services/organizacoes'
import {
  getResponsaveisTecnicos,
  criarResponsavelTecnico,
  definirComoPadrao,
  formatarRegistroRT,
  urlAssinaturaRT,
  TIPOS_REGISTRO_RT,
  type ResponsavelTecnico,
  type TipoRegistroRT,
} from '@/services/responsaveisTecnicos'
import { getModeloFormulario } from '@/services/formularios'
import { getFormulariosByVistoria, type Formulario } from '@/services/registrosFormulario'
import FormularioPreenchivel from '@/components/FormularioPreenchivel'
import DetalhesAgendamento from '@/components/DetalhesAgendamento'
import { getModulos, type Modulos } from '@/services/modulos'

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
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

const STATUS_LABEL: Record<StatusVistoria, string> = {
  agendada: 'Agendada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

const STATUS_BORDER: Record<Situacao, string> = {
  C: 'border-l-4 border-l-emerald-500',
  'N/C': 'border-l-4 border-l-red-500',
  'N/A': 'border-l-4 border-l-muted-foreground/40',
}

const OBSERVACAO_PLACEHOLDER: Record<Situacao, string> = {
  C: 'Observação (opcional)',
  'N/C': 'Observação sobre a não conformidade (opcional)',
  'N/A': 'Observação (opcional)',
}

// Regime de cálculo de multa de cada checklist — vem do campo regime_multa de
// tipos_vistoria (migration 0095):
//   anexo_i            → grade do Anexo I da NR-28, em UFIR (regra geral)
//   anexo_ia_portuario → Anexo I-A, já em reais (NR-29, Portaria SIT 319/2012)
//   rural_art18        → art. 18 da Lei 5.889/1973, por empregado em situação
//                        irregular (NR-31, via item 28.3.2 da NR-28)
// Fallback para bases antigas, anteriores ao campo: código de ementa 231xxx = NR-31.
const regimePeloCodigo = (codigo?: string): RegimeMulta =>
  codigo && codigo.startsWith('231') ? 'rural_art18' : 'anexo_i'

const TEXTO_NR31 =
  'Infração da NR-31 (trabalho rural): a multa não usa a grade de UFIR do Anexo I da NR-28. ' +
  'Pelo item 28.3.2 da NR-28 (Portaria MTE 104/2026), a sanção segue o art. 18 da Lei 5.889/1973 — ' +
  'multa per capita por empregado em situação irregular, dobrada na reincidência. O valor por ' +
  'empregado é o escolhido no topo da página (R$ 392,89 pela Portaria MTE 1.131/2025 ou ' +
  'R$ 380,00 pelo texto da lei). O número usado neste item é o informado no topo. Se a infração ' +
  'alcançar menos empregados que o total do estabelecimento (ex.: falta de exame médico atinge só ' +
  'quem não fez), clique em "Alterar nº de empregados prejudicados" e informe só os afetados. ' +
  'Infrações coletivas (ex.: falta de PGRTR) usam o número de cima, sem alterar.'

const NOVO_RESPONSAVEL = '__novo__'

// Resposta como aparece na tela: a gravada no servidor com, por cima, o que
// ficou guardado no aparelho sem internet (ver lib/filaOffline).
type RespostaVisivel = RespostaVistoria & { pendente?: boolean; erroEnvio?: string }

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// Ordena pelo número real do item da norma (1.4.2 antes de 1.4.10), não pela
// ordem de cadastro no banco.
const compararItemRef = (a: ItemChecklist, b: ItemChecklist) =>
  (a.item_ref || '').localeCompare(b.item_ref || '', undefined, { numeric: true })

// O campo geoPoint do PocketBase vem com {lat:0, lon:0} quando nunca foi
// preenchido — não é uma coordenada real, então trata como "sem localização".
const temLocalizacaoValida = (loc?: GeoLocalizacao) => !!loc && (loc.lat !== 0 || loc.lon !== 0)

function obterLocalizacaoAtual(): Promise<GeoLocalizacao> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada neste dispositivo'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  })
}

export default function VistoriaDetalhe() {
  const { id } = useParams<{ id: string }>()

  const [vistoria, setVistoria] = useState<Vistoria | null>(null)
  const [itens, setItens] = useState<ItemChecklist[]>([])
  // Checklists da vistoria, na ordem: principal e adicionais. O rótulo curto
  // ("NR-12 · Anexo VIII") identifica cada item quando há mais de um.
  const [checklistsInfo, setChecklistsInfo] = useState<
    { id: string; rotulo: string; nome: string }[]
  >([])
  // Busca e filtro dos itens (checklists grandes, com centenas de itens).
  const [busca, setBusca] = useState('')
  const [filtroItens, setFiltroItens] = useState<'todos' | 'pendentes' | 'nc'>('todos')
  // "Marcar seção como N/A": seção escolhida aguardando confirmação.
  const [secaoParaNA, setSecaoParaNA] = useState<{ titulo: string; ids: string[] } | null>(null)
  const [marcandoSecao, setMarcandoSecao] = useState(false)
  const [registrosForm, setRegistrosForm] = useState<Record<string, Formulario>>({})
  const [formAberto, setFormAberto] = useState<string | null>(null)
  const [modeloAberto, setModeloAberto] = useState<Awaited<
    ReturnType<typeof getModeloFormulario>
  > | null>(null)
  const [respostas, setRespostas] = useState<Record<string, RespostaVistoria>>({})
  const [loading, setLoading] = useState(true)
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingGeo, setSavingGeo] = useState(false)
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null)
  // NR-31: nº de empregados prejudicados no nível da vistoria (default = total
  // da empresa). Cada item N/C da NR-31 herda esse número; itens individuais
  // podem sobrescrever com o próprio nº de afetados.
  const [nr31Empregados, setNr31Empregados] = useState<string>('')
  const [nr31Editando, setNr31Editando] = useState(false)
  // Logo e nome usados no laudo e na marca d'água das fotos: os da
  // organização, com os da Labora como padrão pra quem ainda não configurou
  // os próprios (ver /configuracoes).
  // Sem logo próprio, a organização fica sem logo (só a Labora usa o da Labora).
  const [logoMarcaDagua, setLogoMarcaDagua] = useState<string>('')
  const [nomeOrganizacao, setNomeOrganizacao] = useState<string>('')

  // Finalização da vistoria — escolha do responsável técnico que assina o
  // laudo, e geração do PDF.
  const [responsaveis, setResponsaveis] = useState<ResponsavelTecnico[]>([])
  const [rtDialogAberto, setRtDialogAberto] = useState(false)
  const [rtSelecionadoId, setRtSelecionadoId] = useState<string>('')
  const [novoRTNome, setNovoRTNome] = useState('')
  const [novoRTTipo, setNovoRTTipo] = useState<TipoRegistroRT>('CREA')
  const [novoRTNumero, setNovoRTNumero] = useState('')
  const [novoRTUf, setNovoRTUf] = useState('')
  const [novoRTPadrao, setNovoRTPadrao] = useState(false)
  // Quem acompanhou pela empresa (assina junto) e nº da ART, pedidos ao finalizar.
  const [acompanhanteNome, setAcompanhanteNome] = useState('')
  const [acompanhanteCargo, setAcompanhanteCargo] = useState('')
  const [artNumero, setArtNumero] = useState('')
  // Conclusão e metodologia do relatório (item 22).
  const [conclusao, setConclusao] = useState('')
  const [metodologia, setMetodologia] = useState('')
  const [metodologiaOrg, setMetodologiaOrg] = useState('')
  const [mostrarMetodologia, setMostrarMetodologia] = useState(false)
  const [finalizando, setFinalizando] = useState(false)

  // Itens sem resposta na hora de finalizar (marcar como N/A ou voltar).
  const [pendentesDialogAberto, setPendentesDialogAberto] = useState(false)
  const [marcandoNA, setMarcandoNA] = useState(false)

  // Reabertura de vistoria concluída (dono/gerente).
  const [reabrirDialogAberto, setReabrirDialogAberto] = useState(false)
  const [motivoReabertura, setMotivoReabertura] = useState('')
  const [reabrindo, setReabrindo] = useState(false)
  const papelUsuario = getPapelUsuarioLogado()
  const podeReabrir =
    papelUsuario === 'dono' ||
    papelUsuario === 'gerente' ||
    papelUsuario === 'gestor' ||
    papelUsuario === 'admin_plataforma'

  // Empresa sem nº de empregados: informar ali mesmo e recalcular as multas.
  const [empregadosInformados, setEmpregadosInformados] = useState('')
  const [salvandoEmpregados, setSalvandoEmpregados] = useState(false)

  // Fotos são arquivos protegidos: o link precisa de um token temporário.
  const [tokenArquivos, setTokenArquivos] = useState('')
  const renovarTokenArquivos = useCallback(() => {
    getTokenArquivos()
      .then(setTokenArquivos)
      .catch(() => {})
  }, [])

  // Modo offline, etapa 1: alterações guardadas no aparelho quando falta
  // internet, enviadas sozinhas quando a conexão volta.
  const [pendencias, setPendencias] = useState<Record<string, PendenciaResposta>>({})
  const [sincronizando, setSincronizando] = useState(false)
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const sincronizandoRef = useRef(false)
  const avisoOfflineRef = useRef(0)
  const respostasRef = useRef<Record<string, RespostaVistoria>>({})

  // Pacotes: sem o módulo de relatórios contratado, o botão de gerar PDF some.
  const [modulos, setModulos] = useState<Modulos | null>(null)
  useEffect(() => {
    getModulos()
      .then(setModulos)
      .catch(() => {})
  }, [])

  const loadData = useCallback(async () => {
    if (!id) return
    try {
      const v = await getVistoria(id)
      setVistoria(v)
      const idsChecklists = [
        ...(v.tipo_vistoria_id ? [v.tipo_vistoria_id] : []),
        ...(v.expand?.checklists || []).map((c) => c.id),
      ]
      const [itensPorChecklist, respostasVistoria] = await Promise.all([
        Promise.all(idsChecklists.map((cid) => getItensChecklist(cid))),
        getRespostasByVistoria(v.id),
      ])
      // Itens de ementa revogada só aparecem se já foram respondidos nesta
      // vistoria (histórico); em vistorias novas ficam de fora.
      const respondidos = new Set(
        respostasVistoria.filter((r) => r.situacao).map((r) => r.item_checklist_id),
      )
      const visiveis = itensPorChecklist
        .flat()
        .filter((it) => !it.revogado || respondidos.has(it.id))
      // Vistoria concluída: o item aparece (e vai para o laudo) exatamente como
      // estava na norma no dia da conclusão — cópia congelada na resposta.
      if (v.status === 'concluida') {
        const porItem = new Map(respostasVistoria.map((r) => [r.item_checklist_id, r]))
        setItens(
          visiveis.map((it) => {
            const r = porItem.get(it.id)
            if (!r?.descricao_snapshot) return it
            return {
              ...it,
              item_ref: r.item_ref_snapshot || it.item_ref,
              codigo: r.codigo_snapshot || it.codigo,
              grau: r.grau_snapshot || it.grau,
              tipo: (r.tipo_snapshot as 'S' | 'M' | undefined) || it.tipo,
              descricao: r.descricao_snapshot,
              secao: r.secao_snapshot ?? it.secao,
            }
          }),
        )
      } else {
        setItens(visiveis)
      }
      setChecklistsInfo(
        idsChecklists.map((cid) => {
          const t =
            cid === v.tipo_vistoria_id
              ? v.expand?.tipo_vistoria_id
              : v.expand?.checklists?.find((c) => c.id === cid)
          return {
            id: cid,
            rotulo: t ? rotuloCurtoNorma(t) : 'Checklist',
            nome: t?.nome || 'Checklist',
          }
        }),
      )
      try {
        const regs = await getFormulariosByVistoria(v.id)
        const map: Record<string, Formulario> = {}
        for (const r of regs) map[r.modelo_formulario_id] = r
        setRegistrosForm(map)
      } catch (_) {
        setRegistrosForm({})
      }
      const map: Record<string, RespostaVistoria> = {}
      for (const r of respostasVistoria) map[r.item_checklist_id] = r
      setRespostas(map)
      respostasRef.current = map
      // O que ficou guardado neste aparelho sem internet aparece por cima.
      const guardadas = await listarPendencias(v.id)
      const mapaPendencias: Record<string, PendenciaResposta> = {}
      for (const p of guardadas) mapaPendencias[p.item_checklist_id] = p
      setPendencias(mapaPendencias)
      renovarTokenArquivos()
      // NR-31: default do nº de empregados prejudicados = total de trabalhadores
      // da empresa (nomenclatura da Lei 5.889/1973). Editável no topo da página.
      const emp = v.expand?.empresa_id as { numero_funcionarios?: number } | undefined
      if (emp?.numero_funcionarios) setNr31Empregados(String(emp.numero_funcionarios))
    } catch (error) {
      toast.error('Não foi possível carregar a vistoria', { description: getErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }, [id, renovarTokenArquivos])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    respostasRef.current = respostas
  }, [respostas])

  useEffect(() => {
    getMinhaOrganizacao()
      .then((org) => {
        const url = urlLogoOrganizacao(org)
        setLogoMarcaDagua(url || (ehOrganizacaoLabora(org.nome) ? laboraLogoUrl : ''))
        if (org.nome) setNomeOrganizacao(org.nome)
        setMetodologiaOrg(org.dados_documentos?.metodologia_relatorio || '')
      })
      .catch(() => {
        // sem organização carregada — documentos saem sem logo
      })
  }, [])

  useEffect(() => {
    if (!vistoria?.organizacao_id) return
    getResponsaveisTecnicos(vistoria.organizacao_id)
      .then(setResponsaveis)
      .catch(() => {
        // não impede o uso da vistoria — só não vai ter sugestão pronta ao finalizar
      })
  }, [vistoria?.organizacao_id])

  // Vistoria concluída: respostas travadas (o servidor também bloqueia).
  const travada = vistoria?.status === 'concluida'

  const avisarGuardadoNoAparelho = () => {
    // Um aviso por minuto, para não encher a tela de toasts em campo.
    if (Date.now() - avisoOfflineRef.current < 60_000) return
    avisoOfflineRef.current = Date.now()
    toast.info('Sem internet: a resposta ficou guardada neste aparelho', {
      description: 'Ela será enviada sozinha quando a conexão voltar. Não feche a vistoria.',
    })
  }

  const guardarNoAparelho = async (item: ItemChecklist, alteracao: AlteracaoResposta) => {
    if (!vistoria) return
    try {
      const existente = respostasRef.current[item.id]
      const p = await enfileirarAlteracao(
        vistoria.id,
        item.id,
        existente?.client_uuid || crypto.randomUUID(),
        alteracao,
      )
      setPendencias((prev) => ({ ...prev, [item.id]: p }))
      avisarGuardadoNoAparelho()
    } catch (error) {
      toast.error('Não foi possível guardar a resposta no aparelho', {
        description: getErrorMessage(error),
      })
    }
  }

  // Sem internet, ou se o item já tem alteração esperando envio (para manter a
  // ordem), a alteração vai direto para a fila do aparelho.
  const deveGuardarNoAparelho = (item: ItemChecklist) => !navigator.onLine || !!pendencias[item.id]

  const handleSituacaoChange = async (item: ItemChecklist, situacao: Situacao) => {
    if (!vistoria || travada) return
    if (deveGuardarNoAparelho(item)) {
      await guardarNoAparelho(item, { situacao })
      return
    }
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
      // O servidor passa a vistoria para "em andamento" na primeira resposta.
      if (vistoria.status === 'agendada') {
        setVistoria((prev) => (prev ? { ...prev, status: 'em_andamento' } : prev))
      }
    } catch (error) {
      if (isErroDeConexao(error)) {
        await guardarNoAparelho(item, { situacao })
        return
      }
      toast.error('Não foi possível salvar a resposta', { description: getErrorMessage(error) })
    }
  }

  const handleIrregularesBlur = async (item: ItemChecklist, valor: string) => {
    if (travada) return
    const atual = respostasVisiveis[item.id]
    if (!atual) return
    const n = Math.max(0, Math.floor(Number(valor) || 0))
    if ((atual.numero_funcionarios_irregulares || 0) === n) return
    const existing = respostas[item.id]
    if (!existing || deveGuardarNoAparelho(item)) {
      await guardarNoAparelho(item, { numero_funcionarios_irregulares: n })
      return
    }
    try {
      const updated = await updateResposta(existing.id, {
        numero_funcionarios_irregulares: n,
      })
      setRespostas((prev) => ({ ...prev, [item.id]: updated }))
    } catch (error) {
      if (isErroDeConexao(error)) {
        await guardarNoAparelho(item, { numero_funcionarios_irregulares: n })
        return
      }
      toast.error('Não foi possível salvar o nº de empregados irregulares', {
        description: getErrorMessage(error),
      })
    }
  }

  const handleObservacaoBlur = async (item: ItemChecklist, observacao: string) => {
    if (travada) return
    const atual = respostasVisiveis[item.id]
    if (!atual || (atual.observacao || '') === observacao) return
    const existing = respostas[item.id]
    if (!existing || deveGuardarNoAparelho(item)) {
      await guardarNoAparelho(item, { observacao })
      return
    }
    try {
      const updated = await updateResposta(existing.id, { observacao })
      setRespostas((prev) => ({ ...prev, [item.id]: updated }))
    } catch (error) {
      if (isErroDeConexao(error)) {
        await guardarNoAparelho(item, { observacao })
        return
      }
      toast.error('Não foi possível salvar a observação', { description: getErrorMessage(error) })
    }
  }

  // Plano de ação do item não conforme: recomendação e prazo para corrigir.
  const handlePlanoAcao = async (
    item: ItemChecklist,
    alteracao: { recomendacao?: string; prazo_adequacao?: string },
  ) => {
    if (travada) return
    const atual = respostasVisiveis[item.id]
    if (!atual) return
    if (
      alteracao.recomendacao !== undefined &&
      (atual.recomendacao || '') === alteracao.recomendacao
    )
      return
    if (
      alteracao.prazo_adequacao !== undefined &&
      (atual.prazo_adequacao || '').slice(0, 10) === alteracao.prazo_adequacao.slice(0, 10)
    )
      return
    const existing = respostas[item.id]
    if (!existing || deveGuardarNoAparelho(item)) {
      await guardarNoAparelho(item, alteracao)
      return
    }
    try {
      const updated = await updateResposta(existing.id, alteracao)
      setRespostas((prev) => ({ ...prev, [item.id]: updated }))
    } catch (error) {
      if (isErroDeConexao(error)) {
        await guardarNoAparelho(item, alteracao)
        return
      }
      toast.error('Não foi possível salvar o plano de ação', {
        description: getErrorMessage(error),
      })
    }
  }

  // Prazo rápido: hoje + N dias (0 = imediato).
  const prazoEmDias = (dias: number) => {
    const d = new Date()
    d.setDate(d.getDate() + dias)
    return toPocketBaseDate(formatLocalDate(d))
  }

  const handleFotoChange = async (item: ItemChecklist, fileList: FileList | null) => {
    if (!vistoria || travada || !fileList || fileList.length === 0) return
    const arquivosOriginais = Array.from(fileList)
    setUploadingItemId(item.id)
    let fotos: File[] = []
    let localizacao: GeoLocalizacao | undefined
    try {
      if (vistoria.fotos_georreferenciadas) {
        try {
          localizacao = await obterLocalizacaoAtual()
        } catch {
          toast.warning(
            'Não foi possível obter a localização — a foto foi salva sem georreferenciamento.',
          )
        }
      }

      const agora = new Date()
      fotos = await Promise.all(
        arquivosOriginais.map((arquivo) =>
          aplicarMarcaDagua(arquivo, {
            dataHora: agora,
            localizacao,
            logoUrl: logoMarcaDagua,
          }),
        ),
      )

      const existing = respostas[item.id]
      if (deveGuardarNoAparelho(item)) {
        await guardarNoAparelho(item, { fotos, localizacao })
        return
      }
      const updated = existing
        ? await updateResposta(existing.id, { fotos, localizacao })
        : await createResposta({
            vistoria_id: vistoria.id,
            item_checklist_id: item.id,
            client_uuid: crypto.randomUUID(),
            fotos,
            localizacao,
          })
      setRespostas((prev) => ({ ...prev, [item.id]: updated }))
      renovarTokenArquivos()
    } catch (error) {
      if (isErroDeConexao(error) && fotos.length > 0) {
        await guardarNoAparelho(item, { fotos, localizacao })
        return
      }
      toast.error('Não foi possível salvar a foto', { description: getErrorMessage(error) })
    } finally {
      setUploadingItemId(null)
    }
  }

  // Envia o que ficou guardado no aparelho. Para no primeiro erro de conexão
  // (tenta de novo depois); erros de outro tipo ficam marcados no item.
  // forcar = true (botão "Enviar agora") tenta também os itens que já deram
  // erro; nas tentativas automáticas eles ficam de fora.
  const sincronizar = useCallback(
    async (forcar = false) => {
      if (!vistoria || sincronizandoRef.current) return
      const todas = await listarPendencias(vistoria.id)
      if (todas.length === 0) {
        setPendencias({})
        return
      }
      const lista = forcar ? todas : todas.filter((p) => !p.erro)
      if (lista.length === 0 || !navigator.onLine) return
      sincronizandoRef.current = true
      setSincronizando(true)
      let enviados = 0
      try {
        for (const p of lista) {
          try {
            const existente =
              respostasRef.current[p.item_checklist_id] ||
              (await buscarResposta(p.vistoria_id, p.item_checklist_id))
            const dados = {
              situacao: p.situacao,
              observacao: p.observacao,
              numero_funcionarios_irregulares: p.numero_funcionarios_irregulares,
              fotos: p.fotos.length > 0 ? p.fotos : undefined,
              localizacao: p.localizacao,
              recomendacao: p.recomendacao,
              prazo_adequacao: p.prazo_adequacao,
            }
            const salvo = existente
              ? await updateResposta(existente.id, dados)
              : await createResposta({
                  vistoria_id: p.vistoria_id,
                  item_checklist_id: p.item_checklist_id,
                  client_uuid: p.client_uuid,
                  ...dados,
                })
            await removerPendencia(p.chave)
            respostasRef.current = { ...respostasRef.current, [p.item_checklist_id]: salvo }
            setRespostas((prev) => ({ ...prev, [p.item_checklist_id]: salvo }))
            setPendencias((prev) => {
              const novo = { ...prev }
              delete novo[p.item_checklist_id]
              return novo
            })
            enviados++
          } catch (error) {
            if (isErroDeConexao(error)) break
            const msg = getErrorMessage(error)
            await marcarErroPendencia(p.chave, msg)
            setPendencias((prev) => ({ ...prev, [p.item_checklist_id]: { ...p, erro: msg } }))
          }
        }
      } finally {
        sincronizandoRef.current = false
        setSincronizando(false)
      }
      if (enviados > 0) {
        toast.success(
          enviados === 1
            ? '1 resposta guardada no aparelho foi enviada'
            : `${enviados} respostas guardadas no aparelho foram enviadas`,
        )
        renovarTokenArquivos()
      }
    },
    [vistoria, renovarTokenArquivos],
  )

  const totalPendencias = Object.keys(pendencias).length

  // Quando a internet volta, envia. Enquanto houver pendência, tenta a cada 20 s.
  useEffect(() => {
    const aoVoltar = () => {
      setOnline(true)
      sincronizar()
    }
    const aoCair = () => setOnline(false)
    window.addEventListener('online', aoVoltar)
    window.addEventListener('offline', aoCair)
    return () => {
      window.removeEventListener('online', aoVoltar)
      window.removeEventListener('offline', aoCair)
    }
  }, [sincronizar])

  useEffect(() => {
    if (totalPendencias === 0) return
    const t = window.setInterval(() => {
      if (navigator.onLine) sincronizar()
    }, 20_000)
    return () => window.clearInterval(t)
  }, [totalPendencias, sincronizar])

  const temPendencias = totalPendencias > 0
  useEffect(() => {
    if (temPendencias && navigator.onLine) sincronizar()
  }, [temPendencias, sincronizar])

  // Resposta mostrada na tela = servidor + o que está guardado no aparelho.
  const respostasVisiveis = useMemo(() => {
    const mapa: Record<string, RespostaVisivel> = { ...respostas }
    for (const [itemId, p] of Object.entries(pendencias)) {
      const base = respostas[itemId]
      const mudouSituacao = p.situacao !== undefined && p.situacao !== base?.situacao
      mapa[itemId] = {
        ...(base || {
          id: '',
          vistoria_id: p.vistoria_id,
          item_checklist_id: itemId,
          client_uuid: p.client_uuid,
          created: '',
          updated: '',
        }),
        situacao: p.situacao ?? base?.situacao,
        observacao: p.observacao ?? base?.observacao,
        numero_funcionarios_irregulares:
          p.numero_funcionarios_irregulares ?? base?.numero_funcionarios_irregulares,
        localizacao: p.localizacao ?? base?.localizacao,
        recomendacao: p.recomendacao ?? base?.recomendacao,
        prazo_adequacao: p.prazo_adequacao ?? base?.prazo_adequacao,
        // A multa é calculada no servidor: se a situação mudou sem internet,
        // o valor antigo não vale mais.
        valor_multa_min: mudouSituacao ? undefined : base?.valor_multa_min,
        valor_multa_max: mudouSituacao ? undefined : base?.valor_multa_max,
        pendente: true,
        erroEnvio: p.erro,
      }
    }
    return mapa
  }, [respostas, pendencias])

  // Miniaturas das fotos que ainda estão só no aparelho.
  const fotosLocais = useMemo(() => {
    const mapa: Record<string, string[]> = {}
    for (const [itemId, p] of Object.entries(pendencias)) {
      if (p.fotos.length) mapa[itemId] = p.fotos.map((f) => URL.createObjectURL(f))
    }
    return mapa
  }, [pendencias])

  useEffect(
    () => () => {
      for (const urls of Object.values(fotosLocais)) urls.forEach((u) => URL.revokeObjectURL(u))
    },
    [fotosLocais],
  )

  // Abre a foto em outra aba com token novo (o da tela pode ter vencido).
  const abrirFoto = async (resposta: RespostaVistoria, filename: string) => {
    const aba = window.open('', '_blank')
    try {
      const token = await getTokenArquivos()
      const url = fotoUrl(resposta, filename, token)
      if (aba) aba.location.href = url
      else window.open(url, '_blank')
    } catch (error) {
      aba?.close()
      toast.error('Não foi possível abrir a foto', { description: getErrorMessage(error) })
    }
  }

  const handleStatusChange = async (status: StatusVistoria) => {
    if (!vistoria) return
    if (status === 'concluida' && !temChecklistOuFormulario) {
      toast.error('Não é possível finalizar a vistoria', {
        description:
          'É necessário ter ao menos um checklist ou um formulário de campo vinculado para finalizar.',
      })
      return
    }
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

  const temChecklistOuFormulario = useMemo(() => {
    if (!vistoria) return false
    const temChecklistPrincipal = !!vistoria.tipo_vistoria_id
    const temChecklistAdicional = !!(
      (vistoria.checklists && vistoria.checklists.length > 0) ||
      (vistoria.expand?.checklists && vistoria.expand.checklists.length > 0)
    )
    const temFormulario = !!(
      (vistoria.formularios && vistoria.formularios.length > 0) ||
      (vistoria.expand?.formularios && vistoria.expand.formularios.length > 0)
    )
    return temChecklistPrincipal || temChecklistAdicional || temFormulario
  }, [vistoria])

  // Monta e baixa o PDF da vistoria (na finalização ou depois, em "Baixar PDF").
  const gerarPdf = async (v: Vistoria, respostasPdf: Record<string, RespostaVistoria>) => {
    const empresaV = v.expand?.empresa_id
    const tipoV = v.expand?.tipo_vistoria_id
    // Assinatura digitalizada do RT que assinou (arquivo protegido: link com token).
    const rtAssinante =
      responsaveis.find((r) => r.id === v.rt_assinante_id) ||
      responsaveis.find((r) => r.nome === v.responsavel_tecnico_nome)
    let assinaturaRtUrl = ''
    if (rtAssinante?.assinatura) {
      try {
        assinaturaRtUrl = urlAssinaturaRT(rtAssinante, await getTokenArquivos())
      } catch {
        assinaturaRtUrl = ''
      }
    }
    await gerarPdfVistoria({
      vistoria: v,
      empresaNome: empresaV?.nome_fantasia || empresaV?.razao_social || 'Empresa',
      empresaCnpj: empresaV?.cnpj,
      empresaEndereco: empresaV?.endereco,
      empresaNumeroEmpregados: empresaV?.numero_funcionarios,
      tipoNome: tipoV?.nome || '',
      tipoNrReferencia: tipoV?.nr_referencia,
      checklists: checklistsInfo,
      assinaturaRtUrl,
      metodologia: v.metodologia || metodologiaOrg || METODOLOGIA_PADRAO,
      conclusao: v.conclusao,
      organizacaoNome: nomeOrganizacao,
      logoUrl: logoMarcaDagua,
      itens: itensOrdenados,
      respostas: respostasPdf,
      resumo,
      // O laudo precisa saber de qual tabela saiu cada item para não
      // afirmar "Anexo I" numa vistoria portuária ou rural.
      regimePorItem: Object.fromEntries(
        itensOrdenados.map((item) => [item.id, regimeDoItem(item)]),
      ),
      valorRuralPorEmpregado,
    })
  }

  const baixarPdf = async () => {
    if (!vistoria) return
    toast.info('Gerando o PDF...')
    try {
      await gerarPdf(vistoria, respostas)
    } catch (error) {
      toast.error('Não foi possível gerar o PDF', { description: getErrorMessage(error) })
    }
  }

  // Rascunho da conclusão com os números da vistoria, para o RT ajustar.
  const montarRascunhoConclusao = () =>
    rascunhoConclusao({
      dataVistoria: vistoria?.data_realizada || formatLocalDate(new Date()),
      checklists: checklistsInfo.map((c) => c.rotulo),
      ...resumo,
      prazos: itensOrdenados
        .map((item) => respostasVisiveis[item.id])
        .filter((r) => r?.situacao === 'N/C' && r.prazo_adequacao)
        .map((r) => String(r!.prazo_adequacao).slice(0, 10)),
    })

  // Ao abrir a finalização sem conclusão escrita, já traz o rascunho. Roda
  // depois da renderização, com os N/A recém-marcados já contados.
  useEffect(() => {
    if (rtDialogAberto && !conclusao.trim()) setConclusao(montarRascunhoConclusao())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rtDialogAberto])

  const abrirDialogRT = () => {
    const existente = vistoria?.responsavel_tecnico_nome
      ? responsaveis.find((r) => r.nome === vistoria.responsavel_tecnico_nome)
      : undefined
    const padrao = existente || responsaveis.find((r) => r.padrao)
    setRtSelecionadoId(
      padrao?.id || (responsaveis.length > 0 ? responsaveis[0].id : NOVO_RESPONSAVEL),
    )
    setNovoRTNome('')
    setNovoRTTipo('CREA')
    setNovoRTNumero('')
    setNovoRTUf('')
    setNovoRTPadrao(responsaveis.length === 0)
    setAcompanhanteNome(vistoria?.acompanhante_nome || vistoria?.contato_local_nome || '')
    setAcompanhanteCargo(vistoria?.acompanhante_cargo || '')
    setArtNumero(vistoria?.art_numero || '')
    setConclusao(vistoria?.conclusao || '')
    setMetodologia(vistoria?.metodologia || metodologiaOrg || METODOLOGIA_PADRAO)
    setMostrarMetodologia(false)
    setRtDialogAberto(true)
  }

  const abrirDialogFinalizacao = () => {
    if (travada) {
      baixarPdf()
      return
    }
    if (!temChecklistOuFormulario) {
      toast.error('Não é possível finalizar a vistoria', {
        description:
          'É necessário ter ao menos um checklist ou um formulário de campo vinculado para finalizar.',
      })
      return
    }
    if (totalPendencias > 0) {
      toast.error('Ainda há respostas guardadas neste aparelho', {
        description:
          'Conecte-se à internet e toque em "Enviar agora" antes de finalizar, para o relatório sair completo.',
      })
      return
    }
    if (resumo.semResposta > 0) {
      setPendentesDialogAberto(true)
      return
    }
    abrirDialogRT()
  }

  const irParaPrimeiroSemResposta = () => {
    setPendentesDialogAberto(false)
    // Sem busca nem filtro, para o item aparecer na tela.
    setBusca('')
    setFiltroItens('todos')
    const item = itensOrdenados.find((it) => !respostasVisiveis[it.id]?.situacao)
    if (!item) return
    window.setTimeout(() => {
      document
        .getElementById(`item-${item.id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
  }

  const confirmarMarcarNA = async () => {
    if (!vistoria) return
    setMarcandoNA(true)
    try {
      const r = await marcarPendentesComoNA(vistoria.id)
      const atualizadas = await getRespostasByVistoria(vistoria.id)
      const mapa: Record<string, RespostaVistoria> = {}
      for (const resp of atualizadas) mapa[resp.item_checklist_id] = resp
      respostasRef.current = mapa
      setRespostas(mapa)
      setPendentesDialogAberto(false)
      toast.success(
        `${r.criados + r.atualizados} ${r.criados + r.atualizados === 1 ? 'item marcado' : 'itens marcados'} como N/A`,
      )
      abrirDialogRT()
    } catch (error) {
      toast.error('Não foi possível marcar os itens como N/A', {
        description: getErrorMessage(error),
      })
    } finally {
      setMarcandoNA(false)
    }
  }

  // Marca como N/A os itens ainda sem resposta de uma seção inteira (ex.: a
  // seção de caldeiras num estabelecimento sem caldeira).
  const pedirSecaoComoNA = (titulo: string, pendentesSecao: ItemChecklist[]) => {
    if (travada || pendentesSecao.length === 0) return
    if (totalPendencias > 0 || !navigator.onLine) {
      toast.error('Sem conexão para marcar a seção inteira', {
        description:
          'Com internet e sem respostas guardadas no aparelho, a seção é marcada de uma vez. Enquanto isso, marque item a item.',
      })
      return
    }
    setSecaoParaNA({ titulo, ids: pendentesSecao.map((it) => it.id) })
  }

  const confirmarSecaoComoNA = async () => {
    if (!vistoria || !secaoParaNA) return
    setMarcandoSecao(true)
    try {
      const r = await marcarPendentesComoNA(vistoria.id, secaoParaNA.ids)
      const atualizadas = await getRespostasByVistoria(vistoria.id)
      const mapa: Record<string, RespostaVistoria> = {}
      for (const resp of atualizadas) mapa[resp.item_checklist_id] = resp
      respostasRef.current = mapa
      setRespostas(mapa)
      setVistoria((prev) =>
        prev && prev.status === 'agendada' ? { ...prev, status: 'em_andamento' } : prev,
      )
      const n = r.criados + r.atualizados
      toast.success(`${n} ${n === 1 ? 'item marcado' : 'itens marcados'} como N/A`)
      setSecaoParaNA(null)
    } catch (error) {
      toast.error('Não foi possível marcar a seção como N/A', {
        description: getErrorMessage(error),
      })
    } finally {
      setMarcandoSecao(false)
    }
  }

  const confirmarReabertura = async () => {
    if (!vistoria) return
    if (motivoReabertura.trim().length < 5) {
      toast.error('Escreva o motivo da reabertura')
      return
    }
    setReabrindo(true)
    try {
      await reabrirVistoria(vistoria.id, motivoReabertura.trim())
      setReabrirDialogAberto(false)
      setMotivoReabertura('')
      toast.success('Vistoria reaberta', {
        description: 'Ao finalizar de novo, sai um relatório novo.',
      })
      setLoading(true)
      await loadData()
    } catch (error) {
      toast.error('Não foi possível reabrir a vistoria', { description: getErrorMessage(error) })
    } finally {
      setReabrindo(false)
    }
  }

  // Informa o nº de empregados da empresa ali mesmo e recalcula as multas dos
  // itens N/C já marcados (o cálculo roda no servidor ao salvar a resposta).
  const salvarEmpregados = async () => {
    const empresaV = vistoria?.expand?.empresa_id
    if (!vistoria || !empresaV) return
    const n = Math.floor(Number(empregadosInformados))
    if (!(n > 0)) {
      toast.error('Informe um número de empregados maior que zero')
      return
    }
    setSalvandoEmpregados(true)
    try {
      await updateEmpresa(empresaV.id, { numero_funcionarios: n })
      const ncs = Object.values(respostas).filter((r) => r.situacao === 'N/C')
      for (const r of ncs) await updateResposta(r.id, { situacao: 'N/C' })
      toast.success('Número de empregados salvo', {
        description: ncs.length
          ? 'As multas dos itens não conformes foram recalculadas.'
          : undefined,
      })
      setEmpregadosInformados('')
      await loadData()
    } catch (error) {
      toast.error('Não foi possível salvar o número de empregados', {
        description: getErrorMessage(error),
      })
    } finally {
      setSalvandoEmpregados(false)
    }
  }

  const handleStatusSelect = (v: string) => {
    if (v === 'concluida') {
      abrirDialogFinalizacao()
    } else {
      handleStatusChange(v as StatusVistoria)
    }
  }

  const handleConfirmarFinalizacao = async () => {
    if (!vistoria) return
    if (!temChecklistOuFormulario) {
      toast.error('Não é possível finalizar a vistoria', {
        description:
          'É necessário ter ao menos um checklist ou um formulário de campo vinculado para finalizar.',
      })
      setRtDialogAberto(false)
      return
    }
    setFinalizando(true)
    try {
      let nomeRT: string
      let registroRT: string
      let rtAssinanteId = ''

      if (rtSelecionadoId === NOVO_RESPONSAVEL) {
        if (!novoRTNome.trim() || !novoRTNumero.trim()) {
          toast.error('Preencha o nome e o número do registro do responsável técnico')
          setFinalizando(false)
          return
        }
        const criado = await criarResponsavelTecnico({
          organizacao_id: vistoria.organizacao_id,
          nome: novoRTNome.trim(),
          tipo_registro: novoRTTipo,
          numero_registro: novoRTNumero.trim(),
          uf: novoRTUf.trim() || undefined,
          padrao: novoRTPadrao || responsaveis.length === 0,
        })
        if (criado.padrao) await definirComoPadrao(vistoria.organizacao_id, criado.id)
        nomeRT = criado.nome
        registroRT = formatarRegistroRT(criado)
        rtAssinanteId = criado.id
        setResponsaveis(await getResponsaveisTecnicos(vistoria.organizacao_id))
      } else {
        const rt = responsaveis.find((r) => r.id === rtSelecionadoId)
        if (!rt) {
          toast.error('Selecione um responsável técnico')
          setFinalizando(false)
          return
        }
        nomeRT = rt.nome
        registroRT = formatarRegistroRT(rt)
        rtAssinanteId = rt.id
      }

      const updated = await updateVistoria(vistoria.id, {
        status: 'concluida',
        responsavel_tecnico_nome: nomeRT,
        responsavel_tecnico_registro: registroRT,
        rt_assinante_id: rtAssinanteId || undefined,
        acompanhante_nome: acompanhanteNome.trim(),
        acompanhante_cargo: acompanhanteCargo.trim(),
        art_numero: artNumero.trim(),
        conclusao: conclusao.trim(),
        metodologia: metodologia.trim(),
        // Data em que a vistoria foi feita de fato (a agendada pode ser outra).
        // Se a vistoria foi reaberta, mantém a data original.
        ...(vistoria.data_realizada ? {} : { data_realizada: toPocketBaseDate(new Date()) }),
      })
      const vistoriaFinalizada: Vistoria = {
        ...vistoria,
        status: updated.status,
        data_realizada: updated.data_realizada,
        responsavel_tecnico_nome: updated.responsavel_tecnico_nome,
        responsavel_tecnico_registro: updated.responsavel_tecnico_registro,
        rt_assinante_id: updated.rt_assinante_id,
        acompanhante_nome: updated.acompanhante_nome,
        acompanhante_cargo: updated.acompanhante_cargo,
        art_numero: updated.art_numero,
        conclusao: updated.conclusao,
        metodologia: updated.metodologia,
      }
      setVistoria(vistoriaFinalizada)
      setRtDialogAberto(false)
      toast.success('Vistoria finalizada — gerando o PDF...')

      try {
        await gerarPdf(vistoriaFinalizada, respostas)
      } catch (pdfError) {
        toast.error('Vistoria finalizada, mas o PDF não pôde ser gerado', {
          description: getErrorMessage(pdfError),
        })
      }
    } catch (error) {
      toast.error('Não foi possível finalizar a vistoria', { description: getErrorMessage(error) })
    } finally {
      setFinalizando(false)
    }
  }

  const handleToggleGeo = async (checked: boolean) => {
    if (!vistoria) return
    setSavingGeo(true)
    try {
      const updated = await updateVistoria(vistoria.id, { fotos_georreferenciadas: checked })
      setVistoria((prev) =>
        prev ? { ...prev, fotos_georreferenciadas: updated.fotos_georreferenciadas } : prev,
      )
    } catch (error) {
      toast.error('Não foi possível atualizar a opção de georreferenciamento', {
        description: getErrorMessage(error),
      })
    } finally {
      setSavingGeo(false)
    }
  }

  // Ordem: checklist (principal, depois os adicionais) e, dentro dele, o
  // número do item. Assim os itens de um anexo não se misturam com os do corpo.
  const itensOrdenados = useMemo(() => {
    const ordem = new Map(checklistsInfo.map((c, i) => [c.id, i]))
    return [...itens].sort(
      (a, b) =>
        (ordem.get(a.tipo_vistoria_id) ?? 99) - (ordem.get(b.tipo_vistoria_id) ?? 99) ||
        compararItemRef(a, b),
    )
  }, [itens, checklistsInfo])

  const resumo = useMemo(() => {
    let conforme = 0
    let naoConforme = 0
    let naoAplica = 0
    let semResposta = 0
    let multaMin = 0
    let multaMax = 0
    for (const item of itensOrdenados) {
      const r = respostasVisiveis[item.id]
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
  }, [itensOrdenados, respostasVisiveis])

  // Regime de cada checklist vinculado à vistoria (principal + adicionais).
  const regimePorChecklist = useMemo(() => {
    const mapa: Record<string, RegimeMulta> = {}
    const principal = vistoria?.expand?.tipo_vistoria_id
    if (principal) mapa[principal.id] = principal.regime_multa || 'anexo_i'
    for (const checklist of vistoria?.expand?.checklists || []) {
      mapa[checklist.id] = checklist.regime_multa || 'anexo_i'
    }
    return mapa
  }, [vistoria])

  const regimeDoItem = useCallback(
    (item: ItemChecklist): RegimeMulta =>
      regimePorChecklist[item.tipo_vistoria_id] || regimePeloCodigo(item.codigo),
    [regimePorChecklist],
  )

  const isItemRural = useCallback(
    (item: ItemChecklist) => regimeDoItem(item) === 'rural_art18',
    [regimeDoItem],
  )

  // O resumo precisa dizer de qual tabela saiu cada parcela: o rural usa outro
  // critério legal (Lei 5.889/1973) e o portuário usa o Anexo I-A, em reais.
  const temNr31 = useMemo(
    () => itensOrdenados.some((item) => isItemRural(item)),
    [itensOrdenados, isItemRural],
  )

  const temPortuario = useMemo(
    () => itensOrdenados.some((item) => regimeDoItem(item) === 'anexo_ia_portuario'),
    [itensOrdenados, regimeDoItem],
  )

  const temAnexoI = useMemo(
    () => itensOrdenados.some((item) => regimeDoItem(item) === 'anexo_i'),
    [itensOrdenados, regimeDoItem],
  )

  // Valor por empregado do critério rural, conforme a base legal escolhida na
  // vistoria. Mesmo valor mostrado nos cartões de escolha logo abaixo.
  const valorRuralPorEmpregado = vistoria?.nr31_base_legal === 'lei_380' ? 380 : 392.89

  const progressoPct = itensOrdenados.length
    ? Math.round(((itensOrdenados.length - resumo.semResposta) / itensOrdenados.length) * 100)
    : 0

  const grupos = useMemo(() => {
    // Mais de um checklist: o título da seção diz de qual norma ou anexo ela é
    // ("NR-12 · Anexo VIII · Prensas"). Com um só, fica só a seção.
    const multi = checklistsInfo.length > 1
    const rotuloPorId = new Map(checklistsInfo.map((c) => [c.id, c.rotulo]))
    const map = new Map<string, ItemChecklist[]>()
    for (const item of itensOrdenados) {
      const secao = item.secao || 'Disposições gerais'
      const chave = multi
        ? `${rotuloPorId.get(item.tipo_vistoria_id) || 'Checklist'} · ${secao}`
        : secao
      if (!map.has(chave)) map.set(chave, [])
      map.get(chave)!.push(item)
    }
    return Array.from(map.entries())
  }, [itensOrdenados, checklistsInfo])

  // Seções como aparecem na tela, depois da busca e do filtro.
  const gruposVisiveis = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return grupos
      .map(([titulo, itensGrupo], indice) => ({
        titulo,
        indice,
        itens: itensGrupo.filter((item) => {
          const situacao = respostasVisiveis[item.id]?.situacao
          if (filtroItens === 'pendentes' && situacao) return false
          if (filtroItens === 'nc' && situacao !== 'N/C') return false
          if (!q) return true
          return (
            (item.item_ref || '').toLowerCase().includes(q) ||
            (item.codigo || '').toLowerCase().includes(q) ||
            (item.descricao || '').toLowerCase().includes(q)
          )
        }),
        pendentes: itensGrupo.filter((item) => !respostasVisiveis[item.id]?.situacao),
      }))
      .filter((g) => g.itens.length > 0)
  }, [grupos, busca, filtroItens, respostasVisiveis])

  const irParaSecao = (indice: string) => {
    document
      .getElementById(`secao-${indice}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <LoadingScreen fullScreen={false} mensagem="Carregando dados da vistoria..." />
      </div>
    )
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
  const nomeTipoPrincipal =
    tipo?.nr_referencia && tipo?.nome && !tipo.nome.startsWith(tipo.nr_referencia)
      ? `${tipo.nr_referencia} — ${tipo.nome}`
      : tipo?.nome ||
        (vistoria.checklists?.length || vistoria.formularios?.length
          ? 'Vistoria personalizada'
          : 'Sem checklist vinculado')
  const rotuloBotaoFinalizar = travada ? 'Baixar PDF' : 'Finalizar vistoria'
  // Multa pela grade da NR-28 depende do nº de empregados: sem ele, o servidor
  // usa a menor faixa (1 a 10) e o valor sai subestimado.
  const empresaSemEmpregados = !empresa?.numero_funcionarios && (temAnexoI || temPortuario)
  const reaberturas = Array.isArray(vistoria.reaberturas) ? vistoria.reaberturas : []

  return (
    // pb-28: espaço no fim da página para o selo fixo no canto não cobrir o
    // último item nem o botão de finalizar.
    <div className="container mx-auto max-w-4xl px-4 pb-28 pt-8">
      <Link
        to="/vistorias"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para vistorias
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {empresa?.nome_fantasia || empresa?.razao_social || 'Vistoria'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {nomeTipoPrincipal}
            {vistoria.data_agendada && <> · {formatBrazilianDate(vistoria.data_agendada)}</>}
            {vistoria.data_realizada &&
              formatBrazilianDate(vistoria.data_realizada) !==
                formatBrazilianDate(vistoria.data_agendada) && (
                <> · realizada em {formatBrazilianDate(vistoria.data_realizada)}</>
              )}
          </p>
          {vistoria.responsavel_tecnico_nome && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <UserCog className="h-3 w-3" />
              Responsável técnico: {vistoria.responsavel_tecnico_nome} —{' '}
              {vistoria.responsavel_tecnico_registro}
            </p>
          )}
          <DetalhesAgendamento vistoria={vistoria} onSaved={(v) => setVistoria(v)} />
          {!!vistoria.expand?.checklists?.length && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Checklists NR adicionais:
              </span>
              {vistoria.expand.checklists.map((c) => (
                <Badge key={c.id} variant="outline" className="text-xs" title={c.nome}>
                  {rotuloCurtoNorma(c)}
                </Badge>
              ))}
            </div>
          )}
          {!!vistoria.expand?.formularios?.length && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Formulários de campo:
              </span>
              {vistoria.expand.formularios.map((m) => {
                const reg = registrosForm[m.id]
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={async () => {
                      if (formAberto === m.id) {
                        setFormAberto(null)
                        setModeloAberto(null)
                        return
                      }
                      setFormAberto(m.id)
                      setModeloAberto(null)
                      try {
                        setModeloAberto(await getModeloFormulario(m.id))
                      } catch (error) {
                        toast.error('Não foi possível abrir o formulário', {
                          description: getErrorMessage(error),
                        })
                      }
                    }}
                  >
                    <Badge
                      variant="secondary"
                      className={
                        'cursor-pointer text-xs ' +
                        (formAberto === m.id
                          ? 'border border-primary bg-primary/10'
                          : 'hover:bg-accent')
                      }
                    >
                      {m.nome}
                      {m.fixo ? ' 📌' : ''}
                      {reg?.status === 'concluido' ? ' ✓' : reg ? ' ✎' : ''}
                    </Badge>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            Fotos georreferenciadas
            <Switch
              checked={!!vistoria.fotos_georreferenciadas}
              onCheckedChange={handleToggleGeo}
              disabled={savingGeo || travada}
            />
          </label>
          <Select
            value={vistoria.status || 'agendada'}
            onValueChange={handleStatusSelect}
            disabled={savingStatus || travada}
          >
            <SelectTrigger className="w-[160px]">
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
      </div>

      {/* Vistoria concluída: travada, com opção de baixar o PDF ou reabrir. */}
      {travada && (
        <Card className="mb-4 border-emerald-300 bg-emerald-50/60">
          <CardContent className="flex flex-wrap items-center gap-3 pt-4">
            <Lock className="h-5 w-5 shrink-0 text-emerald-700" />
            <div className="min-w-0 flex-1 text-sm">
              <div className="font-medium text-emerald-900">Vistoria concluída</div>
              <div className="text-xs text-emerald-900/80">
                As respostas estão travadas para o relatório continuar igual ao que foi assinado.
                {podeReabrir
                  ? ' Para corrigir algo, reabra a vistoria e finalize de novo.'
                  : ' Para corrigir algo, peça ao dono ou ao gerente da organização para reabrir.'}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {modulos?.relatorios !== false && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={baixarPdf}>
                  <FileCheck2 className="h-3.5 w-3.5" />
                  Baixar PDF
                </Button>
              )}
              {podeReabrir && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setReabrirDialogAberto(true)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reabrir vistoria
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {reaberturas.length > 0 && (
        <div className="mb-4 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <div className="mb-1 font-medium text-foreground">Histórico de reaberturas</div>
          <ul className="space-y-1">
            {reaberturas.map((r, i) => (
              <li key={i}>
                {format(new Date(r.em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}, por{' '}
                {r.por_nome}. Motivo: {r.motivo}
                {r.rt_anterior ? ` (versão anterior assinada por ${r.rt_anterior})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sem internet ou com respostas guardadas no aparelho. */}
      {(!online || totalPendencias > 0) && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <CloudOff className="h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            {!online ? (
              <>
                <span className="font-semibold">Sem internet.</span> Pode continuar marcando os
                itens, escrevendo observações e tirando fotos: tudo fica guardado neste aparelho e é
                enviado quando a conexão voltar. Não feche nem recarregue esta página até lá.
              </>
            ) : (
              <>
                <span className="font-semibold">
                  {totalPendencias === 1
                    ? '1 item guardado neste aparelho'
                    : `${totalPendencias} itens guardados neste aparelho`}
                </span>{' '}
                ainda não {totalPendencias === 1 ? 'foi enviado' : 'foram enviados'}.
              </>
            )}
          </div>
          {online && totalPendencias > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 border-amber-400 bg-white text-xs"
              disabled={sincronizando}
              onClick={() => sincronizar(true)}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${sincronizando ? 'animate-spin' : ''}`} />
              {sincronizando ? 'Enviando...' : 'Enviar agora'}
            </Button>
          )}
        </div>
      )}

      {/* Empresa sem nº de empregados: a multa sai pela menor faixa. */}
      {empresaSemEmpregados && !travada && (
        <Card className="mb-4 border-amber-300 bg-amber-50">
          <CardContent className="flex flex-wrap items-center gap-3 pt-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1 text-xs text-amber-900">
              <div className="text-sm font-medium">
                {empresa?.nome_fantasia || empresa?.razao_social || 'A empresa'} está sem número de
                empregados no cadastro
              </div>
              A multa está sendo estimada pela menor faixa da tabela da NR-28 (1 a 10 empregados), e
              o valor real pode ser maior. Informe o número para recalcular.
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="Nº de empregados"
                value={empregadosInformados}
                onChange={(e) => setEmpregadosInformados(e.target.value)}
                className="h-9 w-40 bg-white"
              />
              <Button size="sm" onClick={salvarEmpregados} disabled={salvandoEmpregados}>
                {salvandoEmpregados ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário aberto — preenchimento inline dentro da vistoria */}
      {formAberto && modeloAberto && (
        <div className="mb-6 rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">{modeloAberto.nome}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFormAberto(null)
                setModeloAberto(null)
              }}
            >
              Fechar
            </Button>
          </div>
          <FormularioPreenchivel
            modelo={modeloAberto}
            registroExistente={registrosForm[formAberto] || null}
            vistoriaId={vistoria.id}
            compacto
            onSalvo={(registro) => {
              setRegistrosForm((prev) => ({ ...prev, [formAberto]: registro }))
              setFormAberto(null)
              setModeloAberto(null)
            }}
          />
        </div>
      )}

      {/* Progresso — fica visível ao rolar a página pra baixo entre os itens. */}
      <div className="sticky top-0 z-10 mb-3 rounded-lg border bg-background/95 px-4 py-2.5 shadow-subtle backdrop-blur">
        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-medium">
          <span>
            {itensOrdenados.length - resumo.semResposta} de {itensOrdenados.length} itens
            respondidos ({progressoPct}%)
            {totalPendencias > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-700">
                <CloudOff className="h-3 w-3" />
                {totalPendencias} no aparelho
              </span>
            )}
          </span>
          {modulos?.relatorios !== false && (
            <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={abrirDialogFinalizacao}>
              <FileCheck2 className="h-3.5 w-3.5" />
              {rotuloBotaoFinalizar}
            </Button>
          )}
        </div>
        <Progress value={progressoPct} className="h-1.5" />
      </div>

      {/* Legenda das situações possíveis do checklist. */}
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <span>
          <span className="font-semibold text-emerald-600">C</span> — Conforme
        </span>
        <span>
          <span className="font-semibold text-destructive">N/C</span> — Não conforme
        </span>
        <span>
          <span className="font-semibold text-foreground">N/A</span> — Não se aplica
        </span>
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
            <div className="text-xs text-muted-foreground">
              Sem resposta ({itensOrdenados.length} itens)
            </div>
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
                  Soma dos itens marcados como não conforme.
                  {temAnexoI && ' Gradação do Anexo I da NR-28, convertida da UFIR.'}
                  {temPortuario &&
                    ' Itens da NR-29 (trabalho portuário) usam o Anexo I-A da NR-28, cujos valores já são fixados em reais.'}
                  {temNr31 &&
                    ` Itens da NR-31 (trabalho rural) seguem o art. 18 da Lei 5.889/1973 — ${currency.format(valorRuralPorEmpregado)} por empregado em situação irregular (dobrado na reincidência), calculados pelo nº informado no topo ou no item.`}
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {temNr31 && (
        <Card className="mb-6 border-amber-300 bg-amber-50">
          <CardContent className="pt-4">
            {/* Escolha da base legal do valor da multa rural */}
            <div className="mb-3">
              <div className="text-xs font-bold uppercase tracking-wide text-amber-900">
                NR-31 · Base legal do valor da multa
              </div>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={travada}
                  className={`rounded-xl border p-3 text-left text-xs leading-relaxed transition-colors disabled:cursor-not-allowed ${
                    (vistoria?.nr31_base_legal || 'portaria_392') === 'portaria_392'
                      ? 'border-amber-600 bg-amber-100 text-amber-950'
                      : 'border-amber-300 bg-white/60 text-amber-900 hover:border-amber-500'
                  }`}
                  onClick={() =>
                    vistoria &&
                    updateVistoria(vistoria.id, { nr31_base_legal: 'portaria_392' })
                      .then((v) => setVistoria(v))
                      .catch((error) =>
                        toast.error('Não foi possível salvar a escolha', {
                          description: getErrorMessage(error),
                        }),
                      )
                  }
                >
                  <span className="block font-bold">R$ 392,89 — Portaria MTE 1.131/2025</span>
                  <span className="mt-1 block">
                    Valor reajustado aplicável pela fiscalização (o item 28.3.3 da NR-28 manda
                    reajustar anualmente). Recomendado para cálculos atuais.
                  </span>
                </button>
                <button
                  type="button"
                  disabled={travada}
                  className={`rounded-xl border p-3 text-left text-xs leading-relaxed transition-colors disabled:cursor-not-allowed ${
                    vistoria?.nr31_base_legal === 'lei_380'
                      ? 'border-amber-600 bg-amber-100 text-amber-950'
                      : 'border-amber-300 bg-white/60 text-amber-900 hover:border-amber-500'
                  }`}
                  onClick={() =>
                    vistoria &&
                    updateVistoria(vistoria.id, { nr31_base_legal: 'lei_380' })
                      .then((v) => setVistoria(v))
                      .catch((error) =>
                        toast.error('Não foi possível salvar a escolha', {
                          description: getErrorMessage(error),
                        }),
                      )
                  }
                >
                  <span className="block font-bold">R$ 380,00 — Lei 5.889/1973, art. 18</span>
                  <span className="mt-1 block">
                    Valor fixado no texto da lei (redação da MP 2.164-41/2001). Use quando quiser
                    citar a lei na aula ou no relatório.
                  </span>
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-amber-900">
                Ambas remetem ao art. 18 da Lei 5.889/1973 (multa per capita, dobrada na
                reincidência): a lei fixou R$ 380,00 em 2001 e a Portaria MTE 1.131/2025 reajustou
                para R$ 392,89, conforme o item 28.3.3 da NR-28. A escolha vale para todos os itens
                NR-31 desta vistoria.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold uppercase tracking-wide text-amber-900">
                  Número de empregados irregulares
                </div>
                <div className="mt-0.5 text-xs leading-relaxed text-amber-900">
                  O padrão é o total de trabalhadores do estabelecimento — usado quando a infração
                  alcança a coletividade (ex.: falta de PGRTR). Se a infração atingir menos
                  trabalhadores (ex.: exame médico), altere o número no item.
                </div>
              </div>
              {nr31Editando ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={nr31Empregados}
                    onChange={(e) => setNr31Empregados(e.target.value)}
                    className="h-9 w-28"
                  />
                  <Button
                    size="sm"
                    className="h-9 rounded-full"
                    onClick={() => setNr31Editando(false)}
                  >
                    OK
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold text-amber-900">
                    {nr31Empregados || empresa?.numero_funcionarios || 0}
                  </span>
                  {!travada && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-full text-xs"
                      onClick={() => setNr31Editando(true)}
                    >
                      Alterar
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Busca, filtro e índice das seções */}
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar item, código ou trecho do texto"
            className="pl-9"
            aria-label="Buscar item"
          />
        </div>
        <Select
          value={filtroItens}
          onValueChange={(v) => setFiltroItens(v as 'todos' | 'pendentes' | 'nc')}
        >
          <SelectTrigger className="sm:w-[190px]" aria-label="Filtrar itens">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os itens</SelectItem>
            <SelectItem value="pendentes">Só sem resposta ({resumo.semResposta})</SelectItem>
            <SelectItem value="nc">Só não conformes ({resumo.naoConforme})</SelectItem>
          </SelectContent>
        </Select>
        {grupos.length > 1 && (
          <Select value="" onValueChange={irParaSecao}>
            <SelectTrigger className="sm:w-[190px]" aria-label="Ir para a seção">
              <SelectValue placeholder="Ir para a seção..." />
            </SelectTrigger>
            <SelectContent>
              {gruposVisiveis.map((g) => (
                <SelectItem key={g.titulo} value={String(g.indice)}>
                  {g.titulo}
                  {g.pendentes.length > 0 ? ` (${g.pendentes.length} sem resposta)` : ' (completa)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {gruposVisiveis.length === 0 && (
        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          {busca.trim()
            ? `Nenhum item encontrado para "${busca.trim()}".`
            : filtroItens === 'pendentes'
              ? 'Todos os itens já têm resposta.'
              : filtroItens === 'nc'
                ? 'Nenhum item marcado como não conforme.'
                : 'Nenhum item neste checklist.'}
        </div>
      )}

      <div className="space-y-8">
        {gruposVisiveis.map(({ titulo: secao, indice, itens: itensGrupo, pendentes }) => (
          <div key={secao} id={`secao-${indice}`} className="scroll-mt-24">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {secao}
              </h2>
              {!travada && pendentes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground"
                  onClick={() => pedirSecaoComoNA(secao, pendentes)}
                >
                  Marcar{' '}
                  {pendentes.length === 1
                    ? 'o item sem resposta'
                    : `os ${pendentes.length} sem resposta`}{' '}
                  como N/A
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {itensGrupo.map((item) => {
                const resposta = respostasVisiveis[item.id]
                const borderClass = resposta?.situacao
                  ? STATUS_BORDER[resposta.situacao]
                  : 'border-l-4 border-l-transparent'
                const fotosNoAparelho = fotosLocais[item.id] || []
                return (
                  <Card key={item.id} id={`item-${item.id}`} className={borderClass}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="border-primary/40 font-mono text-xs text-primary"
                            >
                              Item {rotuloItemRef(item.item_ref)}
                            </Badge>
                            {item.grau && (
                              <Badge variant="outline" className="text-xs">
                                Infração I{item.grau} ·{' '}
                                {item.tipo === 'S'
                                  ? 'Segurança do Trabalho'
                                  : 'Medicina do Trabalho'}
                              </Badge>
                            )}
                            {!item.grau && isItemRural(item) && (
                              <Badge variant="outline" className="text-xs">
                                NR-31 · multa por empregado irregular
                              </Badge>
                            )}
                            {item.revogado && (
                              <Badge variant="destructive" className="text-xs">
                                Ementa revogada
                              </Badge>
                            )}
                            {resposta?.pendente && !resposta.erroEnvio && (
                              <Badge
                                variant="outline"
                                className="gap-1 border-amber-400 text-xs text-amber-700"
                              >
                                <CloudOff className="h-3 w-3" />
                                Guardado no aparelho
                              </Badge>
                            )}
                            {resposta?.erroEnvio && (
                              <Badge
                                variant="destructive"
                                className="text-xs"
                                title={resposta.erroEnvio}
                              >
                                Não enviado: {resposta.erroEnvio}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-sm font-medium leading-snug">
                            <TextoNorma texto={item.descricao} />
                          </CardTitle>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Código da ementa {item.codigo}
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
                          disabled={travada}
                          className="grid w-full shrink-0 grid-cols-3 gap-2 sm:flex sm:w-auto sm:gap-1"
                        >
                          <ToggleGroupItem
                            value="C"
                            aria-label="Conforme"
                            className="h-12 border text-base font-semibold data-[state=on]:border-emerald-500 data-[state=on]:bg-emerald-100 data-[state=on]:text-emerald-700 sm:h-10 sm:text-sm"
                          >
                            C
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="N/C"
                            aria-label="Não conforme"
                            className="h-12 border text-base font-semibold data-[state=on]:border-red-500 data-[state=on]:bg-red-100 data-[state=on]:text-red-700 sm:h-10 sm:text-sm"
                          >
                            N/C
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="N/A"
                            aria-label="Não se aplica"
                            className="h-12 border text-base font-semibold data-[state=on]:border-muted-foreground/60 data-[state=on]:bg-muted sm:h-10 sm:text-sm"
                          >
                            N/A
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </CardHeader>
                    {resposta?.situacao && (
                      <CardContent className="pt-0">
                        {resposta.situacao === 'N/C' && isItemRural(item) && (
                          <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                            {TEXTO_NR31}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {resposta.numero_funcionarios_irregulares ? (
                                <>
                                  <Label
                                    htmlFor={`irreg-${item.id}`}
                                    className="text-xs font-medium"
                                  >
                                    Empregados prejudicados neste item:
                                  </Label>
                                  <Input
                                    id={`irreg-${item.id}`}
                                    type="number"
                                    min={0}
                                    defaultValue={resposta.numero_funcionarios_irregulares}
                                    onBlur={(e) => handleIrregularesBlur(item, e.target.value)}
                                    disabled={travada}
                                    className="h-8 w-28"
                                  />
                                </>
                              ) : (
                                <>
                                  <span className="text-xs text-muted-foreground">
                                    Multa calculada com todos os trabalhadores (
                                    {nr31Empregados || empresa?.numero_funcionarios || 0})
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 rounded-full text-xs"
                                    disabled={travada}
                                    onClick={() => {
                                      const el = document.getElementById(
                                        `irreg-${item.id}`,
                                      ) as HTMLInputElement | null
                                      if (el) {
                                        el.hidden = false
                                        el.focus()
                                      }
                                    }}
                                  >
                                    Alterar nº de empregados prejudicados
                                  </Button>
                                  <Input
                                    id={`irreg-${item.id}`}
                                    type="number"
                                    min={0}
                                    hidden
                                    placeholder={
                                      empresa?.numero_funcionarios
                                        ? String(empresa.numero_funcionarios)
                                        : '0'
                                    }
                                    defaultValue={resposta.numero_funcionarios_irregulares ?? ''}
                                    onBlur={(e) => handleIrregularesBlur(item, e.target.value)}
                                    className="h-8 w-28"
                                  />
                                </>
                              )}
                              {resposta.valor_multa_min || resposta.valor_multa_max ? (
                                <span className="text-sm font-medium text-destructive">
                                  Multa: {currency.format(resposta.valor_multa_min || 0)} a{' '}
                                  {currency.format(resposta.valor_multa_max || 0)}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {resposta.pendente
                                    ? 'Multa calculada quando a resposta for enviada'
                                    : 'Multa calculada ao salvar o nº'}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {resposta.situacao === 'N/C' &&
                          !isItemRural(item) &&
                          (resposta.valor_multa_min || resposta.valor_multa_max ? (
                            <div className="mb-2 text-sm font-medium text-destructive">
                              Multa estimada: {currency.format(resposta.valor_multa_min || 0)} a{' '}
                              {currency.format(resposta.valor_multa_max || 0)}
                            </div>
                          ) : resposta.pendente ? (
                            <div className="mb-2 text-xs text-muted-foreground">
                              Multa calculada quando a resposta for enviada.
                            </div>
                          ) : null)}
                        <Textarea
                          placeholder={OBSERVACAO_PLACEHOLDER[resposta.situacao]}
                          defaultValue={resposta.observacao}
                          onBlur={(e) => handleObservacaoBlur(item, e.target.value)}
                          readOnly={travada}
                          className="mb-2 text-sm"
                        />

                        {resposta.situacao === 'N/C' && (
                          <div className="mb-2 rounded-md border border-dashed p-2.5">
                            <div className="mb-1.5 text-xs font-semibold text-muted-foreground">
                              Plano de ação
                            </div>
                            <Textarea
                              placeholder="Recomendação: o que a empresa deve fazer para corrigir"
                              defaultValue={resposta.recomendacao}
                              onBlur={(e) =>
                                handlePlanoAcao(item, { recomendacao: e.target.value.trim() })
                              }
                              readOnly={travada}
                              rows={2}
                              className="mb-2 text-sm"
                            />
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Label
                                htmlFor={`prazo-${item.id}`}
                                className="text-xs text-muted-foreground"
                              >
                                Prazo
                              </Label>
                              <Input
                                id={`prazo-${item.id}`}
                                type="date"
                                value={(resposta.prazo_adequacao || '').slice(0, 10)}
                                onChange={(e) =>
                                  handlePlanoAcao(item, {
                                    prazo_adequacao: e.target.value
                                      ? toPocketBaseDate(e.target.value)
                                      : '',
                                  })
                                }
                                disabled={travada}
                                className="h-9 w-40 text-sm"
                              />
                              {!travada &&
                                [
                                  { rotulo: 'Imediato', dias: 0 },
                                  { rotulo: '30 dias', dias: 30 },
                                  { rotulo: '60 dias', dias: 60 },
                                  { rotulo: '90 dias', dias: 90 },
                                ].map((p) => (
                                  <Button
                                    key={p.dias}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 text-xs"
                                    onClick={() =>
                                      handlePlanoAcao(item, {
                                        prazo_adequacao: prazoEmDias(p.dias),
                                      })
                                    }
                                  >
                                    {p.rotulo}
                                  </Button>
                                ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          {!travada && (
                            <>
                              {/* Câmera abre direto a câmera traseira; galeria
                                  deixa escolher fotos já tiradas (no Android o
                                  capture impede a galeria). */}
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                id={`foto-${item.id}`}
                                className="hidden"
                                onChange={(e) => {
                                  handleFotoChange(item, e.target.files)
                                  e.target.value = ''
                                }}
                              />
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                id={`galeria-${item.id}`}
                                className="hidden"
                                onChange={(e) => {
                                  handleFotoChange(item, e.target.files)
                                  e.target.value = ''
                                }}
                              />
                              {uploadingItemId === item.id ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground">
                                  <Camera className="h-3.5 w-3.5" />
                                  Salvando foto...
                                </span>
                              ) : (
                                <>
                                  <label
                                    htmlFor={`foto-${item.id}`}
                                    className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-accent"
                                  >
                                    <Camera className="h-3.5 w-3.5" />
                                    {resposta.foto?.length || fotosNoAparelho.length
                                      ? 'Tirar outra foto'
                                      : 'Tirar foto'}
                                  </label>
                                  <label
                                    htmlFor={`galeria-${item.id}`}
                                    className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-accent"
                                  >
                                    <ImagePlus className="h-3.5 w-3.5" />
                                    Da galeria
                                  </label>
                                </>
                              )}
                            </>
                          )}
                          {temLocalizacaoValida(resposta.localizacao) && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {resposta.localizacao!.lat.toFixed(5)},{' '}
                              {resposta.localizacao!.lon.toFixed(5)}
                            </span>
                          )}
                        </div>

                        {((resposta.foto && resposta.foto.length > 0) ||
                          fotosNoAparelho.length > 0) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {tokenArquivos &&
                              resposta.id &&
                              (resposta.foto || []).map((filename) => (
                                <button
                                  key={filename}
                                  type="button"
                                  title="Abrir a foto"
                                  onClick={() => abrirFoto(resposta, filename)}
                                >
                                  <img
                                    src={fotoUrl(resposta, filename, tokenArquivos)}
                                    alt="Foto da vistoria"
                                    className="h-16 w-16 rounded-md border object-cover"
                                  />
                                </button>
                              ))}
                            {fotosNoAparelho.map((url) => (
                              <div key={url} className="relative" title="Guardada no aparelho">
                                <img
                                  src={url}
                                  alt="Foto guardada no aparelho"
                                  className="h-16 w-16 rounded-md border border-dashed border-amber-400 object-cover opacity-90"
                                />
                                <CloudOff className="absolute right-1 top-1 h-3.5 w-3.5 rounded bg-white/90 p-0.5 text-amber-700" />
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button size="lg" className="gap-2" onClick={abrirDialogFinalizacao}>
          <FileCheck2 className="h-4 w-4" />
          {rotuloBotaoFinalizar}
        </Button>
      </div>

      <Dialog open={!!secaoParaNA} onOpenChange={(aberto) => !aberto && setSecaoParaNA(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {secaoParaNA?.ids.length === 1
                ? 'Marcar 1 item como N/A?'
                : `Marcar ${secaoParaNA?.ids.length || 0} itens como N/A?`}
            </DialogTitle>
            <DialogDescription>
              Seção {secaoParaNA?.titulo}. Só os itens ainda sem resposta são marcados como "não se
              aplica"; os que já foram respondidos não mudam. Depois dá para trocar item a item.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSecaoParaNA(null)} disabled={marcandoSecao}>
              Cancelar
            </Button>
            <Button onClick={confirmarSecaoComoNA} disabled={marcandoSecao}>
              {marcandoSecao ? 'Marcando...' : 'Marcar como N/A'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendentesDialogAberto} onOpenChange={setPendentesDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resumo.semResposta === 1
                ? 'Falta 1 item sem resposta'
                : `Faltam ${resumo.semResposta} itens sem resposta`}
            </DialogTitle>
            <DialogDescription>
              Um relatório com itens em branco fica incompleto. Volte e responda, ou, se os itens
              que faltam não se aplicam a este estabelecimento, marque todos como N/A (não se
              aplica) e siga para a finalização.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={irParaPrimeiroSemResposta} disabled={marcandoNA}>
              Voltar e responder
            </Button>
            <Button onClick={confirmarMarcarNA} disabled={marcandoNA}>
              {marcandoNA
                ? 'Marcando...'
                : resumo.semResposta === 1
                  ? 'Marcar como N/A e continuar'
                  : `Marcar os ${resumo.semResposta} como N/A e continuar`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reabrirDialogAberto} onOpenChange={setReabrirDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabrir vistoria concluída</DialogTitle>
            <DialogDescription>
              A vistoria volta para "em andamento" e as respostas podem ser corrigidas. Fica
              registrado quem reabriu, quando e por quê. Ao finalizar de novo, sai um relatório
              novo, que substitui o anterior.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="motivo-reabertura" className="text-xs">
              Motivo da reabertura
            </Label>
            <Textarea
              id="motivo-reabertura"
              value={motivoReabertura}
              onChange={(e) => setMotivoReabertura(e.target.value)}
              placeholder="Ex.: corrigir a situação do item 12.6.1, marcado errado em campo"
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReabrirDialogAberto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmarReabertura}
              disabled={reabrindo || motivoReabertura.trim().length < 5}
            >
              {reabrindo ? 'Reabrindo...' : 'Reabrir vistoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rtDialogAberto} onOpenChange={setRtDialogAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Responsável técnico do relatório</DialogTitle>
            <DialogDescription>
              Escolha quem assina esta vistoria como responsável técnico. Ao confirmar, a vistoria é
              finalizada e o PDF é gerado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Select value={rtSelecionadoId} onValueChange={setRtSelecionadoId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {responsaveis.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>
                    {rt.nome} — {formatarRegistroRT(rt)}
                    {rt.padrao ? ' (padrão)' : ''}
                  </SelectItem>
                ))}
                <SelectItem value={NOVO_RESPONSAVEL}>
                  + Adicionar novo responsável técnico
                </SelectItem>
              </SelectContent>
            </Select>

            {rtSelecionadoId === NOVO_RESPONSAVEL && (
              <div className="grid grid-cols-1 gap-3 rounded-md border border-dashed p-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="novo-rt-nome" className="mb-1.5 block text-xs">
                    Nome
                  </Label>
                  <Input
                    id="novo-rt-nome"
                    value={novoRTNome}
                    onChange={(e) => setNovoRTNome(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Conselho</Label>
                  <Select
                    value={novoRTTipo}
                    onValueChange={(v) => setNovoRTTipo(v as TipoRegistroRT)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_REGISTRO_RT.map((tipoRT) => (
                        <SelectItem key={tipoRT} value={tipoRT}>
                          {tipoRT}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <div className="w-16">
                    <Label htmlFor="novo-rt-uf" className="mb-1.5 block text-xs">
                      UF
                    </Label>
                    <Input
                      id="novo-rt-uf"
                      value={novoRTUf}
                      maxLength={2}
                      onChange={(e) => setNovoRTUf(e.target.value.toUpperCase())}
                      placeholder="PI"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="novo-rt-numero" className="mb-1.5 block text-xs">
                      Número
                    </Label>
                    <Input
                      id="novo-rt-numero"
                      value={novoRTNumero}
                      onChange={(e) => setNovoRTNumero(e.target.value)}
                      placeholder="12345"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Checkbox
                    id="novo-rt-padrao"
                    checked={novoRTPadrao}
                    onCheckedChange={(v) => setNovoRTPadrao(v === true)}
                  />
                  <Label
                    htmlFor="novo-rt-padrao"
                    className="text-xs font-normal text-muted-foreground"
                  >
                    Salvar como padrão da organização
                  </Label>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2">
              <div className="sm:col-span-2 text-xs font-semibold text-muted-foreground">
                Quem acompanhou pela empresa (assina o relatório junto)
              </div>
              <div>
                <Label htmlFor="acompanhante-nome" className="mb-1.5 block text-xs">
                  Nome
                </Label>
                <Input
                  id="acompanhante-nome"
                  value={acompanhanteNome}
                  onChange={(e) => setAcompanhanteNome(e.target.value)}
                  placeholder="Ex.: Maria Souza"
                />
              </div>
              <div>
                <Label htmlFor="acompanhante-cargo" className="mb-1.5 block text-xs">
                  Cargo
                </Label>
                <Input
                  id="acompanhante-cargo"
                  value={acompanhanteCargo}
                  onChange={(e) => setAcompanhanteCargo(e.target.value)}
                  placeholder="Ex.: Técnica de segurança"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="art-numero" className="mb-1.5 block text-xs">
                  Nº da ART (opcional)
                </Label>
                <Input
                  id="art-numero"
                  value={artNumero}
                  onChange={(e) => setArtNumero(e.target.value)}
                  placeholder="Ex.: PI20260123456"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="conclusao" className="text-xs font-semibold">
                  Conclusão do relatório
                </Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-0 text-xs"
                  onClick={() => setConclusao(montarRascunhoConclusao())}
                >
                  Refazer o rascunho
                </Button>
              </div>
              <Textarea
                id="conclusao"
                rows={8}
                value={conclusao}
                onChange={(e) => setConclusao(e.target.value)}
                maxLength={5000}
              />
              <p className="text-[11px] text-muted-foreground">
                Rascunho feito com os números da vistoria. Ajuste o que precisar antes de assinar.
              </p>
            </div>

            <div className="rounded-md border p-3">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left text-xs font-semibold"
                onClick={() => setMostrarMetodologia((m) => !m)}
                aria-expanded={mostrarMetodologia}
              >
                <span>Metodologia</span>
                <span className="font-normal text-muted-foreground">
                  {mostrarMetodologia ? 'fechar' : 'ver e ajustar'}
                </span>
              </button>
              {mostrarMetodologia && (
                <Textarea
                  className="mt-2"
                  rows={6}
                  value={metodologia}
                  onChange={(e) => setMetodologia(e.target.value)}
                  maxLength={5000}
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRtDialogAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarFinalizacao} disabled={finalizando}>
              {finalizando ? 'Finalizando...' : 'Finalizar e gerar PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
