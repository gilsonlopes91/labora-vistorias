/* Service worker do Labora Vistorias (modo offline, etapa 2).
   Guarda os arquivos do próprio app (página, scripts, estilos) para ele abrir
   sem internet. Os dados vêm da cópia local feita pelo app (cacheOffline.ts);
   este arquivo não guarda nada do servidor de dados.
   - Página (navegação): rede primeiro; sem rede, a última página guardada.
   - /assets/: os nomes mudam a cada versão, então pode usar a cópia direto.
   Ao instalar, já baixa os scripts que o app carrega depois (PDF etc.), para
   não faltar nada em campo. */
const VERSAO = 'labora-app-v1'
const PAGINA = '/'

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSAO)
      try {
        await guardarPaginaEArquivos(cache)
      } catch (_) {
        // sem rede na instalação: tenta de novo na próxima navegação
      }
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const nomes = await caches.keys()
      await Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

// Baixa a página e todos os arquivos que ela e o script principal citam.
async function guardarPaginaEArquivos(cache) {
  const resp = await fetch(PAGINA, { cache: 'no-store' })
  if (!resp.ok) return
  const html = await resp.clone().text()
  await cache.put(PAGINA, resp)
  const arquivos = new Set()
  for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) arquivos.add(m[1])
  // O script principal cita os pedaços carregados depois ("assets/x-hash.js").
  for (const a of Array.from(arquivos)) {
    if (!a.endsWith('.js')) continue
    try {
      let r = await cache.match(a)
      if (!r) {
        r = await fetch(a)
        if (!r.ok) continue
        await cache.put(a, r.clone())
      }
      const js = await r.text()
      for (const m of js.matchAll(/assets\/[A-Za-z0-9._-]+\.(?:js|css)/g)) arquivos.add('/' + m[0])
    } catch (_) {
      // segue com os outros
    }
  }
  await Promise.all(
    Array.from(arquivos).map(async (a) => {
      if (await cache.match(a)) return
      try {
        const r = await fetch(a)
        if (r.ok) await cache.put(a, r)
      } catch (_) {
        // ignora
      }
    }),
  )
  await podarArquivos(cache, arquivos)
}

// Remove arquivos de versões antigas que a página atual não usa mais.
async function podarArquivos(cache, atuais) {
  const chaves = await cache.keys()
  await Promise.all(
    chaves.map((req) => {
      const caminho = new URL(req.url).pathname
      if (caminho.startsWith('/assets/') && !atuais.has(caminho)) return cache.delete(req)
      return null
    }),
  )
}

let atualizando = null

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(VERSAO)
        try {
          const resp = await fetch(req)
          if (resp.ok && resp.headers.get('content-type')?.includes('text/html')) {
            await cache.put(PAGINA, resp.clone())
            // Versão nova publicada: renova os arquivos em segundo plano.
            if (!atualizando) {
              atualizando = guardarPaginaEArquivos(cache).finally(() => (atualizando = null))
              event.waitUntil(atualizando)
            }
          }
          return resp
        } catch (_) {
          const guardada = await cache.match(PAGINA)
          if (guardada) return guardada
          throw _
        }
      })(),
    )
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(VERSAO)
        const guardado = await cache.match(req)
        if (guardado) return guardado
        const resp = await fetch(req)
        if (resp.ok) cache.put(req, resp.clone())
        return resp
      })(),
    )
  }
})
