/* Modelos de vistoria/auditoria — catálogo global (NRs) + modelos customizados da organização.
   O dono/gerente pode criar modelos próprios, duplicar um NR como base e gerenciar os itens.
   A segurança fica nas regras do PocketBase (só o dono da organização escreve). */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Copy, ListChecks, Pencil, Plus, Search, Trash2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getPapelUsuarioLogado } from '@/services/equipe'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import {
  getTiposVistoria,
  createTipoVistoria,
  updateTipoVistoria,
  deleteTipoVistoria,
  type TipoVistoria,
} from '@/services/tiposVistoria'
import {
  getItensChecklist,
  createItemChecklist,
  updateItemChecklist,
  deleteItemChecklist,
  type ItemChecklist,
} from '@/services/itensChecklist'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

// Ordena pelo número real do item da norma (1.4.2 antes de 1.4.10), não pela
// ordem de cadastro no banco.
const compararItemRef = (a: ItemChecklist, b: ItemChecklist) =>
  (a.item_ref || '').localeCompare(b.item_ref || '', undefined, { numeric: true })

interface ModeloFormValues {
  nome: string
  nr_referencia: string
  descricao: string
}

export default function ModelosVistoria() {
  const [tipos, setTipos] = useState<TipoVistoria[]>([])
  const [loading, setLoading] = useState(true)
  const [itensPorTipo, setItensPorTipo] = useState<Record<string, ItemChecklist[]>>({})
  const [carregandoItens, setCarregandoItens] = useState<Record<string, boolean>>({})
  const [busca, setBusca] = useState('')
  const [abertosManual, setAbertosManual] = useState<string[]>([])
  // Regras PB: só o dono da organização escreve em modelos customizados
  // (create/update/delete exigem organizacao_id.dono_id = usuário logado).
  const podeGerenciar = getPapelUsuarioLogado() === 'dono'

  // Diálogos
  const [modeloDialog, setModeloDialog] = useState<'criar' | 'editar' | 'duplicar' | null>(null)
  const [modeloBase, setModeloBase] = useState<TipoVistoria | null>(null) // para editar/duplicar
  const [salvandoModelo, setSalvandoModelo] = useState(false)
  const [excluindo, setExcluindo] = useState<TipoVistoria | null>(null)
  const [itensDialog, setItensDialog] = useState<TipoVistoria | null>(null)

  const [formModelo, setFormModelo] = useState<ModeloFormValues>({
    nome: '',
    nr_referencia: '',
    descricao: '',
  })

  const recarregarTipos = () =>
    getTiposVistoria()
      .then(setTipos)
      .catch((error) =>
        toast.error('Não foi possível carregar os modelos de vistoria', {
          description: getErrorMessage(error),
        }),
      )

  useEffect(() => {
    recarregarTipos().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const carregarItens = async (tipoId: string) => {
    if (itensPorTipo[tipoId] || carregandoItens[tipoId]) return
    setCarregandoItens((prev) => ({ ...prev, [tipoId]: true }))
    try {
      const itens = await getItensChecklist(tipoId)
      setItensPorTipo((prev) => ({ ...prev, [tipoId]: itens }))
    } catch (error) {
      toast.error('Não foi possível carregar o checklist', { description: getErrorMessage(error) })
    } finally {
      setCarregandoItens((prev) => ({ ...prev, [tipoId]: false }))
    }
  }

  // Enquanto o usuário busca, carrega o checklist de todos os modelos (não só
  // do que estava aberto) pra conseguir procurar em tudo.
  useEffect(() => {
    if (!busca.trim()) return
    for (const tipo of tipos) {
      carregarItens(tipo.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, tipos])

  const buscando = busca.trim().length > 0
  const buscaNormalizada = busca.trim().toLowerCase()

  const itemBate = (item: ItemChecklist) =>
    !buscaNormalizada ||
    item.item_ref?.toLowerCase().includes(buscaNormalizada) ||
    item.codigo?.toLowerCase().includes(buscaNormalizada) ||
    item.descricao?.toLowerCase().includes(buscaNormalizada)

  const agruparPorSecao = (itens: ItemChecklist[]) => {
    const ordenados = [...itens].sort(compararItemRef)
    const grupos = new Map<string, ItemChecklist[]>()
    for (const item of ordenados) {
      const chave = item.secao || 'Geral'
      if (!grupos.has(chave)) grupos.set(chave, [])
      grupos.get(chave)!.push(item)
    }
    return Array.from(grupos.entries())
  }

  const tiposComMatch = useMemo(() => {
    if (!buscando) return null
    return tipos
      .filter((tipo) => (itensPorTipo[tipo.id] || []).some(itemBate))
      .map((tipo) => tipo.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscando, buscaNormalizada, tipos, itensPorTipo])

  const valorAccordion = buscando ? tiposComMatch || [] : abertosManual

  // ---------- Modelo (criar / editar / duplicar / excluir) ----------

  const abrirCriar = () => {
    setModeloBase(null)
    setFormModelo({ nome: '', nr_referencia: '', descricao: '' })
    setModeloDialog('criar')
  }

  const abrirEditar = (tipo: TipoVistoria) => {
    setModeloBase(tipo)
    setFormModelo({
      nome: tipo.nome,
      nr_referencia: tipo.nr_referencia || '',
      descricao: tipo.descricao || '',
    })
    setModeloDialog('editar')
  }

  const abrirDuplicar = async (tipo: TipoVistoria) => {
    setModeloBase(tipo)
    setFormModelo({
      nome: `${tipo.nome} (cópia)`,
      nr_referencia: tipo.nr_referencia || '',
      descricao: tipo.descricao || '',
    })
    setModeloDialog('duplicar')
    await carregarItens(tipo.id)
  }

  const salvarModelo = async () => {
    if (!formModelo.nome.trim()) {
      toast.error('Informe o nome do modelo')
      return
    }
    setSalvandoModelo(true)
    try {
      if (modeloDialog === 'editar' && modeloBase) {
        await updateTipoVistoria(modeloBase.id, {
          nome: formModelo.nome.trim(),
          nr_referencia: formModelo.nr_referencia.trim() || undefined,
          descricao: formModelo.descricao.trim() || undefined,
        })
        toast.success('Modelo atualizado')
      } else {
        const org = await getMinhaOrganizacao()
        const novo = await createTipoVistoria(org.id, {
          nome: formModelo.nome.trim(),
          nr_referencia: formModelo.nr_referencia.trim() || undefined,
          descricao: formModelo.descricao.trim() || undefined,
        })
        // Duplicar: copia os itens do modelo base para o novo modelo próprio.
        if (modeloDialog === 'duplicar' && modeloBase) {
          const itensBase = itensPorTipo[modeloBase.id] || (await getItensChecklist(modeloBase.id))
          for (const item of itensBase) {
            await createItemChecklist(novo.id, {
              secao: item.secao,
              item_ref: item.item_ref,
              codigo: item.codigo,
              grau: item.grau,
              tipo: item.tipo,
              descricao: item.descricao,
              observacao: item.observacao,
              ordem: item.ordem,
            })
          }
          toast.success(
            `Modelo criado com ${itensBase.length} item(ns) copiados de ${modeloBase.nome}`,
          )
        } else {
          toast.success('Modelo criado — agora adicione os itens do checklist')
        }
        setItensDialog(novo)
      }
      setModeloDialog(null)
      recarregarTipos()
    } catch (error) {
      toast.error('Não foi possível salvar o modelo', { description: getErrorMessage(error) })
    } finally {
      setSalvandoModelo(false)
    }
  }

  const confirmarExclusao = async () => {
    if (!excluindo) return
    try {
      await deleteTipoVistoria(excluindo.id)
      toast.success('Modelo excluído')
      setExcluindo(null)
      recarregarTipos()
    } catch (error) {
      toast.error('Não foi possível excluir o modelo', { description: getErrorMessage(error) })
    }
  }

  // ---------- Render ----------

  const dialogTitulo =
    modeloDialog === 'criar'
      ? 'Novo modelo de vistoria'
      : modeloDialog === 'duplicar'
        ? `Duplicar "${modeloBase?.nome}"`
        : 'Editar modelo'

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Modelos de vistoria</h1>
          <p className="text-sm text-muted-foreground">
            {podeGerenciar
              ? 'Os modelos oficiais (NRs) e os modelos da sua organização.'
              : 'Os tipos de vistoria/auditoria disponíveis e o checklist de cada um.'}
          </p>
        </div>
        {podeGerenciar && (
          <Button onClick={abrirCriar} className="shrink-0 rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Novo modelo
          </Button>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por item da norma, código ou trecho da descrição..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : tipos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
          <ListChecks className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum modelo de vistoria cadastrado ainda.
          </p>
        </div>
      ) : buscando && (tiposComMatch?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
          <Search className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum item encontrado para "{busca}".</p>
        </div>
      ) : (
        <Card className="overflow-hidden rounded-2xl border-none bg-card p-2 shadow-subtle">
          <Accordion
            type="multiple"
            className="w-full"
            value={valorAccordion}
            onValueChange={(v) => !buscando && setAbertosManual(v)}
          >
            {tipos.map((tipo) => {
              if (buscando && !tiposComMatch?.includes(tipo.id)) return null
              const itensDoTipo = itensPorTipo[tipo.id] || []
              const itensFiltrados = buscando ? itensDoTipo.filter(itemBate) : itensDoTipo
              const customizado = Boolean(tipo.organizacao_id)

              return (
                <AccordionItem key={tipo.id} value={tipo.id} className="border-border/60 px-2">
                  <AccordionTrigger
                    onClick={() => carregarItens(tipo.id)}
                    className="hover:no-underline"
                  >
                    <div className="flex flex-1 items-center gap-3 text-left">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <ListChecks className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tipo.nome}</span>
                          {tipo.nr_referencia && (
                            <Badge variant="secondary">{tipo.nr_referencia}</Badge>
                          )}
                          {customizado && (
                            <Badge className="bg-accent text-accent-foreground">Próprio</Badge>
                          )}
                        </div>
                        {tipo.descricao && (
                          <p className="truncate text-xs text-muted-foreground">{tipo.descricao}</p>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {podeGerenciar && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {customizado && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => abrirEditar(tipo)}
                            >
                              <Pencil className="mr-1.5 h-3.5 w-3.5" />
                              Editar modelo
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => {
                                setItensDialog(tipo)
                                carregarItens(tipo.id)
                              }}
                            >
                              <ListChecks className="mr-1.5 h-3.5 w-3.5" />
                              Gerenciar itens
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full text-destructive hover:text-destructive"
                              onClick={() => setExcluindo(tipo)}
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              Excluir
                            </Button>
                          </>
                        )}
                        {!customizado && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => abrirDuplicar(tipo)}
                          >
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Duplicar como modelo próprio
                          </Button>
                        )}
                      </div>
                    )}
                    {carregandoItens[tipo.id] ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        Carregando checklist...
                      </div>
                    ) : itensFiltrados.length ? (
                      <div className="space-y-4 pb-2">
                        {agruparPorSecao(itensFiltrados).map(([secao, itens]) => (
                          <div key={secao}>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {secao}
                            </p>
                            <ul className="space-y-2">
                              {itens.map((item) => (
                                <li key={item.id} className="flex items-start gap-3 text-sm">
                                  <div className="mt-0.5 flex w-[4.5rem] shrink-0 flex-col items-start gap-0.5">
                                    <span className="text-[11px] font-semibold text-foreground">
                                      {item.item_ref}
                                    </span>
                                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                      {item.codigo}
                                    </span>
                                  </div>
                                  <span>{item.descricao}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground">
                          {buscando
                            ? `${itensFiltrados.length} de ${itensDoTipo.length} item(ns) encontrados`
                            : `${itensDoTipo.length} item(ns) no checklist`}
                        </p>
                      </div>
                    ) : (
                      <p className="py-2 text-sm text-muted-foreground">
                        Este modelo ainda não tem itens de checklist.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </Card>
      )}

      {/* Diálogo criar/editar/duplicar modelo */}
      <Dialog open={modeloDialog !== null} onOpenChange={(o) => !o && setModeloDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitulo}</DialogTitle>
            <DialogDescription>
              {modeloDialog === 'duplicar'
                ? 'Cria um modelo da sua organização com os mesmos itens do original — ajuste depois o que quiser.'
                : 'O modelo fica visível só para a sua organização.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modelo-nome">Nome *</Label>
              <Input
                id="modelo-nome"
                value={formModelo.nome}
                onChange={(e) => setFormModelo((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex.: Vistoria mensal de obra"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo-nr">Referência (NR, procedimento...)</Label>
              <Input
                id="modelo-nr"
                value={formModelo.nr_referencia}
                onChange={(e) => setFormModelo((f) => ({ ...f, nr_referencia: e.target.value }))}
                placeholder="Ex.: NR-06 (opcional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo-descricao">Descrição</Label>
              <Textarea
                id="modelo-descricao"
                value={formModelo.descricao}
                onChange={(e) => setFormModelo((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Para que serve este modelo (opcional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModeloDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarModelo} disabled={salvandoModelo}>
              {salvandoModelo ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={excluindo !== null} onOpenChange={(o) => !o && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{excluindo?.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>
              O modelo e todos os itens do checklist serão excluídos. Vistorias já agendadas com
              este modelo não são afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmarExclusao}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {itensDialog && (
        <ItensChecklistDialog
          tipo={itensDialog}
          itens={itensPorTipo[itensDialog.id] || []}
          carregando={Boolean(carregandoItens[itensDialog.id])}
          onClose={() => setItensDialog(null)}
          onItensChange={(itens) =>
            setItensPorTipo((prev) => ({ ...prev, [itensDialog.id]: itens }))
          }
        />
      )}
    </div>
  )
}

// ---------- Gestão de itens do checklist (modelo customizado) ----------

interface ItemFormValues {
  secao: string
  item_ref: string
  codigo: string
  grau: string
  tipo: string
  descricao: string
  observacao: string
}

const itemFormVazio: ItemFormValues = {
  secao: '',
  item_ref: '',
  codigo: '',
  grau: '',
  tipo: '',
  descricao: '',
  observacao: '',
}

function ItensChecklistDialog({
  tipo,
  itens,
  carregando,
  onClose,
  onItensChange,
}: {
  tipo: TipoVistoria
  itens: ItemChecklist[]
  carregando: boolean
  onClose: () => void
  onItensChange: (itens: ItemChecklist[]) => void
}) {
  const [form, setForm] = useState<ItemFormValues>(itemFormVazio)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const ordenados = useMemo(() => [...itens].sort(compararItemRef), [itens])

  const iniciarEdicao = (item: ItemChecklist) => {
    setEditandoId(item.id)
    setForm({
      secao: item.secao || '',
      item_ref: item.item_ref || '',
      codigo: item.codigo || '',
      grau: item.grau ? String(item.grau) : '',
      tipo: item.tipo || '',
      descricao: item.descricao || '',
      observacao: item.observacao || '',
    })
  }

  const salvarItem = async () => {
    if (!form.item_ref.trim() || !form.codigo.trim() || !form.descricao.trim()) {
      toast.error('Preencha referência, código e descrição do item')
      return
    }
    setSalvando(true)
    try {
      const dados = {
        secao: form.secao.trim() || undefined,
        item_ref: form.item_ref.trim(),
        codigo: form.codigo.trim(),
        grau: form.grau ? Number(form.grau) : undefined,
        tipo: (form.tipo || undefined) as 'S' | 'M' | undefined,
        descricao: form.descricao.trim(),
        observacao: form.observacao.trim() || undefined,
      }
      if (editandoId) {
        const atualizado = await updateItemChecklist(editandoId, dados)
        onItensChange(itens.map((i) => (i.id === editandoId ? atualizado : i)))
        toast.success('Item atualizado')
      } else {
        const criado = await createItemChecklist(tipo.id, {
          ...dados,
          ordem: itens.length + 1,
        })
        onItensChange([...itens, criado])
        toast.success('Item adicionado')
      }
      setForm(itemFormVazio)
      setEditandoId(null)
    } catch (error) {
      toast.error('Não foi possível salvar o item', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  const excluirItem = async (item: ItemChecklist) => {
    try {
      await deleteItemChecklist(item.id)
      onItensChange(itens.filter((i) => i.id !== item.id))
      if (editandoId === item.id) {
        setEditandoId(null)
        setForm(itemFormVazio)
      }
      toast.success('Item excluído')
    } catch (error) {
      toast.error('Não foi possível excluir o item', { description: getErrorMessage(error) })
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Itens do checklist — {tipo.nome}</DialogTitle>
          <DialogDescription>
            Cada item é uma verificação da vistoria. Use "Seção" para agrupar (ex.: Instalações,
            EPIs).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {carregando ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Carregando itens...</p>
          ) : ordenados.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum item ainda — adicione o primeiro abaixo.
            </p>
          ) : (
            <ul className="space-y-2">
              {ordenados.map((item) => (
                <li
                  key={item.id}
                  className={`rounded-xl border p-3 text-sm ${
                    editandoId === item.id ? 'border-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{item.item_ref}</span>
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {item.codigo}
                        </span>
                        {item.grau && (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Grau {item.grau} · {item.tipo === 'M' ? 'Multa' : 'Súmula'}
                          </span>
                        )}
                        {item.secao && (
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {item.secao}
                          </span>
                        )}
                      </div>
                      <p className="mt-1">{item.descricao}</p>
                      {item.observacao && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.observacao}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => iniciarEdicao(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => excluirItem(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="mb-3 text-sm font-medium">
            {editandoId ? 'Editar item' : 'Adicionar item'}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="item-ref">Referência *</Label>
              <Input
                id="item-ref"
                value={form.item_ref}
                onChange={(e) => setForm((f) => ({ ...f, item_ref: e.target.value }))}
                placeholder="1.4.2"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-codigo">Código *</Label>
              <Input
                id="item-codigo"
                value={form.codigo}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                placeholder="A01"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-grau">Grau de risco</Label>
              <Select
                value={form.grau || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, grau: v }))}
              >
                <SelectTrigger id="item-grau">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((g) => (
                    <SelectItem key={g} value={String(g)}>
                      Grau {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-tipo">Tipo (NR-28)</Label>
              <Select
                value={form.tipo || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}
              >
                <SelectTrigger id="item-tipo">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S">S — Súmula</SelectItem>
                  <SelectItem value="M">M — Multa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5 sm:col-span-4">
              <Label htmlFor="item-descricao">Descrição *</Label>
              <Textarea
                id="item-descricao"
                rows={2}
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="O que deve ser verificado nesta vistoria"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="item-secao">Seção</Label>
              <Input
                id="item-secao"
                value={form.secao}
                onChange={(e) => setForm((f) => ({ ...f, secao: e.target.value }))}
                placeholder="Ex.: Instalações elétricas"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="item-observacao">Observação</Label>
              <Input
                id="item-observacao"
                value={form.observacao}
                onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            {editandoId && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditandoId(null)
                  setForm(itemFormVazio)
                }}
              >
                Cancelar edição
              </Button>
            )}
            <Button onClick={salvarItem} disabled={salvando}>
              {salvando ? 'Salvando...' : editandoId ? 'Salvar item' : 'Adicionar item'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
