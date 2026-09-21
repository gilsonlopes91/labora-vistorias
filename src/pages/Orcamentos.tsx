/* Redirecionamento da antiga rota /orcamentos para a aba orçamentos dentro de Empresas (apenas gestores) */
import { Navigate } from 'react-router-dom'
import { isGestor } from '@/services/equipe'
import AcessoNegado from '@/components/AcessoNegado'

export default function Orcamentos() {
  if (!isGestor()) {
    return (
      <AcessoNegado
        titulo="Acesso negado aos orçamentos"
        mensagem="A gestão comercial e de orçamentos é restrita aos gestores da organização."
        voltarPara="/empresas"
        rotuloVoltar="Ir para Empresas"
      />
    )
  }

  return <Navigate to="/empresas?aba=orcamentos" replace />
}
