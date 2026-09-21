/* Auditoria e Formulários — tela unificada que agrupa Auditoria de NRs e Formulários em sub-abas */
import { useSearchParams, Link } from 'react-router-dom'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { AuditoriaNRsTab } from '@/components/AuditoriaNRsTab'
import { FormulariosTab } from '@/components/FormulariosTab'

export default function AuditoriaEFormularios() {
  const [searchParams, setSearchParams] = useSearchParams()
  const abaParam = searchParams.get('aba')
  const abaAtiva = abaParam === 'formularios' ? 'formularios' : 'auditoria'

  const handleTrocaAba = (novaAba: string) => {
    if (novaAba === 'formularios') {
      setSearchParams({ aba: 'formularios' })
    } else {
      setSearchParams({ aba: 'auditoria' })
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Auditoria e Formulários</h1>
        <p className="text-sm text-muted-foreground">
          Checklists oficiais de Normas Regulamentadoras (NRs) e formulários de campo da sua
          organização.
        </p>
      </div>

      <Tabs value={abaAtiva} onValueChange={handleTrocaAba} className="space-y-6">
        <TabsContent value="auditoria" className="mt-0 focus-visible:outline-none">
          <AuditoriaNRsTab />
        </TabsContent>

        <TabsContent value="formularios" className="mt-0 focus-visible:outline-none">
          <FormulariosTab />
        </TabsContent>
      </Tabs>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Vistorias operacionais completas continuam em{' '}
        <Link to="/vistorias" className="underline">
          Vistorias
        </Link>
        .
      </p>
    </div>
  )
}
