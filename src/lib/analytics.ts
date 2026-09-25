/**
 * Utilitários para Google Analytics 4 (gtag.js)
 * ID de Medição Oficial: G-6ZNNN1CVH6
 */

export const GA_MEASUREMENT_ID = 'G-6ZNNN1CVH6'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Registra uma visualização de página pública no Google Analytics 4.
 */
export function trackPublicPageView(path: string, title?: string) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return
  }

  const pagePath = path || window.location.pathname + window.location.search
  const pageTitle = title || document.title

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: pageTitle,
    send_to: GA_MEASUREMENT_ID,
  })
}
