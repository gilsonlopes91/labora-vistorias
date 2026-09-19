/* Execução da vistoria: checklist item a item, com cálculo automático de multa. */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { ArrowLeft, AlertTriangle, Camera, MapPin, UserCog, FileCheck2 } from 'lucide-react'

import { formatBrazilianDate } from '@/lib/date'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { aplicarMarcaDagua } from '@/lib/marcaDagua'
import { gerarPdfVistoria } from '@/lib/relatorioVistoria'
import laboraLogoUrl from '@/assets/projeto-labora-engenharia-e-sst-07-83499.png'
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
  fotoUrl,
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
  TIPOS_REGISTRO_RT,
  type ResponsavelTecnico,
  type TipoRegistroRT,
} from '@/services/responsaveisTecnicos'
import { getModeloFormulario } from '@/services/formularios'
import { getFormulariosByVistoria, type Formulario } from '@/services/registrosFormulario'
import FormularioPreenchivel from '@/components/FormularioPreenchivel'

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

// NR-31 (trabalho rural): os itens dela têm código 231xxx no Anexo II da NR-28
// e NÃO usam a grade UFIR do Anexo I — a sanção segue o art. 18 da Lei
// 5.889/1973 (R$ 392,89 por trabalhador em situação irregular, dobrado na
// reincidência — Portaria MTE 1.131/2025), remetida pelo item 28.3.2 da NR-28
// (Portaria MTE 104/2026). O nº informado no item é de trabalhadores afetados
// (contratados ou não); o default é o total de trabalhadores da empresa.
const isItemNr31 = (item: ItemChecklist) => !!(item.codigo && item.codigo.startsWith('231'))

const TEXTO_NR31 =
  'Infração da NR-31 (trabalho rural): a multa não usa a grade de UFIR do Anexo I da NR-28. ' +
  'Pelo item 28.3.2 da NR-28 (Portaria MTE 104/2026), a sanção segue o art. 18 da Lei 5.889/1973: ' +
  'R$ 392,89 por empregado prejudicado, dobrada na reincidência — multa per capita. ' +
  'O número usado neste item é o informado no topo da página. Se a infração alcançar menos ' +
  'trabalhadores que o total do estabelecimento (ex.: falta de exame médico atinge só quem não ' +
  'fez), clique em "Alterar nº de empregados prejudicados" e informe só os afetados. ' +
  'Infrações coletivas (ex.: falta de PGRTR) usam o número de cima, sem alterar.'

const NOVO_RESPONSAVEL = '__novo__'

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
  const [nomesChecklist, setNomesChecklist] = useState<string[]>([])
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
  const [logoMarcaDagua, setLogoMarcaDagua] = useState<string>(laboraLogoUrl)
  const [nomeOrganizacao, setNomeOrganizacao] = useState<string>('LABORA')

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
  const [finalizando, setFinalizando] = useState(false)

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
      setItens(itensPorChecklist.flat())
      setNomesChecklist(
        idsChecklists.map((cid) => {
          if (cid === v.tipo_vistoria_id) {
            const t = v.expand?.tipo_vistoria_id
            return t?.nr_referencia || t?.nome || 'Checklist principal'
          }
          const extra = v.expand?.checklists?.find((c) => c.id === cid)
          return extra?.nr_referencia || extra?.nome || 'Checklist'
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
      // NR-31: default do nº de empregados prejudicados = total de trabalhadores
      // da empresa (nomenclatura da Lei 5.889/1973). Editável no topo da página.
      const emp = v.expand?.empresa_id as { numero_funcionarios?: number } | undefined
      if (emp?.numero_funcionarios) setNr31Empregados(String(emp.numero_funcionarios))
    } catch (error) {
      toast.error('Não foi possível carregar a vistoria', { description: getErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    getMinhaOrganizacao()
      .then((org) => {
        const url = urlLogoOrganizacao(org)
        if (url) setLogoMarcaDagua(url)
        if (org.nome) setNomeOrganizacao(org.nome)
      })
      .catch(() => {
        // sem organização carregada ainda — segue com os padrões da Labora
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

  const handleIrregularesBlur = async (item: ItemChecklist, valor: string) => {
    const existing = respostas[item.id]
    if (!existing) return
    const n = Math.max(0, Math.floor(Number(valor) || 0))
    if ((existing.numero_funcionarios_irregulares || 0) === n) return
    try {
      const updated = await updateResposta(existing.id, {
        numero_funcionarios_irregulares: n,
      } as unknown as { situacao?: Situacao })
      setRespostas((prev) => ({ ...prev, [item.id]: updated }))
    } catch (error) {
      toast.error('Não foi possível salvar o nº de empregados irregulares', {
        description: getErrorMessage(error),
      })
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

  const handleFotoChange = async (item: ItemChecklist, fileList: FileList | null) => {
    if (!vistoria || !fileList || fileList.length === 0) return
    const arquivosOriginais = Array.from(fileList)
    setUploadingItemId(item.id)
    try {
      let localizacao: GeoLocalizacao | undefined
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
      const fotos = await Promise.all(
        arquivosOriginais.map((arquivo) =>
          aplicarMarcaDagua(arquivo, {
            dataHora: agora,
            localizacao,
            logoUrl: logoMarcaDagua,
          }),
        ),
      )

      const existing = respostas[item.id]
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
    } catch (error) {
      toast.error('Não foi possível salvar a foto', { description: getErrorMessage(error) })
    } finally {
      setUploadingItemId(null)
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

  const abrirDialogFinalizacao = () => {
    if (!temChecklistOuFormulario) {
      toast.error('Não é possível finalizar a vistoria', {
        description:
          'É necessário ter ao menos um checklist ou um formulário de campo vinculado para finalizar.',
      })
      return
    }
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
    setRtDialogAberto(true)
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
      }

      const updated = await updateVistoria(vistoria.id, {
        status: 'concluida',
        responsavel_tecnico_nome: nomeRT,
        responsavel_tecnico_registro: registroRT,
      })
      const vistoriaFinalizada: Vistoria = {
        ...vistoria,
        status: updated.status,
        responsavel_tecnico_nome: updated.responsavel_tecnico_nome,
        responsavel_tecnico_registro: updated.responsavel_tecnico_registro,
      }
      setVistoria(vistoriaFinalizada)
      setRtDialogAberto(false)
      toast.success('Vistoria finalizada — gerando o PDF...')

      const empresa = vistoria.expand?.empresa_id
      const tipo = vistoria.expand?.tipo_vistoria_id
      try {
        await gerarPdfVistoria({
          vistoria: vistoriaFinalizada,
          empresaNome: empresa?.nome_fantasia || empresa?.razao_social || 'Empresa',
          empresaCnpj: empresa?.cnpj,
          empresaEndereco: empresa?.endereco,
          tipoNome: tipo?.nome || '',
          tipoNrReferencia: tipo?.nr_referencia,
          organizacaoNome: nomeOrganizacao,
          logoUrl: logoMarcaDagua,
          itens: itensOrdenados,
          respostas,
          resumo,
        })
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

  const itensOrdenados = useMemo(() => [...itens].sort(compararItemRef), [itens])

  const resumo = useMemo(() => {
    let conforme = 0
    let naoConforme = 0
    let naoAplica = 0
    let semResposta = 0
    let multaMin = 0
    let multaMax = 0
    for (const item of itensOrdenados) {
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
  }, [itensOrdenados, respostas])

  // NR-31 presente na vistoria? O resumo avisa que a parte rural usa outro
  // critério legal (Lei 5.889/1973), somado à grade UFIR das demais NRs.
  const temNr31 = useMemo(() => itensOrdenados.some((item) => isItemNr31(item)), [itensOrdenados])

  const progressoPct = itensOrdenados.length
    ? Math.round(((itensOrdenados.length - resumo.semResposta) / itensOrdenados.length) * 100)
    : 0

  const grupos = useMemo(() => {
    // Multi-NR: agrupa primeiro por checklist (NR) e depois por seção interna.
    // Com 1 checklist só, o visual continua igual ao de antes.
    const multi = nomesChecklist.length > 1
    const porChecklist = new Map<string, ItemChecklist[]>()
    const ordemChecklists: string[] = []
    for (const item of itensOrdenados) {
      if (!porChecklist.has(item.tipo_vistoria_id)) porChecklist.set(item.tipo_vistoria_id, [])
      porChecklist.get(item.tipo_vistoria_id)!.push(item)
      if (!ordemChecklists.includes(item.tipo_vistoria_id))
        ordemChecklists.push(item.tipo_vistoria_id)
    }
    if (!multi) {
      const map = new Map<string, ItemChecklist[]>()
      for (const item of itensOrdenados) {
        const key = item.secao || 'Disposições gerais'
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(item)
      }
      return Array.from(map.entries())
    }
    // multi: pares [titulo, itens] com titulo = "NR-XX · Seção"
    const saida: [string, ItemChecklist[]][] = []
    ordemChecklists.forEach((cid, idx) => {
      const nome = nomesChecklist[idx] || 'Checklist'
      const secoes = new Map<string, ItemChecklist[]>()
      for (const item of porChecklist.get(cid) || []) {
        const s = item.secao || 'Disposições gerais'
        if (!secoes.has(s)) secoes.set(s, [])
        secoes.get(s)!.push(item)
      }
      for (const [secao, itensSecao] of secoes.entries()) {
        saida.push([`${nome} · ${secao}`, itensSecao])
      }
    })
    return saida
  }, [itensOrdenados, nomesChecklist])

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
  const nomeTipoPrincipal =
    tipo?.nr_referencia && tipo?.nome && !tipo.nome.startsWith(tipo.nr_referencia)
      ? `${tipo.nr_referencia} — ${tipo.nome}`
      : tipo?.nome ||
        (vistoria.checklists?.length || vistoria.formularios?.length
          ? 'Vistoria personalizada'
          : 'Sem checklist vinculado')
  const rotuloBotaoFinalizar =
    vistoria.status === 'concluida' ? 'Gerar PDF novamente' : 'Finalizar vistoria'

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
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
          </p>
          {vistoria.responsavel_tecnico_nome && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <UserCog className="h-3 w-3" />
              Responsável técnico: {vistoria.responsavel_tecnico_nome} —{' '}
              {vistoria.responsavel_tecnico_registro}
            </p>
          )}
          {!!vistoria.expand?.checklists?.length && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Checklists NR adicionais:
              </span>
              {vistoria.expand.checklists.map((c) => (
                <Badge key={c.id} variant="outline" className="text-xs">
                  {c.nr_referencia || c.nome}
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
              disabled={savingGeo}
            />
          </label>
          <Select
            value={vistoria.status || 'agendada'}
            onValueChange={handleStatusSelect}
            disabled={savingStatus}
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
          </span>
          <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={abrirDialogFinalizacao}>
            <FileCheck2 className="h-3.5 w-3.5" />
            {rotuloBotaoFinalizar}
          </Button>
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
                  Soma dos itens marcados como não conforme, pela gradação do Anexo I da NR-28.
                  {temNr31 &&
                    ' Itens da NR-31 (trabalho rural) seguem o art. 18 da Lei 5.889/1973 — R$ 392,89 por empregado prejudicado (dobrado na reincidência), calculados pelo nº informado no topo ou no item.'}
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {temNr31 && (
        <Card className="mb-6 border-amber-300 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold uppercase tracking-wide text-amber-900">
                  NR-31 · Número de empregados irregulares
                </div>
                <div className="mt-0.5 text-xs leading-relaxed text-amber-900">
                  Multa per capita pelo art. 18 da Lei 5.889/1973 (R$ 392,89 por empregado
                  prejudicado, dobrada na reincidência). O padrão é o total de trabalhadores do
                  estabelecimento — usado quando a infração alcança a coletividade (ex.: falta de
                  PGRTR). Se a infração atingir menos trabalhadores (ex.: exame médico), altere o
                  número no item.
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-full text-xs"
                    onClick={() => setNr31Editando(true)}
                  >
                    Alterar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-8">
        {grupos.map(([secao, itensGrupo]) => (
          <div key={secao}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {secao}
            </h2>
            <div className="space-y-3">
              {itensGrupo.map((item) => {
                const resposta = respostas[item.id]
                const borderClass = resposta?.situacao
                  ? STATUS_BORDER[resposta.situacao]
                  : 'border-l-4 border-l-transparent'
                return (
                  <Card key={item.id} className={borderClass}>
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
                            {!item.grau && isItemNr31(item) && (
                              <Badge variant="outline" className="text-xs">
                                NR-31 · multa por empregado irregular
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
                    {resposta?.situacao && (
                      <CardContent className="pt-0">
                        {resposta.situacao === 'N/C' && isItemNr31(item) && (
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
                                    className="h-8 w-28"
                                  />
                                </>
                              ) : (
                                <>
                                  <span className="text-xs text-muted-foreground">
                                    Usando o nº do topo (
                                    {nr31Empregados || empresa?.numero_funcionarios || 0}{' '}
                                    empregados)
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 rounded-full text-xs"
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
                                  Multa calculada ao salvar o nº
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {resposta.situacao === 'N/C' &&
                          !isItemNr31(item) &&
                          (resposta.valor_multa_min || resposta.valor_multa_max) && (
                            <div className="mb-2 text-sm font-medium text-destructive">
                              Multa estimada: {currency.format(resposta.valor_multa_min || 0)} a{' '}
                              {currency.format(resposta.valor_multa_max || 0)}
                            </div>
                          )}
                        <Textarea
                          placeholder={OBSERVACAO_PLACEHOLDER[resposta.situacao]}
                          defaultValue={resposta.observacao}
                          onBlur={(e) => handleObservacaoBlur(item, e.target.value)}
                          className="mb-2 text-sm"
                        />

                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            id={`foto-${item.id}`}
                            className="hidden"
                            onChange={(e) => {
                              handleFotoChange(item, e.target.files)
                              e.target.value = ''
                            }}
                          />
                          <label
                            htmlFor={`foto-${item.id}`}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            {uploadingItemId === item.id
                              ? 'Enviando...'
                              : resposta.foto?.length
                                ? 'Adicionar mais fotos'
                                : 'Adicionar foto'}
                          </label>
                          {temLocalizacaoValida(resposta.localizacao) && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {resposta.localizacao!.lat.toFixed(5)},{' '}
                              {resposta.localizacao!.lon.toFixed(5)}
                            </span>
                          )}
                        </div>

                        {resposta.foto && resposta.foto.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {resposta.foto.map((filename) => (
                              <a
                                key={filename}
                                href={fotoUrl(resposta, filename)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={fotoUrl(resposta, filename)}
                                  alt="Foto da vistoria"
                                  className="h-16 w-16 rounded-md border object-cover"
                                />
                              </a>
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

      <Dialog open={rtDialogAberto} onOpenChange={setRtDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responsável técnico do laudo</DialogTitle>
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
