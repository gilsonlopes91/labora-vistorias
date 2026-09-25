/* Home pública: apresenta o app (com telas desenhadas a partir do visual
   real), a calculadora grátis e o convite para a lista de espera. Sem preço
   por enquanto. */
import { Link, Navigate } from 'react-router-dom'
import {
  ArrowRight,
  Calculator,
  CalendarDays,
  Camera,
  ClipboardCheck,
  FileText,
  Receipt,
  Thermometer,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { TelaAgenda, TelaRelatorio, TelaVistoria } from '@/components/TelasHome'

const LISTA_ESPERA = '/login?aba=lista'

const RECURSOS = [
  {
    icon: ClipboardCheck,
    titulo: 'Checklists das 36 NRs vigentes',
    desc: 'Cada anexo separado e o texto de cada item como está na norma. Você também monta checklists próprios.',
  },
  {
    icon: Calculator,
    titulo: 'Multa estimada em cada não conformidade',
    desc: 'Pela tabela da NR-28, com o número de empregados da empresa. Ajuda a mostrar ao cliente o que está em jogo.',
  },
  {
    icon: Camera,
    titulo: 'Fotos com GPS, mesmo com sinal fraco',
    desc: 'Se a internet cair no meio da vistoria, as respostas e fotos ficam no aparelho e sobem quando o sinal volta.',
  },
  {
    icon: FileText,
    titulo: 'Relatório em PDF com a sua marca',
    desc: 'Plano de ação com prazos, conclusão, nº da ART e assinaturas do responsável técnico e da empresa.',
  },
  {
    icon: Thermometer,
    titulo: 'Fichas de campo de calor e ruído',
    desc: 'IBUTG médio, taxa metabólica, dose e NEN calculados na hora, com a comparação com o nível de ação e o limite.',
  },
  {
    icon: CalendarDays,
    titulo: 'Agenda e rotinas',
    desc: 'Visitas recorrentes entram na agenda sozinhas. Dá para assinar a agenda no Google Agenda ou no Outlook.',
  },
  {
    icon: Receipt,
    titulo: 'Orçamentos e propostas',
    desc: 'Proposta em PDF e link para o cliente abrir no celular. Você vê quando ele abriu.',
  },
  {
    icon: Users,
    titulo: 'Equipe com papéis',
    desc: 'Dono, gerente e técnico. O técnico vê as empresas e edita só as vistorias que são dele.',
  },
]

export default function PublicHome() {
  const { isAuthenticated, loading } = useAuth()

  if (!loading && isAuthenticated) {
    return <Navigate to="/painel" replace />
  }

  return (
    <div>
      {/* Abertura */}
      <section className="bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="text-center lg:text-left">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              Labora Vistorias
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
              Vistoria de SST do agendamento ao relatório,{' '}
              <span className="text-primary">no celular</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground lg:mx-0">
              Checklists das NRs, foto com GPS, multa estimada em cada não conformidade e o
              relatório em PDF com plano de ação pronto antes de você sair do cliente.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button asChild size="lg" className="rounded-full px-8 text-base">
                <Link to={LISTA_ESPERA}>
                  Entrar na lista de espera <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8 text-base">
                <Link to="/calculadora">Calcular uma multa grátis</Link>
              </Button>
            </div>
            <p className="mx-auto mt-5 max-w-xl text-sm text-muted-foreground lg:mx-0">
              O app está sendo usado por um grupo pequeno de profissionais. Novas contas são abertas
              aos poucos, pela lista de espera.
            </p>
          </div>
          <div className="mx-auto w-full max-w-md">
            <TelaVistoria />
          </div>
        </div>
      </section>

      {/* Agenda */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div className="order-2 mx-auto w-full max-w-md lg:order-1">
          <TelaAgenda />
        </div>
        <div className="order-1 lg:order-2">
          <h2 className="text-3xl font-extrabold tracking-tight">Antes da visita</h2>
          <p className="mt-3 text-muted-foreground">
            Cadastre a empresa pelo CNPJ (o grau de risco vem do CNAE), escolha os checklists e
            marque a data. Visitas que se repetem viram rotina: a próxima entra na agenda assim que
            a anterior é concluída, com o mesmo responsável e os mesmos checklists.
          </p>
          <p className="mt-3 text-muted-foreground">
            O app sugere o que levar a partir das normas escolhidas: dosímetro para ruído, medidor
            de IBUTG para calor, detector de tensão para NR-10.
          </p>
        </div>
      </section>

      {/* Relatório */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Depois da visita</h2>
            <p className="mt-3 text-muted-foreground">
              Ao finalizar, o app monta um rascunho da conclusão com os números da vistoria e você
              ajusta. O relatório sai com o plano de ação, as fotos, a metodologia e as assinaturas,
              com o logo e os dados da sua empresa.
            </p>
            <p className="mt-3 text-muted-foreground">
              Vistoria concluída fica travada. Se precisar mudar algo, ela é reaberta com o motivo
              registrado no histórico.
            </p>
          </div>
          <div className="mx-auto w-full max-w-md">
            <TelaRelatorio />
          </div>
        </div>
      </section>

      {/* O que vem no app */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">O que já vem no app</h2>
        <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {RECURSOS.map((r) => (
            <div key={r.titulo}>
              <r.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 font-bold">{r.titulo}</p>
              <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Calculadora */}
      <section className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:flex-row lg:justify-between lg:text-left">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Calculadora de multas da NR-28, grátis e sem cadastro
            </h2>
            <p className="mt-2 text-muted-foreground">
              Escolha a norma, o item e o número de empregados e veja o valor mínimo e máximo da
              multa, com o texto do item e a célula da tabela destacada.
            </p>
          </div>
          <Button asChild size="lg" variant="outline" className="shrink-0 rounded-full px-8">
            <Link to="/calculadora">
              Abrir a calculadora <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Lista de espera */}
      <section className="bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight">
            Quer usar no seu dia a dia?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Deixe seu nome na lista de espera. Avisamos por e-mail quando abrir uma vaga.
          </p>
          <Button asChild size="lg" className="mt-8 rounded-full px-10 text-base">
            <Link to={LISTA_ESPERA}>
              Entrar na lista de espera <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
