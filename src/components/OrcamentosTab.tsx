/* Painel de orçamentos: indicadores, filtros e a lista com troca rápida de
   status, registro de recebimento e geração do PDF da proposta.

   Este é o único lugar onde a carteira de orçamentos é desenhada. A página
   /orcamentos e a aba dentro de Empresas renderizam este mesmo componente, para
   não existirem duas versões da tela. */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import {
  Palette,
  Archive,
  ArchiveRestore,
  Copy,
  FileDown,
  FileSpreadsheet,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Wallet,
} from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { formatarDataCalendario, formatLocalDate } from '@/lib/date'
import { getMinhaOrganizacao, urlLogoOrganizacao } from '@/services/organizacoes'
import { getModelosProposta, type ModeloProposta } from '@/services/modelosProposta'
import { criarRecebimento } from '@/services/recebimentos'
import { gerarPdfProposta, type PdfGerado } from '@/lib/propostaPdf'
import {
  calcularIndicadores,
  camposAoMudarStatus,
  estaEmAtraso,
  criarVersaoOrcamento,
  deleteOrcamento,
  getOrcamentos,
  updateOrcamento,
  STATUS_FINANCEIRO_LABEL,
  STATUS_FINANCEIRO_ORDEM,
  STATUS_LABEL,
  STATUS_ORDEM,
  type Orcamento,
  type StatusFinanceiro,
  type StatusOrcamento,
} from '@/services/orcamentos'
import { OrcamentoDialog } from '@/components/OrcamentoDialog'
import { OrcamentoKpis } from '@/components/OrcamentoKpis'
import { EnviarPropostaDialog } from '@/components/EnviarPropostaDialog'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const VARIANTE_STATUS: Record<StatusOrcamento, 'default' | 'secondary' | 'destructive'> = {
  rascunho: 'secondary',
  enviado: 'secondary',
  aguardando_retorno: 'secondary',
  em_negociacao: 'secondary',
  aprovado: 'default',
  recusado: 'destructive',
  cancelado: 'destructive',
  expirado: 'destructive',
  em_execucao: 'default',
  concluido: 'default',
}

export function OrcamentosTab({
  empresaId,
  titulo = 'Gestão de orçamentos',
  descricao = 'Propostas comerciais emitidas para as empresas cadastradas, do rascunho ao recebimento.',
}: {
  /** Quando informado, a carteira e os indicadores ficam restritos a essa empresa. */
  empresaId?: string
  titulo?: string
  descricao?: string
} = {}) {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [modelos, setModelos] = useState<ModeloProposta[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroFinanceiro, setFiltroFinanceiro] = useState('todos')
  const [mostrarArquivados, setMostrarArquivados] = useState(false)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<Orcamento | null>(null)
  const [paraExcluir, setParaExcluir] = useState<Orcamento | null>(null)
  const [paraReceber, setParaReceber] = useState<Orcamento | null>(null)
  const [valorRecebimento, setValorRecebimento] = useState('')
  const [formaRecebimento, setFormaRecebimento] = useState('PIX')
  const [dataRecebimento, setDataRecebimento] = useState('')
  const [gerandoPdf, setGerandoPdf] = useState('')
  const [paraEnviar, setParaEnviar] = useState<Orcamento | null>(null)

  const carregar = () =>
    getOrcamentos()
      .then(setOrcamentos)
      .catch((error) =>
        toast.error('Não foi possível carregar os orçamentos', {
          description: getErrorMessage(error),
        }),
      )

  useEffect(() => {
    carregar().finally(() => setCarregando(false))
    getModelosProposta()
      .then(setModelos)
      .catch(() => setModelos([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return orcamentos.filter((o) => {
      if (empresaId && o.empresa_id !== empresaId) return false
      if (!!o.arquivado !== mostrarArquivados) return false
      if (filtroStatus !== 'todos' && o.status !== filtroStatus) return false
      if (filtroFinanceiro !== 'todos' && o.status_financeiro !== filtroFinanceiro) return false
      if (!termo) return true
      const empresa = o.expand?.empresa_id
      return (
        o.titulo.toLowerCase().includes(termo) ||
        (o.numero || '').toLowerCase().includes(termo) ||
        (o.responsavel_engenheiro || '').toLowerCase().includes(termo) ||
        (empresa?.razao_social || '').toLowerCase().includes(termo) ||
        (empresa?.nome_fantasia || '').toLowerCase().includes(termo) ||
        (empresa?.cnpj || '').toLowerCase().includes(termo)
      )
    })
  }, [orcamentos, busca, filtroStatus, filtroFinanceiro, mostrarArquivados, empresaId])

  const indicadores = useMemo(() => calcularIndicadores(filtrados), [filtrados])

  const atualizarLocal = (id: string, campos: Partial<Orcamento>) =>
    setOrcamentos((atual) => atual.map((o) => (o.id === id ? { ...o, ...campos } : o)))

  const trocarStatus = async (orcamento: Orcamento, status: StatusOrcamento) => {
    try {
      const extras: Partial<Orcamento> = { status, ...camposAoMudarStatus(orcamento, status) }
      await updateOrcamento(orcamento.id, extras)
      atualizarLocal(orcamento.id, extras as Partial<Orcamento>)
    } catch (error) {
      toast.error('Não foi possível atualizar o status', { description: getErrorMessage(error) })
    }
  }

  const trocarFinanceiro = async (orcamento: Orcamento, status_financeiro: StatusFinanceiro) => {
    try {
      await updateOrcamento(orcamento.id, { status_financeiro })
      atualizarLocal(orcamento.id, { status_financeiro })
    } catch (error) {
      toast.error('Não foi possível atualizar o financeiro', {
        description: getErrorMessage(error),
      })
    }
  }

  const alternarArquivo = async (orcamento: Orcamento) => {
    try {
      const arquivado = !orcamento.arquivado
      await updateOrcamento(orcamento.id, { arquivado })
      toast.success(arquivado ? 'Orçamento arquivado' : 'Orçamento desarquivado')
      carregar()
    } catch (error) {
      toast.error('Não foi possível arquivar', { description: getErrorMessage(error) })
    }
  }

  const duplicarVersao = async (orcamento: Orcamento) => {
    try {
      const nova = await criarVersaoOrcamento(orcamento)
      toast.success(`Nova versão criada: ${nova.numero || ''}`)
      carregar()
    } catch (error) {
      toast.error('Não foi possível criar a versão', { description: getErrorMessage(error) })
    }
  }

  // Monta o PDF da proposta. salvar=false só devolve o arquivo (link público).
  const montarPdf = async (orcamento: Orcamento, salvar = true): Promise<PdfGerado | null> => {
    const org = await getMinhaOrganizacao()
    // Orçamento sem modelo escolhido (ou criado antes dos modelos existirem)
    // usa o modelo marcado como padrão, em vez de recusar o PDF.
    const modelo =
      orcamento.expand?.modelo_proposta_id ||
      modelos.find((m) => m.id === orcamento.modelo_proposta_id) ||
      modelos.find((m) => m.padrao) ||
      modelos[0] ||
      null

    if (!modelo) {
      toast.error('Nenhum modelo de proposta disponível', {
        description: 'Não foi possível encontrar um modelo de proposta ativo para gerar o PDF.',
      })
      return null
    }

    return gerarPdfProposta({
      orcamento,
      empresa: orcamento.expand?.empresa_id,
      modelo,
      organizacaoNome: org.nome,
      logoOrganizacaoUrl: urlLogoOrganizacao(org),
      salvar,
    })
  }

  const gerarPdf = async (orcamento: Orcamento) => {
    setGerandoPdf(orcamento.id)
    try {
      await montarPdf(orcamento)
    } catch (error) {
      toast.error('Não foi possível gerar o PDF', { description: getErrorMessage(error) })
    } finally {
      setGerandoPdf('')
    }
  }

  const registrarRecebimento = async () => {
    if (!paraReceber) return
    const valor = Number(valorRecebimento)
    if (!(valor > 0)) {
      toast.error('Informe o valor recebido')
      return
    }
    try {
      await criarRecebimento({
        orcamento_id: paraReceber.id,
        valor,
        data_recebimento: dataRecebimento || formatLocalDate(new Date()),
        forma_pagamento: formaRecebimento,
        situacao: 'recebido',
        descricao: 'Recebimento lançado pela listagem',
      })
      toast.success('Recebimento registrado')
      setParaReceber(null)
      setValorRecebimento('')
      carregar()
    } catch (error) {
      toast.error('Não foi possível registrar', { description: getErrorMessage(error) })
    }
  }

  const confirmarExclusao = async () => {
    if (!paraExcluir) return
    try {
      await deleteOrcamento(paraExcluir.id)
      toast.success('Orçamento excluído')
      setParaExcluir(null)
      carregar()
    } catch (error) {
      toast.error('Não foi possível excluir', { description: getErrorMessage(error) })
    }
  }

  // Datas do orçamento são dias de calendário (gravados como 00:00 UTC):
  // converter para o fuso local jogava a data um dia para trás.
  const formatarData = (iso?: string) => formatarDataCalendario(iso) || '—'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{titulo}</h2>
          <p className="text-sm text-muted-foreground">{descricao}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/orcamentos/modelos">
              <Palette className="mr-2 h-4 w-4" />
              Modelos
            </Link>
          </Button>
          <Button
            onClick={() => {
              setEmEdicao(null)
              setDialogAberto(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo orçamento
          </Button>
        </div>
      </div>

      <OrcamentoKpis dados={indicadores} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por número, cliente, CNPJ, título ou responsável..."
            className="pl-9"
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {STATUS_ORDEM.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroFinanceiro} onValueChange={setFiltroFinanceiro}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo o financeiro</SelectItem>
            {STATUS_FINANCEIRO_ORDEM.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_FINANCEIRO_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch
            id="arquivados"
            checked={mostrarArquivados}
            onCheckedChange={setMostrarArquivados}
          />
          <Label htmlFor="arquivados" className="text-sm text-muted-foreground">
            Arquivados
          </Label>
        </div>
      </div>

      {carregando ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
          <FileSpreadsheet className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {orcamentos.length === 0
              ? 'Nenhum orçamento criado ainda.'
              : 'Nenhum orçamento para esses filtros.'}
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y">
            {filtrados.map((orcamento) => {
              const empresa = orcamento.expand?.empresa_id
              const recebido = orcamento.valor_recebido || 0
              const pendente = Math.max((orcamento.valor_total || 0) - recebido, 0)
              return (
                <div
                  key={orcamento.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-accent/30"
                >
                  <div className="min-w-56 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        {orcamento.numero || '—'}
                      </span>
                      {orcamento.versao && (
                        <Badge variant="outline" className="text-[10px]">
                          {orcamento.versao}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {orcamento.tipo === 'treinamento' ? 'Treinamento' : 'Serviço'}
                      </Badge>
                    </div>
                    <div className="font-medium leading-snug">{orcamento.titulo}</div>
                    <div className="text-xs text-muted-foreground">
                      {!empresaId && (
                        <>
                          {empresa?.nome_fantasia || empresa?.razao_social || 'Empresa removida'}{' '}
                          ·{' '}
                        </>
                      )}
                      {formatarData(orcamento.data_proposta)}
                      {orcamento.proximo_contato && (
                        <> · retomar em {formatarData(orcamento.proximo_contato)}</>
                      )}
                    </div>
                    {orcamento.link_token && (
                      <div
                        className={`text-[11px] ${orcamento.link_visualizacoes ? 'text-emerald-700' : 'text-muted-foreground'}`}
                      >
                        {orcamento.link_visualizacoes
                          ? `Cliente abriu o link ${orcamento.link_visualizacoes === 1 ? '1 vez' : `${orcamento.link_visualizacoes} vezes`}`
                          : 'Link criado, ainda não aberto pelo cliente'}
                      </div>
                    )}
                  </div>

                  <div className="min-w-32 text-right">
                    <div className="font-bold tabular-nums">
                      {brl.format(orcamento.valor_total || 0)}
                    </div>
                    <div className="text-[11px] tabular-nums text-muted-foreground">
                      recebido {brl.format(recebido)}
                    </div>
                    <div
                      className={`text-[11px] tabular-nums ${estaEmAtraso(orcamento) ? 'font-semibold text-rose-700' : 'text-amber-700'}`}
                    >
                      {estaEmAtraso(orcamento) ? 'em atraso' : 'pendente'} {brl.format(pendente)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Select
                      value={orcamento.status}
                      onValueChange={(v) => trocarStatus(orcamento, v as StatusOrcamento)}
                    >
                      <SelectTrigger className="h-8 w-44 text-xs">
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
                    <Select
                      value={orcamento.status_financeiro || 'nao_faturado'}
                      onValueChange={(v) => trocarFinanceiro(orcamento, v as StatusFinanceiro)}
                    >
                      <SelectTrigger className="h-8 w-44 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_FINANCEIRO_ORDEM.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_FINANCEIRO_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="hidden xl:block">
                    <Badge variant={VARIANTE_STATUS[orcamento.status]}>
                      {STATUS_LABEL[orcamento.status]}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Gerar PDF da proposta"
                      disabled={gerandoPdf === orcamento.id}
                      onClick={() => gerarPdf(orcamento)}
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Enviar ao cliente (link, WhatsApp ou e-mail)"
                      onClick={() => setParaEnviar(orcamento)}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Registrar recebimento"
                      onClick={() => {
                        setParaReceber(orcamento)
                        setValorRecebimento(String(pendente || ''))
                        setDataRecebimento(formatLocalDate(new Date()))
                      }}
                    >
                      <Wallet className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Criar nova versão"
                      onClick={() => duplicarVersao(orcamento)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar"
                      onClick={() => {
                        setEmEdicao(orcamento)
                        setDialogAberto(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={orcamento.arquivado ? 'Desarquivar' : 'Arquivar'}
                      onClick={() => alternarArquivo(orcamento)}
                    >
                      {orcamento.arquivado ? (
                        <ArchiveRestore className="h-4 w-4" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Excluir"
                      onClick={() => setParaExcluir(orcamento)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <EnviarPropostaDialog
        orcamento={paraEnviar}
        onOpenChange={(aberto) => !aberto && setParaEnviar(null)}
        gerarPdf={(o) => montarPdf(o, false)}
        onAtualizado={atualizarLocal}
        onEnviado={(o) => trocarStatus(o, 'enviado')}
      />

      <OrcamentoDialog
        orcamento={emEdicao}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        onSalvo={carregar}
      />

      <Dialog open={!!paraReceber} onOpenChange={(aberto) => !aberto && setParaReceber(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar recebimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {paraReceber?.numero} · {brl.format(paraReceber?.valor_total || 0)} no total, com{' '}
              {brl.format(paraReceber?.valor_recebido || 0)} já recebido.
            </p>
            <div>
              <Label htmlFor="valorrec">Valor recebido agora</Label>
              <Input
                id="valorrec"
                type="number"
                min="0"
                step="0.01"
                value={valorRecebimento}
                onChange={(e) => setValorRecebimento(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="datarec">Data</Label>
                <Input
                  id="datarec"
                  type="date"
                  value={dataRecebimento}
                  onChange={(e) => setDataRecebimento(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="formarec">Forma</Label>
                <Input
                  id="formarec"
                  value={formaRecebimento}
                  onChange={(e) => setFormaRecebimento(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setParaReceber(null)}>
              Cancelar
            </Button>
            <Button onClick={registrarRecebimento}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!paraExcluir} onOpenChange={(aberto) => !aberto && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              O orçamento {paraExcluir?.numero}, seus itens e seus recebimentos serão removidos. Não
              dá para desfazer. Se quiser apenas tirar da lista, use arquivar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default OrcamentosTab
