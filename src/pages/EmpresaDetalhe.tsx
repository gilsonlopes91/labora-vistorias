/* Perfil da empresa: tudo que foi feito nela em um lugar só.
   Cabeçalho com os dados cadastrais, um resumo com os números daquela empresa,
   e as abas de vistorias, orçamentos e SST (documentação: estrutura, inventário
   de riscos e plano de ação) já filtradas. */
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
  Download,
  Files,
  FileBadge,
  Mail,
  MapPin,
  Pencil,
  Phone,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'

import { formatBrazilianDate } from '@/lib/date'
import { rotuloCurtoNorma } from '@/lib/normas'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getEmpresa, type Empresa } from '@/services/empresas'
import LoadingScreen from '@/components/LoadingScreen'
import { getVistorias, type Vistoria } from '@/services/vistorias'
import { calcularIndicadores, getOrcamentos, type Orcamento } from '@/services/orcamentos'
import { getFormulariosByEmpresa, type Formulario } from '@/services/registrosFormulario'
import {
  camposDoRegistro,
  gerarPdfFormularios,
  nomeArquivoFormularios,
  type FormularioParaPdf,
} from '@/lib/pdfFormulario'
import { OrcamentosTab } from '@/components/OrcamentosTab'
import AcessoClienteCard from '@/components/AcessoClienteCard'

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
  const [formularios, setFormularios] = useState<Formulario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  // Falha de carga (conexão) é diferente de empresa que não existe.
  const [falhaCarga, setFalhaCarga] = useState(false)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    if (!id) return
    setCarregando(true)
    setFalhaCarga(false)
    Promise.all([
      getEmpresa(id),
      getVistorias(),
      getOrcamentos(),
      getFormulariosByEmpresa(id).catch(() => [] as Formulario[]),
    ])
      .then(([emp, vist, orc, forms]) => {
        setEmpresa(emp)
        setVistorias(vist.filter((v) => v.empresa_id === id))
        setOrcamentos(orc.filter((o) => o.empresa_id === id))
        setFormularios(forms)
      })
      .catch((error) => {
        setFalhaCarga(true)
        toast.error('Não foi possível carregar a empresa', {
          description: getErrorMessage(error),
        })
      })
      .finally(() => setCarregando(false))
  }, [id, tentativa])

  const resumoVistorias = useMemo(() => {
    const porStatus = (status: string) => vistorias.filter((v) => v.status === status).length
    // "Última vistoria" = a data em que foi feita de fato (data_realizada);
    // vistorias antigas, sem esse dado, usam a data agendada.
    const dataFeita = (v: Vistoria) => v.data_realizada || v.data_agendada || ''
    const concluidas = vistorias
      .filter((v) => v.status === 'concluida')
      .sort((a, b) => dataFeita(b).localeCompare(dataFeita(a)))
    return {
      total: vistorias.length,
      agendadas: porStatus('agendada'),
      emAndamento: porStatus('em_andamento'),
      concluidas: concluidas.length,
      ultima: concluidas[0] ? dataFeita(concluidas[0]) : undefined,
    }
  }, [vistorias])

  const comercial = useMemo(() => calcularIndicadores(orcamentos), [orcamentos])

  // PDF de formulários desta empresa: um só (individual) ou todos os
  // concluídos juntos, cada um começando numa página.
  const baixarPdfFormularios = async (registros: Formulario[], titulo: string) => {
    if (!empresa || registros.length === 0) return
    setGerandoPdf(true)
    toast.info('Gerando o PDF...')
    try {
      const dataDe = (v: Vistoria) => formatBrazilianDate(v.data_realizada || v.data_agendada)
      const itens: FormularioParaPdf[] = registros.map((r) => {
        const v = r.vistoria_id ? vistorias.find((x) => x.id === r.vistoria_id) : undefined
        return {
          registro: r,
          campos: camposDoRegistro(r),
          titulo: r.expand?.modelo_formulario_id?.nome || 'Formulário',
          detalhe: v ? `Vistoria de ${dataDe(v)}` : undefined,
        }
      })
      const nomeEmpresa = empresa.nome_fantasia || empresa.razao_social
      // Com um formulário só, a data e o responsável vêm da vistoria dele.
      const origem =
        registros.length === 1 && registros[0].vistoria_id
          ? vistorias.find((x) => x.id === registros[0].vistoria_id)
          : undefined
      const doc = await gerarPdfFormularios({
        formularios: itens,
        empresa: { nome: nomeEmpresa, cnpj: empresa.cnpj, endereco: empresa.endereco },
        titulo,
        dadosGerais: origem ? [['Data da vistoria', dataDe(origem)]] : undefined,
        responsavelTecnico: origem
          ? [
              origem.responsavel_tecnico_nome || origem.expand?.responsavel_tecnico_id?.nome,
              origem.responsavel_tecnico_registro,
            ]
              .filter(Boolean)
              .join(' — ')
          : undefined,
      })
      doc.save(nomeArquivoFormularios(nomeEmpresa, titulo))
    } catch (error) {
      toast.error('Não foi possível gerar o PDF', { description: getErrorMessage(error) })
    } finally {
      setGerandoPdf(false)
    }
  }

  const formulariosConcluidos = formularios.filter((f) => f.status === 'concluido')

  if (carregando) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <LoadingScreen fullScreen={false} mensagem="Carregando informações da empresa..." />
      </div>
    )
  }

  if (!empresa) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {falhaCarga
            ? 'Não foi possível carregar a empresa. Confira a conexão e tente de novo.'
            : 'Empresa não encontrada.'}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {falhaCarga && <Button onClick={() => setTentativa((t) => t + 1)}>Tentar de novo</Button>}
          <Button variant="outline" asChild>
            <Link to="/empresas">Voltar para empresas</Link>
          </Button>
        </div>
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
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={`/empresas?editar=${empresa.id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar dados
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/vistorias">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Agendar vistoria
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/documentacao?aba=levantamento&empresa=${empresa.id}`}>
              <FileBadge className="mr-2 h-4 w-4" />
              Documentação SST
            </Link>
          </Button>
        </div>
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
      <div className="mb-6">
        <AcessoClienteCard empresaId={empresa.id} />
      </div>
      <Tabs defaultValue="vistorias" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vistorias">Vistorias ({vistorias.length})</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos ({orcamentos.length})</TabsTrigger>
          <TabsTrigger value="formularios">Formulários ({formularios.length})</TabsTrigger>
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
                  const extras = vistoria.expand?.checklists || []
                  const nome = tipo
                    ? [tipo, ...extras].map((t) => rotuloCurtoNorma(t)).join(', ')
                    : extras.length
                      ? extras.map((t) => rotuloCurtoNorma(t)).join(', ')
                      : 'Vistoria sem checklist principal'
                  return (
                    <Link
                      key={vistoria.id}
                      to={`/vistorias/${vistoria.id}`}
                      className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-accent/30"
                    >
                      <div className="min-w-48 flex-1">
                        <div className="font-medium leading-snug">{nome}</div>
                        <div className="text-xs text-muted-foreground">
                          {vistoria.status === 'concluida' && vistoria.data_realizada
                            ? `realizada em ${formatBrazilianDate(vistoria.data_realizada)}`
                            : vistoria.data_agendada
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

        <TabsContent value="formularios" className="mt-0 focus-visible:outline-none">
          {formularios.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Formulários preenchidos nas vistorias desta empresa. Cada um pode ser baixado em
                PDF, ou todos os concluídos juntos.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={gerandoPdf || formulariosConcluidos.length === 0}
                onClick={() => baixarPdfFormularios(formulariosConcluidos, 'Avaliações de campo')}
              >
                <Files className="h-3.5 w-3.5" />
                Todos em um PDF ({formulariosConcluidos.length})
              </Button>
            </div>
          )}
          {formularios.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
              <ClipboardCheck className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhum formulário preenchido para esta empresa ainda.
              </p>
            </div>
          ) : (
            <Card className="overflow-hidden">
              <div className="divide-y">
                {formularios.map((registro) => {
                  const dataRegistro = registro.data_campo || registro.created
                  return (
                    <div key={registro.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <div className="min-w-48 flex-1">
                        <div className="font-medium leading-snug">
                          {registro.expand?.modelo_formulario_id?.nome || 'Formulário'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dataRegistro ? formatBrazilianDate(dataRegistro) : 'sem data'}
                          {registro.vistoria_id ? '' : ' · preenchido fora de vistoria'}
                        </div>
                      </div>
                      <Badge
                        variant={registro.status === 'concluido' ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {registro.status === 'concluido' ? 'Concluído' : 'Rascunho'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 shrink-0 gap-1.5"
                        disabled={gerandoPdf}
                        onClick={() =>
                          baixarPdfFormularios(
                            [registro],
                            registro.expand?.modelo_formulario_id?.nome || 'Formulário',
                          )
                        }
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                      {registro.vistoria_id && (
                        <Button asChild size="sm" variant="outline" className="h-8 shrink-0">
                          <Link to={`/vistorias/${registro.vistoria_id}`}>Abrir vistoria</Link>
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Para preencher ou corrigir um formulário, abra a vistoria em que ele foi feito.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
