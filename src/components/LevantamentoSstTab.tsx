/* Levantamento SST: escolhe a empresa e, dentro dela, a estrutura (setores,
   GHE, funções), o inventário de riscos e o plano de ação. A empresa e a
   sub-aba ficam na URL (?empresa=...&sub=...) para o link da ficha da
   empresa cair direto no lugar certo. */
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getEmpresas, type Empresa } from '@/services/empresas'
import { EstruturaSstTab } from '@/components/EstruturaSstTab'
import { InventarioRiscosTab } from '@/components/InventarioRiscosTab'
import { PlanoAcaoTab } from '@/components/PlanoAcaoTab'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SUBS = ['estrutura', 'inventario', 'plano'] as const
type Sub = (typeof SUBS)[number]

export function LevantamentoSstTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [carregando, setCarregando] = useState(true)

  const empresaId = searchParams.get('empresa') || ''
  const subParam = searchParams.get('sub')
  const sub: Sub = SUBS.includes(subParam as Sub) ? (subParam as Sub) : 'estrutura'

  useEffect(() => {
    getEmpresas()
      .then(setEmpresas)
      .catch((error) =>
        toast.error('Não foi possível carregar as empresas', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregando(false))
  }, [])

  const mudarParam = (chave: string, valor: string) => {
    const proximo = new URLSearchParams(searchParams)
    proximo.set('aba', 'levantamento')
    proximo.set(chave, valor)
    setSearchParams(proximo)
  }

  const empresa = empresas.find((e) => e.id === empresaId)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-72 flex-1">
          <Label>Empresa</Label>
          <Select value={empresaId} onValueChange={(v) => mudarParam('empresa', v)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue
                placeholder={carregando ? 'Carregando empresas...' : 'Escolha a empresa'}
              />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome_fantasia || e.razao_social}
                  {e.cnpj ? ` · ${e.cnpj}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {empresa && (
          <Button asChild variant="outline">
            <Link to={`/empresas/${empresa.id}`}>
              <Building2 className="mr-2 h-4 w-4" />
              Abrir ficha da empresa
            </Link>
          </Button>
        )}
      </div>

      {!carregando && empresas.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma empresa cadastrada.{' '}
            <Link to="/empresas" className="underline">
              Cadastre uma empresa
            </Link>{' '}
            para começar o levantamento.
          </p>
        </div>
      ) : !empresaId ? (
        <div className="rounded-2xl border border-dashed bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Escolha uma empresa acima para ver a estrutura, o inventário e o plano de ação dela.
          </p>
        </div>
      ) : (
        <Tabs value={sub} onValueChange={(v) => mudarParam('sub', v)} className="space-y-6">
          <TabsList>
            <TabsTrigger value="estrutura">Estrutura SST</TabsTrigger>
            <TabsTrigger value="inventario">Inventário de riscos</TabsTrigger>
            <TabsTrigger value="plano">Plano de ação</TabsTrigger>
          </TabsList>
          <TabsContent value="estrutura" className="mt-0 focus-visible:outline-none">
            <EstruturaSstTab key={empresaId} empresaId={empresaId} />
          </TabsContent>
          <TabsContent value="inventario" className="mt-0 focus-visible:outline-none">
            <InventarioRiscosTab key={empresaId} empresaId={empresaId} />
          </TabsContent>
          <TabsContent value="plano" className="mt-0 focus-visible:outline-none">
            <PlanoAcaoTab key={empresaId} empresaId={empresaId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default LevantamentoSstTab
