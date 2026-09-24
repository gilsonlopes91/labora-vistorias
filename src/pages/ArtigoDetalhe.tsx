/* ArtigoDetalhe — página pública do artigo completo com tipografia refinada e layout agradável */
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  User,
  Share2,
  Clock,
  ArrowRight,
  Calculator,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getArtigoPorSlug,
  getUrlCapaArtigo,
  getNomeAutorArtigo,
  type Artigo,
} from '@/services/artigos'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function ArtigoDetalhe() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [artigo, setArtigo] = useState<Artigo | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!slug) {
      navigate('/blog', { replace: true })
      return
    }

    setLoading(true)
    getArtigoPorSlug(slug)
      .then((res) => {
        if (!res) {
          toast.error('Artigo não encontrado ou ainda não publicado')
          navigate('/blog', { replace: true })
        } else {
          setArtigo(res)
        }
      })
      .catch(() => {
        toast.error('Erro ao carregar o artigo')
        navigate('/blog', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [slug, navigate])

  const formatarData = (dataIso: string) => {
    try {
      return new Date(dataIso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  // Estimar tempo de leitura (palavras / 200)
  const estimarTempoLeitura = (textoHtml: string) => {
    const textoPuro = textoHtml.replace(/<[^>]*>?/gm, '')
    const palavras = textoPuro.trim().split(/\s+/).length
    const minutos = Math.max(1, Math.ceil(palavras / 180))
    return `${minutos} min de leitura`
  }

  const handleCompartilhar = () => {
    const url = window.location.href
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
      setCopiado(true)
      toast.success('Link do artigo copiado para a área de transferência!')
      setTimeout(() => setCopiado(false), 2500)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <Skeleton className="h-6 w-32 rounded-full mb-6" />
        <Skeleton className="h-12 w-full rounded-2xl mb-4" />
        <Skeleton className="h-6 w-3/4 rounded-2xl mb-8" />
        <Skeleton className="h-80 w-full rounded-3xl mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-full rounded" />
          <Skeleton className="h-5 w-full rounded" />
          <Skeleton className="h-5 w-4/5 rounded" />
        </div>
      </div>
    )
  }

  if (!artigo) {
    return null
  }

  const capaUrl = getUrlCapaArtigo(artigo)

  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      {/* Botão de Voltar */}
      <div className="mb-8">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="rounded-full -ml-3 text-muted-foreground hover:text-foreground"
        >
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Blog
          </Link>
        </Button>
      </div>

      {/* Cabeçalho do Artigo */}
      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Artigo Técnico • SST
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground leading-[1.15]">
          {artigo.titulo}
        </h1>

        {/* Metadados: autor, data, tempo de leitura e botão compartilhar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-y py-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <User className="h-4 w-4 text-primary" />
              {getNomeAutorArtigo(artigo)}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              {formatarData(artigo.created)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              {estimarTempoLeitura(artigo.conteudo)}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCompartilhar}
            className="rounded-full h-8 text-xs"
          >
            {copiado ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5 text-primary" /> Copiado!
              </>
            ) : (
              <>
                <Share2 className="mr-1.5 h-3.5 w-3.5" /> Compartilhar
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Resumo destacado */}
      <div className="my-8 rounded-2xl border-l-4 border-primary bg-primary/5 p-5 text-base sm:text-lg leading-relaxed text-foreground/90 font-medium">
        {artigo.resumo}
      </div>

      {/* Imagem de Capa */}
      {capaUrl && (
        <div className="my-8 overflow-hidden rounded-3xl border bg-muted shadow-sm">
          <img src={capaUrl} alt={artigo.titulo} className="w-full max-h-[460px] object-cover" />
        </div>
      )}

      {/* Conteúdo Renderizado (HTML com tipografia Tailwind Typography prose) */}
      <div
        className="prose prose-stone dark:prose-invert max-w-none text-foreground text-base sm:text-lg leading-relaxed pt-2
        prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-foreground
        prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4
        prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
        prose-p:my-4 prose-p:leading-relaxed
        prose-blockquote:border-l-primary prose-blockquote:font-normal prose-blockquote:italic
        prose-ul:my-4 prose-ol:my-4 prose-li:my-1
        prose-a:text-primary prose-a:underline hover:prose-a:opacity-80
        prose-img:rounded-2xl prose-img:border prose-img:shadow-sm"
        dangerouslySetInnerHTML={{ __html: artigo.conteudo }}
      />

      {/* Rodapé do Artigo com Chamada de Ação (Calculadora e Início) */}
      <Card className="mt-16 rounded-3xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 sm:p-10 shadow-subtle">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Calculator className="h-3.5 w-3.5" /> Ferramenta Gratuita
            </div>
            <h3 className="text-xl font-bold sm:text-2xl">
              Consulte os valores das multas da NR-28
            </h3>
            <p className="text-sm text-muted-foreground max-w-lg">
              Faça simulações com o número de funcionários da sua empresa e entenda o impacto
              financeiro das não conformidades.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0 rounded-full px-6">
            <Link to="/calculadora">
              Calcular Multas <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>
    </article>
  )
}
