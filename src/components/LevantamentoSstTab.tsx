/* Levantamento SST: escolhe a empresa e, dentro dela, a estrutura (setores,
   GHE, funções), o inventário de riscos e o plano de ação. A empresa e a
   sub-aba ficam na URL (?empresa=...&sub=...) para o link da ficha da
   empresa cair direto no lugar certo. Acima das abas, um painel de saúde do
   cadastro resume o quanto já foi levantado (estrutura, efetivo, riscos),
   no mesmo espírito do painel que a Labora já usava no site anterior. */
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertCircle, Building2, CheckCircle2, HardHat, ShieldCheck, Users2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getEmpresas, type Empresa } from '@/services/empresas'
import { getSetores } from '@/services/setores'
import { getGhes } from '@/services/ghes'
import { getFuncoesSst } from '@/services/funcoesSst'
import { getAcoesPlano } from '@/services/acoesPlano'
import { getAvaliacoesRiscoPorGhes } from '@/services/avaliacoesRisco'
import { EstruturaSstTab } from '@/components/EstruturaSstTab'
import { InventarioRiscosTab } from '@/components/InventarioRiscosTab'
import { PlanoAcaoTab } from '@/components/PlanoAcaoTab'
import { PlanejamentoPgrTab } from '@/components/PlanejamentoPgrTab'
import { DocumentosSstTab } from '@/components/DocumentosSstTab'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SUBS = ['planejamento', 'estrutura', 'inventario', 'plano', 'documentos'] as const
type Sub = (typeof SUBS)[number]

interface SaudeCadastro {
  carregando: boolean
  ambientes: number
  ghes: number
  funcoes: number
  avaliacoes: number
  acoesPendentes: number
  acoesTotal: number
  percentual: number
  pendencia: string | null
}

const SAUDE_VAZIA: SaudeCadastro = {
  carregando: true,
  ambientes: 0,
  ghes: 0,
  funcoes: 0,
  avaliacoes: 0,
  acoesPendentes: 0,
  acoesTotal: 0,
  percentual: 0,
  pendencia: null,
}

function useSaudeCadastro(empresaId: string) {
  const [saude, setSaude] = useState<SaudeCadastro>(SAUDE_VAZIA)

  useEffect(() => {
    if (!empresaId) {
      setSaude(SAUDE_VAZIA)
      return
    }
    let cancelado = false
    setSaude((v) => ({ ...v, carregando: true }))
    Promise.all([
      getSetores(empresaId),
      getGhes(empresaId),
      getFuncoesSst(empresaId),
      getAcoesPlano(empresaId),
    ])
      .then(async ([setores, ghes, funcoes, acoes]) => {
        const avaliacoes = await getAvaliacoesRiscoPorGhes(ghes.map((g) => g.id))
        if (cancelado) return
        const passos: Array<[boolean, string]> = [
          [setores.length > 0 || ghes.length > 0, 'Cadastre ao menos um ambiente ou GHE'],
          [funcoes.length > 0, 'Cadastre as funções da empresa'],
          [avaliacoes.length > 0, 'Preencha o inventário de riscos'],
          [acoes.length > 0, 'Crie o plano de ação'],
        ]
        const concluidos = passos.filter(([ok]) => ok).length
        const pendencia = passos.find(([ok]) => !ok)?.[1] || null
        setSaude({
          carregando: false,
          ambientes: setores.length,
          ghes: ghes.length,
          funcoes: funcoes.length,
          avaliacoes: avaliacoes.length,
          acoesPendentes: acoes.filter((a) => a.status !== 'Concluída' && a.status !== 'Cancelada')
            .length,
          acoesTotal: acoes.length,
          percentual: Math.round((concluidos / passos.length) * 100),
          pendencia,
        })
      })
      .catch((error) =>
        toast.error('Não foi possível calcular a saúde do cadastro', {
          description: getErrorMessage(error),
        }),
      )
    return () => {
      cancelado = true
    }
  }, [empresaId])

  return saude
}

function PainelSaude({ saude }: { saude: SaudeCadastro }) {
  const corSaude = saude.percentual === 100 ? 'text-emerald-600' : 'text-orange-500'
  const corBarra = saude.percentual === 100 ? 'bg-emerald-600' : 'bg-orange-500'
  const IconeSaude = saude.percentual === 100 ? CheckCircle2 : AlertCircle

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="flex h-full flex-col justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Saúde do Cadastro</p>
            <h3 className={`mt-1 flex items-center gap-2 text-2xl font-bold ${corSaude}`}>
              {saude.carregando ? '—' : `${saude.percentual}%`}
              <IconeSaude className="h-5 w-5" />
            </h3>
          </div>
          <div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${corBarra} transition-all`}
                style={{ width: `${saude.carregando ? 0 : saude.percentual}%` }}
              />
            </div>
            {saude.pendencia && (
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-orange-600">
                <AlertCircle className="h-3.5 w-3.5" /> Pendência: {saude.pendencia}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex h-full items-center gap-3 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Estrutura Física</p>
            <p className="text-xl font-bold">{saude.ambientes} ambientes</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {saude.ghes} unidade{saude.ghes === 1 ? '' : 's'} de avaliação (GHE)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex h-full items-center gap-3 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <Users2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Efetivo Operacional</p>
            <p className="text-xl font-bold">{saude.funcoes} funções</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{saude.ghes} GHEs configurados</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex h-full items-center gap-3 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50">
            <ShieldCheck className="h-5 w-5 text-orange-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Gestão de Riscos</p>
            <p className="text-xl font-bold">{saude.acoesPendentes} ações pendentes</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              De {saude.acoesTotal} plano{saude.acoesTotal === 1 ? '' : 's'} no total
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function LevantamentoSstTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [carregando, setCarregando] = useState(true)

  const empresaId = searchParams.get('empresa') || ''
  const subParam = searchParams.get('sub')
  const sub: Sub = SUBS.includes(subParam as Sub) ? (subParam as Sub) : 'planejamento'
  const saude = useSaudeCadastro(empresaId)

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
        <>
          <PainelSaude saude={saude} />

          <Tabs value={sub} onValueChange={(v) => mudarParam('sub', v)} className="space-y-6">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="planejamento">
                <HardHat className="mr-2 h-4 w-4 opacity-70" />
                Planejamento
              </TabsTrigger>
              <TabsTrigger value="estrutura">Estrutura SST</TabsTrigger>
              <TabsTrigger value="inventario">Inventário de riscos</TabsTrigger>
              <TabsTrigger value="plano">
                Plano de ação
                {saude.acoesPendentes > 0 && (
                  <span className="ml-2 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {saude.acoesPendentes}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>
            <TabsContent value="planejamento" className="mt-0 focus-visible:outline-none">
              <PlanejamentoPgrTab key={empresaId} empresaId={empresaId} />
            </TabsContent>
            <TabsContent value="estrutura" className="mt-0 focus-visible:outline-none">
              <EstruturaSstTab key={empresaId} empresaId={empresaId} />
            </TabsContent>
            <TabsContent value="inventario" className="mt-0 focus-visible:outline-none">
              <InventarioRiscosTab key={empresaId} empresaId={empresaId} />
            </TabsContent>
            <TabsContent value="plano" className="mt-0 focus-visible:outline-none">
              <PlanoAcaoTab key={empresaId} empresaId={empresaId} />
            </TabsContent>
            <TabsContent value="documentos" className="mt-0 focus-visible:outline-none">
              <DocumentosSstTab key={empresaId} empresaId={empresaId} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

export default LevantamentoSstTab
