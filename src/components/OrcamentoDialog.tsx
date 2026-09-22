/* Criação e edição de orçamento. Dois formatos de proposta no mesmo diálogo:
   "Serviço" (descrição, quantidade, unidade, valor unitário) e "Treinamento"
   (carga horária, nº de pessoas, turmas, valor unitário). O valor total é
   sempre a soma dos itens, nunca digitado à mão.

   As normas de referência vêm do catálogo em múltipla escolha, com campo para
   cadastrar uma nova sem sair da tela. */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Trash2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getEmpresas, type Empresa } from '@/services/empresas'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import {
  criarNormaReferencia,
  getNormasReferencia,
  type NormaReferencia,
} from '@/services/normasReferencia'
import { getModelosProposta, LAYOUT_LABEL, type ModeloProposta } from '@/services/modelosProposta'
import {
  createOrcamento,
  updateOrcamento,
  subtotalItem,
  totalItens,
  STATUS_LABEL,
  STATUS_ORDEM,
  type ItemOrcamento,
  type ItemServico,
  type ItemTreinamento,
  type Orcamento,
  type StatusOrcamento,
  type TipoOrcamento,
} from '@/services/orcamentos'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
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

function Bloco({
  numero,
  titulo,
  children,
}: {
  numero: number
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
          {numero}
        </span>
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {titulo}
        </span>
      </div>
      {children}
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
  const [condicaoPagamento, setCondicaoPagamento] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('')
  const [prazoEntrega, setPrazoEntrega] = useState('')
  const [normasSelecionadas, setNormasSelecionadas] = useState<string[]>([])
  const [buscaNorma, setBuscaNorma] = useState('')
  const [novaNorma, setNovaNorma] = useState('')
  const [inclusos, setInclusos] = useState('')
  const [exclusos, setExclusos] = useState('')
  const [engenheiro, setEngenheiro] = useState('')
  const [crea, setCrea] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [motivoRecusa, setMotivoRecusa] = useState('')
  const [proximoContato, setProximoContato] = useState('')
  const [proximaAcao, setProximaAcao] = useState('')
  const [responsavelFollowup, setResponsavelFollowup] = useState('')

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
      setCondicaoPagamento(orcamento.condicao_pagamento || '')
      setFormaPagamento(orcamento.forma_pagamento || '')
      setPrazoEntrega(orcamento.prazo_entrega || '')
      setNormasSelecionadas(orcamento.normas_referencia || [])
      setInclusos(listaParaLinhas(orcamento.itens_inclusos))
      setExclusos(listaParaLinhas(orcamento.itens_exclusos))
      setEngenheiro(orcamento.responsavel_engenheiro || '')
      setCrea(orcamento.crea || '')
      setObservacoes(orcamento.observacoes || '')
      setMotivoRecusa(orcamento.motivo_recusa || '')
      setProximoContato((orcamento.proximo_contato || '').slice(0, 10))
      setProximaAcao(orcamento.proxima_acao || '')
      setResponsavelFollowup(orcamento.responsavel_followup || '')
    } else {
      setEmpresaId('')
      setModeloId('')
      setTipo('servico')
      setTitulo('')
      setDescricao('')
      setStatus('rascunho')
      setDataProposta(new Date().toISOString().slice(0, 10))
      setValidadeDias('30')
      setItens([itemServicoVazio()])
      setValorEntrada('')
      setCondicaoPagamento('')
      setFormaPagamento('')
      setPrazoEntrega('')
      setNormasSelecionadas([])
      setInclusos('')
      setExclusos('')
      setEngenheiro('')
      setCrea('')
      setObservacoes('')
      setMotivoRecusa('')
      setProximoContato('')
      setProximaAcao('')
      setResponsavelFollowup('')
    }
    setBuscaNorma('')
    setNovaNorma('')
  }, [open, orcamento])

  // Orçamento novo já nasce com o modelo marcado como padrão.
  useEffect(() => {
    if (!open || editando || modeloId || !modelos.length) return
    const padrao = modelos.find((m) => m.padrao) || modelos[0]
    if (padrao) setModeloId(padrao.id)
  }, [open, editando, modeloId, modelos])

  const trocarTipo = (novo: TipoOrcamento) => {
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

    setSalvando(true)
    try {
      const dados = {
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
        condicao_pagamento: condicaoPagamento,
        forma_pagamento: formaPagamento,
        prazo_entrega: prazoEntrega,
        normas_referencia: normasSelecionadas,
        itens_inclusos: linhasParaLista(inclusos),
        itens_exclusos: linhasParaLista(exclusos),
        responsavel_engenheiro: engenheiro,
        crea,
        observacoes,
        motivo_recusa: motivoRecusa,
        proximo_contato: proximoContato || undefined,
        proxima_acao: proximaAcao,
        responsavel_followup: responsavelFollowup,
      }

      if (orcamento) {
        await updateOrcamento(orcamento.id, dados)
        toast.success('Orçamento atualizado')
      } else {
        const org = await getMinhaOrganizacao()
        await createOrcamento({
          ...dados,
          organizacao_id: org.id,
          status_financeiro: 'nao_faturado',
        })
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editando ? `Orçamento ${orcamento?.numero || ''}` : 'Novo orçamento'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Bloco numero={1} titulo="Cliente e formato">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Empresa</Label>
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
                <Label>Tipo de proposta</Label>
                <Select value={tipo} onValueChange={(v) => trocarTipo(v as TipoOrcamento)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="treinamento">Treinamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
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
            </div>
          </Bloco>

          <Bloco numero={2} titulo="Objeto da proposta">
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex.: Elaboração de PGR e PCMSO"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição do serviço</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  className="mt-1.5"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
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
              </div>
              {(status === 'recusado' || status === 'cancelado') && (
                <div>
                  <Label htmlFor="motivo">
                    Motivo {status === 'recusado' ? 'da recusa' : 'do cancelamento'}
                  </Label>
                  <Textarea
                    id="motivo"
                    value={motivoRecusa}
                    onChange={(e) => setMotivoRecusa(e.target.value)}
                    rows={2}
                    className="mt-1.5"
                  />
                </div>
              )}
            </div>
          </Bloco>

          <Bloco numero={3} titulo="Normas de referência e escopo">
            <div className="space-y-4">
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
                <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
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
                  <Button type="button" variant="outline" size="sm" onClick={cadastrarNorma}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="inclusos">Itens inclusos na proposta</Label>
                  <Textarea
                    id="inclusos"
                    value={inclusos}
                    onChange={(e) => setInclusos(e.target.value)}
                    rows={5}
                    placeholder={
                      'Um por linha\nVisita técnica para levantamento em campo\nEmissão de ART'
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="exclusos">Itens não inclusos</Label>
                  <Textarea
                    id="exclusos"
                    value={exclusos}
                    onChange={(e) => setExclusos(e.target.value)}
                    rows={5}
                    placeholder={
                      'Um por linha\nExames médicos ocupacionais\nAdequações estruturais'
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          </Bloco>

          <Bloco
            numero={4}
            titulo={tipo === 'treinamento' ? 'Turmas e valores' : 'Itens e valores'}
          >
            <div>
              <div className="mb-2 flex items-center justify-end">
                <Button type="button" variant="outline" size="sm" onClick={adicionarItem}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Adicionar item
                </Button>
              </div>

              <div className="space-y-2">
                {itens.map((item, indice) => (
                  <div key={indice} className="rounded-xl border p-3">
                    {tipo === 'treinamento' ? (
                      <div className="grid gap-2 sm:grid-cols-12">
                        <Input
                          className="sm:col-span-4"
                          placeholder="Treinamento (ex.: NR-35)"
                          value={(item as ItemTreinamento).nome}
                          onChange={(e) => atualizarItem(indice, 'nome', e.target.value)}
                        />
                        <Input
                          className="sm:col-span-2"
                          placeholder="Carga h."
                          value={(item as ItemTreinamento).carga_horaria}
                          onChange={(e) => atualizarItem(indice, 'carga_horaria', e.target.value)}
                        />
                        <Input
                          className="sm:col-span-2"
                          type="number"
                          min="0"
                          placeholder="Pessoas"
                          value={(item as ItemTreinamento).pessoas}
                          onChange={(e) => atualizarItem(indice, 'pessoas', Number(e.target.value))}
                        />
                        <Input
                          className="sm:col-span-1"
                          type="number"
                          min="0"
                          placeholder="Turmas"
                          value={(item as ItemTreinamento).turmas}
                          onChange={(e) => atualizarItem(indice, 'turmas', Number(e.target.value))}
                        />
                        <Input
                          className="sm:col-span-2"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Valor unit."
                          value={item.valor_unitario}
                          onChange={(e) =>
                            atualizarItem(indice, 'valor_unitario', Number(e.target.value))
                          }
                        />
                        <div className="flex items-center justify-end sm:col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removerItem(indice)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-12">
                        <Input
                          className="sm:col-span-6"
                          placeholder="Descrição do serviço"
                          value={(item as ItemServico).descricao}
                          onChange={(e) => atualizarItem(indice, 'descricao', e.target.value)}
                        />
                        <Input
                          className="sm:col-span-2"
                          type="number"
                          min="0"
                          placeholder="Qtd."
                          value={(item as ItemServico).quantidade}
                          onChange={(e) =>
                            atualizarItem(indice, 'quantidade', Number(e.target.value))
                          }
                        />
                        <Input
                          className="sm:col-span-1"
                          placeholder="Un."
                          value={(item as ItemServico).unidade}
                          onChange={(e) => atualizarItem(indice, 'unidade', e.target.value)}
                        />
                        <Input
                          className="sm:col-span-2"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Valor unit."
                          value={item.valor_unitario}
                          onChange={(e) =>
                            atualizarItem(indice, 'valor_unitario', Number(e.target.value))
                          }
                        />
                        <div className="flex items-center justify-end sm:col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removerItem(indice)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="mt-1 text-right text-xs text-muted-foreground">
                      Subtotal {brl.format(subtotalItem(item))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-sm font-medium">Valor total da proposta</span>
                <span className="text-lg font-bold">{brl.format(total)}</span>
              </div>
            </div>
          </Bloco>

          <Bloco numero={5} titulo="Condições comerciais">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="entrada">Valor de entrada</Label>
                <Input
                  id="entrada"
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorEntrada}
                  onChange={(e) => setValorEntrada(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="prazo">Prazo de entrega</Label>
                <Input
                  id="prazo"
                  value={prazoEntrega}
                  onChange={(e) => setPrazoEntrega(e.target.value)}
                  placeholder="Ex.: 30 dias após a assinatura"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="condicao">Condição de pagamento</Label>
                <Input
                  id="condicao"
                  value={condicaoPagamento}
                  onChange={(e) => setCondicaoPagamento(e.target.value)}
                  placeholder="Ex.: 50% na assinatura, 50% na entrega"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="forma">Forma de pagamento</Label>
                <Input
                  id="forma"
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  placeholder="Ex.: PIX ou boleto"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="engenheiro">Responsável técnico</Label>
                <Input
                  id="engenheiro"
                  value={engenheiro}
                  onChange={(e) => setEngenheiro(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="crea">Registro no conselho</Label>
                <Input
                  id="crea"
                  value={crea}
                  onChange={(e) => setCrea(e.target.value)}
                  placeholder="Ex.: CREA-PI 12345/D"
                  className="mt-1.5"
                />
              </div>
            </div>
          </Bloco>

          <Separator />

          <Bloco numero={6} titulo="Acompanhamento e notas internas">
            <div className="grid gap-4 sm:grid-cols-3">
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
              <div>
                <Label htmlFor="respfollow">Responsável</Label>
                <Input
                  id="respfollow"
                  value={responsavelFollowup}
                  onChange={(e) => setResponsavelFollowup(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-3">
                <Label htmlFor="obs">Observações internas</Label>
                <Textarea
                  id="obs"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={2}
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Este campo não sai na proposta enviada ao cliente.
                </p>
              </div>
            </div>
          </Bloco>
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
