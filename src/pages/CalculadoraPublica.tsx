/* Calculadora pública de multas — escolhe NR → escolhe item → dados da
   empresa → valor da multa + explicação. Sem login (rotas /backend/v1/public). */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Calculator, ChevronRight, Info } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Nr {
  id: string
  nome: string
  nr_referencia?: string
}

interface ItemNr {
  id: string
  item_ref: string
  descricao: string
  codigo: string
  grau: number
  tipo: string
  secao?: string
}

interface Resultado {
  item: ItemNr
  multa: { min: number; max: number }
  explicacao_extra?: string
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const GRAU_LABEL: Record<number, string> = {
  1: 'Grau 1 — risco leve',
  2: 'Grau 2 — risco médio',
  3: 'Grau 3 — risco grave',
  4: 'Grau 4 — risco gravíssimo',
}

export default function CalculadoraPublica() {
  const [nrs, setNrs] = useState<Nr[]>([])
  const [nrId, setNrId] = useState<string>('')
  const [itens, setItens] = useState<ItemNr[]>([])
  const [itemId, setItemId] = useState<string>('')
  const [trabalhadores, setTrabalhadores] = useState<string>('')
  const [grauEmpresa, setGrauEmpresa] = useState<string>('')
  const [busca, setBusca] = useState('')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [calculando, setCalculando] = useState(false)
  const [loadingItens, setLoadingItens] = useState(false)

  // Catálogo fixo de NRs (organizacao_id vazio) — público.
  useEffect(() => {
    pb.collection('tipos_vistoria')
      .getFullList({ filter: "organizacao_id = '' && ativo = true", sort: 'nome' })
      .then((lista) => setNrs(lista as unknown as Nr[]))
      .catch(() => toast.error('Não foi possível carregar as normas'))
  }, [])

  const carregarItens = useCallback(async (id: string) => {
    if (!id) return
    setLoadingItens(true)
    setItemId('')
    setResultado(null)
    try {
      const res = await fetch(`/backend/v1/public/nr/${id}/itens`)
      if (!res.ok) throw new Error('Falha ao carregar itens')
      const data = await res.json()
      setItens(data.itens || [])
    } catch (error) {
      toast.error('Não foi possível carregar os itens da norma', {
        description: getErrorMessage(error),
      })
      setItens([])
    } finally {
      setLoadingItens(false)
    }
  }, [])

  useEffect(() => {
    if (nrId) carregarItens(nrId)
  }, [nrId, carregarItens])

  const calcular = async () => {
    if (!itemId) {
      toast.error('Escolha um item da norma')
      return
    }
    const n = parseInt(trabalhadores, 10)
    if (!(n > 0)) {
      toast.error('Informe o número de trabalhadores')
      return
    }
    setCalculando(true)
    try {
      const res = await fetch('/backend/v1/public/calculadora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          trabalhadores: n,
          grau_risco: grauEmpresa ? parseInt(grauEmpresa, 10) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha no cálculo')
      setResultado(data)
    } catch (error) {
      toast.error('Não foi possível calcular', { description: getErrorMessage(error) })
    } finally {
      setCalculando(false)
    }
  }

  const itensFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return itens
    return itens.filter(
      (i) => i.item_ref.toLowerCase().includes(q) || i.descricao.toLowerCase().includes(q),
    )
  }, [itens, busca])

  return (
    <div className="px-8 py-12">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Teste gratuito
      </p>
      <h1 className="text-4xl font-extrabold tracking-tight">
        Calculadora de <span className="text-primary">multas NR-28</span>
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Escolha a norma e o item, informe o número de trabalhadores e veja o valor da multa com
        explicação simples.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Passos */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-none p-5 shadow-subtle">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              1. Escolha a norma
            </div>
            <Select value={nrId} onValueChange={setNrId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Ex.: NR-12 — Máquinas" />
              </SelectTrigger>
              <SelectContent>
                {nrs.map((nr) => (
                  <SelectItem key={nr.id} value={nr.id}>
                    {nr.nr_referencia ? `${nr.nr_referencia} — ${nr.nome}` : nr.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          <Card className="rounded-2xl border-none p-5 shadow-subtle">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              2. Escolha o item (um por vez)
            </div>
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar item por número ou texto..."
              className="mt-2"
            />
            {loadingItens ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ) : itens.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {nrId ? 'Esta norma não tem itens carregados.' : 'Escolha uma norma primeiro.'}
              </p>
            ) : (
              <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1">
                {itensFiltrados.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setItemId(it.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                      itemId === it.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">
                        {it.item_ref}
                      </span>
                      {it.grau ? <Badge variant="secondary">G{it.grau}</Badge> : null}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {it.descricao}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="rounded-2xl border-none p-5 shadow-subtle">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              3. Dados da empresa
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="trab">Número de trabalhadores</Label>
                <Input
                  id="trab"
                  type="number"
                  min="1"
                  value={trabalhadores}
                  onChange={(e) => setTrabalhadores(e.target.value)}
                  placeholder="Ex.: 45"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="grau">Grau de risco (NR-4)</Label>
                <Select value={grauEmpresa} onValueChange={setGrauEmpresa}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Opcional — para contexto" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((g) => (
                      <SelectItem key={g} value={String(g)}>
                        {GRAU_LABEL[g]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={calcular} disabled={calculando} className="w-full rounded-full">
                <Calculator className="mr-2 h-4 w-4" />
                {calculando ? 'Calculando...' : 'Calcular multa'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Resultado */}
        <div>
          {!resultado ? (
            <Card className="flex h-full min-h-72 items-center justify-center rounded-2xl border-dashed p-10 text-center text-sm text-muted-foreground">
              Escolha a norma, o item e informe os dados da empresa para ver o valor.
            </Card>
          ) : (
            <Card className="rounded-2xl border-none p-6 shadow-subtle">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{resultado.item.item_ref}</span>
                {resultado.item.grau ? (
                  <Badge variant="destructive">Grau {resultado.item.grau}</Badge>
                ) : null}
                {resultado.item.tipo ? (
                  <Badge variant="secondary">
                    {resultado.item.tipo === 'S' ? 'Segurança' : 'Medicina'}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{resultado.item.descricao}</p>

              <div className="mt-6 rounded-2xl bg-primary/5 p-5">
                <div className="text-xs font-bold uppercase tracking-wide text-primary">
                  Multa estimada (NR-28)
                </div>
                <div className="mt-1 text-3xl font-extrabold text-primary">
                  {brl.format(resultado.multa.min)}
                  <span className="mx-2 text-lg text-muted-foreground">até</span>
                  {brl.format(resultado.multa.max)}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Faixa calculada pelo nº de trabalhadores × grau da infração (Anexo I da NR-28 ×
                  UFIR).
                </p>
              </div>

              {resultado.explicacao_extra && (
                <div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                  <Info className="h-4 w-4 shrink-0" />
                  {resultado.explicacao_extra}
                </div>
              )}

              <p className="mt-4 text-xs text-muted-foreground">
                Valor estimado com base na tabela vigente. A fiscalização considera reincidência e
                outros fatores. Este teste é informativo — a gestão completa está no app.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
