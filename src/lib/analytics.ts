/**
 * Google Analytics 4 (gtag.js) com consentimento.
 * ID de Medição: G-6ZNNN1CVH6
 *
 * O script do Google só é carregado depois que o visitante aceita no aviso de
 * cookies (componente AvisoCookies). Sem aceite, nenhum cookie _ga é gravado,
 * como diz a Política de Privacidade. A escolha fica no navegador e pode ser
 * mudada pelo link "Cookies" no rodapé do site.
 */

export const GA_MEASUREMENT_ID = 'G-6ZNNN1CVH6'

const CHAVE_CONSENTIMENTO = 'labora_consentimento_cookies'
export const EVENTO_ABRIR_COOKIES = 'labora-abrir-preferencias-cookies'

export type Consentimento = 'aceito' | 'recusado' | null

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function lerConsentimento(): Consentimento {
  try {
    const valor = window.localStorage.getItem(CHAVE_CONSENTIMENTO)
    return valor === 'aceito' || valor === 'recusado' ? valor : null
  } catch {
    return null
  }
}

let analyticsCarregado = false

/** Injeta o gtag.js. Só deve ser chamado com consentimento. */
export function carregarAnalytics() {
  if (analyticsCarregado || typeof window === 'undefined') return
  analyticsCarregado = true
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // O gtag.js exige o objeto `arguments`, não um array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)
}

/** Apaga os cookies _ga já gravados (quando a pessoa recusa depois de aceitar). */
function apagarCookiesAnalytics() {
  if (typeof document === 'undefined') return
  const dominio = window.location.hostname
  const partes = dominio.split('.')
  const dominios = ['', dominio]
  for (let i = 1; i < partes.length - 1; i++) dominios.push('.' + partes.slice(i).join('.'))
  for (const cookie of document.cookie.split(';')) {
    const nome = cookie.split('=')[0].trim()
    if (!nome.startsWith('_ga')) continue
    for (const d of dominios) {
      document.cookie = `${nome}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ''}`
    }
  }
}

export function salvarConsentimento(valor: 'aceito' | 'recusado') {
  try {
    window.localStorage.setItem(CHAVE_CONSENTIMENTO, valor)
  } catch {
    // navegador sem armazenamento: a escolha vale só para esta visita
  }
  if (valor === 'aceito') {
    carregarAnalytics()
  } else {
    // Desliga a coleta nesta página e apaga o que já tinha sido gravado.
    try {
      ;(window as unknown as Record<string, boolean>)[`ga-disable-${GA_MEASUREMENT_ID}`] = true
    } catch {
      // ignora
    }
    apagarCookiesAnalytics()
  }
}

/** Reabre o aviso de cookies (link "Cookies" no rodapé). */
export function abrirPreferenciasCookies() {
  window.dispatchEvent(new Event(EVENTO_ABRIR_COOKIES))
}

/**
 * Registra uma visualização de página pública no Google Analytics 4 — só se o
 * visitante tiver aceitado os cookies.
 */
export function trackPublicPageView(path: string, title?: string) {
  if (typeof window === 'undefined') return
  if (lerConsentimento() !== 'aceito') return
  carregarAnalytics()
  if (typeof window.gtag !== 'function') return

  const pagePath = path || window.location.pathname + window.location.search
  const pageTitle = title || document.title

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: pageTitle,
    send_to: GA_MEASUREMENT_ID,
  })
}
