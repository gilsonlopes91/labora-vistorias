/* Home pública — apresentação + atalho para a calculadora (teste gratuito). */
import { Link } from 'react-router-dom'
import { ArrowRight, Calculator, ShieldCheck } from 'lucide-react'
import { LaboraLogoFull } from '@/components/LaboraLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function PublicHome() {
  return (
    <div className="px-8 py-12">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Labora Vistorias
      </p>
      <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight lg:text-5xl">
        Descubra o que a fiscalização pode multar na sua empresa —{' '}
        <span className="text-primary">grátis e em segundos</span>.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        Escolha a norma, escolha o item, informe o número de trabalhadores e veja o valor da multa
        da NR-28 com explicação em linguagem simples. Sem cadastro.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg" className="rounded-full">
          <Link to="/calculadora">
            Testar a calculadora <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full">
          <Link to="/blog">Ver o blog</Link>
        </Button>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Calculator,
            titulo: '38 NRs no catálogo',
            desc: 'Todas as normas regulamentadoras com itens oficiais da NR-28.',
          },
          {
            icon: ShieldCheck,
            titulo: 'Valores oficiais',
            texto: 'Grade do Anexo I da NR-28 × UFIR, a mesma usada pela fiscalização.',
          },
          {
            icon: ArrowRight,
            titulo: 'Explicação simples',
            texto: 'Cada item vem com o que significa e por que dá multa.',
          },
        ].map((c) => (
          <Card key={c.titulo} className="rounded-2xl border-none p-5 shadow-subtle">
            <c.icon className="h-6 w-6 text-primary" />
            <div className="mt-3 font-bold">{c.titulo}</div>
            <div className="mt-1 text-sm text-muted-foreground">{c.texto}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
