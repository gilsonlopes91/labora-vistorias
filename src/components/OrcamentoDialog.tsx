/* Criação e edição de orçamento. Dois formatos de proposta no mesmo diálogo:
   "Serviço" (descrição, quantidade, unidade, valor unitário) e "Treinamento"
   (carga horária, nº de pessoas, turmas, valor unitário). O valor total é
   sempre a soma dos itens — não se digita total à mão. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getEmpresas, type Empresa } from '@/services/empresas'
import { getMinhaOrganizacao } from '@/services/organizacoes'
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

/** Lista de texto livre, uma entrada por linha — normas, inclusos, exclusos. */
const linhasParaLista = (texto: string): string[] =>
  texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

const listaParaLinhas = (lista?: string[]): string => (lista || []).join('\n')

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
  const [salvando, setSalvando] = useState(false)

  const [empresaId, setEmpresaId] = useState('')
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
  const [normas, setNormas] = useState('')
  const [inclusos, setInclusos] = useState('')
  const [exclusos, setExclusos] = useState('')
  const [engenheiro, setEngenheiro] = useState('')
  const [crea, setCrea] = useState('')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    if (!open) return
    getEmpresas()
      .then(setEmpresas)
      .catch(() => setEmpresas([]))
  }, [open])

  // Carrega o orçamento em edição, ou zera o formulário para um novo.
  useEffect(() => {
    if (!open) return
    if (orcamento) {
      setEmpresaId(orcamento.empresa_id || '')
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
      setNormas(listaParaLinhas(orcamento.normas_referencia))
      setInclusos(listaParaLinhas(orcamento.itens_inclusos))
      setExclusos(listaParaLinhas(orcamento.itens_exclusos))
      setEngenheiro(orcamento.responsavel_engenheiro || '')
      setCrea(orcamento.crea || '')
      setObservacoes(orcamento.observacoes || '')
    } else {
      setEmpresaId('')
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
      setNormas('')
      setInclusos('')
      setExclusos('')
      setEngenheiro('')
      setCrea('')
      setObservacoes('')
    }
  }, [open, orcamento])

  // Trocar o tipo troca a natureza dos itens — recomeça a lista em branco.
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
        normas_referencia: linhasParaLista(normas),
        itens_inclusos: linhasParaLista(inclusos),
        itens_exclusos: linhasParaLista(exclusos),
        responsavel_engenheiro: engenheiro,
        crea,
        observacoes,
      }

      if (orcamento) {
        await updateOrcamento(orcamento.id, dados)
        toast.success('Orçamento atualizado')
      } else {
        const org = await getMinhaOrganizacao()
        await createOrcamento({ ...dados, organizacao_id: org.id })
        toast.success('Orçamento criado')
      }
      onSalvo()
      onOpenChange(false)
    } catch (error) {
      toast.error('Não foi possível salvar o orçamento', {
        description: getErrorMessage(error),
      })
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

        <div className="space-y-5">
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
          </div>

          <div>
            <Label htmlFor="titulo">Título da proposta</Label>
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

          <Separator />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>{tipo === 'treinamento' ? 'Turmas e treinamentos' : 'Itens do serviço'}</Label>
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

          <Separator />

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
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="normas">Normas de referência</Label>
              <Textarea
                id="normas"
                value={normas}
                onChange={(e) => setNormas(e.target.value)}
                rows={4}
                placeholder={'Uma por linha\nNR-01\nNR-09'}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="inclusos">Itens inclusos</Label>
              <Textarea
                id="inclusos"
                value={inclusos}
                onChange={(e) => setInclusos(e.target.value)}
                rows={4}
                placeholder="Uma por linha"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="exclusos">Itens não inclusos</Label>
              <Textarea
                id="exclusos"
                value={exclusos}
                onChange={(e) => setExclusos(e.target.value)}
                rows={4}
                placeholder="Uma por linha"
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="crea">Registro no CREA</Label>
              <Input
                id="crea"
                value={crea}
                onChange={(e) => setCrea(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="obs">Observações internas</Label>
            <Textarea
              id="obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="mt-1.5"
            />
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
