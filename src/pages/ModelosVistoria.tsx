/* Redirecionamento de compatibilidade para a tela unificada de Auditoria e Formulários */
import { Navigate } from 'react-router-dom'

export default function ModelosVistoria() {
  return <Navigate to="/auditoria-formularios?aba=auditoria" replace />
}
