/* Modelos de proposta: catálogo de modelos de propostas comerciais prontos para download
   e personalização dos modelos de layout/PDF da organização. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileDown,
  FileSpreadsheet,
  FileText,
  ImageOff,
  Palette,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
} from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getMinhaOrganizacao, urlLogoOrganizacao } from '@/services/organizacoes'
import {
  definirModeloPadrao,
  enviarArquivoModelo,
  getModelosProposta,
  updateModeloProposta,
  urlArquivoModelo,
  secaoAtiva,
  LAYOUT_DESCRICAO,
  LAYOUT_LABEL,
  SECOES_PROPOSTA,
  COR_PRIMARIA_PADRAO,
  COR_SECUNDARIA_PADRAO,
  type CampoImagemModelo,
  type ChaveSecao,
  type DadosInstitucionais,
  type ModeloProposta,
} from '@/services/modelosProposta'
import {
  MODELOS_PROPOSTAS_COMERCIAIS,
  type ModeloPropostaComercial,
} from '@/lib/modelosPropostaComercial'
import { gerarPdfModeloPropostaComercial } from '@/lib/modeloPropostaComercialPdf'
import { getIconeFormulario } from '@/lib/iconesFormulario'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/** Miniatura do layout, desenhada com divs para o usuário ver a diferença. */
function Miniatura({
  layout,
  primaria,
  secundaria,
}: {
  layout: string
  primaria: string
  secundaria: string
}) {
  if (layout === 'moderno') {
    return (
      <div className="h-24 w-16 overflow-hidden rounded border" style={{ background: primaria }}>
        <div className="p-1.5">
          <div className="h-1.5 w-6 rounded-sm bg-white/70" />
          <div className="mt-4 h-1.5 w-10 rounded-sm bg-white" />
          <div className="mt-1 h-1.5 w-8 rounded-sm bg-white" />
        </div>
        <div className="mt-2 h-9 w-full" style={{ background: secundaria }} />
      </div>
    )
  }
  if (layout === 'labora') {
    return (
      <div className="h-24 w-16 overflow-hidden rounded border bg-white">
        <div className="h-1 w-full" style={{ background: primaria }} />
        <div className="flex flex-col items-center p-1.5">
          <div className="h-4 w-4 rounded" style={{ background: primaria }} />
          <div className="mt-1 h-1 w-8 rounded-sm" style={{ background: secundaria }} />
          <div className="mt-1.5 h-3 w-11 rounded-sm border" style={{ borderColor: primaria }} />
        </div>
        <div className="mt-1 h-6 w-full bg-neutral-200" />
        <div className="h-4 w-full" style={{ background: primaria }} />
      </div>
    )
  }
  if (layout === 'minimalista') {
    return (
      <div className="h-24 w-16 overflow-hidden rounded border bg-white p-2">
        <div className="h-1 w-5 rounded-sm" style={{ background: secundaria }} />
        <div className="mt-3 h-1 w-10 rounded-sm bg-neutral-300" />
        <div className="mt-1 h-1 w-9 rounded-sm bg-neutral-200" />
        <div className="mt-1 h-1 w-10 rounded-sm bg-neutral-200" />
        <div className="mt-4 h-px w-full" style={{ background: secundaria }} />
        <div className="mt-1 h-1 w-6 rounded-sm bg-neutral-300" />
      </div>
    )
  }
  return (
    <div className="h-24 w-16 overflow-hidden rounded border bg-white">
      <div className="h-1.5 w-full" style={{ background: primaria }} />
      <div className="p-1.5">
        <div className="h-1.5 w-6 rounded-sm bg-neutral-300" />
        <div className="mt-4 h-1.5 w-11 rounded-sm" style={{ background: secundaria }} />
        <div className="mt-0.5 h-0.5 w-5 rounded-sm" style={{ background: primaria }} />
        <div className="mt-3 h-1 w-10 rounded-sm bg-neutral-200" />
        <div className="mt-1 h-1 w-9 rounded-sm bg-neutral-200" />
      </div>
    </div>
  )
}

export default function ModelosProposta() {
  const [abaAtiva, setAbaAtiva] = useState<'download' | 'layouts'>('download')
  const [modelos, setModelos] = useState<ModeloProposta[]>([])
  const [selecionadoId, setSelecionadoId] = useState<string>('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  // Estado para download dos modelos de proposta
  const [baixandoModeloId, setBaixandoModeloId] = useState<string | null>(null)
  const [visualizandoModelo, setVisualizandoModelo] = useState<ModeloPropostaComercial | null>(null)
  const [nomeOrganizacao, setNomeOrganizacao] = useState('LABORA vistorias')
  const [logoOrganizacao, setLogoOrganizacao] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [corPrimaria, setCorPrimaria] = useState(COR_PRIMARIA_PADRAO)
  const [corSecundaria, setCorSecundaria] = useState(COR_SECUNDARIA_PADRAO)
  const [apresentacao, setApresentacao] = useState('')
  const [encerramento, setEncerramento] = useState('')
  const [inclusosPadrao, setInclusosPadrao] = useState('')
  const [exclusosPadrao, setExclusosPadrao] = useState('')
  const [secoes, setSecoes] = useState<Record<string, boolean>>({})
  const [inst, setInst] = useState<DadosInstitucionais>({})

  const listaParaLinhas = (lista?: string[]) => (lista || []).join('\n')
  const linhasParaLista = (texto: string) =>
    texto
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

  const selecionado = modelos.find((m) => m.id === selecionadoId) || null

  const carregar = async () => {
    try {
      const [lista, org] = await Promise.all([
        getModelosProposta().catch(() => []),
        getMinhaOrganizacao().catch(() => null),
      ])
      setModelos(lista)
      if (lista.length && !selecionadoId) setSelecionadoId(lista[0].id)
      if (org) {
        if (org.nome) setNomeOrganizacao(org.nome)
        const logoUrl = urlLogoOrganizacao(org)
        if (logoUrl) setLogoOrganizacao(logoUrl)
      }
    } catch (error) {
      toast.error('Não foi possível carregar os modelos', {
        description: getErrorMessage(error),
      })
    }
  }

  useEffect(() => {
    carregar().finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const baixarPdfModelo = async (modeloComercial: ModeloPropostaComercial) => {
    setBaixandoModeloId(modeloComercial.id)
    try {
      await gerarPdfModeloPropostaComercial({
        modelo: modeloComercial,
        nomeOrganizacao,
        logoUrlPersonalizada: logoOrganizacao,
      })
      toast.success(`Download concluído: ${modeloComercial.nome}`)
    } catch (error) {
      toast.error('Erro ao gerar PDF da proposta', {
        description: getErrorMessage(error),
      })
    } finally {
      setBaixandoModeloId(null)
    }
  }

  // Carrega o modelo selecionado no formulário.
  useEffect(() => {
    if (!selecionado) return
    setNome(selecionado.nome)
    setCorPrimaria(selecionado.cor_primaria || COR_PRIMARIA_PADRAO)
    setCorSecundaria(selecionado.cor_secundaria || COR_SECUNDARIA_PADRAO)
    setApresentacao(selecionado.texto_apresentacao || '')
    setEncerramento(selecionado.texto_encerramento || '')
    setInclusosPadrao(listaParaLinhas(selecionado.itens_inclusos_padrao))
    setExclusosPadrao(listaParaLinhas(selecionado.itens_exclusos_padrao))
    setInst(selecionado.dados_institucionais || {})
    const mapa: Record<string, boolean> = {}
    for (const secao of SECOES_PROPOSTA) {
      mapa[secao.chave] = secaoAtiva(selecionado, secao.chave as ChaveSecao)
    }
    setSecoes(mapa)
  }, [selecionado])

  const salvar = async () => {
    if (!selecionado) return
    setSalvando(true)
    try {
      await updateModeloProposta(selecionado.id, {
        nome: nome.trim() || selecionado.nome,
        cor_primaria: corPrimaria,
        cor_secundaria: corSecundaria,
        texto_apresentacao: apresentacao,
        texto_encerramento: encerramento,
        itens_inclusos_padrao: linhasParaLista(inclusosPadrao),
        itens_exclusos_padrao: linhasParaLista(exclusosPadrao),
        secoes,
        ...(selecionado.layout === 'labora' ? { dados_institucionais: inst } : {}),
      })
      toast.success('Modelo salvo')
      await carregar()
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  const enviarArquivo = async (campo: CampoImagemModelo, arquivo: File | null) => {
    if (!selecionado) return
    try {
      await enviarArquivoModelo(selecionado.id, campo, arquivo)
      toast.success(arquivo ? 'Imagem atualizada' : 'Imagem removida')
      await carregar()
    } catch (error) {
      toast.error('Não foi possível enviar a imagem', { description: getErrorMessage(error) })
    }
  }

  const tornarPadrao = async () => {
    if (!selecionado) return
    try {
      await definirModeloPadrao(selecionado.id)
      toast.success(`${selecionado.nome} agora é o modelo padrão`)
      await carregar()
    } catch (error) {
      toast.error('Não foi possível definir o padrão', { description: getErrorMessage(error) })
    }
  }

  if (carregando) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="-ml-2 h-8 px-2 text-muted-foreground"
            >
              <Link to="/orcamentos">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Orçamentos
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Modelos de proposta comercial</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Baixe modelos de propostas prontos e editáveis para fechar novos clientes de SST ou
            configure o design visual e a identidade do PDF gerado pelo sistema.
          </p>
        </div>
      </div>

      <Tabs
        value={abaAtiva}
        onValueChange={(v) => setAbaAtiva(v as 'download' | 'layouts')}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="download" className="gap-2">
            <FileDown className="h-4 w-4" />
            Modelos para baixar (PDF)
          </TabsTrigger>
          <TabsTrigger value="layouts" className="gap-2">
            <Palette className="h-4 w-4" />
            Personalizar layout PDF
          </TabsTrigger>
        </TabsList>

        {/* ====================================================================
            ABA 1: MODELOS DE PROPOSTAS PRONTOS PARA DOWNLOAD
            ==================================================================== */}
        <TabsContent value="download" className="space-y-6">
          <div className="rounded-2xl border bg-card/60 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Modelos Comerciais Editáveis de SST</h2>
                  <Badge variant="outline" className="text-xs">
                    4 modelos disponíveis
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground max-w-3xl">
                  Documentos completos com redação jurídica e técnica para Engenharia de Segurança
                  do Trabalho. Cada PDF é gerado com campos editáveis entre colchetes como{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">
                    [NOME DO CLIENTE]
                  </code>
                  ,{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">[CNPJ]</code>{' '}
                  e{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">
                    [VALOR TOTAL]
                  </code>
                  , tabela de itens orçamentários, metodologia, escopo, exclusões e termos de
                  assinatura.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {MODELOS_PROPOSTAS_COMERCIAIS.map((modeloItem) => {
              const Icone = getIconeFormulario(modeloItem.iconeId)
              const estaBaixando = baixandoModeloId === modeloItem.id

              return (
                <Card
                  key={modeloItem.id}
                  className="flex flex-col justify-between border transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icone className="h-6 w-6" />
                      </div>
                      <Badge variant="secondary" className="text-[11px]">
                        {modeloItem.categoria}
                      </Badge>
                    </div>
                    <CardTitle className="mt-3 text-base font-bold leading-snug">
                      {modeloItem.nome}
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed line-clamp-3">
                      {modeloItem.descricaoCurta}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          Prazo / Vigência:
                        </span>
                        <span className="text-right font-medium text-foreground">
                          {modeloItem.tempoEstimado}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2 text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium shrink-0">
                          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                          Normas:
                        </span>
                        <span className="text-right text-[11px] font-mono text-foreground truncate max-w-[200px]">
                          {modeloItem.nrReferencia}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="font-semibold text-foreground">
                        Estrutura inclusa no PDF:
                      </span>
                      <ul className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                        <li className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                          Identificação partes
                        </li>
                        <li className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                          Escopo & Metodologia
                        </li>
                        <li className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                          Tabela investimento
                        </li>
                        <li className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                          Aceite e assinaturas
                        </li>
                      </ul>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVisualizandoModelo(modeloItem)}
                        className="text-xs gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver detalhes
                      </Button>
                      <Button
                        size="sm"
                        disabled={estaBaixando}
                        onClick={() => baixarPdfModelo(modeloItem)}
                        className="text-xs gap-1.5 font-medium"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {estaBaixando ? 'Gerando PDF...' : 'Baixar PDF'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
              <span>
                Quer gerar uma proposta vinculada a uma empresa específica já cadastrada? Use o
                botão <strong>"Novo orçamento"</strong> na aba principal.
              </span>
            </div>
            <Button variant="secondary" size="sm" asChild className="shrink-0 text-xs">
              <Link to="/orcamentos">Ir para Orçamentos</Link>
            </Button>
          </div>
        </TabsContent>

        {/* ====================================================================
            ABA 2: PERSONALIZAÇÃO DO LAYOUT DO PDF (CONTEÚDO EXISTENTE)
            ==================================================================== */}
        <TabsContent value="layouts" className="space-y-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Personalização do layout das propostas</h2>
            <p className="text-sm text-muted-foreground">
              Escolha o desenho do PDF gerado pelo sistema ao orçar para empresas cadastradas,
              ajuste as cores e a logo, e marque quais seções entram no documento.
            </p>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {modelos.map((modelo) => {
              const ativo = modelo.id === selecionadoId
              return (
                <button
                  key={modelo.id}
                  type="button"
                  onClick={() => setSelecionadoId(modelo.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                    ativo ? 'border-primary bg-primary/5' : 'hover:bg-accent/40'
                  }`}
                >
                  <Miniatura
                    layout={modelo.layout}
                    primaria={modelo.cor_primaria || COR_PRIMARIA_PADRAO}
                    secundaria={modelo.cor_secundaria || COR_SECUNDARIA_PADRAO}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-semibold">{modelo.nome}</span>
                      {modelo.padrao && (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <Star className="h-2.5 w-2.5" />
                          Padrão
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{LAYOUT_LABEL[modelo.layout]}</p>
                  </div>
                  {ativo && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}
                </button>
              )
            })}
          </div>

          {selecionado && (
            <Card>
              <CardContent className="space-y-6 pt-6">
                <p className="text-sm text-muted-foreground">
                  {LAYOUT_DESCRICAO[selecionado.layout]}
                </p>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="nome">Nome do modelo</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cor1">Cor principal</Label>
                    <div className="mt-1.5 flex gap-2">
                      <Input
                        id="cor1"
                        type="color"
                        value={corPrimaria}
                        onChange={(e) => setCorPrimaria(e.target.value)}
                        className="h-10 w-14 p-1"
                      />
                      <Input
                        value={corPrimaria}
                        onChange={(e) => setCorPrimaria(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cor2">Cor de apoio</Label>
                    <div className="mt-1.5 flex gap-2">
                      <Input
                        id="cor2"
                        type="color"
                        value={corSecundaria}
                        onChange={(e) => setCorSecundaria(e.target.value)}
                        className="h-10 w-14 p-1"
                      />
                      <Input
                        value={corSecundaria}
                        onChange={(e) => setCorSecundaria(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { campo: 'logo' as const, rotulo: 'Logo', ajuda: 'Aparece na capa e no topo' },
                    {
                      campo: 'imagem_capa' as const,
                      rotulo: 'Imagem de capa',
                      ajuda: 'Foto usada na página de abertura',
                    },
                  ].map(({ campo, rotulo, ajuda }) => {
                    const url = urlArquivoModelo(selecionado, campo)
                    return (
                      <div key={campo} className="rounded-xl border p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{rotulo}</div>
                            <div className="text-xs text-muted-foreground">{ajuda}</div>
                          </div>
                          {url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => enviarArquivo(campo, null)}
                            >
                              Remover
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded border bg-muted/40">
                            {url ? (
                              <img
                                src={url}
                                alt={rotulo}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <ImageOff className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <label className="cursor-pointer">
                            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                              <Upload className="h-3.5 w-3.5" />
                              Enviar imagem
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const arquivo = e.target.files?.[0]
                                if (arquivo) enviarArquivo(campo, arquivo)
                                e.target.value = ''
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Separator />

                <div>
                  <Label>Seções do documento</Label>
                  <p className="mb-3 mt-1 text-xs text-muted-foreground">
                    Desmarque o que não deve sair no PDF. Uma seção sem conteúdo no orçamento é
                    pulada mesmo quando está marcada aqui.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SECOES_PROPOSTA.map((secao) => (
                      <label
                        key={secao.chave}
                        className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 hover:bg-accent/40"
                      >
                        <Checkbox
                          checked={!!secoes[secao.chave]}
                          onCheckedChange={(v) =>
                            setSecoes((atual) => ({ ...atual, [secao.chave]: v === true }))
                          }
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{secao.rotulo}</div>
                          <div className="text-xs text-muted-foreground">{secao.ajuda}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {selecionado.layout === 'labora' && (
                  <>
                    <Separator />
                    <div>
                      <Label>Dados institucionais</Label>
                      <p className="mb-3 mt-1 text-xs text-muted-foreground">
                        Aparecem na capa, no rodapé e na página de valores deste modelo. Campo em
                        branco simplesmente não é desenhado no PDF.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(
                          [
                            ['razao_social', 'Razão social'],
                            ['cnpj', 'CNPJ'],
                            ['telefone', 'Telefone'],
                            ['email', 'E-mail'],
                            ['tagline', 'Linha de apoio da capa'],
                            ['subtitulo', 'Subtítulo da capa'],
                            ['cidade_emissao', 'Cidade de emissão'],
                            ['lema', 'Lema institucional'],
                          ] as [keyof DadosInstitucionais, string][]
                        ).map(([chave, rotulo]) => (
                          <div key={chave}>
                            <Label htmlFor={`inst-${chave}`} className="text-xs">
                              {rotulo}
                            </Label>
                            <Input
                              id={`inst-${chave}`}
                              value={(inst[chave] as string) || ''}
                              onChange={(e) =>
                                setInst((atual) => ({ ...atual, [chave]: e.target.value }))
                              }
                              className="mt-1"
                            />
                          </div>
                        ))}
                      </div>

                      <p className="mb-2 mt-4 text-xs font-medium">Dados bancários</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(
                          [
                            ['favorecido', 'Favorecido'],
                            ['instituicao', 'Instituição'],
                            ['agencia', 'Agência'],
                            ['conta', 'Conta'],
                            ['pix', 'Chave PIX'],
                          ] as [string, string][]
                        ).map(([chave, rotulo]) => (
                          <div key={chave}>
                            <Label htmlFor={`banco-${chave}`} className="text-xs">
                              {rotulo}
                            </Label>
                            <Input
                              id={`banco-${chave}`}
                              value={((inst.banco || {}) as Record<string, string>)[chave] || ''}
                              onChange={(e) =>
                                setInst((atual) => ({
                                  ...atual,
                                  banco: { ...(atual.banco || {}), [chave]: e.target.value },
                                }))
                              }
                              className="mt-1"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        <Label htmlFor="servicos" className="text-xs">
                          Portfólio de serviços (um por linha)
                        </Label>
                        <Textarea
                          id="servicos"
                          value={(inst.servicos || []).join('\n')}
                          onChange={(e) =>
                            setInst((atual) => ({
                              ...atual,
                              servicos: e.target.value
                                .split('\n')
                                .map((l) => l.trim())
                                .filter(Boolean),
                            }))
                          }
                          rows={6}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <Label>Escopo padrão</Label>
                  <p className="mb-3 mt-1 text-xs text-muted-foreground">
                    Entra preenchido em todo orçamento novo que usar este modelo, e pode ser
                    ajustado proposta a proposta sem alterar o modelo. Um item por linha.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="incl">Itens inclusos</Label>
                      <Textarea
                        id="incl"
                        value={inclusosPadrao}
                        onChange={(e) => setInclusosPadrao(e.target.value)}
                        rows={6}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="excl">Itens não inclusos</Label>
                      <Textarea
                        id="excl"
                        value={exclusosPadrao}
                        onChange={(e) => setExclusosPadrao(e.target.value)}
                        rows={6}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="apres">Texto de apresentação</Label>
                    <Textarea
                      id="apres"
                      value={apresentacao}
                      onChange={(e) => setApresentacao(e.target.value)}
                      rows={6}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="encer">Texto de encerramento</Label>
                    <Textarea
                      id="encer"
                      value={encerramento}
                      onChange={(e) => setEncerramento(e.target.value)}
                      rows={6}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  {!selecionado.padrao && (
                    <Button variant="outline" onClick={tornarPadrao}>
                      <Star className="mr-2 h-4 w-4" />
                      Definir como padrão
                    </Button>
                  )}
                  <Button onClick={salvar} disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar modelo'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para visualização detalhada do modelo antes do download */}
      <Dialog
        open={!!visualizandoModelo}
        onOpenChange={(aberto) => !aberto && setVisualizandoModelo(null)}
      >
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {visualizandoModelo && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {visualizandoModelo.categoria}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">
                    {visualizandoModelo.nrReferencia}
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold">{visualizandoModelo.nome}</DialogTitle>
                <DialogDescription className="text-xs">
                  {visualizandoModelo.descricaoCurta}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-foreground mb-1">Apresentação:</h4>
                  <p className="text-muted-foreground leading-relaxed bg-muted/40 p-2.5 rounded-lg">
                    {visualizandoModelo.apresentacao}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-1.5">Escopo dos serviços:</h4>
                  <ul className="space-y-1">
                    {visualizandoModelo.escopo.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-1.5">Metodologia e Etapas:</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {visualizandoModelo.metodologia.map((m, i) => (
                      <div key={i} className="rounded-md border p-2 bg-card">
                        <div className="font-semibold text-primary">{m.etapa}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{m.descricao}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-1.5">
                    Itens de Investimento orçamentários:
                  </h4>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-muted text-muted-foreground font-semibold">
                        <tr>
                          <th className="p-2">Item</th>
                          <th className="p-2">Descrição</th>
                          <th className="p-2">Un.</th>
                          <th className="p-2 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {visualizandoModelo.itensInvestimento.map((it, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-mono">{it.item}</td>
                            <td className="p-2">{it.descricao}</td>
                            <td className="p-2">{it.unidade}</td>
                            <td className="p-2 text-right font-mono text-primary font-semibold">
                              {it.subtotal}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-primary" />
                    Campos editáveis prontos no PDF:
                  </div>
                  <p className="text-[11px]">
                    O arquivo gerado traz os campos [NOME DO CLIENTE], [CNPJ], [VALOR TOTAL], [DATA]
                    e linhas de assinatura das partes preparados para edição rápida em leitores de
                    PDF ou conversão para DOCX/impressão.
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setVisualizandoModelo(null)}>
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    const mod = visualizandoModelo
                    setVisualizandoModelo(null)
                    if (mod) baixarPdfModelo(mod)
                  }}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar este Modelo (PDF)
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
