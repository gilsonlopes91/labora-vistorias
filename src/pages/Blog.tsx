/* Blog público — listagem de artigos técnicos de SST com layout profissional */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, User, Newspaper, Search, ShieldCheck } from 'lucide-react'
import {
  getArtigosPublicos,
  getUrlCapaArtigo,
  getNomeAutorArtigo,
  type Artigo,
} from '@/services/artigos'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function Blog() {
  const [artigos, setArtigos] = useState<Artigo[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    getArtigosPublicos()
      .then(setArtigos)
      .catch(() => setArtigos([]))
      .finally(() => setLoading(false))
  }, [])

  const formatarData = (dataIso: string) => {
    try {
      return new Date(dataIso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  const artigosFiltrados = artigos.filter(
    (a) =>
      a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      a.resumo.toLowerCase().includes(busca.toLowerCase()),
  )

  const artigoDestaque = artigosFiltrados.length > 0 ? artigosFiltrados[0] : null
  const outrosArtigos = artigosFiltrados.length > 1 ? artigosFiltrados.slice(1) : []

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      {/* Topo / Banner com Hero */}
      <div className="max-w-3xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
          LABORA • Conhecimento & SST
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Conteúdo de <span className="text-primary">SST na prática</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Artigos, guias práticos sobre as Normas Regulamentadoras, fiscalizações do trabalho e
          gestão de vistorias técnicas.
        </p>
      </div>

      {/* Barra de Pesquisa */}
      <div className="mt-8 max-w-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por assunto, NR ou palavra-chave..."
            className="h-11 rounded-full pl-10 pr-4 bg-card"
          />
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="mt-12 space-y-8">
          <Skeleton className="h-80 w-full rounded-3xl" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        </div>
      ) : artigosFiltrados.length === 0 ? (
        <Card className="mt-12 rounded-3xl border-dashed p-12 text-center shadow-none">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Newspaper className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold">Nenhum artigo encontrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {busca
              ? `Não foram encontrados artigos com o termo "${busca}".`
              : 'Os primeiros artigos de SST estão sendo redigidos pela nossa equipe técnica.'}
          </p>
          {busca && (
            <Button variant="outline" onClick={() => setBusca('')} className="mt-4 rounded-full">
              Limpar busca
            </Button>
          )}
        </Card>
      ) : (
        <div className="mt-12 space-y-12">
          {/* Artigo em destaque */}
          {artigoDestaque && (
            <Link
              to={`/blog/${artigoDestaque.slug}`}
              className="group block overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:shadow-subtle"
            >
              <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-7 p-6 sm:p-10">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide">
                    <ShieldCheck className="h-4 w-4" /> Destaque
                  </div>
                  <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl group-hover:text-primary transition-colors">
                    {artigoDestaque.titulo}
                  </h2>
                  <p className="mt-4 text-base text-muted-foreground line-clamp-3">
                    {artigoDestaque.resumo}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {formatarData(artigoDestaque.created)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                      {getNomeAutorArtigo(artigoDestaque)}
                    </span>
                    <span className="ml-auto font-semibold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Ler artigo completo <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 h-64 lg:h-full min-h-[260px] bg-muted/40 relative overflow-hidden">
                  {getUrlCapaArtigo(artigoDestaque) ? (
                    <img
                      src={getUrlCapaArtigo(artigoDestaque)!}
                      alt={artigoDestaque.titulo}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5 p-8 text-primary/40">
                      <Newspaper className="h-20 w-20" />
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )}

          {/* Grid dos demais artigos */}
          {outrosArtigos.length > 0 && (
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-6">Mais publicações</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {outrosArtigos.map((artigo) => {
                  const capaUrl = getUrlCapaArtigo(artigo)

                  return (
                    <Link
                      key={artigo.id}
                      to={`/blog/${artigo.slug}`}
                      className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:shadow-subtle"
                    >
                      <div className="h-48 w-full bg-muted/40 overflow-hidden relative">
                        {capaUrl ? (
                          <img
                            src={capaUrl}
                            alt={artigo.titulo}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-primary/30">
                            <Newspaper className="h-12 w-12" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-6">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-primary" />
                            {formatarData(artigo.created)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3 text-primary" />
                            {getNomeAutorArtigo(artigo)}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {artigo.titulo}
                        </h3>

                        <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-1">
                          {artigo.resumo}
                        </p>

                        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs font-semibold text-primary">
                          <span>Ler artigo</span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Banner de Conversão para a Calculadora */}
      <section className="mt-20 rounded-3xl bg-muted/40 border p-8 sm:p-12 text-center">
        <h2 className="text-2xl font-extrabold sm:text-3xl">
          Quer saber os riscos de autuação da sua empresa?
        </h2>
        <p className="mt-3 max-w-xl mx-auto text-muted-foreground text-sm sm:text-base">
          Calcule em poucos cliques a multa de cada item, com os valores oficiais da NR-28. É
          gratuito e não precisa de cadastro.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/calculadora">
              Acessar calculadora de multas <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
