/* Home pública — landing page profissional em largura total: header com acesso,
   hero, prova social, como funciona e CTA final. */
import { Link, Navigate } from 'react-router-dom'
import { ArrowRight, Calculator, ClipboardCheck, FileText, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

export default function PublicHome() {
  const { isAuthenticated, loading } = useAuth()

  if (!loading && isAuthenticated) {
    return <Navigate to="/painel" replace />
  }

  return (
    <div>
      {/* Hero — full-width com fundo em degradê suave */}
      <section className="bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:py-28">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Labora Vistorias
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Descubra o que a fiscalização pode multar na sua empresa —{' '}
            <span className="text-primary">grátis e em segundos</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Escolha a norma, escolha o item, informe o número de trabalhadores e veja o valor da
            multa da NR-28 com a explicação em linguagem simples. Sem cadastro, sem cartão.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-8 text-base">
              <Link to="/calculadora">
                Testar a calculadora <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8 text-base">
              <Link to="/blog">Ver o blog</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Valores oficiais NR-28
            </span>
            <span className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" /> 38 NRs no catálogo
            </span>
            <span className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" /> Sem cadastro
            </span>
          </div>
        </div>
      </section>

      {/* Como funciona — 3 passos */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          Como <span className="text-primary">funciona</span>
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              n: '1',
              titulo: 'Escolha a norma',
              desc: 'Todas as NRs do catálogo oficial, com seus anexos.',
            },
            {
              n: '2',
              desc: 'Um item por vez, com busca por número ou texto.',
              titulo: 'Escolha o item',
            },
            {
              n: '3',
              titulo: 'Veja a multa',
              desc: 'Valor mínimo e máximo com a célula da tabela destacada.',
            },
          ].map((p) => (
            <Card key={p.n} className="rounded-2xl border-none p-6 shadow-subtle">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-primary-foreground">
                {p.n}
              </div>
              <div className="mt-4 text-lg font-bold">{p.titulo}</div>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* O que você ganha — benefícios */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">
            Feito por quem <span className="text-primary">faz SST no campo</span>
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Calculator,
                titulo: 'Multa em segundos',
                desc: 'A mesma grade do Anexo I da NR-28 usada pela fiscalização, com valores em reais.',
              },
              {
                icon: FileText,
                titulo: 'Explicação simples',
                desc: 'Cada item traduzido: o que a norma exige e por que a multa existe.',
              },
              {
                icon: ShieldCheck,
                titulo: 'Gestão completa no app',
                desc: 'Agenda, vistoria guiada com foto e GPS e relatório pronto antes de sair do cliente.',
              },
            ].map((b) => (
              <div key={b.titulo} className="rounded-2xl border bg-background p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-4 font-bold">{b.titulo}</div>
                <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
        <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight">
          Sua próxima fiscalização não avisa.{' '}
          <span className="text-primary">Descubra os riscos antes.</span>
        </h2>
        <Button asChild size="lg" className="mt-8 rounded-full px-10 text-base">
          <Link to="/calculadora">
            Testar agora — é grátis <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  )
}
