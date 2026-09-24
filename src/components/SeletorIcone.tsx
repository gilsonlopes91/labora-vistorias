/* Grade de ícones para fichas/formulários: mostra os 32 principais e um botão
   "Mostrar mais ícones" que abre o restante, com busca pelo nome. */
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'

import { ICONES_FORMULARIO, ICONES_VISIVEIS_INICIO } from '@/lib/iconesFormulario'
import { Input } from '@/components/ui/input'

const semAcento = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

interface Props {
  value: string
  onChange: (id: string) => void
  /** 'grade' = 4 colunas largas (painel lateral); 'compacto' = 8 colunas (diálogo) */
  variante?: 'grade' | 'compacto'
}

export default function SeletorIcone({ value, onChange, variante = 'grade' }: Props) {
  const indiceAtual = ICONES_FORMULARIO.findIndex((i) => i.id === value)
  // Se o ícone escolhido está entre os extras, já abre expandido.
  const [expandido, setExpandido] = useState(indiceAtual >= ICONES_VISIVEIS_INICIO)
  const [busca, setBusca] = useState('')

  const lista = useMemo(() => {
    if (!expandido) return ICONES_FORMULARIO.slice(0, ICONES_VISIVEIS_INICIO)
    const q = semAcento(busca.trim())
    if (!q) return ICONES_FORMULARIO
    return ICONES_FORMULARIO.filter((i) => semAcento(i.label).includes(q))
  }, [expandido, busca])

  const extras = ICONES_FORMULARIO.length - ICONES_VISIVEIS_INICIO
  const selecionado = ICONES_FORMULARIO[indiceAtual]

  const grade = variante === 'grade' ? 'grid grid-cols-4 gap-2' : 'grid grid-cols-8 gap-1.5'
  const botao =
    variante === 'grade'
      ? 'flex h-10 items-center justify-center rounded-xl border transition-colors'
      : 'flex h-9 w-9 items-center justify-center rounded-lg border transition-all'
  const ativo =
    variante === 'grade'
      ? 'border-primary bg-accent text-accent-foreground'
      : 'border-primary bg-primary text-primary-foreground'
  const inativo =
    variante === 'grade'
      ? 'hover:bg-muted'
      : 'border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground'

  return (
    <div className="space-y-2">
      {expandido && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar ícone (ex.: extintor, ruído)"
            className="h-8 pl-8 text-xs"
          />
        </div>
      )}

      <div className={`${grade} ${expandido ? 'max-h-72 overflow-y-auto pr-1' : ''}`}>
        {lista.map((opcao) => {
          const Icone = opcao.icon
          return (
            <button
              key={opcao.id}
              type="button"
              title={opcao.label}
              aria-label={opcao.label}
              aria-pressed={value === opcao.id}
              onClick={() => onChange(opcao.id)}
              className={`${botao} ${value === opcao.id ? ativo : inativo}`}
            >
              <Icone className="h-4 w-4" />
            </button>
          )
        })}
        {expandido && lista.length === 0 && (
          <p className="col-span-full py-3 text-center text-xs text-muted-foreground">
            Nenhum ícone com esse nome.
          </p>
        )}
      </div>

      {selecionado && (
        <p className="text-xs text-muted-foreground">
          Selecionado: <span className="font-medium text-foreground">{selecionado.label}</span>
        </p>
      )}

      {extras > 0 && (
        <button
          type="button"
          onClick={() => {
            setExpandido((x) => !x)
            setBusca('')
          }}
          className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {expandido ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Mostrar mais ícones (+{extras})
            </>
          )}
        </button>
      )}
    </div>
  )
}
