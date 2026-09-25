/* Aviso de cookies do site público. O Google Analytics só é ativado se o
   visitante aceitar (ver lib/analytics). Aparece na primeira visita e quando a
   pessoa clica em "Cookies" no rodapé. Não aparece na área logada do app. */
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  EVENTO_ABRIR_COOKIES,
  lerConsentimento,
  salvarConsentimento,
  trackPublicPageView,
} from '@/lib/analytics'

const ROTAS_PUBLICAS = [
  '/',
  '/login',
  '/calculadora',
  '/blog',
  '/em-breve',
  '/termos',
  '/privacidade',
]

const ehRotaPublica = (path: string) =>
  ROTAS_PUBLICAS.includes(path) || path.startsWith('/blog/') || path.startsWith('/calculadora')

export default function AvisoCookies() {
  const location = useLocation()
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    if (lerConsentimento() === null) setAberto(true)
    const abrir = () => setAberto(true)
    window.addEventListener(EVENTO_ABRIR_COOKIES, abrir)
    return () => window.removeEventListener(EVENTO_ABRIR_COOKIES, abrir)
  }, [])

  if (!aberto || !ehRotaPublica(location.pathname)) return null

  const escolher = (valor: 'aceito' | 'recusado') => {
    salvarConsentimento(valor)
    setAberto(false)
    if (valor === 'aceito') trackPublicPageView(location.pathname + location.search)
  }

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 py-3 shadow-lg backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Usamos cookies do Google Analytics para contar as visitas ao site e saber quais conteúdos
          são mais úteis. Eles só são ativados se você aceitar. Veja a{' '}
          <Link to="/privacidade" className="text-primary underline underline-offset-2">
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => escolher('recusado')}>
            Recusar
          </Button>
          <Button size="sm" onClick={() => escolher('aceito')}>
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  )
}
