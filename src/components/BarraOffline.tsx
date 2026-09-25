/* Faixa no topo do app quando não há internet (modo offline, etapa 2), e
   preparação automática das próximas vistorias quando há. */
import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { prepararParaCampo } from '@/lib/prepararOffline'

export default function BarraOffline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [usandoCopia, setUsandoCopia] = useState(false)

  useEffect(() => {
    const on = () => {
      setOnline(true)
      setUsandoCopia(false)
      prepararParaCampo().catch(() => {})
    }
    const off = () => setOnline(false)
    // Com internet, o aviso de cópia local some sozinho depois de um tempo.
    let apagar: ReturnType<typeof setTimeout> | undefined
    const copia = () => {
      setUsandoCopia(true)
      clearTimeout(apagar)
      apagar = setTimeout(() => setUsandoCopia(false), 20000)
    }
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    window.addEventListener('labora:copia-local', copia)
    // Com internet, deixa as próximas vistorias guardadas no aparelho.
    const t = setTimeout(() => {
      if (navigator.onLine) prepararParaCampo().catch(() => {})
    }, 3000)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
      window.removeEventListener('labora:copia-local', copia)
      clearTimeout(t)
      clearTimeout(apagar)
    }
  }, [])

  if (online && !usandoCopia) return null

  return (
    <div className="flex items-start gap-2 border-b bg-muted px-4 py-2 text-xs text-muted-foreground">
      <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p>
        {online
          ? 'Conexão fraca: parte do que está na tela veio da cópia guardada neste aparelho.'
          : 'Sem internet. Você vê o que foi aberto ou preparado neste aparelho; o que marcar na vistoria fica guardado e é enviado quando a conexão voltar.'}
      </p>
    </div>
  )
}
