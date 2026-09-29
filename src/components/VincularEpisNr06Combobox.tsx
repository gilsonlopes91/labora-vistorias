import * as React from 'react'
import { Check, ChevronsUpDown, Search, ShieldCheck, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  CATEGORIAS_EPI_NR06,
  buscarItensNr06,
  listarTodosItensNr06,
  type ItemEpiNr06,
} from '@/lib/episNr06'

interface VincularEpisNr06ComboboxProps {
  selecionados: string[]
  onChange: (novosSelecionados: string[]) => void
  disabled?: boolean
  className?: string
}

export function VincularEpisNr06Combobox({
  selecionados,
  onChange,
  disabled = false,
  className,
}: VincularEpisNr06ComboboxProps) {
  const [aberto, setAberto] = React.useState(false)
  const [termoBusca, setTermoBusca] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const todosItens = React.useMemo(() => listarTodosItensNr06(), [])

  // Mapa rápido de id -> item para exibir badges dos selecionados
  const mapaItens = React.useMemo(() => {
    const mapa = new Map<string, ItemEpiNr06 & { categoriaCodigo: string }>()
    for (const item of todosItens) {
      mapa.set(item.id, item)
    }
    return mapa
  }, [todosItens])

  const categoriasFiltradas = React.useMemo(() => {
    return buscarItensNr06(termoBusca)
  }, [termoBusca])

  const alternarItem = (id: string) => {
    if (selecionados.includes(id)) {
      onChange(selecionados.filter((item) => item !== id))
    } else {
      onChange([...selecionados, id])
    }
  }

  const removerItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    onChange(selecionados.filter((item) => item !== id))
  }

  const limparTodos = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    onChange([])
  }

  // Foco no input ao abrir
  React.useEffect(() => {
    if (aberto) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setTermoBusca('')
    }
  }, [aberto])

  const totalFiltrados = React.useMemo(() => {
    return categoriasFiltradas.reduce((acc, cat) => acc + cat.itens.length, 0)
  }, [categoriasFiltradas])

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={aberto}
            disabled={disabled}
            className="w-full justify-between font-normal text-left h-auto min-h-10 py-2 px-3 hover:bg-background"
          >
            <div className="flex items-center gap-2 truncate">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              {selecionados.length === 0 ? (
                <span className="text-muted-foreground text-sm">
                  Selecione os EPIs (NR-06) para proteção...
                </span>
              ) : (
                <span className="text-sm font-medium text-foreground">
                  {selecionados.length}{' '}
                  {selecionados.length === 1 ? 'EPI vinculado' : 'EPIs vinculados'} (NR-06)
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[calc(100vw-2rem)] sm:w-[540px] max-w-[95vw] p-0 shadow-lg"
          align="start"
        >
          {/* Campo de busca incremental com autocomplete */}
          <div className="flex items-center border-b px-3 py-2 bg-muted/30">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Digite para buscar EPI (ex: capacete, óculos, luva, solda)..."
              className="flex h-9 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {termoBusca && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTermoBusca('')}
                className="h-6 w-6 p-0 hover:bg-muted"
                title="Limpar busca"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>

          {/* Resumo de contagem e botão para limpar seleção */}
          <div className="flex items-center justify-between border-b px-3 py-1.5 text-xs text-muted-foreground bg-muted/20">
            <span>
              {totalFiltrados} {totalFiltrados === 1 ? 'opção encontrada' : 'opções encontradas'}
            </span>
            {selecionados.length > 0 && (
              <button
                type="button"
                onClick={limparTodos}
                className="text-xs text-destructive hover:underline font-medium"
              >
                Desmarcar todos ({selecionados.length})
              </button>
            )}
          </div>

          {/* Lista com scroll e grupos visíveis A–I */}
          <div className="max-h-[320px] overflow-y-auto p-1 divide-y divide-border/40">
            {totalFiltrados === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhum EPI encontrado para &ldquo;{termoBusca}&rdquo;.
              </div>
            ) : (
              categoriasFiltradas.map((cat) => (
                <div key={cat.codigo} className="py-1.5 first:pt-1 last:pb-1">
                  {/* Cabeçalho da Categoria Oficial NR-06 */}
                  <div className="sticky top-0 z-10 flex items-center justify-between bg-muted/90 backdrop-blur px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    <span>{cat.titulo}</span>
                    <span className="text-[10px] font-normal lowercase">
                      {cat.itens.length} {cat.itens.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>

                  {/* Itens do grupo */}
                  <div className="space-y-0.5">
                    {cat.itens.map((item) => {
                      const estaMarcado = selecionados.includes(item.id)
                      return (
                        <div
                          key={item.id}
                          role="checkbox"
                          aria-checked={estaMarcado}
                          tabIndex={0}
                          onClick={() => alternarItem(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              alternarItem(item.id)
                            }
                          }}
                          className={cn(
                            'group flex items-start gap-2.5 rounded-md px-2.5 py-2 text-sm cursor-pointer select-none transition-colors outline-none',
                            estaMarcado
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'hover:bg-accent text-foreground hover:text-accent-foreground',
                          )}
                        >
                          <div
                            className={cn(
                              'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                              estaMarcado
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground/40 group-hover:border-foreground/70 bg-background',
                            )}
                          >
                            {estaMarcado && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="leading-snug break-words">{item.nome}</p>
                            {item.descricao && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                                {item.descricao}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Rodapé com botão Concluído */}
          <div className="border-t p-2 flex justify-end bg-muted/20">
            <Button
              type="button"
              size="sm"
              onClick={() => setAberto(false)}
              className="h-8 px-4 text-xs font-semibold"
            >
              Concluído
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Badges dos itens selecionados com remoção individual */}
      {selecionados.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selecionados.map((id) => {
            const item = mapaItens.get(id)
            const rotulo = item ? `${item.categoriaCodigo} · ${item.nome}` : id
            return (
              <Badge
                key={id}
                variant="secondary"
                className="text-xs font-normal pl-2 pr-1 py-0.5 max-w-full flex items-center gap-1.5 break-words whitespace-normal text-left"
              >
                <span className="truncate">{rotulo}</span>
                <button
                  type="button"
                  onClick={(e) => removerItem(id, e)}
                  disabled={disabled}
                  aria-label={`Remover ${rotulo}`}
                  className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 inline-flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
