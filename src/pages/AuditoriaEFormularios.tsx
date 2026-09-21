/* Auditoria e Formulários — tela unificada que agrupa Auditoria de NRs e Formulários em sub-abas */
import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { ListChecks, FileText } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AuditoriaNRsTab } from '@/components/AuditoriaNRsTab'
import { FormulariosTab } from '@/components/FormulariosTab'

export default function AuditoriaEFormularios() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabInicial = searchParams.get('aba') === 'formularios' ? 'formularios' : 'auditoria'
  const [abaAtiva, setAbaAtiva] = useState<string>(tabInicial)

  useEffect(() => {
    const param = searchParams.get('aba')
    if (param === 'formularios' && abaAtiva !== 'formularios') {
      setAbaAtiva('formularios')
    } else if (param !== 'formularios' && abaAtiva === 'formularios' && !searchParams.has('aba')) {
      setAbaAtiva('auditoria')
    }
  }, [searchParams, abaAtiva])

  const handleTrocaAba = (novaAba: string) => {
    setAbaAtiva(novaAba)
    if (novaAba === 'formularios') {
      setSearchParams({ aba: 'formularios' })
    } else {
      setSearchParams({})
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
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl bg-muted/60 p-1.5 shadow-sm sm:inline-grid sm:h-14 sm:w-auto sm:min-w-[420px]">
          <TabsTrigger
            value="auditoria"
            className="flex h-12 items-center justify-center gap-2.5 rounded-xl px-5 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md sm:text-base"
          >
            <ListChecks className="h-5 w-5 shrink-0" />
            <span>Auditoria NRs</span>
          </TabsTrigger>
          <TabsTrigger
            value="formularios"
            className="flex h-12 items-center justify-center gap-2.5 rounded-xl px-5 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md sm:text-base"
          >
            <FileText className="h-5 w-5 shrink-0" />
            <span>Formulários</span>
          </TabsTrigger>
        </TabsList>

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
