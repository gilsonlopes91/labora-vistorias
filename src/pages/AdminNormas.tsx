/* Admin > Normas — gestão do catálogo oficial de NRs sem depender de IA.
   - Lista cada NR com a versão (portaria) cadastrada e a situação de cada
     checklist (corpo e anexos): itens vigentes, revogados e pendências.
   - Editor de itens: corrigir/colar o texto literal, marcar como conferido,
     criar item novo.
   - Importação do arquivo do catálogo (sincronização com o Anexo II da NR-28).
   Só admin_plataforma. */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  FileUp,
  Pencil,
  Plus,
  Search,
} from 'lucide-react'
import AtualizarNrDialog from '@/components/AtualizarNrDialog'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import TextoNorma from '@/components/TextoNorma'
import SincronizarCatalogoPanel from '@/components/SincronizarCatalogoPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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

interface TipoNorma {
  id: string
  nome: string
  nr_referencia: string
  secao_oficial?: string
  norma_versao?: string
  norma_versao_dou?: string
  catalogo_sincronizado_em?: string
}

interface ItemNorma {
  id: string
  tipo_vistoria_id: string
  item_ref: string
  codigo: string
  grau?: number | null
  tipo?: string
  secao?: string
  descricao: string
  observacao?: string
  ordem?: number
  revogado?: boolean
  pendente_revisao?: boolean
}

interface Estatistica {
  vigentes: number
  revogados: number
  pendentes: number
}

const dataBR = (s?: string) => (s ? new Date(s).toLocaleDateString('pt-BR') : '—')
const compararRef = (a: ItemNorma, b: ItemNorma) =>
  (a.item_ref || '').localeCompare(b.item_ref || '', undefined, { numeric: true })

const ITEM_VAZIO: Partial<ItemNorma> = {
  item_ref: '',
  codigo: '',
  grau: null,
  tipo: '',
  secao: '',
  descricao: '',
  observacao: '',
}

export default function AdminNormas() {
  const [tipos, setTipos] = useState<TipoNorma[]>([])
  const [stats, setStats] = useState<Record<string, Estatistica>>({})
  const [pendentes, setPendentes] = useState<ItemNorma[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [soPendencias, setSoPendencias] = useState(false)

  // checklist aberto
  const [tipoAberto, setTipoAberto] = useState<TipoNorma | null>(null)
  const [itensTipo, setItensTipo] = useState<ItemNorma[]>([])
  const [buscaItens, setBuscaItens] = useState('')
  const [mostrarRevogados, setMostrarRevogados] = useState(false)

  // edição de item
  const [itemEdit, setItemEdit] = useState<Partial<ItemNorma> | null>(null)
  const [conferido, setConferido] = useState(false)
  const [revogarItem, setRevogarItem] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // atualização de NR a partir do PDF oficial
  const [atualizarAberto, setAtualizarAberto] = useState(false)
  const [atualizarNr, setAtualizarNr] = useState<string | undefined>(undefined)

  // edição de versão da NR
  const [versaoNr, setVersaoNr] = useState<string | null>(null)
  const [versaoTexto, setVersaoTexto] = useState('')
  const [versaoData, setVersaoData] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const listaTipos = await pb.collection('tipos_vistoria').getFullList<TipoNorma>({
        filter: "organizacao_id = ''",
        fields:
          'id,nome,nr_referencia,secao_oficial,norma_versao,norma_versao_dou,catalogo_sincronizado_em',
      })
      const itens = await pb.collection('itens_checklist').getFullList<ItemNorma>({
        filter: "tipo_vistoria_id.organizacao_id = ''",
        fields: 'id,tipo_vistoria_id,revogado,pendente_revisao',
        batch: 1000,
      })
      const s: Record<string, Estatistica> = {}
      for (const it of itens) {
        const e = (s[it.tipo_vistoria_id] ||= { vigentes: 0, revogados: 0, pendentes: 0 })
        if (it.revogado) e.revogados++
        else {
          e.vigentes++
          if (it.pendente_revisao) e.pendentes++
        }
      }
      const pend = await pb.collection('itens_checklist').getFullList<ItemNorma>({
        filter:
          "tipo_vistoria_id.organizacao_id = '' && pendente_revisao = true && revogado != true",
      })
      listaTipos.sort((a, b) =>
        (a.secao_oficial || a.nome).localeCompare(b.secao_oficial || b.nome, undefined, {
          numeric: true,
        }),
      )
      setTipos(listaTipos)
      setStats(s)
      setPendentes(pend.sort(compararRef))
    } catch (error) {
      toast.error('Não foi possível carregar o catálogo', { description: getErrorMessage(error) })
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const porNr = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const mapa = new Map<string, TipoNorma[]>()
    for (const t of tipos) {
      if (q && !`${t.nome} ${t.nr_referencia}`.toLowerCase().includes(q)) continue
      if (soPendencias && !(stats[t.id]?.pendentes > 0)) continue
      const k = t.nr_referencia || 'Outros'
      if (!mapa.has(k)) mapa.set(k, [])
      mapa.get(k)!.push(t)
    }
    return Array.from(mapa.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], undefined, { numeric: true }),
    )
  }, [tipos, stats, busca, soPendencias])

  const totais = useMemo(() => {
    let vigentes = 0
    let pend = 0
    for (const e of Object.values(stats)) {
      vigentes += e.vigentes
      pend += e.pendentes
    }
    return {
      nrs: new Set(tipos.map((t) => t.nr_referencia)).size,
      checklists: tipos.length,
      vigentes,
      pendencias: pend,
    }
  }, [tipos, stats])

  const nomeTipo = (id: string) => tipos.find((t) => t.id === id)?.nome || ''

  const abrirTipo = async (t: TipoNorma) => {
    setTipoAberto(t)
    setBuscaItens('')
    setItensTipo([])
    try {
      const itens = await pb.collection('itens_checklist').getFullList<ItemNorma>({
        filter: pb.filter('tipo_vistoria_id = {:id}', { id: t.id }),
      })
      setItensTipo(itens.sort(compararRef))
    } catch (error) {
      toast.error('Não foi possível carregar os itens', { description: getErrorMessage(error) })
    }
  }

  const itensFiltrados = useMemo(() => {
    const q = buscaItens.trim().toLowerCase()
    return itensTipo.filter(
      (i) =>
        (mostrarRevogados || !i.revogado) &&
        (!q ||
          i.item_ref.toLowerCase().includes(q) ||
          i.codigo.toLowerCase().includes(q) ||
          i.descricao.toLowerCase().includes(q)),
    )
  }, [itensTipo, buscaItens, mostrarRevogados])

  const editarItem = (it: Partial<ItemNorma>) => {
    setItemEdit({ ...it })
    setConferido(!it.pendente_revisao && !!it.id)
    setRevogarItem(!!it.revogado)
  }

  const salvarItem = async () => {
    if (!itemEdit) return
    if (!itemEdit.item_ref?.trim() || !itemEdit.codigo?.trim() || !itemEdit.descricao?.trim()) {
      toast.error('Preencha item, código de ementa e texto da norma')
      return
    }
    setSalvando(true)
    try {
      const obs = (itemEdit.observacao || '').trim()
      const obsPendente =
        obs.startsWith('Texto literal ainda não localizado') ||
        obs.startsWith('Parte dos subitens citados')
      const dados = {
        item_ref: itemEdit.item_ref.trim(),
        codigo: itemEdit.codigo.trim(),
        grau: itemEdit.grau || null,
        tipo: itemEdit.tipo || '',
        secao: itemEdit.secao || '',
        descricao: itemEdit.descricao.trim(),
        observacao: (conferido || revogarItem) && obsPendente ? '' : obs,
        pendente_revisao: revogarItem ? false : !conferido,
        revogado: revogarItem,
      }
      if (itemEdit.id) {
        await pb.collection('itens_checklist').update(itemEdit.id, dados)
      } else {
        const tipoId = itemEdit.tipo_vistoria_id || tipoAberto?.id
        if (!tipoId) throw new Error('Checklist não identificado')
        const maiorOrdem = itensTipo.reduce((m, i) => Math.max(m, i.ordem ?? 0), 0)
        await pb
          .collection('itens_checklist')
          .create({ ...dados, tipo_vistoria_id: tipoId, ordem: maiorOrdem + 1, revogado: false })
      }
      toast.success('Item salvo')
      setItemEdit(null)
      if (tipoAberto) abrirTipo(tipoAberto)
      carregar()
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  const abrirVersao = (nr: string) => {
    const t = tipos.find((x) => x.nr_referencia === nr)
    setVersaoNr(nr)
    setVersaoTexto(t?.norma_versao || '')
    setVersaoData(t?.norma_versao_dou ? t.norma_versao_dou.slice(0, 10) : '')
  }

  const salvarVersao = async () => {
    if (!versaoNr) return
    try {
      const alvos = tipos.filter((t) => t.nr_referencia === versaoNr)
      for (const t of alvos) {
        await pb.collection('tipos_vistoria').update(t.id, {
          norma_versao: versaoTexto.trim(),
          norma_versao_dou: versaoData ? `${versaoData} 12:00:00.000Z` : '',
        })
      }
      toast.success(`Versão da ${versaoNr} atualizada`)
      setVersaoNr(null)
      carregar()
    } catch (error) {
      toast.error('Não foi possível salvar a versão', { description: getErrorMessage(error) })
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Normas</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo oficial das NRs usado nas vistorias e na calculadora. Cada item segue o código
            de ementa do Anexo II da NR-28 e o texto literal da norma.
          </p>
        </div>
        <Button
          className="rounded-full"
          onClick={() => {
            setAtualizarNr(undefined)
            setAtualizarAberto(true)
          }}
        >
          <FileUp className="mr-2 h-4 w-4" />
          Atualizar NR
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'NRs', value: totais.nrs },
          { label: 'Checklists (corpo e anexos)', value: totais.checklists },
          { label: 'Itens vigentes', value: totais.vigentes },
          { label: 'Pendências de revisão', value: totais.pendencias },
        ].map((m) => (
          <Card key={m.label} className="rounded-2xl border-none p-4 shadow-subtle">
            <div className="text-2xl font-extrabold leading-none">{m.value}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              {m.label}
            </div>
          </Card>
        ))}
      </div>

      {pendentes.length > 0 && (
        <Card className="mb-6 rounded-2xl border-none p-4 shadow-subtle">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="font-bold">Pendências de revisão ({pendentes.length})</h2>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Itens cujo texto literal não foi localizado automaticamente no PDF oficial. Abra,
            confira com a norma, corrija o texto se preciso e marque como conferido.
          </p>
          <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {pendentes.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-accent/40"
              >
                <div className="min-w-0">
                  <div className="font-semibold">
                    {it.item_ref}{' '}
                    <span className="font-mono text-xs text-muted-foreground">{it.codigo}</span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {nomeTipo(it.tipo_vistoria_id)}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 rounded-full"
                  onClick={() => editarItem(it)}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Revisar
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar NR ou anexo..."
            className="pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={soPendencias} onCheckedChange={(v) => setSoPendencias(!!v)} />
          Só com pendências
        </label>
      </div>

      {carregando ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : (
        <div className="space-y-3">
          {porNr.map(([nr, lista]) => {
            const t0 = lista[0]
            return (
              <Card key={nr} className="rounded-2xl border-none p-4 shadow-subtle">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-lg font-bold">{nr}</div>
                    <div className="text-xs text-muted-foreground">
                      {t0.norma_versao
                        ? `Última alteração: ${t0.norma_versao} (DOU ${dataBR(t0.norma_versao_dou)})`
                        : 'Versão da norma não informada'}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setAtualizarNr(nr)
                        setAtualizarAberto(true)
                      }}
                    >
                      <FileUp className="mr-1.5 h-3.5 w-3.5" />
                      Atualizar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => abrirVersao(nr)}
                    >
                      Editar versão
                    </Button>
                  </div>
                </div>
                <div className="divide-y">
                  {lista.map((t) => {
                    const e = stats[t.id] || { vigentes: 0, revogados: 0, pendentes: 0 }
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => abrirTipo(t)}
                        className="flex w-full flex-wrap items-center justify-between gap-2 py-2 text-left text-sm hover:bg-accent/30"
                      >
                        <span className="min-w-0 flex-1 truncate">{t.nome}</span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{e.vigentes} itens</span>
                          {e.revogados > 0 && <span>· {e.revogados} revogados</span>}
                          <span>· conferido em {dataBR(t.catalogo_sincronizado_em)}</span>
                          {e.pendentes > 0 ? (
                            <Badge variant="outline" className="border-amber-500 text-amber-700">
                              {e.pendentes} pendência(s)
                            </Badge>
                          ) : e.vigentes > 0 ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-500 text-emerald-700"
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Em dia
                            </Badge>
                          ) : (
                            <Badge variant="outline">Sem itens</Badge>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <SincronizarCatalogoPanel />

      <AtualizarNrDialog
        aberto={atualizarAberto}
        nrInicial={atualizarNr}
        onFechar={() => setAtualizarAberto(false)}
        onAplicado={carregar}
      />

      {/* Checklist aberto */}
      <Dialog open={!!tipoAberto} onOpenChange={(o) => !o && setTipoAberto(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tipoAberto?.nome}</DialogTitle>
            <DialogDescription>
              {itensTipo.filter((i) => !i.revogado).length} itens vigentes. Clique em Editar para
              corrigir o texto de um item.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={buscaItens}
              onChange={(e) => setBuscaItens(e.target.value)}
              placeholder="Buscar item, código ou trecho do texto..."
              className="min-w-60 flex-1"
            />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={mostrarRevogados}
                onCheckedChange={(v) => setMostrarRevogados(!!v)}
              />
              Mostrar revogados
            </label>
            <Button
              size="sm"
              className="rounded-full"
              onClick={() =>
                editarItem({
                  ...ITEM_VAZIO,
                  tipo_vistoria_id: tipoAberto?.id,
                  pendente_revisao: false,
                })
              }
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Novo item
            </Button>
          </div>
          <div className="mt-2 space-y-2">
            {itensFiltrados.map((it) => (
              <div key={it.id} className="rounded-xl border p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{it.item_ref}</span>
                  <span className="font-mono text-xs text-muted-foreground">{it.codigo}</span>
                  {it.grau ? (
                    <Badge variant="secondary">
                      I{it.grau} {it.tipo}
                    </Badge>
                  ) : null}
                  {it.revogado && <Badge variant="destructive">Revogado</Badge>}
                  {it.pendente_revisao && !it.revogado && (
                    <Badge variant="outline" className="border-amber-500 text-amber-700">
                      Pendente de revisão
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-7 rounded-full"
                    onClick={() => editarItem(it)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Editar
                  </Button>
                </div>
                <TextoNorma texto={it.descricao} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edição de item */}
      <Dialog open={!!itemEdit} onOpenChange={(o) => !o && setItemEdit(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{itemEdit?.id ? 'Editar item' : 'Novo item'}</DialogTitle>
            <DialogDescription>
              {itemEdit?.tipo_vistoria_id ? nomeTipo(itemEdit.tipo_vistoria_id) : ''} — copie o
              texto exatamente como está no PDF oficial da norma.
            </DialogDescription>
          </DialogHeader>
          {itemEdit && (
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <Label>Item/subitem (como no Anexo II da NR-28)</Label>
                  <Input
                    value={itemEdit.item_ref || ''}
                    onChange={(e) => setItemEdit({ ...itemEdit, item_ref: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Código de ementa</Label>
                  <Input
                    value={itemEdit.codigo || ''}
                    onChange={(e) => setItemEdit({ ...itemEdit, codigo: e.target.value })}
                    placeholder="000000-0"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Grau</Label>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-2 text-sm"
                      value={itemEdit.grau || ''}
                      onChange={(e) =>
                        setItemEdit({
                          ...itemEdit,
                          grau: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    >
                      <option value="">—</option>
                      {[1, 2, 3, 4].map((g) => (
                        <option key={g} value={g}>
                          I{g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-2 text-sm"
                      value={itemEdit.tipo || ''}
                      onChange={(e) => setItemEdit({ ...itemEdit, tipo: e.target.value })}
                    >
                      <option value="">—</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <Label>Seção (título do capítulo)</Label>
                <Input
                  value={itemEdit.secao || ''}
                  onChange={(e) => setItemEdit({ ...itemEdit, secao: e.target.value })}
                />
              </div>
              <div>
                <Label>Texto literal da norma</Label>
                <Textarea
                  rows={12}
                  value={itemEdit.descricao || ''}
                  onChange={(e) => setItemEdit({ ...itemEdit, descricao: e.target.value })}
                  className="font-mono text-xs"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Uma linha por alínea (a), b), c)...). Deixe uma linha em branco entre subitens
                  diferentes.
                </p>
              </div>
              <div>
                <Label>Observação interna</Label>
                <Input
                  value={itemEdit.observacao || ''}
                  onChange={(e) => setItemEdit({ ...itemEdit, observacao: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={conferido} onCheckedChange={(v) => setConferido(!!v)} />
                Texto conferido com o PDF oficial (sai da lista de pendências)
              </label>
              {itemEdit.id && (
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={revogarItem}
                    onCheckedChange={(v) => setRevogarItem(!!v)}
                    className="mt-0.5"
                  />
                  <span>
                    Item revogado (o subitem não existe mais na norma). Sai das novas vistorias;
                    laudos antigos continuam com ele.
                  </span>
                </label>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemEdit(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarItem} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Versão da NR */}
      <Dialog open={!!versaoNr} onOpenChange={(o) => !o && setVersaoNr(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Versão da {versaoNr}</DialogTitle>
            <DialogDescription>
              Portaria da última alteração da norma que o checklist segue. Vale para o corpo e todos
              os anexos desta NR.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Portaria</Label>
              <Input
                value={versaoTexto}
                onChange={(e) => setVersaoTexto(e.target.value)}
                placeholder="Portaria MTE nº ..., de ... de ... de ..."
              />
            </div>
            <div>
              <Label>Data de publicação no DOU</Label>
              <Input
                type="date"
                value={versaoData}
                onChange={(e) => setVersaoData(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVersaoNr(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarVersao}>
              <BookOpenCheck className="mr-2 h-4 w-4" />
              Salvar versão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
