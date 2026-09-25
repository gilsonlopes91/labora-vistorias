/* Campo de valor em reais. Aceita o jeito brasileiro de digitar (1250,50 ou
   1.250,50) e também 1250.50; mostra formatado ao sair do campo. O campo
   type="number" do navegador descartava a vírgula e o total ficava R$ 0,00. */
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

/** Converte o texto digitado em número (0 quando vazio ou inválido). */
export function textoParaValor(texto: string): number {
  const t = (texto || '').replace(/[^\d,.]/g, '')
  if (!t) return 0
  if (t.includes(',')) {
    // vírgula é o decimal; pontos são separador de milhar
    const n = Number(t.replace(/\./g, '').replace(',', '.'))
    return Number.isFinite(n) ? n : 0
  }
  const partes = t.split('.')
  // um ponto com até 2 casas no fim é decimal (1250.5); senão é milhar (1.250)
  const n =
    partes.length === 2 && partes[1].length > 0 && partes[1].length <= 2
      ? Number(t)
      : Number(t.replace(/\./g, ''))
  return Number.isFinite(n) ? n : 0
}

const formatar = (valor: number) =>
  valor ? valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''

interface CampoMoedaProps {
  valor: number
  onChange: (valor: number) => void
  id?: string
  placeholder?: string
  title?: string
  /** Classes do contêiner (ex.: col-span do grid). */
  className?: string
}

export default function CampoMoeda({
  valor,
  onChange,
  id,
  placeholder,
  title,
  className,
}: CampoMoedaProps) {
  const [texto, setTexto] = useState(formatar(valor))
  const [focado, setFocado] = useState(false)

  // Valor mudou de fora (outro orçamento aberto, item removido): atualiza o texto.
  useEffect(() => {
    if (!focado) setTexto(formatar(valor))
  }, [valor, focado])

  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        R$
      </span>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        title={title}
        value={texto}
        onFocus={() => setFocado(true)}
        onChange={(e) => {
          setTexto(e.target.value)
          onChange(textoParaValor(e.target.value))
        }}
        onBlur={() => {
          setFocado(false)
          setTexto(formatar(textoParaValor(texto)))
        }}
        className="pl-9 tabular-nums"
      />
    </div>
  )
}
