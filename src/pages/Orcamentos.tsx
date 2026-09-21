/* Redirecionamento da antiga rota /orcamentos para a aba orçamentos dentro de Empresas */
import { Navigate } from 'react-router-dom'

export default function Orcamentos() {
  return <Navigate to="/empresas?aba=orcamentos" replace />
}
