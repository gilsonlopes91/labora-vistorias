/* Auditoria de NRs — catálogo das Normas Regulamentadoras oficiais vigentes
   e seus checklists, mantido pela Labora via migration. Somente
   leitura pela UI padrão: criação/edição fica em Formulários
   (builder customizado). A exceção é a importação de checklist via CSV,
   usada para popular rapidamente um checklist "rascunho" (criado
   sem itens por migration) sem precisar digitar a lista inteira.

   Nomenclatura (glossário do app): a seção é "Auditoria de NRs", cada entrada
   do catálogo é um "checklist", e suas linhas são "itens do checklist".
   Evitar "modelo" e "tipo de vistoria" em texto visível ao usuário — são
   nomes internos (coleção tipos_vistoria). */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ListChecks, Lock, Search, Shapes } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getTiposVistoria, type TipoVistoria } from '@/services/tiposVistoria'
import { getItensChecklistVigentes, type ItemChecklist } from '@/services/itensChecklist'
import TextoNorma from '@/components/TextoNorma'
import { isAdmin } from '@/services/equipe'
import { ImportarChecklistCsvDialog } from '@/components/ImportarChecklistCsvDialog'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const compararItemRef = (a: ItemChecklist, b: ItemChecklist) =>
  (a.item_ref || '').localeCompare(b.item_ref || '', undefined, { numeric: true })

export function AuditoriaNRsTab() {
  const [tipos, setTipos] = useState<TipoVistoria[]>([])
  const [loading, setLoading] = useState(true)
  const [itensPorTipo, setItensPorTipo] = useState<Record<string, ItemChecklist[]>>({})
  const [carregandoItens, setCarregandoItens] = useState<Record<string, boolean>>({})
  const [busca, setBusca] = useState('')
  const [abertosManual, setAbertosManual] = useState<string[]>([])
  const usuarioAdmin = isAdmin()

  const carregarTipos = () =>
    getTiposVistoria()
      .then((todos) => {
        const globais = todos.filter((t) => !t.organizacao_id)
        globais.sort((a, b) => {
          const refA = a.nr_referencia || a.nome || ''
          const refB = b.nr_referencia || b.nome || ''
          return refA.localeCompare(refB, undefined, { numeric: true })
        })
        setTipos(globais)
      })
      .catch((error) =>
        toast.error('Não foi possível carregar os checklists', {
          description: getErrorMessage(error),
        }),
      )

  useEffect(() => {
    carregarTipos().finally(() => setLoading(false))
  }, [])

  const carregarItens = async (tipoId: string, forcar = false) => {
    if ((itensPorTipo[tipoId] && !forcar) || carregandoItens[tipoId]) return
    setCarregandoItens((prev) => ({ ...prev, [tipoId]: true }))
    try {
      const itens = await getItensChecklistVigentes(tipoId)
      setItensPorTipo((prev) => ({ ...prev, [tipoId]: itens }))
    } catch (error) {
      toast.error('Não foi possível carregar o checklist', { description: getErrorMessage(error) })
    } finally {
      setCarregandoItens((prev) => ({ ...prev, [tipoId]: false }))
    }
  }

  const handleImportado = (tipoVistoriaId: string) => {
    carregarItens(tipoVistoriaId, true)
    setAbertosManual((prev) => (prev.includes(tipoVistoriaId) ? prev : [...prev, tipoVistoriaId]))
  }

  useEffect(() => {
    if (!busca.trim()) return
    for (const tipo of tipos) {
      carregarItens(tipo.id)
    }
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
  }, [buscando, buscaNormalizada, tipos, itensPorTipo])

  const separarItemRef = (item: ItemChecklist) => {
    const ref = item.item_ref || ''
    const m = ref.match(/^(.*?\d)(\s*,.*|\s+alínea.*|\s+e\s+.*)$/)
    return {
      num: m ? m[1] : ref,
      alineas: m ? m[2].trim().replace(/^,\s*/, '') : '',
    }
  }

  const valorAccordion = buscando ? tiposComMatch || [] : abertosManual

  const qtdNrs = tipos.reduce((max, t) => {
    const n = Number((t.nr_referencia || t.nome || '').match(/NR-(\d+)/i)?.[1] || 0)
    return n > max ? n : max
  }, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Auditoria de NRs</h2>
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              Catálogo fixo ({qtdNrs} NRs e seus anexos)
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Catálogo com todas as Normas Regulamentadoras brasileiras vigentes, mantido pela Labora.
            Para criar seus próprios checklists e fichas de campo, use a aba{' '}
            <span className="font-medium">Formulários</span>.
          </p>
        </div>
        {usuarioAdmin && <ImportarChecklistCsvDialog tipos={tipos} onImportado={handleImportado} />}
      </div>

      <div className="relative">
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
          <p className="text-sm text-muted-foreground">Nenhum checklist cadastrado ainda.</p>
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
                    className="group min-w-0 hover:no-underline"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <ListChecks className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {tipo.nr_referencia && (
                            <Badge variant="secondary" className="shrink-0">
                              <Shapes className="mr-1 h-3 w-3" />
                              {tipo.nr_referencia}
                            </Badge>
                          )}
                          <span className="font-bold">
                            {tipo.nome.replace(/^NR-\d+\s*[—–-]\s*/i, '')}
                          </span>
                        </div>
                        {tipo.descricao && (
                          <p className="line-clamp-2 text-xs text-muted-foreground group-data-[state=open]:line-clamp-none">
                            {tipo.descricao}
                          </p>
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
                            <ul className="space-y-1.5">
                              {itens.map((item) => {
                                const { num, alineas } = separarItemRef(item)
                                return (
                                  <li
                                    key={item.id}
                                    className="grid grid-cols-[5.5rem_1fr] gap-x-3 rounded-lg px-2 py-1.5 text-sm hover:bg-accent/40 sm:grid-cols-[5.5rem_5.5rem_1fr]"
                                  >
                                    <span className="break-words text-[11px] font-semibold leading-5 text-foreground">
                                      {num}
                                    </span>
                                    <span className="hidden whitespace-nowrap font-mono text-[11px] leading-5 text-muted-foreground sm:block">
                                      {item.codigo}
                                    </span>
                                    <div className="min-w-0">
                                      <TextoNorma texto={item.descricao} className="leading-snug" />
                                      {alineas && (
                                        <p className="mt-0.5 text-[11px] italic text-muted-foreground">
                                          {alineas}
                                        </p>
                                      )}
                                    </div>
                                  </li>
                                )
                              })}
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
                        Este checklist ainda não tem itens.
                        {usuarioAdmin
                          ? ' Use "Importar checklist (CSV)" acima para preenchê-lo.'
                          : ''}
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
