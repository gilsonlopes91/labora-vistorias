/* Route guard — redirects to /login when not authenticated. Gates on isAuthenticated, never !!user.
   Supports role-based checks (gestorOnly / adminOnly) and renders AcessoNegado when unauthorized. */
import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { isGestor } from '@/services/equipe'
import { getVisaoCliente } from '@/lib/visaoCliente'
import { isGestorOnlyPath } from '@/config/navigation'
import AcessoNegado from '@/components/AcessoNegado'
import LoadingScreen from '@/components/LoadingScreen'

interface ProtectedRouteProps {
  children: ReactNode
  gestorOnly?: boolean
  adminOnly?: boolean
}

export default function ProtectedRoute({
  children,
  gestorOnly = false,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen fullScreen mensagem="Iniciando sessão com segurança..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Senha provisória: enquanto não trocar, só a tela de troca de senha abre.
  const precisaTrocarSenha = Boolean(
    (pb.authStore.record as { trocar_senha?: boolean } | null)?.trocar_senha,
  )
  if (precisaTrocarSenha && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />
  }

  // Cliente final (empresa vistoriada) só usa o portal, nunca o app interno.
  if (user?.papel === 'cliente') {
    return <Navigate to="/cliente" replace />
  }

  // Verifica proteção de admin_plataforma
  if (adminOnly) {
    const isAdmin =
      !getVisaoCliente() &&
      (user?.papel === 'admin_plataforma' ||
        (user?.papel === 'staff_labora' && Boolean(user?.acesso_console)))
    if (!isAdmin) {
      return (
        <AcessoNegado
          titulo="Acesso restrito à administração"
          mensagem="Esta área é de uso exclusivo da equipe administrativa da plataforma Labora."
        />
      )
    }
  }

  // Verifica se a rota exige gestor (via prop explícita ou mapeamento central de navegação)
  const requiresGestor = gestorOnly || isGestorOnlyPath(location.pathname)

  if (requiresGestor && !isGestor()) {
    return (
      <AcessoNegado
        titulo="Acesso negado"
        mensagem="Seu perfil de acesso (técnico) não possui permissão para visualizar esta página. Entre em contato com um gestor ou administrador caso precise de acesso."
        voltarPara="/painel"
        rotuloVoltar="Voltar ao início"
      />
    )
  }

  return <>{children}</>
}
