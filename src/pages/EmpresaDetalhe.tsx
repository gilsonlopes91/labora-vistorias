/* Perfil da empresa: tudo que foi feito nela em um lugar só.
   Cabeçalho com os dados cadastrais, um resumo com os números daquela empresa,
   e as abas de vistorias e orçamentos já filtradas. */
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  Mail,
  MapPin,
  Phone,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'

import { formatBrazilianDate } from '@/lib/date'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getEmpresa, type Empresa } from '@/services/empresas'
import { getVistorias, type Vistoria } from '@/services/vistorias'
import { calcularIndicadores, getOrcamentos, type Orcamento } from '@/services/orcamentos'
import { OrcamentosTab } from '@/components/OrcamentosTab'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const STATUS_VISTORIA_LABEL: Record<string, string> = {
  agendada: 'Agendada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

function Numero({
  rotulo,
  valor,
  icone: Icone,
  cor,
}: {
  rotulo: string
  valor: string
  icone: typeof Building2
  cor: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-2 p-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cor}`}>
          <Icone className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[10px] leading-tight text-muted-foreground">{rotulo}</p>
          <p className="truncate text-xs font-bold tabular-nums">{valor}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EmpresaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [vistorias, setVistorias] = useState<Vistoria[]>([])
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([getEmpresa(id), getVistorias(), getOrcamentos()])
      .then(([emp, vist, orc]) => {
        setEmpresa(emp)
        setVistorias(vist.filter((v) => v.empresa_id === id))
        setOrcamentos(orc.filter((o) => o.empresa_id === id))
      })
      .catch((error) =>
        toast.error('Não foi possível carregar a empresa', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregando(false))
  }, [id])

  const resumoVistorias = useMemo(() => {
    const porStatus = (status: string) => vistorias.filter((v) => v.status === status).length
    const concluidas = vistorias
      .filter((v) => v.status === 'concluida')
      .sort((a, b) => (b.data_agendada || '').localeCompare(a.data_agendada || ''))
    return {
      total: vistorias.length,
      agendadas: porStatus('agendada'),
      emAndamento: porStatus('em_andamento'),
      concluidas: concluidas.length,
      ultima: concluidas[0]?.data_agendada,
    }
  }, [vistorias])

  const comercial = useMemo(() => calcularIndicadores(orcamentos), [orcamentos])

  if (carregando) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
  }

  if (!empresa) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Empresa não encontrada.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/empresas">Voltar para empresas</Link>
        </Button>
      </div>
    )
  }

  const contatoLinhas = [
    empresa.contato_nome && { icone: Users, texto: empresa.contato_nome },
    empresa.contato_telefone && { icone: Phone, texto: empresa.contato_telefone },
    empresa.contato_email && { icone: Mail, texto: empresa.contato_email },
    empresa.endereco && { icone: MapPin, texto: empresa.endereco },
  ].filter(Boolean) as { icone: typeof Users; texto: string }[]

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Link
        to="/empresas"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para empresas
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{empresa.razao_social}</h1>
          {empresa.nome_fantasia && (
            <p className="text-sm text-muted-foreground">{empresa.nome_fantasia}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {empresa.cnpj && <Badge variant="secondary">CNPJ {empresa.cnpj}</Badge>}
            {empresa.porte && <Badge variant="outline">{empresa.porte}</Badge>}
            {empresa.grau_risco != null && (
              <Badge variant="outline">Grau de risco {empresa.grau_risco}</Badge>
            )}
            {empresa.numero_funcionarios != null && (
              <Badge variant="outline">{empresa.numero_funcionarios} empregados</Badge>
            )}
          </div>
          {contatoLinhas.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              {contatoLinhas.map(({ icone: Icone, texto }) => (
                <span key={texto} className="flex items-center gap-1.5">
                  <Icone className="h-3.5 w-3.5" />
                  {texto}
                </span>
              ))}
            </div>
          )}
        </div>
        <Button asChild variant="outline">
          <Link to="/vistorias">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Agendar vistoria
          </Link>
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <Numero
          rotulo="Vistorias"
          valor={String(resumoVistorias.total)}
          icone={ClipboardCheck}
          cor="bg-slate-500"
        />
        <Numero
          rotulo="Concluídas"
          valor={String(resumoVistorias.concluidas)}
          icone={CheckCircle2}
          cor="bg-green-600"
        />
        <Numero
          rotulo="Agendadas"
          valor={String(resumoVistorias.agendadas)}
          icone={CalendarClock}
          cor="bg-cyan-600"
        />
        <Numero
          rotulo="Última vistoria"
          valor={
            resumoVistorias.ultima ? formatBrazilianDate(resumoVistorias.ultima) : 'sem registro'
          }
          icone={CalendarClock}
          cor="bg-indigo-500"
        />
        <Numero
          rotulo="Orçamentos"
          valor={String(comercial.quantidade)}
          icone={DollarSign}
          cor="bg-blue-500"
        />
        <Numero
          rotulo="Orçado"
          valor={brl.format(comercial.valorOrcado)}
          icone={DollarSign}
          cor="bg-amber-500"
        />
        <Numero
          rotulo="Aprovado"
          valor={brl.format(comercial.valorAprovado)}
          icone={TrendingUp}
          cor="bg-green-700"
        />
        <Numero
          rotulo="Recebido"
          valor={brl.format(comercial.valorRecebido)}
          icone={Wallet}
          cor="bg-emerald-500"
        />
      </div>

      <Tabs defaultValue="vistorias" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vistorias">Vistorias ({vistorias.length})</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos ({orcamentos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="vistorias" className="mt-0 focus-visible:outline-none">
          {vistorias.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
              <ClipboardCheck className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhuma vistoria realizada nesta empresa ainda.
              </p>
            </div>
          ) : (
            <Card className="overflow-hidden">
              <div className="divide-y">
                {vistorias.map((vistoria) => {
                  const tipo = vistoria.expand?.tipo_vistoria_id
                  const nome =
                    tipo?.nr_referencia || tipo?.nome || 'Vistoria sem checklist principal'
                  return (
                    <Link
                      key={vistoria.id}
                      to={`/vistorias/${vistoria.id}`}
                      className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-accent/30"
                    >
                      <div className="min-w-48 flex-1">
                        <div className="font-medium leading-snug">{nome}</div>
                        <div className="text-xs text-muted-foreground">
                          {vistoria.data_agendada
                            ? formatBrazilianDate(vistoria.data_agendada)
                            : 'sem data'}
                          {vistoria.responsavel_tecnico_nome && (
                            <> · {vistoria.responsavel_tecnico_nome}</>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={vistoria.status === 'concluida' ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {STATUS_VISTORIA_LABEL[vistoria.status || 'agendada'] || vistoria.status}
                      </Badge>
                    </Link>
                  )
                })}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orcamentos" className="mt-0 focus-visible:outline-none">
          <OrcamentosTab
            empresaId={id}
            titulo="Orçamentos desta empresa"
            descricao="Propostas emitidas para este cliente, com os números restritos a ele."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
