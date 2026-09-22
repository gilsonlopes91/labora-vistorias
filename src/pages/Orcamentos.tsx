/* Rota /orcamentos. A carteira em si mora no OrcamentosTab, que também é o que
   a aba de Orçamentos dentro de Empresas renderiza. Uma implementação só. */
import { OrcamentosTab } from '@/components/OrcamentosTab'

export default function Orcamentos() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <OrcamentosTab />
    </div>
  )
}
