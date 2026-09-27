/* Guarda de rota do portal do cliente (empresa vistoriada). Só papel
 * "cliente" entra; qualquer outro papel autenticado volta para o app
 * interno (/painel) — o próprio ProtectedRoute.tsx manda o cliente de volta
 * para cá se tentar abrir uma rota interna. */
import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import LoadingScreen from '@/components/LoadingScreen'

export default function ProtectedRouteCliente({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <LoadingScreen fullScreen mensagem="Iniciando sessão com segurança..." />
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (user?.papel !== 'cliente') {
    return <Navigate to="/painel" replace />
  }
  return <>{children}</>
}
