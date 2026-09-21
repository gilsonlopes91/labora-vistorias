/* Redirecionamento de compatibilidade para a tela unificada de Auditoria e Formulários */
import { Navigate } from 'react-router-dom'

export default function Formularios() {
  return <Navigate to="/auditoria-formularios?aba=formularios" replace />
}
