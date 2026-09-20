/* Blog público — estrutura pronta; posts entram depois (coleção blog_posts). */
import { Link } from 'react-router-dom'
import { Newspaper } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function Blog() {
  return (
    <div className="px-8 py-12">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">Blog</p>
      <h1 className="text-4xl font-extrabold tracking-tight">
        Conteúdo de <span className="text-primary">SST na prática</span>
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Artigos sobre normas, fiscalização e gestão de segurança do trabalho — em breve.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl border-dashed p-10 text-center text-sm text-muted-foreground">
          Nenhum artigo publicado ainda. Os primeiros posts chegam em breve.
        </Card>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Quer ver na prática?{' '}
        <Link to="/calculadora" className="font-semibold text-primary hover:underline">
          Teste a calculadora de multas
        </Link>
        .
      </p>
    </div>
  )
}
