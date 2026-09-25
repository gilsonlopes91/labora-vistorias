/* Criação e edição de orçamento, em formato enxuto.
   Na frente fica só o que toda proposta precisa: cliente, título, itens,
   prazos, pagamento e responsável técnico. O resto (escopo e normas,
   situação e acompanhamento, modelo do PDF) fica em seções recolhidas.

   Tudo o que alimenta os indicadores do painel está aqui:
   - valor total (soma dos itens) → orçado, aprovado, ticket médio, conversão;
   - status e data de envio/aprovação → contagens por status;
   - data da proposta + validade → "vencendo em 7 dias";
   - previsão de recebimento → "pagamento em atraso" automático. */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, Plus, Search, Trash2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { formatLocalDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import { getEmpresas, type Empresa } from '@/services/empresas'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import {
  getResponsaveisTecnicos,
  formatarRegistroRT,
  type ResponsavelTecnico,
} from '@/services/responsaveisTecnicos'
import {
  criarNormaReferencia,
  getNormasReferencia,
  type NormaReferencia,
} from '@/services/normasReferencia'
import { getModelosProposta, LAYOUT_LABEL, type ModeloProposta } from '@/services/modelosProposta'
import {
  camposAoMudarStatus,
  createOrcamento,
  statusFinanceiroPorValores,
  updateOrcamento,
  subtotalItem,
  totalItens,
  STATUS_LABEL,
  STATUS_ORDEM,
  type ItemOrcamento,
  type ItemServico,
  type ItemTreinamento,
  type Orcamento,
  type OrcamentoInput,
  type StatusOrcamento,
  type TipoOrcamento,
} from '@/services/orcamentos'

import CampoMoeda from '@/components/CampoMoeda'
import { Button } from '@/components/ui/button'
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

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const itemServicoVazio = (): ItemServico => ({
  descricao: '',
  quantidade: 1,
  unidade: 'un',
  valor_unitario: 0,
})

const itemTreinamentoVazio = (): ItemTreinamento => ({
  nome: '',
  carga_horaria: '',
  pessoas: 1,
  turmas: 1,
  valor_unitario: 0,
})

const linhasParaLista = (texto: string): string[] =>
  texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

const listaParaLinhas = (lista?: string[]): string => (lista || []).join('\n')

const RT_OUTRO = '__outro__'

/** Seção recolhível com um resumo do que já foi preenchido. */
function Recolhivel({
  titulo,
  resumo,
  children,
  inicialAberto = false,
}: {
  titulo: string
  resumo?: string
  children: React.ReactNode
  inicialAberto?: boolean
}) {
  const [aberto, setAberto] = useState(inicialAberto)
  return (
    <div className="rounded-xl border">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-accent/30"
        aria-expanded={aberto}
      >
        <span className="text-sm font-semibold">{titulo}</span>
        <span className="flex min-w-0 items-center gap-2">
          {resumo && <span className="truncate text-xs text-muted-foreground">{resumo}</span>}
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 transition-transform', aberto && 'rotate-180')}
          />
        </span>
      </button>
      {aberto && <div className="space-y-4 border-t px-3 pb-3 pt-3">{children}</div>}
    </div>
  )
}

export function OrcamentoDialog({
  orcamento,
  open,
  onOpenChange,
  onSalvo,
}: {
  orcamento: Orcamento | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSalvo: () => void
}) {
  const editando = !!orcamento

  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [modelos, setModelos] = useState<ModeloProposta[]>([])
  const [normas, setNormas] = useState<NormaReferencia[]>([])
  const [rts, setRts] = useState<ResponsavelTecnico[]>([])
  const [salvando, setSalvando] = useState(false)

  const [empresaId, setEmpresaId] = useState('')
  const [modeloId, setModeloId] = useState('')
  const [tipo, setTipo] = useState<TipoOrcamento>('servico')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [status, setStatus] = useState<StatusOrcamento>('rascunho')
  const [dataProposta, setDataProposta] = useState('')
  const [validadeDias, setValidadeDias] = useState('30')
  const [itens, setItens] = useState<ItemOrcamento[]>([itemServicoVazio()])
  const [valorEntrada, setValorEntrada] = useState('')
  const [pagamento, setPagamento] = useState('')
  const [prazoEntrega, setPrazoEntrega] = useState('')
  const [previsaoRecebimento, setPrevisaoRecebimento] = useState('')
  const [normasSelecionadas, setNormasSelecionadas] = useState<string[]>([])
  const [buscaNorma, setBuscaNorma] = useState('')
  const [novaNorma, setNovaNorma] = useState('')
  const [inclusos, setInclusos] = useState('')
  const [exclusos, setExclusos] = useState('')
  const [rtEscolhido, setRtEscolhido] = useState('')
  const [engenheiro, setEngenheiro] = useState('')
  const [crea, setCrea] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [motivoRecusa, setMotivoRecusa] = useState('')
  const [proximoContato, setProximoContato] = useState('')
  const [proximaAcao, setProximaAcao] = useState('')

  useEffect(() => {
    if (!open) return
    getEmpresas()
      .then(setEmpresas)
      .catch(() => setEmpresas([]))
    getModelosProposta()
      .then(setModelos)
      .catch(() => setModelos([]))
    getNormasReferencia()
      .then(setNormas)
      .catch(() => setNormas([]))
    getMinhaOrganizacao()
      .then((org) => getResponsaveisTecnicos(org.id))
      .then(setRts)
      .catch(() => setRts([]))
  }, [open])

  useEffect(() => {
    if (!open) return
    if (orcamento) {
      setEmpresaId(orcamento.empresa_id || '')
      setModeloId(orcamento.modelo_proposta_id || '')
      setTipo(orcamento.tipo)
      setTitulo(orcamento.titulo || '')
      setDescricao(orcamento.descricao || '')
      setStatus(orcamento.status)
      setDataProposta((orcamento.data_proposta || '').slice(0, 10))
      setValidadeDias(String(orcamento.validade_dias ?? 30))
      setItens(
        orcamento.itens && orcamento.itens.length
          ? orcamento.itens
          : [orcamento.tipo === 'treinamento' ? itemTreinamentoVazio() : itemServicoVazio()],
      )
      setValorEntrada(orcamento.valor_entrada ? String(orcamento.valor_entrada) : '')
      // Condição e forma de pagamento viraram um campo só.
      setPagamento(
        [orcamento.condicao_pagamento, orcamento.forma_pagamento]
          .map((s) => (s || '').trim())
          .filter(Boolean)
          .join(' · '),
      )
      setPrazoEntrega(orcamento.prazo_entrega || '')
      setPrevisaoRecebimento((orcamento.data_prevista_recebimento || '').slice(0, 10))
      setNormasSelecionadas(orcamento.normas_referencia || [])
      setInclusos(listaParaLinhas(orcamento.itens_inclusos))
      setExclusos(listaParaLinhas(orcamento.itens_exclusos))
      setEngenheiro(orcamento.responsavel_engenheiro || '')
      setCrea(orcamento.crea || '')
      setRtEscolhido('')
      setObservacoes(orcamento.observacoes || '')
      setMotivoRecusa(orcamento.motivo_recusa || '')
      setProximoContato((orcamento.proximo_contato || '').slice(0, 10))
      setProximaAcao(orcamento.proxima_acao || '')
    } else {
      setEmpresaId('')
      setModeloId('')
      setTipo('servico')
      setTitulo('')
      setDescricao('')
      setStatus('rascunho')
      // data de hoje no fuso do aparelho (toISOString daria o dia seguinte à noite)
      setDataProposta(formatLocalDate(new Date()))
      setValidadeDias('30')
      setItens([itemServicoVazio()])
      setValorEntrada('')
      setPagamento('')
      setPrazoEntrega('')
      setPrevisaoRecebimento('')
      setNormasSelecionadas([])
      setInclusos('')
      setExclusos('')
      setEngenheiro('')
      setCrea('')
      setRtEscolhido('')
      setObservacoes('')
      setMotivoRecusa('')
      setProximoContato('')
      setProximaAcao('')
    }
    setBuscaNorma('')
    setNovaNorma('')
  }, [open, orcamento])

  // Responsável técnico: casa o texto salvo com um cadastrado; orçamento novo
  // já vem com o responsável padrão da organização.
  useEffect(() => {
    if (!open || rtEscolhido) return
    if (editando) {
      if (!engenheiro) return
      const achado = rts.find((r) => r.nome === engenheiro && formatarRegistroRT(r) === crea)
      setRtEscolhido(achado ? achado.id : RT_OUTRO)
      return
    }
    if (!rts.length) return
    const padrao = rts.find((r) => r.padrao) || rts[0]
    setRtEscolhido(padrao.id)
    setEngenheiro(padrao.nome)
    setCrea(formatarRegistroRT(padrao))
  }, [open, editando, rts, rtEscolhido, engenheiro, crea])

  const escolherRt = (id: string) => {
    setRtEscolhido(id)
    if (id === RT_OUTRO) return
    const rt = rts.find((r) => r.id === id)
    if (rt) {
      setEngenheiro(rt.nome)
      setCrea(formatarRegistroRT(rt))
    }
  }

  // Orçamento novo já nasce com o modelo marcado como padrão.
  useEffect(() => {
    if (!open || editando || modeloId || !modelos.length) return
    const padrao = modelos.find((m) => m.padrao) || modelos[0]
    if (padrao) setModeloId(padrao.id)
  }, [open, editando, modeloId, modelos])

  // O escopo padrão do modelo entra preenchido no orçamento novo, só onde está em branco.
  useEffect(() => {
    if (!open || editando || !modeloId) return
    const modelo = modelos.find((m) => m.id === modeloId)
    if (!modelo) return
    setInclusos((atual) => (atual.trim() ? atual : listaParaLinhas(modelo.itens_inclusos_padrao)))
    setExclusos((atual) => (atual.trim() ? atual : listaParaLinhas(modelo.itens_exclusos_padrao)))
  }, [open, editando, modeloId, modelos])

  const trocarTipo = (novo: TipoOrcamento) => {
    if (novo === tipo) return
    setTipo(novo)
    setItens([novo === 'treinamento' ? itemTreinamentoVazio() : itemServicoVazio()])
  }

  const atualizarItem = (indice: number, campo: string, valor: string | number) => {
    setItens((atual) => atual.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item)))
  }

  const adicionarItem = () =>
    setItens((atual) => [
      ...atual,
      tipo === 'treinamento' ? itemTreinamentoVazio() : itemServicoVazio(),
    ])

  const removerItem = (indice: number) =>
    setItens((atual) => (atual.length === 1 ? atual : atual.filter((_, i) => i !== indice)))

  const total = totalItens(itens)

  const normasFiltradas = useMemo(() => {
    const termo = buscaNorma.trim().toLowerCase()
    if (!termo) return normas
    return normas.filter((n) => n.nome.toLowerCase().includes(termo))
  }, [normas, buscaNorma])

  const alternarNorma = (nome: string) =>
    setNormasSelecionadas((atual) =>
      atual.includes(nome) ? atual.filter((n) => n !== nome) : [...atual, nome],
    )

  const cadastrarNorma = async () => {
    const nome = novaNorma.trim()
    if (!nome) return
    try {
      const org = await getMinhaOrganizacao()
      const criada = await criarNormaReferencia(org.id, nome)
      setNormas((atual) => [...atual, criada])
      setNormasSelecionadas((atual) => [...atual, criada.nome])
      setNovaNorma('')
      toast.success('Norma adicionada ao catálogo')
    } catch (error) {
      toast.error('Não foi possível adicionar a norma', { description: getErrorMessage(error) })
    }
  }

  const salvar = async () => {
    if (!empresaId) {
      toast.error('Escolha a empresa')
      return
    }
    if (!titulo.trim()) {
      toast.error('Informe o título da proposta')
      return
    }
    if (total <= 0) {
      toast.error('Informe ao menos um item com valor', {
        description: 'O valor total entra nos indicadores do painel.',
      })
      return
    }

    setSalvando(true)
    try {
      const dados: Record<string, unknown> = {
        empresa_id: empresaId,
        modelo_proposta_id: modeloId || undefined,
        tipo,
        titulo: titulo.trim(),
        descricao,
        itens,
        valor_total: total,
        valor_entrada: valorEntrada ? Number(valorEntrada) : 0,
        status,
        data_proposta: dataProposta || undefined,
        validade_dias: validadeDias ? Number(validadeDias) : undefined,
        condicao_pagamento: pagamento.trim(),
        forma_pagamento: '',
        prazo_entrega: prazoEntrega,
        data_prevista_recebimento: previsaoRecebimento || '',
        normas_referencia: normasSelecionadas,
        itens_inclusos: linhasParaLista(inclusos),
        itens_exclusos: linhasParaLista(exclusos),
        responsavel_engenheiro: engenheiro.trim(),
        crea: crea.trim(),
        observacoes,
        motivo_recusa: motivoRecusa,
        proximo_contato: proximoContato || '',
        proxima_acao: proximaAcao,
      }

      if (orcamento) {
        // Datas de envio/aprovação e financeiro acompanham a troca de status,
        // igual à troca rápida na lista.
        if (status !== orcamento.status) {
          Object.assign(dados, camposAoMudarStatus(orcamento, status))
        }
        // Total mudou com valores já recebidos: recalcula o financeiro.
        const financeiro = statusFinanceiroPorValores(
          {
            valor_recebido: orcamento.valor_recebido,
            status_financeiro:
              (dados.status_financeiro as Orcamento['status_financeiro']) ??
              orcamento.status_financeiro,
          },
          total,
        )
        if (financeiro) dados.status_financeiro = financeiro
        await updateOrcamento(orcamento.id, dados as Partial<OrcamentoInput>)
        toast.success('Orçamento atualizado')
      } else {
        const org = await getMinhaOrganizacao()
        await createOrcamento({
          ...dados,
          ...camposAoMudarStatus({ status: 'rascunho' }, status),
          organizacao_id: org.id,
          empresa_id: empresaId,
          titulo: titulo.trim(),
          tipo,
          status,
        } as OrcamentoInput)
        toast.success('Orçamento criado')
      }
      onSalvo()
      onOpenChange(false)
    } catch (error) {
      toast.error('Não foi possível salvar o orçamento', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  const resumoEscopo =
    [
      normasSelecionadas.length ? `${normasSelecionadas.length} norma(s)` : '',
      linhasParaLista(inclusos).length ? `${linhasParaLista(inclusos).length} incluso(s)` : '',
      linhasParaLista(exclusos).length ? `${linhasParaLista(exclusos).length} não incluso(s)` : '',
    ]
      .filter(Boolean)
      .join(' · ') || 'nada preenchido'

  const resumoSituacao = [
    STATUS_LABEL[status],
    proximoContato
      ? `retomar em ${new Date(proximoContato + 'T12:00').toLocaleDateString('pt-BR')}`
      : '',
  ]
    .filter(Boolean)
    .join(' · ')

  const modeloAtual = modelos.find((m) => m.id === modeloId)
  const resumoModelo = [
    modeloAtual ? modeloAtual.nome : '',
    valorEntrada && Number(valorEntrada) > 0 ? `entrada ${brl.format(Number(valorEntrada))}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editando ? `Orçamento ${orcamento?.numero || ''}` : 'Novo orçamento'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Cliente e objeto */}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <Label>Empresa *</Label>
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Escolha a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome_fantasia || empresa.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <div className="mt-1.5 flex h-10 rounded-md border p-0.5" role="group">
                {(['servico', 'treinamento'] as TipoOrcamento[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => trocarTipo(t)}
                    className={cn(
                      'rounded px-3 text-sm',
                      tipo === t ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/40',
                    )}
                    aria-pressed={tipo === t}
                  >
                    {t === 'servico' ? 'Serviço' : 'Treinamento'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={
                tipo === 'treinamento'
                  ? 'Ex.: Treinamento NR-35 para a equipe de manutenção'
                  : 'Ex.: Elaboração de PGR e PCMSO'
              }
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="mt-1.5"
            />
          </div>

          {/* Itens */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>{tipo === 'treinamento' ? 'Turmas e valores *' : 'Itens e valores *'}</Label>
              <Button type="button" variant="outline" size="sm" onClick={adicionarItem}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Item
              </Button>
            </div>
            <div className="space-y-2">
              {itens.map((item, indice) => (
                <div key={indice} className="rounded-xl border p-2.5">
                  {tipo === 'treinamento' ? (
                    <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
                      <Input
                        className="col-span-6 sm:col-span-4"
                        placeholder="Treinamento (ex.: NR-35)"
                        value={(item as ItemTreinamento).nome}
                        onChange={(e) => atualizarItem(indice, 'nome', e.target.value)}
                      />
                      <Input
                        className="col-span-2 sm:col-span-2"
                        placeholder="Carga h."
                        value={(item as ItemTreinamento).carga_horaria}
                        onChange={(e) => atualizarItem(indice, 'carga_horaria', e.target.value)}
                      />
                      <Input
                        className="col-span-2 sm:col-span-2"
                        type="number"
                        min="0"
                        placeholder="Pessoas"
                        title="Pessoas"
                        value={(item as ItemTreinamento).pessoas}
                        onChange={(e) => atualizarItem(indice, 'pessoas', Number(e.target.value))}
                      />
                      <Input
                        className="col-span-2 sm:col-span-1"
                        type="number"
                        min="0"
                        placeholder="Turmas"
                        title="Turmas"
                        value={(item as ItemTreinamento).turmas}
                        onChange={(e) => atualizarItem(indice, 'turmas', Number(e.target.value))}
                      />
                      <CampoMoeda
                        className="col-span-5 sm:col-span-2"
                        placeholder="por pessoa"
                        title="Valor por pessoa"
                        valor={item.valor_unitario || 0}
                        onChange={(v) => atualizarItem(indice, 'valor_unitario', v)}
                      />
                      <div className="col-span-1 flex items-center justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Remover item"
                          onClick={() => removerItem(indice)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
                      <Input
                        className="col-span-6 sm:col-span-6"
                        placeholder="Descrição do serviço"
                        value={(item as ItemServico).descricao}
                        onChange={(e) => atualizarItem(indice, 'descricao', e.target.value)}
                      />
                      <Input
                        className="col-span-2 sm:col-span-2"
                        type="number"
                        min="0"
                        placeholder="Qtd."
                        title="Quantidade"
                        value={(item as ItemServico).quantidade}
                        onChange={(e) =>
                          atualizarItem(indice, 'quantidade', Number(e.target.value))
                        }
                      />
                      <CampoMoeda
                        className="col-span-3 sm:col-span-3"
                        placeholder="Valor unit."
                        title="Valor unitário"
                        valor={item.valor_unitario || 0}
                        onChange={(v) => atualizarItem(indice, 'valor_unitario', v)}
                      />
                      <div className="col-span-1 flex items-center justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Remover item"
                          onClick={() => removerItem(indice)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {itens.length > 1 && (
                    <div className="mt-1 text-right text-xs text-muted-foreground">
                      Subtotal {brl.format(subtotalItem(item))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5">
              <span className="text-sm font-medium">Valor total</span>
              <span className="text-lg font-bold tabular-nums">{brl.format(total)}</span>
            </div>
          </div>

          {/* Condições */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="validade">Validade (dias)</Label>
              <Input
                id="validade"
                type="number"
                min="0"
                value={validadeDias}
                onChange={(e) => setValidadeDias(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="prazo">Prazo de entrega</Label>
              <Input
                id="prazo"
                value={prazoEntrega}
                onChange={(e) => setPrazoEntrega(e.target.value)}
                placeholder="Ex.: 30 dias"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="previsao">Previsão de recebimento</Label>
              <Input
                id="previsao"
                type="date"
                value={previsaoRecebimento}
                onChange={(e) => setPrevisaoRecebimento(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="pagamento">Pagamento</Label>
              <Input
                id="pagamento"
                value={pagamento}
                onChange={(e) => setPagamento(e.target.value)}
                placeholder="Ex.: 50% na assinatura e 50% na entrega, por PIX ou boleto"
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-3">
              <Label>Responsável técnico</Label>
              <Select value={rtEscolhido} onValueChange={escolherRt}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Escolha o responsável técnico" />
                </SelectTrigger>
                <SelectContent>
                  {rts.map((rt) => (
                    <SelectItem key={rt.id} value={rt.id}>
                      {rt.nome} · {formatarRegistroRT(rt)}
                    </SelectItem>
                  ))}
                  <SelectItem value={RT_OUTRO}>Outro (digitar)</SelectItem>
                </SelectContent>
              </Select>
              {rtEscolhido === RT_OUTRO && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Input
                    value={engenheiro}
                    onChange={(e) => setEngenheiro(e.target.value)}
                    placeholder="Nome"
                  />
                  <Input
                    value={crea}
                    onChange={(e) => setCrea(e.target.value)}
                    placeholder="Registro (ex.: CREA-PI nº 12345)"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Seções recolhidas */}
          <div className="space-y-2">
            <Recolhivel titulo="Escopo e normas" resumo={resumoEscopo}>
              <div className="rounded-xl border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-sm">Normas e leis de referência</Label>
                  <span className="text-xs text-muted-foreground">
                    {normasSelecionadas.length} selecionada(s)
                  </span>
                </div>
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={buscaNorma}
                    onChange={(e) => setBuscaNorma(e.target.value)}
                    placeholder="Filtrar normas..."
                    className="h-9 pl-9 text-sm"
                  />
                </div>
                <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                  {normasFiltradas.map((norma) => (
                    <label
                      key={norma.id}
                      className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40"
                    >
                      <Checkbox
                        checked={normasSelecionadas.includes(norma.nome)}
                        onCheckedChange={() => alternarNorma(norma.nome)}
                        className="mt-0.5"
                      />
                      <span className="leading-snug">{norma.nome}</span>
                    </label>
                  ))}
                  {normasFiltradas.length === 0 && (
                    <p className="px-2 py-3 text-xs text-muted-foreground">
                      Nenhuma norma encontrada com esse filtro.
                    </p>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={novaNorma}
                    onChange={(e) => setNovaNorma(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        cadastrarNorma()
                      }
                    }}
                    placeholder="Adicionar outra norma ao catálogo..."
                    className="h-9 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={cadastrarNorma}
                    title="Adicionar norma"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="inclusos">Incluso (um por linha)</Label>
                  <Textarea
                    id="inclusos"
                    value={inclusos}
                    onChange={(e) => setInclusos(e.target.value)}
                    rows={4}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="exclusos">Não incluso (um por linha)</Label>
                  <Textarea
                    id="exclusos"
                    value={exclusos}
                    onChange={(e) => setExclusos(e.target.value)}
                    rows={4}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </Recolhivel>

            <Recolhivel
              titulo="Situação e acompanhamento"
              resumo={resumoSituacao}
              inicialAberto={status === 'recusado' || status === 'cancelado'}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as StatusOrcamento)}>
                    <SelectTrigger className="mt-1.5">
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
                </div>
                <div>
                  <Label htmlFor="data">Data da proposta</Label>
                  <Input
                    id="data"
                    type="date"
                    value={dataProposta}
                    onChange={(e) => setDataProposta(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                {(status === 'recusado' || status === 'cancelado') && (
                  <div className="sm:col-span-2">
                    <Label htmlFor="motivo">
                      Motivo {status === 'recusado' ? 'da recusa' : 'do cancelamento'}
                    </Label>
                    <Input
                      id="motivo"
                      value={motivoRecusa}
                      onChange={(e) => setMotivoRecusa(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="proxcontato">Próximo contato</Label>
                  <Input
                    id="proxcontato"
                    type="date"
                    value={proximoContato}
                    onChange={(e) => setProximoContato(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="proxacao">Próxima ação</Label>
                  <Input
                    id="proxacao"
                    value={proximaAcao}
                    onChange={(e) => setProximaAcao(e.target.value)}
                    placeholder="Ex.: ligar para o RH"
                    className="mt-1.5"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="obs">Observações internas (não saem no PDF)</Label>
                  <Textarea
                    id="obs"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={2}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </Recolhivel>

            <Recolhivel titulo="Modelo do PDF e entrada" resumo={resumoModelo}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Modelo do PDF</Label>
                  <Select value={modeloId} onValueChange={setModeloId}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Escolha o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelos.map((modelo) => (
                        <SelectItem key={modelo.id} value={modelo.id}>
                          {modelo.nome} ({LAYOUT_LABEL[modelo.layout]})
                          {modelo.padrao ? ' · padrão' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="entrada">Valor de entrada (opcional)</Label>
                  <CampoMoeda
                    id="entrada"
                    valor={Number(valorEntrada) || 0}
                    onChange={(v) => setValorEntrada(v ? String(v) : '')}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </Recolhivel>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar orçamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
