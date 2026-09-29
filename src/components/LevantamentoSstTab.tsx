/* Levantamento SST: escolhe a empresa e, dentro dela, a estrutura (setores,
   GHE, funções), o inventário de riscos e o plano de ação. A empresa e a
   sub-aba ficam na URL (?empresa=...&sub=...) para o link da ficha da
   empresa cair direto no lugar certo. Acima das abas, um painel de saúde do
   cadastro resume o quanto já foi levantado (estrutura, efetivo, riscos),
   no mesmo espírito do painel que a Labora já usava no site anterior. */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  HardHat,
  Search,
  ShieldCheck,
  Users2,
} from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getEmpresas, type Empresa } from '@/services/empresas'
import { getSetores } from '@/services/setores'
import { getGhes } from '@/services/ghes'
import { getFuncoesSst } from '@/services/funcoesSst'
import { getAcoesPlano } from '@/services/acoesPlano'
import { getAvaliacoesRiscoPorGhes } from '@/services/avaliacoesRisco'
import { EstruturaSstTab } from '@/components/EstruturaSstTab'
import { PlanoAcaoTab } from '@/components/PlanoAcaoTab'
import { PlanejamentoPgrTab } from '@/components/PlanejamentoPgrTab'
import { DocumentosSstTab } from '@/components/DocumentosSstTab'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const SUBS = ['planejamento', 'ambiente', 'ghe', 'funcao', 'plano', 'documentos'] as const
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

// Busca os dados de uma empresa e monta a "saúde do cadastro" dela — usada
// tanto no painel de detalhe (uma empresa) quanto na lista geral (todas).
async function buscarSaudeCadastro(empresaId: string): Promise<SaudeCadastro> {
  const [setores, ghes, funcoes, acoes] = await Promise.all([
    getSetores(empresaId),
    getGhes(empresaId),
    getFuncoesSst(empresaId),
    getAcoesPlano(empresaId),
  ])
  const avaliacoes = await getAvaliacoesRiscoPorGhes(ghes.map((g) => g.id))
  const passos: Array<[boolean, string]> = [
    [setores.length > 0 || ghes.length > 0, 'Cadastre ao menos um ambiente ou GHE'],
    [funcoes.length > 0, 'Cadastre as funções da empresa'],
    [avaliacoes.length > 0, 'Preencha o inventário de riscos'],
    [acoes.length > 0, 'Crie o plano de ação'],
  ]
  const concluidos = passos.filter(([ok]) => ok).length
  const pendencia = passos.find(([ok]) => !ok)?.[1] || null
  return {
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
  }
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
    buscarSaudeCadastro(empresaId)
      .then((resultado) => {
        if (!cancelado) setSaude(resultado)
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

// Mesma "saúde do cadastro", mas calculada para várias empresas de uma vez —
// alimenta a lista inicial de empresas do levantamento (aba fechada por
// padrão, o técnico entra na empresa que quiser continuar).
function useSaudeVariasEmpresas(empresaIds: string[]) {
  const [mapa, setMapa] = useState<Record<string, number>>({})
  const [carregando, setCarregando] = useState(true)
  const chave = empresaIds.join(',')

  useEffect(() => {
    if (empresaIds.length === 0) {
      setMapa({})
      setCarregando(false)
      return
    }
    let cancelado = false
    setCarregando(true)
    Promise.all(
      empresaIds.map((id) =>
        buscarSaudeCadastro(id)
          .then((saude) => [id, saude.percentual] as const)
          .catch(() => [id, 0] as const),
      ),
    ).then((resultados) => {
      if (cancelado) return
      setMapa(Object.fromEntries(resultados))
      setCarregando(false)
    })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])

  return { mapa, carregando }
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

// Status textual a partir do percentual de saúde do cadastro, para a lista.
function statusPorPercentual(percentual: number): {
  texto: string
  variante: 'secondary' | 'outline' | 'default'
} {
  if (percentual >= 100) return { texto: 'Completo', variante: 'default' }
  if (percentual <= 0) return { texto: 'Não iniciado', variante: 'secondary' }
  return { texto: 'Em andamento', variante: 'outline' }
}

function BarraProgresso({ percentual }: { percentual: number }) {
  const cor =
    percentual >= 100
      ? 'bg-emerald-600'
      : percentual > 0
        ? 'bg-orange-500'
        : 'bg-muted-foreground/30'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${cor} transition-all`}
          style={{ width: `${percentual}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-xs font-medium text-muted-foreground">{percentual}%</span>
    </div>
  )
}

// Lista inicial: as empresas cadastradas e quanto já foi levantado de cada
// uma, para o técnico bater o olho e continuar de onde parou. Sem coluna de
// funcionários por enquanto — o foco é simplicidade.
function ListaEmpresasLevantamento({
  empresas,
  carregando,
  onEscolher,
}: {
  empresas: Empresa[]
  carregando: boolean
  onEscolher: (id: string) => void
}) {
  const [busca, setBusca] = useState('')
  const { mapa: saudePorEmpresa } = useSaudeVariasEmpresas(empresas.map((e) => e.id))

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return empresas
    return empresas.filter((e) =>
      [e.razao_social, e.nome_fantasia, e.cnpj]
        .filter(Boolean)
        .some((c) => String(c).toLowerCase().includes(termo)),
    )
  }, [empresas, busca])

  if (empresas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma empresa cadastrada.{' '}
          <Link to="/empresas" className="underline">
            Cadastre uma empresa
          </Link>{' '}
          para começar o levantamento.
        </p>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Saúde do cadastro</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((empresa) => {
              const percentual = saudePorEmpresa[empresa.id] ?? 0
              const status = statusPorPercentual(percentual)
              return (
                <TableRow
                  key={empresa.id}
                  className="cursor-pointer"
                  onClick={() => onEscolher(empresa.id)}
                >
                  <TableCell>
                    <p className="font-medium leading-snug">
                      {empresa.nome_fantasia || empresa.razao_social}
                    </p>
                    {empresa.nome_fantasia && (
                      <p className="text-xs text-muted-foreground">{empresa.razao_social}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {empresa.cnpj || '—'}
                  </TableCell>
                  <TableCell>
                    <BarraProgresso percentual={carregando ? 0 : percentual} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variante}>{status.texto}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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

  const voltarParaLista = () => {
    setSearchParams({ aba: 'levantamento' })
  }

  const empresa = empresas.find((e) => e.id === empresaId)

  return (
    <div className="space-y-6">
      {empresaId && empresa && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 mb-1 h-7 px-2 text-muted-foreground"
              onClick={voltarParaLista}
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Voltar à lista de empresas
            </Button>
            <h2 className="text-lg font-semibold leading-tight">
              {empresa.nome_fantasia || empresa.razao_social}
            </h2>
            {empresa.cnpj && <p className="text-xs text-muted-foreground">{empresa.cnpj}</p>}
          </div>
          <Button asChild variant="outline">
            <Link to={`/empresas/${empresa.id}`}>
              <Building2 className="mr-2 h-4 w-4" />
              Abrir ficha da empresa
            </Link>
          </Button>
        </div>
      )}

      {!empresaId ? (
        <ListaEmpresasLevantamento
          empresas={empresas}
          carregando={carregando}
          onEscolher={(id) => mudarParam('empresa', id)}
        />
      ) : (
        <>
          <PainelSaude saude={saude} />

          <Tabs value={sub} onValueChange={(v) => mudarParam('sub', v)} className="space-y-6">
            <TabsList>
              <TabsTrigger value="planejamento">
                <HardHat className="mr-2 h-4 w-4 opacity-70" />
                Planejamento
              </TabsTrigger>
              <TabsTrigger value="ambiente">Ambiente</TabsTrigger>
              <TabsTrigger value="ghe">GHE</TabsTrigger>
              <TabsTrigger value="funcao">Função</TabsTrigger>
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
            <TabsContent value="ambiente" className="mt-0 focus-visible:outline-none">
              <EstruturaSstTab key={empresaId} empresaId={empresaId} secao="ambientes" />
            </TabsContent>
            <TabsContent value="ghe" className="mt-0 focus-visible:outline-none">
              <EstruturaSstTab key={empresaId} empresaId={empresaId} secao="ghes" />
            </TabsContent>
            <TabsContent value="funcao" className="mt-0 focus-visible:outline-none">
              <EstruturaSstTab key={empresaId} empresaId={empresaId} secao="funcoes" />
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
