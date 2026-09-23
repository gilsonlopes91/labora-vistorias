/* Texto literal de um item de NR, preservando as quebras de linha (caput,
   alíneas, subitens). Textos longos mostram o começo e um "ver texto completo". */
import { useState } from 'react'
import { cn } from '@/lib/utils'

const LIMITE = 700

export default function TextoNorma({ texto, className }: { texto: string; className?: string }) {
  const [aberto, setAberto] = useState(false)
  const longo = texto.length > LIMITE
  const mostrado = !longo || aberto ? texto : texto.slice(0, LIMITE).replace(/\s+\S*$/, '') + ' …'
  return (
    <div className={cn('whitespace-pre-line text-sm leading-relaxed', className)}>
      {mostrado}
      {longo && (
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="ml-1 text-xs font-medium text-primary underline underline-offset-2"
        >
          {aberto ? 'mostrar menos' : 'ver texto completo'}
        </button>
      )}
    </div>
  )
}
