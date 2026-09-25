/* Modelos de proposta (Empresas > Modelos de proposta).
   Lista os modelos da organização para escolher o favorito (sugerido em todo
   orçamento novo), ver um PDF de exemplo e editar cada um: nome, desenho,
   seções, textos e escopo padrão. Logo e cores vêm de Configurações >
   Identidade visual, a menos que o modelo use identidade própria. */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Copy, Eye, Pencil, Star, Upload, X } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { gerarPdfProposta, type PdfGerado } from '@/lib/propostaPdf'
import VisualizadorPdf from '@/components/VisualizadorPdf'
import {
  carregarIdentidade,
  hexValido,
  COR_PRIMARIA_LABORA,
  COR_SECUNDARIA_LABORA,
  type IdentidadeVisual,
} from '@/lib/identidadeVisual'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import {
  definirModeloPadrao,
  duplicarModeloProposta,
  enviarArquivoModelo,
  getModelosProposta,
  secaoAtiva,
  updateModeloProposta,
  urlArquivoModelo,
  LAYOUT_DESCRICAO,
  LAYOUT_LABEL,
  SECOES_PROPOSTA,
  type CampoImagemModelo,
  type ChaveSecao,
  type DadosInstitucionais,
  type LayoutProposta,
  type ModeloProposta,
  type SecoesProposta,
} from '@/services/modelosProposta'
import type { Orcamento } from '@/services/orcamentos'
import type { Empresa } from '@/services/empresas'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const linhas = (t: string) =>
  t
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

/** Orçamento fictício para o PDF de exemplo. */
const ORCAMENTO_EXEMPLO = {
  id: 'exemplo',
  organizacao_id: '',
  empresa_id: '',
  numero: '000/2026',
  tipo: 'servico',
  titulo: 'Elaboração de PGR e PCMSO',
  descricao:
    'Levantamento dos riscos ocupacionais em campo, elaboração do inventário de riscos e do plano de ação, e emissão do PCMSO.',
  itens: [
    {
      descricao: 'Visita técnica e levantamento em campo',
      quantidade: 1,
      unidade: 'un',
      valor_unitario: 900,
    },
    { descricao: 'Elaboração do PGR', quantidade: 1, unidade: 'un', valor_unitario: 1800 },
    { descricao: 'Elaboração do PCMSO', quantidade: 1, unidade: 'un', valor_unitario: 1200 },
  ],
  valor_total: 3900,
  status: 'rascunho',
  data_proposta: new Date().toISOString().slice(0, 10),
  validade_dias: 30,
  condicao_pagamento: '50% na assinatura e 50% na entrega, por PIX ou boleto',
  prazo_entrega: '30 dias após a visita técnica',
  normas_referencia: [
    'NR-01 — Disposições Gerais e Gerenciamento de Riscos Ocupacionais',
    'NR-07 — PCMSO',
  ],
  itens_inclusos: ['Visita técnica ao estabelecimento', 'Emissão de ART'],
  itens_exclusos: ['Exames médicos ocupacionais', 'Medições quantitativas de agentes'],
  responsavel_engenheiro: 'Responsável Técnico',
  crea: 'CREA-UF nº 00000',
  created: '',
  updated: '',
} as unknown as Orcamento

const EMPRESA_EXEMPLO = {
  razao_social: 'Empresa Exemplo Ltda',
  nome_fantasia: 'Empresa Exemplo',
  cnpj: '00.000.000/0001-00',
} as unknown as Empresa

function EnvioImagem({
  modelo,
  campo,
  rotulo,
  somentePng,
  onAtualizado,
}: {
  modelo: ModeloProposta
  campo: CampoImagemModelo
  rotulo: string
  somentePng?: boolean
  onAtualizado: (m: ModeloProposta) => void
}) {
  const [enviando, setEnviando] = useState(false)
  const url = urlArquivoModelo(modelo, campo)
  const enviar = async (arquivo: File | null) => {
    if (arquivo && somentePng && arquivo.type !== 'image/png') {
      toast.error('Envie em PNG', { description: 'Use o arquivo PNG com fundo transparente.' })
      return
    }
    setEnviando(true)
    try {
      onAtualizado(await enviarArquivoModelo(modelo.id, campo, arquivo))
    } catch (error) {
      toast.error('Não foi possível enviar a imagem', { description: getErrorMessage(error) })
    } finally {
      setEnviando(false)
    }
  }
  const id = `img-${modelo.id}-${campo}`
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="text-[10px] text-muted-foreground">sem imagem</span>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium">{rotulo}</div>
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="file"
            accept={somentePng ? 'image/png' : 'image/png,image/jpeg'}
            className="hidden"
            onChange={(e) => {
              enviar(e.target.files?.[0] || null)
              e.target.value = ''
            }}
          />
          <label
            htmlFor={id}
            className="inline-flex cursor-pointer items-center gap-1 text-xs text-primary hover:underline"
          >
            <Upload className="h-3 w-3" />
            {enviando ? 'Enviando...' : url ? 'Trocar' : 'Enviar'}
          </label>
          {url && (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => enviar(null)}
            >
              <X className="h-3 w-3" />
              Remover
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ModelosProposta() {
  const [modelos, setModelos] = useState<ModeloProposta[]>([])
  const [identidade, setIdentidade] = useState<IdentidadeVisual | null>(null)
  const [nomeOrg, setNomeOrg] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [gerando, setGerando] = useState('')
  const [pdfNaTela, setPdfNaTela] = useState<{ pdf: PdfGerado; titulo: string } | null>(null)

  const [emEdicao, setEmEdicao] = useState<ModeloProposta | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [nome, setNome] = useState('')
  const [layout, setLayout] = useState<LayoutProposta>('classico')
  const [usarIdentidade, setUsarIdentidade] = useState(true)
  const [corPrimaria, setCorPrimaria] = useState(COR_PRIMARIA_LABORA)
  const [corSecundaria, setCorSecundaria] = useState(COR_SECUNDARIA_LABORA)
  const [secoes, setSecoes] = useState<SecoesProposta>({})
  const [apresentacao, setApresentacao] = useState('')
  const [encerramento, setEncerramento] = useState('')
  const [inclusos, setInclusos] = useState('')
  const [exclusos, setExclusos] = useState('')
  const [inst, setInst] = useState<DadosInstitucionais>({})

  const carregar = useCallback(async () => {
    try {
      const [lista, ident, org] = await Promise.all([
        getModelosProposta(),
        carregarIdentidade(),
        getMinhaOrganizacao(),
      ])
      setModelos(lista)
      setIdentidade(ident)
      setNomeOrg(org.nome)
    } catch (error) {
      toast.error('Não foi possível carregar os modelos', { description: getErrorMessage(error) })
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const favoritar = async (modelo: ModeloProposta) => {
    try {
      await definirModeloPadrao(modelo.id)
      toast.success(`"${modelo.nome}" é o seu modelo favorito`, {
        description: 'Todo orçamento novo já vem com ele.',
      })
      carregar()
    } catch (error) {
      toast.error('Não foi possível favoritar', { description: getErrorMessage(error) })
    }
  }

  const duplicar = async (modelo: ModeloProposta) => {
    try {
      await duplicarModeloProposta(modelo)
      toast.success('Cópia criada')
      carregar()
    } catch (error) {
      toast.error('Não foi possível duplicar', { description: getErrorMessage(error) })
    }
  }

  // Mostra o PDF de exemplo na tela; baixar é opcional, dentro da janela.
  const verExemplo = async (modelo: ModeloProposta, titulo = `Exemplo: ${modelo.nome}`) => {
    setGerando(modelo.id)
    try {
      const pdf = await gerarPdfProposta({
        orcamento: ORCAMENTO_EXEMPLO,
        empresa: EMPRESA_EXEMPLO,
        modelo,
        organizacaoNome: nomeOrg,
        logoOrganizacaoUrl: identidade?.logoUrl,
        salvar: false,
      })
      setPdfNaTela({ pdf, titulo })
    } catch (error) {
      toast.error('Não foi possível gerar o exemplo', { description: getErrorMessage(error) })
    } finally {
      setGerando('')
    }
  }

  const abrirEdicao = (m: ModeloProposta) => {
    setEmEdicao(m)
    setNome(m.nome)
    setLayout(m.layout)
    setUsarIdentidade(m.usar_identidade_org !== false)
    setCorPrimaria(hexValido(m.cor_primaria) ? m.cor_primaria! : COR_PRIMARIA_LABORA)
    setCorSecundaria(hexValido(m.cor_secundaria) ? m.cor_secundaria! : COR_SECUNDARIA_LABORA)
    const s: SecoesProposta = {}
    for (const sec of SECOES_PROPOSTA) s[sec.chave] = secaoAtiva(m, sec.chave)
    setSecoes(s)
    setApresentacao(m.texto_apresentacao || '')
    setEncerramento(m.texto_encerramento || '')
    setInclusos((m.itens_inclusos_padrao || []).join('\n'))
    setExclusos((m.itens_exclusos_padrao || []).join('\n'))
    setInst(m.dados_institucionais || {})
  }

  const salvar = async () => {
    if (!emEdicao) return
    if (!nome.trim()) {
      toast.error('Dê um nome ao modelo')
      return
    }
    setSalvando(true)
    try {
      await updateModeloProposta(emEdicao.id, {
        nome: nome.trim(),
        layout,
        usar_identidade_org: usarIdentidade,
        cor_primaria: hexValido(corPrimaria) ? corPrimaria.toUpperCase() : emEdicao.cor_primaria,
        cor_secundaria: hexValido(corSecundaria)
          ? corSecundaria.toUpperCase()
          : emEdicao.cor_secundaria,
        secoes,
        texto_apresentacao: apresentacao,
        texto_encerramento: encerramento,
        itens_inclusos_padrao: linhas(inclusos),
        itens_exclusos_padrao: linhas(exclusos),
        dados_institucionais: inst,
      })
      toast.success('Modelo salvo')
      setEmEdicao(null)
      carregar()
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  // Pré-visualização com o que está na tela de edição, antes de salvar.
  const verEdicao = () => {
    if (!emEdicao) return
    verExemplo(
      {
        ...emEdicao,
        nome: nome.trim() || emEdicao.nome,
        layout,
        usar_identidade_org: usarIdentidade,
        cor_primaria: hexValido(corPrimaria) ? corPrimaria.toUpperCase() : emEdicao.cor_primaria,
        cor_secundaria: hexValido(corSecundaria)
          ? corSecundaria.toUpperCase()
          : emEdicao.cor_secundaria,
        secoes,
        texto_apresentacao: apresentacao,
        texto_encerramento: encerramento,
        itens_inclusos_padrao: linhas(inclusos),
        itens_exclusos_padrao: linhas(exclusos),
        dados_institucionais: inst,
      },
      `Prévia (ainda não salva): ${nome.trim() || emEdicao.nome}`,
    )
  }

  const corDoModelo = (m: ModeloProposta) =>
    m.usar_identidade_org === false
      ? m.cor_primaria || COR_PRIMARIA_LABORA
      : identidade?.corPrimaria || COR_PRIMARIA_LABORA

  const setBanco = (campo: string, valor: string) =>
    setInst((atual) => ({ ...atual, banco: { ...(atual.banco || {}), [campo]: valor } }))

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <Link
        to="/empresas?aba=orcamentos"
        className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Orçamentos
      </Link>
      <h1 className="text-2xl font-bold">Modelos de proposta</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Escolha o modelo favorito, que vem marcado em todo orçamento novo, e ajuste o que entra no
        PDF. O logo e as cores vêm de{' '}
        <Link to="/configuracoes" className="text-primary hover:underline">
          Configurações &gt; Identidade visual
        </Link>{' '}
        e valem para todos os documentos.
      </p>

      {carregando ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : modelos.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Nenhum modelo encontrado.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modelos.map((m) => (
            <Card key={m.id} className="flex flex-col overflow-hidden">
              <div className="h-2" style={{ background: corDoModelo(m) }} />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{m.nome}</div>
                    <div className="text-xs text-muted-foreground">{LAYOUT_LABEL[m.layout]}</div>
                  </div>
                  {m.padrao ? (
                    <Badge className="shrink-0 gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Favorito
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 shrink-0 gap-1 text-xs"
                      onClick={() => favoritar(m)}
                    >
                      <Star className="h-3.5 w-3.5" />
                      Favoritar
                    </Button>
                  )}
                </div>
                <p className="line-clamp-3 flex-1 text-xs text-muted-foreground">
                  {LAYOUT_DESCRICAO[m.layout]}
                </p>
                {m.usar_identidade_org === false && (
                  <p className="text-[11px] text-amber-700">Usa logo e cores próprios.</p>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => verExemplo(m)}
                    disabled={gerando === m.id}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    {gerando === m.id ? 'Gerando...' : 'Ver exemplo'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => abrirEdicao(m)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8"
                    onClick={() => duplicar(m)}
                    title="Criar uma cópia para fazer uma variação"
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    Duplicar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <VisualizadorPdf
        pdf={pdfNaTela?.pdf || null}
        titulo={pdfNaTela?.titulo || 'Exemplo'}
        descricao="Proposta de exemplo, com cliente e valores fictícios."
        onFechar={() => setPdfNaTela(null)}
      />

      <Dialog open={!!emEdicao} onOpenChange={(o) => !o && setEmEdicao(null)}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar modelo</DialogTitle>
            <DialogDescription>
              O que mudar aqui vale para os próximos PDFs gerados com este modelo.
            </DialogDescription>
          </DialogHeader>
          {emEdicao && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="m-nome">Nome</Label>
                  <Input
                    id="m-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Desenho</Label>
                  <Select value={layout} onValueChange={(v) => setLayout(v as LayoutProposta)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(LAYOUT_LABEL) as LayoutProposta[]).map((l) => (
                        <SelectItem key={l} value={l}>
                          {LAYOUT_LABEL[l]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  {LAYOUT_DESCRICAO[layout]}
                </p>
              </div>

              <div className="space-y-3 rounded-xl border p-3">
                <label className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-sm font-semibold">
                      Usar logo e cores da empresa
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Os de Configurações &gt; Identidade visual. Desligue só se este modelo precisa
                      de uma identidade diferente.
                    </span>
                  </span>
                  <Switch checked={usarIdentidade} onCheckedChange={setUsarIdentidade} />
                </label>
                {!usarIdentidade && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { rotulo: 'Cor principal', valor: corPrimaria, set: setCorPrimaria },
                      { rotulo: 'Cor de apoio', valor: corSecundaria, set: setCorSecundaria },
                    ].map((c) => (
                      <div key={c.rotulo}>
                        <Label className="text-xs">{c.rotulo}</Label>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="color"
                            aria-label={c.rotulo}
                            value={hexValido(c.valor) ? c.valor : '#000000'}
                            onChange={(e) => c.set(e.target.value.toUpperCase())}
                            className="h-9 w-11 cursor-pointer rounded-md border bg-transparent p-1"
                          />
                          <Input
                            value={c.valor}
                            onChange={(e) => c.set(e.target.value.trim())}
                            maxLength={7}
                            className="font-mono uppercase"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <EnvioImagem
                        modelo={emEdicao}
                        campo="logo"
                        rotulo="Logo próprio do modelo (somente PNG sem fundo)"
                        somentePng
                        onAtualizado={setEmEdicao}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <EnvioImagem
                  modelo={emEdicao}
                  campo="imagem_capa"
                  rotulo="Imagem de capa"
                  onAtualizado={setEmEdicao}
                />
                {layout === 'labora' && (
                  <>
                    <EnvioImagem
                      modelo={emEdicao}
                      campo="imagem_institucional"
                      rotulo="Imagem institucional"
                      onAtualizado={setEmEdicao}
                    />
                    <EnvioImagem
                      modelo={emEdicao}
                      campo="imagem_servicos"
                      rotulo="Imagem de serviços"
                      onAtualizado={setEmEdicao}
                    />
                    <EnvioImagem
                      modelo={emEdicao}
                      campo="imagem_encerramento"
                      rotulo="Imagem de encerramento"
                      onAtualizado={setEmEdicao}
                    />
                  </>
                )}
              </div>

              <div>
                <Label>O que entra no PDF</Label>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {SECOES_PROPOSTA.map((s) => (
                    <label key={s.chave} className="flex cursor-pointer items-start gap-2 text-sm">
                      <Checkbox
                        checked={secoes[s.chave as ChaveSecao] !== false}
                        onCheckedChange={(v) => setSecoes((a) => ({ ...a, [s.chave]: !!v }))}
                        className="mt-0.5"
                      />
                      <span>
                        {s.rotulo}
                        <span className="block text-[11px] text-muted-foreground">{s.ajuda}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="m-apres">Texto de apresentação</Label>
                  <Textarea
                    id="m-apres"
                    rows={4}
                    value={apresentacao}
                    onChange={(e) => setApresentacao(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="m-enc">Texto de encerramento</Label>
                  <Textarea
                    id="m-enc"
                    rows={4}
                    value={encerramento}
                    onChange={(e) => setEncerramento(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="m-inc">Incluso padrão (um por linha)</Label>
                  <Textarea
                    id="m-inc"
                    rows={4}
                    value={inclusos}
                    onChange={(e) => setInclusos(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="m-exc">Não incluso padrão (um por linha)</Label>
                  <Textarea
                    id="m-exc"
                    rows={4}
                    value={exclusos}
                    onChange={(e) => setExclusos(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  O escopo padrão entra preenchido em cada orçamento novo e pode ser ajustado em
                  cada proposta.
                </p>
              </div>

              {layout === 'labora' && (
                <div className="space-y-3 rounded-xl border p-3">
                  <div className="text-sm font-semibold">Dados do documento completo</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        ['razao_social', 'Razão social'],
                        ['cnpj', 'CNPJ'],
                        ['telefone', 'Telefone'],
                        ['email', 'E-mail'],
                        ['cidade_emissao', 'Cidade de emissão'],
                        ['tagline', 'Frase de apresentação'],
                      ] as [keyof DadosInstitucionais, string][]
                    ).map(([campo, rotulo]) => (
                      <div key={campo}>
                        <Label className="text-xs">{rotulo}</Label>
                        <Input
                          value={String(inst[campo] || '')}
                          onChange={(e) => setInst((a) => ({ ...a, [campo]: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">Dados bancários</div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      ['instituicao', 'Banco'],
                      ['agencia', 'Agência'],
                      ['conta', 'Conta'],
                      ['pix', 'Chave PIX'],
                      ['favorecido', 'Favorecido'],
                    ].map(([campo, rotulo]) => (
                      <div key={campo}>
                        <Label className="text-xs">{rotulo}</Label>
                        <Input
                          value={String(
                            (inst.banco as Record<string, string> | undefined)?.[campo] || '',
                          )}
                          onChange={(e) => setBanco(campo, e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={verEdicao}
              disabled={salvando || (!!emEdicao && gerando === emEdicao.id)}
              className="sm:mr-auto"
            >
              <Eye className="mr-1.5 h-4 w-4" />
              {emEdicao && gerando === emEdicao.id ? 'Gerando...' : 'Ver como fica'}
            </Button>
            <Button variant="outline" onClick={() => setEmEdicao(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar modelo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
