/* Console de contas — visão geral: indicadores globais e últimas ações. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Building2,
  ShieldCheck,
  Users,
  ClipboardCheck,
  Bot,
  CalendarClock,
  Ban,
  ListChecks,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import AdminNav from '@/components/admin/AdminNav'
import { obterResumo, type Resumo, ACAO_LABEL } from '@/services/admin'

export default function AdminVisaoGeral() {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    obterResumo()
      .then(setResumo)
      .catch((error) =>
        toast.error('Não foi possível carregar o resumo', { description: getErrorMessage(error) }),
      )
      .finally(() => setLoading(false))
  }, [])

  const cards = resumo
    ? [
        {
          icon: Building2,
          label: 'Organizações',
          value: resumo.organizacoes,
          to: '/admin/organizacoes',
        },
        {
          icon: ShieldCheck,
          label: 'Ativas',
          value: resumo.ativas,
          to: '/admin/organizacoes?status=ativa',
        },
        {
          icon: CalendarClock,
          label: 'Vencem em 30 dias',
          value: resumo.vencem_30_dias,
          to: '/admin/organizacoes',
        },
        {
          icon: Ban,
          label: 'Bloqueadas / vencidas',
          value: resumo.bloqueadas + resumo.vencidas,
          to: '/admin/organizacoes?status=bloqueada',
        },
        { icon: Users, label: 'Usuários', value: resumo.usuarios, to: '/admin/organizacoes' },
        {
          icon: ClipboardCheck,
          label: 'Vistorias',
          value: resumo.vistorias,
          to: '/admin/organizacoes',
        },
        { icon: Bot, label: 'Perguntas IA', value: resumo.perguntas_ia, to: '/admin/organizacoes' },
        {
          icon: ListChecks,
          label: 'Lista de espera',
          value: resumo.lista_espera,
          to: '/admin/lista-espera',
        },
      ]
    : []

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Gerenciamento de contas</h1>
        <p className="text-sm text-muted-foreground">
          Console de administração da plataforma — visão de todas as organizações.
        </p>
      </div>
      <AdminNav />

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : resumo ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((m) => (
              <Link key={m.label} to={m.to}>
                <Card className="rounded-2xl border-none p-4 shadow-subtle transition-colors hover:bg-accent/40">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <m.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold leading-none">{m.value}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                        {m.label}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <h2 className="mb-2 mt-10 text-xl font-bold">Últimas ações</h2>
          {resumo.atividades.length === 0 ? (
            <Card className="rounded-2xl border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhuma ação registrada ainda. Bloqueios, planos, pacotes e senhas passam a aparecer
              aqui.
            </Card>
          ) : (
            <Card className="divide-y rounded-2xl border-none shadow-subtle">
              {resumo.atividades.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <span className="w-36 shrink-0 text-xs text-muted-foreground">
                    {new Date(a.created).toLocaleString('pt-BR')}
                  </span>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs">
                    {ACAO_LABEL[a.acao] || a.acao}
                  </span>
                  <span className="min-w-0 flex-1">
                    {a.organizacao_id ? (
                      <Link
                        to={`/admin/organizacoes/${a.organizacao_id}`}
                        className="font-semibold hover:underline"
                      >
                        {a.organizacao_nome || 'Organização'}
                      </Link>
                    ) : null}
                    {a.organizacao_id ? ' · ' : ''}
                    {a.descricao}
                  </span>
                  <span className="text-xs text-muted-foreground">{a.usuario_nome}</span>
                </div>
              ))}
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}
