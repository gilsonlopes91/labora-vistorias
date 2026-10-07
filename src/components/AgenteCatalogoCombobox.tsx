/* Seletor do risco do catálogo com busca: o técnico digita e a lista vai
   filtrando (por nome, tipo ou sinônimo, sem diferenciar acento nem
   maiúscula). Digitar "químico" mostra todos os agentes químicos, "ruído"
   mostra os de ruído, e assim por diante. Os itens aparecem agrupados por
   tipo (Acidente, Biológico, Ergonômico, Físico, Químico...). */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { AgenteCatalogo } from '@/services/agentesCatalogo'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

interface AgenteCatalogoComboboxProps {
  agentes: AgenteCatalogo[]
  /** id do agente escolhido, ou vazio para "sem agente". */
  value?: string
  onChange: (agenteId: string) => void
  className?: string
}

export function AgenteCatalogoCombobox({
  agentes,
  value,
  onChange,
  className,
}: AgenteCatalogoComboboxProps) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const escolhido = agentes.find((a) => a.id === value)

  useEffect(() => {
    if (aberto) setTimeout(() => inputRef.current?.focus(), 50)
    else setBusca('')
  }, [aberto])

  const grupos = useMemo(() => {
    const termos = normalizar(busca).split(/\s+/).filter(Boolean)
    const filtrados = agentes.filter((a) => {
      if (termos.length === 0) return true
      const texto = normalizar([a.tipo, a.nome, a.sinonimos, a.cas].filter(Boolean).join(' '))
      return termos.every((t) => texto.includes(t))
    })
    const mapa = new Map<string, AgenteCatalogo[]>()
    for (const a of filtrados) {
      const lista = mapa.get(a.tipo) || []
      lista.push(a)
      mapa.set(a.tipo, lista)
    }
    return Array.from(mapa.entries())
  }, [agentes, busca])

  const total = grupos.reduce((soma, [, lista]) => soma + lista.length, 0)

  const escolher = (id: string) => {
    onChange(id)
    setAberto(false)
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={aberto}
          className={cn('w-full justify-between px-3 font-normal', className)}
        >
          <span className={cn('truncate text-left', !escolhido && 'text-muted-foreground')}>
            {escolhido ? `${escolhido.tipo} — ${escolhido.nome}` : 'Digite para buscar o risco...'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[320px] max-w-[95vw] p-0"
        align="start"
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite: químico, ruído, altura, poeira..."
            className="flex h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              className="rounded p-1 text-muted-foreground hover:bg-muted"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="border-b bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
          {total} {total === 1 ? 'risco encontrado' : 'riscos encontrados'}
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => escolher('__nenhum')}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-muted-foreground hover:bg-accent"
          >
            Sem agente (perigo avulso)
          </button>
          {total === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhum risco encontrado para &ldquo;{busca}&rdquo;.
            </div>
          ) : (
            grupos.map(([tipo, lista]) => (
              <div key={tipo} className="pt-1">
                <div className="sticky top-0 z-10 bg-muted/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
                  {tipo} ({lista.length})
                </div>
                {lista.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => escolher(a.id)}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent',
                      a.id === value && 'bg-accent/60 font-medium',
                    )}
                  >
                    <Check
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        a.id === value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="min-w-0 leading-snug">{a.nome}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default AgenteCatalogoCombobox
