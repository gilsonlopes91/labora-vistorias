/* Modelos de vistoria/auditoria — catálogo dos tipos de vistoria cadastrados e seus checklists. */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ListChecks, Search } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getTiposVistoria, type TipoVistoria } from '@/services/tiposVistoria'
import { getItensChecklist, type ItemChecklist } from '@/services/itensChecklist'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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

export default function ModelosVistoria() {
  const [tipos, setTipos] = useState<TipoVistoria[]>([])
  const [loading, setLoading] = useState(true)
  const [itensPorTipo, setItensPorTipo] = useState<Record<string, ItemChecklist[]>>({})
  const [carregandoItens, setCarregandoItens] = useState<Record<string, boolean>>({})
  const [busca, setBusca] = useState('')
  const [abertosManual, setAbertosManual] = useState<string[]>([])

  useEffect(() => {
    getTiposVistoria()
      .then(setTipos)
      .catch((error) =>
        toast.error('Não foi possível carregar os modelos de vistoria', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setLoading(false))
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

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Modelos de vistoria</h1>
        <p className="text-sm text-muted-foreground">
          Os tipos de vistoria/auditoria disponíveis e o checklist de cada um.
        </p>
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
                        </div>
                        {tipo.descricao && (
                          <p className="truncate text-xs text-muted-foreground">{tipo.descricao}</p>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
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
    </div>
  )
}
