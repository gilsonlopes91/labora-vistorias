/* Documentação SST — módulo próprio (PGR, LTCAT, laudos de insalubridade e
   periculosidade). A navegação entre Visão Geral, Levantamento, Catálogo de
   agentes, Catálogo de EPIs e Como funciona é feita pelo submenu lateral
   ("Documentação SST" no menu principal) — não há mais uma barra de abas
   própria aqui em cima, ela duplicava o menu lateral. A página só lê o
   parâmetro ?aba= (definido pelos links do menu) e renderiza o conteúdo
   correspondente direto. */
import { useSearchParams } from 'react-router-dom'

import { VisaoGeralDocumentacaoTab } from '@/components/VisaoGeralDocumentacaoTab'
import { DocumentacaoComoFunciona } from '@/components/DocumentacaoComoFunciona'
import { LevantamentoSstTab } from '@/components/LevantamentoSstTab'
import { CatalogoAgentesTab } from '@/components/CatalogoAgentesTab'
import { CatalogoEpisTab } from '@/components/CatalogoEpisTab'

const ABAS = ['visao-geral', 'levantamento', 'catalogo', 'epis', 'como-funciona'] as const
type Aba = (typeof ABAS)[number]

export default function DocumentacaoSst() {
  const [searchParams] = useSearchParams()
  const abaParam = searchParams.get('aba')
  const abaAtiva: Aba = ABAS.includes(abaParam as Aba) ? (abaParam as Aba) : 'visao-geral'

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {abaAtiva !== 'visao-geral' && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Documentação SST</h1>
          <p className="text-sm text-muted-foreground">
            PGR, LTCAT e laudos de insalubridade e periculosidade a partir de um único levantamento
            de campo.
          </p>
        </div>
      )}

      {abaAtiva === 'visao-geral' && <VisaoGeralDocumentacaoTab />}
      {abaAtiva === 'levantamento' && <LevantamentoSstTab />}
      {abaAtiva === 'catalogo' && <CatalogoAgentesTab />}
      {abaAtiva === 'epis' && <CatalogoEpisTab />}
      {abaAtiva === 'como-funciona' && <DocumentacaoComoFunciona />}
    </div>
  )
}
