/* Documentação SST — módulo próprio (PGR, LTCAT, laudos de insalubridade e
   periculosidade). Sub-abas pela URL (?aba=...), no mesmo padrão de
   "Auditoria e Formulários": como funciona, levantamento por empresa,
   catálogo de agentes e matrizes de risco. */
import { useSearchParams } from 'react-router-dom'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentacaoComoFunciona } from '@/components/DocumentacaoComoFunciona'
import { LevantamentoSstTab } from '@/components/LevantamentoSstTab'
import { CatalogoAgentesTab } from '@/components/CatalogoAgentesTab'
import { CatalogoEpisTab } from '@/components/CatalogoEpisTab'
import { MatrizesRiscoTab } from '@/components/MatrizesRiscoTab'

const ABAS = ['levantamento', 'catalogo', 'epis', 'matrizes', 'como-funciona'] as const
type Aba = (typeof ABAS)[number]

export default function DocumentacaoSst() {
  const [searchParams, setSearchParams] = useSearchParams()
  const abaParam = searchParams.get('aba')
  const abaAtiva: Aba = ABAS.includes(abaParam as Aba) ? (abaParam as Aba) : 'levantamento'

  const trocarAba = (aba: string) => {
    // Troca de aba limpa os parâmetros da aba anterior (empresa, sub).
    setSearchParams({ aba })
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Documentação SST</h1>
        <p className="text-sm text-muted-foreground">
          PGR, LTCAT e laudos de insalubridade e periculosidade a partir de um único levantamento de
          campo.
        </p>
      </div>

      <Tabs value={abaAtiva} onValueChange={trocarAba} className="space-y-6">
        <TabsList>
          <TabsTrigger value="levantamento">Levantamento</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo de agentes</TabsTrigger>
          <TabsTrigger value="epis">Catálogo de EPIs</TabsTrigger>
          <TabsTrigger value="matrizes">Matrizes de risco</TabsTrigger>
          <TabsTrigger value="como-funciona">Como funciona</TabsTrigger>
        </TabsList>

        <TabsContent value="levantamento" className="mt-0 focus-visible:outline-none">
          <LevantamentoSstTab />
        </TabsContent>
        <TabsContent value="catalogo" className="mt-0 focus-visible:outline-none">
          <CatalogoAgentesTab />
        </TabsContent>
        <TabsContent value="epis" className="mt-0 focus-visible:outline-none">
          <CatalogoEpisTab />
        </TabsContent>
        <TabsContent value="matrizes" className="mt-0 focus-visible:outline-none">
          <MatrizesRiscoTab />
        </TabsContent>
        <TabsContent value="como-funciona" className="mt-0 focus-visible:outline-none">
          <DocumentacaoComoFunciona />
        </TabsContent>
      </Tabs>
    </div>
  )
}
