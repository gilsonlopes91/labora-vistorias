import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  FileText,
  UploadCloud,
  X,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  type Artigo,
  type StatusArtigo,
  getTodosArtigos,
  createArtigo,
  updateArtigo,
  deleteArtigo,
  toggleStatusArtigo,
  gerarSlug,
  getUrlCapaArtigo,
  getNomeAutorArtigo,
} from '@/services/artigos'
import { type BlogAutor, getAutoresBlog, createAutorBlog } from '@/services/blogAutores'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useAuth } from '@/hooks/use-auth'
import { RichTextEditor } from '@/components/RichTextEditor'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminArtigos() {
  const { user } = useAuth()
  const [artigos, setArtigos] = useState<Artigo[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusArtigo>('todos')

  // Estado do formulário de criação/edição
  const [modoEdicao, setModoEdicao] = useState(false)
  const [artigoAtualId, setArtigoAtualId] = useState<string | null>(null)
  const [titulo, setTitulo] = useState('')
  const [slug, setSlug] = useState('')
  const [slugModificadoManualmente, setSlugModificadoManualmente] = useState(false)
  const [resumo, setResumo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [status, setStatus] = useState<StatusArtigo>('rascunho')
  const [capaArquivo, setCapaArquivo] = useState<File | null>(null)
  const [capaPreview, setCapaPreview] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Gestão de autores do blog
  const [autores, setAutores] = useState<BlogAutor[]>([])
  const [autorSelecionadoId, setAutorSelecionadoId] = useState<string>('')
  const [modalNovoAutorAberto, setModalNovoAutorAberto] = useState(false)
  const [novoAutorNome, setNovoAutorNome] = useState('')
  const [novoAutorBio, setNovoAutorBio] = useState('')
  const [salvandoNovoAutor, setSalvandoNovoAutor] = useState(false)

  // Diálogo de pré-visualização
  const [previewAberto, setPreviewAberto] = useState(false)
  const [artigoParaPreview, setArtigoParaPreview] = useState<{
    titulo: string
    resumo: string
    conteudo: string
    capaUrl?: string | null
    status: StatusArtigo
    data: string
    autorNome?: string
  } | null>(null)

  // Diálogo de confirmação de exclusão
  const [artigoParaExcluir, setArtigoParaExcluir] = useState<Artigo | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const carregarAutores = useCallback(async () => {
    try {
      const listaAutores = await getAutoresBlog()
      setAutores(listaAutores)
      return listaAutores
    } catch (err) {
      console.error('Erro ao carregar autores:', err)
      return []
    }
  }, [])

  const carregarArtigos = useCallback(async () => {
    setLoading(true)
    try {
      const [lista] = await Promise.all([getTodosArtigos(), carregarAutores()])
      setArtigos(lista)
    } catch (err) {
      toast.error('Erro ao carregar artigos', { description: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }, [carregarAutores])

  useEffect(() => {
    carregarArtigos()
  }, [carregarArtigos])

  // Abertura do formulário para novo artigo
  const abrirNovo = () => {
    setArtigoAtualId(null)
    setTitulo('')
    setSlug('')
    setSlugModificadoManualmente(false)
    setResumo('')
    setConteudo('')
    setStatus('rascunho')
    setCapaArquivo(null)
    setCapaPreview(null)

    // Autor padrão: Gilson Lopes de Souza Junior (ou o primeiro disponível)
    const autorPadrao =
      autores.find((a) => a.nome.toLowerCase() === 'gilson lopes de souza junior') || autores[0]
    setAutorSelecionadoId(autorPadrao ? autorPadrao.id : '')

    setModoEdicao(true)
  }

  // Abertura do formulário para edição de artigo existente
  const abrirEdicao = (artigo: Artigo) => {
    setArtigoAtualId(artigo.id)
    setTitulo(artigo.titulo)
    setSlug(artigo.slug)
    setSlugModificadoManualmente(true)
    setResumo(artigo.resumo)
    setConteudo(artigo.conteudo)
    setStatus(artigo.status)
    setCapaArquivo(null)
    setCapaPreview(getUrlCapaArtigo(artigo))

    // Se o artigo já tem autor_blog_id, usa ele; senão procura por Gilson ou primeiro
    if (artigo.autor_blog_id) {
      setAutorSelecionadoId(artigo.autor_blog_id)
    } else {
      const autorPadrao =
        autores.find((a) => a.nome.toLowerCase() === 'gilson lopes de souza junior') || autores[0]
      setAutorSelecionadoId(autorPadrao ? autorPadrao.id : '')
    }

    setModoEdicao(true)
  }

  const handleCriarNovoAutor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoAutorNome.trim()) {
      toast.error('Informe o nome do novo autor')
      return
    }

    setSalvandoNovoAutor(true)
    try {
      const autorCriado = await createAutorBlog({
        nome: novoAutorNome.trim(),
        bio: novoAutorBio.trim(),
      })
      const listaAtualizada = await carregarAutores()
      setAutorSelecionadoId(autorCriado.id)
      setNovoAutorNome('')
      setNovoAutorBio('')
      setModalNovoAutorAberto(false)
      toast.success(`Autor "${autorCriado.nome}" adicionado com sucesso!`)
    } catch (err) {
      toast.error('Erro ao adicionar autor', { description: getErrorMessage(err) })
    } finally {
      setSalvandoNovoAutor(false)
    }
  }

  const cancelarEdicao = () => {
    setModoEdicao(false)
    setArtigoAtualId(null)
  }

  const handleTituloChange = (novoTitulo: string) => {
    setTitulo(novoTitulo)
    if (!slugModificadoManualmente) {
      setSlug(gerarSlug(novoTitulo))
    }
  }

  const handleCapaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCapaArquivo(file)
      const reader = new FileReader()
      reader.onload = (ev) => {
        setCapaPreview(ev.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoverCapa = () => {
    setCapaArquivo(null)
    setCapaPreview(null)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) {
      toast.error('Informe o título do artigo')
      return
    }
    const finalSlug = (slug || gerarSlug(titulo)).trim()
    if (!finalSlug) {
      toast.error('Informe um slug válido')
      return
    }
    if (!resumo.trim()) {
      toast.error('Informe um resumo breve')
      return
    }
    if (!conteudo.trim()) {
      toast.error('Escreva o conteúdo do artigo')
      return
    }

    setSalvando(true)
    try {
      if (artigoAtualId) {
        await updateArtigo(artigoAtualId, {
          titulo: titulo.trim(),
          slug: finalSlug,
          resumo: resumo.trim(),
          conteudo: conteudo.trim(),
          status,
          autor_blog_id: autorSelecionadoId || undefined,
          capa: capaArquivo !== null ? capaArquivo : capaPreview === null ? null : undefined,
        })
        toast.success('Artigo atualizado com sucesso!')
      } else {
        await createArtigo({
          titulo: titulo.trim(),
          slug: finalSlug,
          resumo: resumo.trim(),
          conteudo: conteudo.trim(),
          status,
          autor_id: user?.id,
          autor_blog_id: autorSelecionadoId || undefined,
          capa: capaArquivo,
        })
        toast.success('Artigo criado com sucesso!')
      }
      setModoEdicao(false)
      carregarArtigos()
    } catch (err) {
      toast.error('Não foi possível salvar o artigo', { description: getErrorMessage(err) })
    } finally {
      setSalvando(false)
    }
  }

  const handleAlternarStatus = async (artigo: Artigo) => {
    try {
      const atualizado = await toggleStatusArtigo(artigo.id, artigo.status)
      setArtigos((prev) =>
        prev.map((a) => (a.id === artigo.id ? { ...a, status: atualizado.status } : a)),
      )
      toast.success(
        atualizado.status === 'publicado'
          ? 'Artigo publicado no blog!'
          : 'Artigo movido para rascunho.',
      )
    } catch (err) {
      toast.error('Erro ao alterar status', { description: getErrorMessage(err) })
    }
  }

  const handleConfirmarExclusao = async () => {
    if (!artigoParaExcluir) return
    setExcluindo(true)
    try {
      await deleteArtigo(artigoParaExcluir.id)
      setArtigos((prev) => prev.filter((a) => a.id !== artigoParaExcluir.id))
      toast.success('Artigo excluído!')
      setArtigoParaExcluir(null)
    } catch (err) {
      toast.error('Erro ao excluir artigo', { description: getErrorMessage(err) })
    } finally {
      setExcluindo(false)
    }
  }

  const abrirPreviewEdicao = () => {
    const autorObj = autores.find((a) => a.id === autorSelecionadoId)
    const autorNomeFinal = autorObj?.nome || 'Gilson Lopes de Souza Junior'

    setArtigoParaPreview({
      titulo: titulo.trim() || 'Título de exemplo',
      resumo: resumo.trim() || 'Resumo explicativo do artigo para contextualização.',
      conteudo: conteudo.trim() || '<p>O conteúdo completo do artigo aparecerá aqui...</p>',
      capaUrl: capaPreview,
      status,
      data: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      autorNome: autorNomeFinal,
    })
    setPreviewAberto(true)
  }

  const abrirPreviewItem = (artigo: Artigo) => {
    setArtigoParaPreview({
      titulo: artigo.titulo,
      resumo: artigo.resumo,
      conteudo: artigo.conteudo,
      capaUrl: getUrlCapaArtigo(artigo),
      status: artigo.status,
      data: new Date(artigo.created).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      autorNome: getNomeAutorArtigo(artigo),
    })
    setPreviewAberto(true)
  }

  const artigosFiltrados = artigos.filter((artigo) => {
    const matchBusca =
      artigo.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      artigo.resumo.toLowerCase().includes(busca.toLowerCase()) ||
      artigo.slug.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus === 'todos' || artigo.status === filtroStatus
    return matchBusca && matchStatus
  })

  // ==========================================
  // MODO EDIÇÃO / CRIAÇÃO
  // ==========================================
  if (modoEdicao) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={cancelarEdicao} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                {artigoAtualId ? 'Editar Artigo' : 'Novo Artigo para o Blog'}
              </h1>
              <p className="text-xs text-muted-foreground">
                Editor completo com suporte a formatação, imagens e tabelas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={abrirPreviewEdicao}
              className="rounded-full"
            >
              <Eye className="mr-2 h-4 w-4" /> Pré-visualizar
            </Button>
            <Button
              type="button"
              onClick={handleSalvar}
              disabled={salvando}
              className="rounded-full px-6"
            >
              {salvando ? 'Salvando...' : artigoAtualId ? 'Salvar alterações' : 'Publicar / Salvar'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSalvar} className="space-y-6">
          {/* Título, Autor & Status */}
          <div className="grid gap-4 md:grid-cols-12">
            <div className="space-y-2 md:col-span-6">
              <Label htmlFor="artigo-titulo" className="text-sm font-semibold">
                Título do artigo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="artigo-titulo"
                value={titulo}
                onChange={(e) => handleTituloChange(e.target.value)}
                placeholder="Ex.: 5 cuidados essenciais na vistoria de NR-35 em trabalho em altura"
                className="text-base font-medium"
                required
              />
            </div>

            {/* Campo Autor (Dropdown com botão + Novo Autor) */}
            <div className="space-y-2 md:col-span-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="artigo-autor" className="text-sm font-semibold">
                  Autor <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary font-medium"
                  onClick={() => setModalNovoAutorAberto(true)}
                >
                  <Plus className="mr-1 h-3 w-3" /> Novo autor
                </Button>
              </div>
              <Select value={autorSelecionadoId} onValueChange={(v) => setAutorSelecionadoId(v)}>
                <SelectTrigger id="artigo-autor" className="bg-card">
                  <SelectValue placeholder="Selecione o autor" />
                </SelectTrigger>
                <SelectContent>
                  {autores.map((aut) => (
                    <SelectItem key={aut.id} value={aut.id}>
                      {aut.nome}
                    </SelectItem>
                  ))}
                  {autores.length === 0 && (
                    <SelectItem value="gilson-placeholder" disabled>
                      Gilson Lopes de Souza Junior
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="artigo-status" className="text-sm font-semibold">
                Status da publicação
              </Label>
              <Select value={status} onValueChange={(v: StatusArtigo) => setStatus(v)}>
                <SelectTrigger id="artigo-status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">
                    <span className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Rascunho (invisível)
                    </span>
                  </SelectItem>
                  <SelectItem value="publicado">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Publicado no Blog
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Slug URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="artigo-slug"
                className="text-xs font-semibold uppercase text-muted-foreground"
              >
                URL amigável (slug)
              </Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-primary"
                onClick={() => {
                  setSlug(gerarSlug(titulo))
                  setSlugModificadoManualmente(false)
                }}
              >
                Regenerar do título
              </Button>
            </div>
            <div className="flex items-center rounded-lg border bg-muted/30 px-3">
              <span className="text-xs text-muted-foreground">/blog/</span>
              <input
                id="artigo-slug"
                value={slug}
                onChange={(e) => {
                  setSlug(gerarSlug(e.target.value))
                  setSlugModificadoManualmente(true)
                }}
                className="w-full bg-transparent px-1 py-2 text-sm text-foreground outline-none"
                placeholder="exemplo-de-artigo-sst"
                required
              />
            </div>
          </div>

          {/* Imagem de Capa */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Imagem de Capa (opcional)</Label>
            {capaPreview ? (
              <div className="relative overflow-hidden rounded-xl border bg-card p-2 sm:max-w-md">
                <img
                  src={capaPreview}
                  alt="Capa do artigo"
                  className="h-44 w-full rounded-lg object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-3 top-3 h-7 w-7 rounded-full shadow"
                  onClick={handleRemoverCapa}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-6 text-center hover:bg-muted/40 transition-colors">
                <UploadCloud className="h-8 w-8 text-primary/70 mb-2" />
                <span className="text-sm font-semibold text-foreground">
                  Selecione uma imagem de destaque
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  PNG, JPG ou WebP de até 10MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCapaChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Resumo / Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="artigo-resumo" className="text-sm font-semibold">
              Resumo / Sinopse <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="artigo-resumo"
              rows={3}
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              placeholder="Uma síntese clara em 2 ou 3 frases para o card no blog e redes sociais..."
              required
            />
          </div>

          {/* Conteúdo com RichTextEditor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                Conteúdo completo do artigo <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> Rich Text HTML
              </span>
            </div>
            <RichTextEditor
              value={conteudo}
              onChange={setConteudo}
              placeholder="Comece a redigir o artigo aqui. Utilize cabeçalhos H2 e H3, listas, citações, imagens e tabelas..."
              minHeight="420px"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={cancelarEdicao}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando} className="rounded-full px-8">
              {salvando ? 'Salvando...' : artigoAtualId ? 'Salvar alterações' : 'Salvar Artigo'}
            </Button>
          </div>
        </form>

        {/* Modal de Pré-visualização */}
        <Dialog open={previewAberto} onOpenChange={setPreviewAberto}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Pré-visualização do Artigo</span>
                <Badge
                  variant={artigoParaPreview?.status === 'publicado' ? 'default' : 'secondary'}
                >
                  {artigoParaPreview?.status === 'publicado' ? 'Publicado' : 'Rascunho'}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            {artigoParaPreview && (
              <article className="mt-4 space-y-6">
                {artigoParaPreview.capaUrl && (
                  <img
                    src={artigoParaPreview.capaUrl}
                    alt={artigoParaPreview.titulo}
                    className="max-h-[380px] w-full rounded-2xl object-cover"
                  />
                )}
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                    {artigoParaPreview.titulo}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Publicado por <strong>{artigoParaPreview.autorNome}</strong> em{' '}
                    {artigoParaPreview.data}
                  </p>
                </div>
                <div className="rounded-xl border-l-4 border-primary bg-muted/30 p-4 text-base italic text-foreground/80">
                  {artigoParaPreview.resumo}
                </div>
                <div
                  className="prose prose-stone dark:prose-invert max-w-none text-foreground leading-relaxed prose-a:text-primary prose-a:underline prose-a:font-medium hover:prose-a:opacity-80"
                  dangerouslySetInnerHTML={{ __html: artigoParaPreview.conteudo }}
                />
              </article>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ==========================================
  // MODO LISTA DE ARTIGOS (DASHBOARD)
  // ==========================================
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Cabeçalho da página */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Artigos & Publicações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie o conteúdo educativo e técnico de SST publicado no Blog da Labora.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/blog" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Ver Blog Público
            </Link>
          </Button>
          <Button onClick={abrirNovo} className="rounded-full">
            <Plus className="mr-2 h-4 w-4" /> Novo Artigo
          </Button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, resumo ou slug..."
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={filtroStatus}
            onValueChange={(v: 'todos' | StatusArtigo) => setFiltroStatus(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="publicado">Publicados</SelectItem>
              <SelectItem value="rascunho">Rascunhos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conteúdo / Listagem */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : artigosFiltrados.length === 0 ? (
        <Card className="rounded-2xl border-dashed p-12 text-center shadow-none">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-bold">Nenhum artigo encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {busca || filtroStatus !== 'todos'
              ? 'Tente ajustar os filtros de busca para encontrar o artigo desejado.'
              : 'Comece publicando o primeiro artigo técnico para alimentar o blog.'}
          </p>
          <Button onClick={abrirNovo} className="mt-6 rounded-full">
            <Plus className="mr-2 h-4 w-4" /> Criar Primeiro Artigo
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {artigosFiltrados.map((artigo) => {
            const capaUrl = getUrlCapaArtigo(artigo)
            const isPublicado = artigo.status === 'publicado'

            return (
              <Card
                key={artigo.id}
                className="overflow-hidden rounded-2xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-subtle"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-1 gap-4">
                    {capaUrl ? (
                      <img
                        src={capaUrl}
                        alt={artigo.titulo}
                        className="h-20 w-24 shrink-0 rounded-xl object-cover border"
                      />
                    ) : (
                      <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                        <FileText className="h-8 w-8 opacity-40" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-foreground hover:text-primary transition-colors">
                          {artigo.titulo}
                        </h2>
                        <Badge
                          variant={isPublicado ? 'default' : 'secondary'}
                          className="rounded-full text-[11px]"
                        >
                          {isPublicado ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">{artigo.resumo}</p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                        <span>
                          Slug:{' '}
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                            /blog/{artigo.slug}
                          </code>
                        </span>
                        <span>•</span>
                        <span>
                          Atualizado em{' '}
                          {new Date(artigo.updated || artigo.created).toLocaleDateString('pt-BR')}
                        </span>
                        <span>•</span>
                        <span>Por {getNomeAutorArtigo(artigo)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirPreviewItem(artigo)}
                      className="rounded-full h-8 px-2.5 text-xs"
                      title="Pré-visualizar"
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" /> Ver
                    </Button>

                    <Button
                      variant={isPublicado ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => handleAlternarStatus(artigo)}
                      className="rounded-full h-8 px-2.5 text-xs"
                    >
                      {isPublicado ? 'Despublicar' : 'Publicar'}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => abrirEdicao(artigo)}
                      className="h-8 w-8 rounded-full"
                      title="Editar artigo"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setArtigoParaExcluir(artigo)}
                      className="h-8 w-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal de Pré-visualização de Item da Lista */}
      <Dialog open={previewAberto} onOpenChange={setPreviewAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Pré-visualização do Artigo</span>
              <Badge variant={artigoParaPreview?.status === 'publicado' ? 'default' : 'secondary'}>
                {artigoParaPreview?.status === 'publicado' ? 'Publicado' : 'Rascunho'}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {artigoParaPreview && (
            <article className="mt-4 space-y-6">
              {artigoParaPreview.capaUrl && (
                <img
                  src={artigoParaPreview.capaUrl}
                  alt={artigoParaPreview.titulo}
                  className="max-h-[380px] w-full rounded-2xl object-cover"
                />
              )}
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  {artigoParaPreview.titulo}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Publicado por <strong>{artigoParaPreview.autorNome}</strong> em{' '}
                  {artigoParaPreview.data}
                </p>
              </div>
              <div className="rounded-xl border-l-4 border-primary bg-muted/30 p-4 text-base italic text-foreground/80">
                {artigoParaPreview.resumo}
              </div>
              <div
                className="prose prose-stone dark:prose-invert max-w-none text-foreground leading-relaxed prose-a:text-primary prose-a:underline prose-a:font-medium hover:prose-a:opacity-80"
                dangerouslySetInnerHTML={{ __html: artigoParaPreview.conteudo }}
              />
            </article>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para Adicionar Novo Autor */}
      <Dialog open={modalNovoAutorAberto} onOpenChange={setModalNovoAutorAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Autor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCriarNovoAutor} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="novo-autor-nome" className="text-sm font-semibold">
                Nome do autor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="novo-autor-nome"
                value={novoAutorNome}
                onChange={(e) => setNovoAutorNome(e.target.value)}
                placeholder="Ex.: Maria Fernanda Silva"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="novo-autor-bio" className="text-sm font-semibold">
                Breve biografia ou especialidade (opcional)
              </Label>
              <Input
                id="novo-autor-bio"
                value={novoAutorBio}
                onChange={(e) => setNovoAutorBio(e.target.value)}
                placeholder="Ex.: Engenheira de Segurança do Trabalho"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalNovoAutorAberto(false)}
                disabled={salvandoNovoAutor}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={salvandoNovoAutor}>
                {salvandoNovoAutor ? 'Salvando...' : 'Adicionar autor'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog
        open={Boolean(artigoParaExcluir)}
        onOpenChange={(aberto) => !aberto && setArtigoParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja remover permanentemente o artigo{' '}
              <strong>"{artigoParaExcluir?.titulo}"</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarExclusao}
              disabled={excluindo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluindo ? 'Excluindo...' : 'Sim, excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
