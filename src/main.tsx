/* Main entry point for the application - renders the root React component */
// Primeiro: modo offline e erros em português no cliente do servidor.
import './lib/clienteServidor'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'

// Modo offline (etapa 2): o service worker guarda os arquivos do app para ele
// abrir sem internet. Não roda no servidor de desenvolvimento local.
if ('serviceWorker' in navigator && !/^(localhost|127\.)/.test(location.hostname)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // sem service worker o app funciona normalmente, só não abre offline
    })
  })
}

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)
