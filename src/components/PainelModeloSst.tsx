/* Painel do documento gerado a partir de um Modelo Geral Labora: dados do
 * documento (autor, coordenador, datas, ART), alternativas e trechos
 * condicionais do texto, pendências (campos sem dado, com os campos manuais
 * para preencher), blocos de dados (incluir/observação) e pré-visualização.
 * Tudo que o técnico muda aqui é gravado no próprio documento
 * (documentos_sst: alternativas, blocos_config, campos_manuais, autor_rt_id,
 * coordenador_rt_id, data_levantamento, cidade_emissao, numero_art). O texto
 * das seções é regenerado só quando ele pede ("Reaplicar texto do modelo"),
 * para não perder edições feitas à mão. */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Check, Eye, RefreshCw, Loader2, ListChecks, Table2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { updateEmpresa, type Empresa } from '@/services/empresas'
import {
  carregarModelo,
  carregarDadosDocumento,
  escolhasAutomaticas,
  resolverEscolhas,
  listarAlternativas,
  listarCondicoes,
  montarSecoesHtml,
  renderizarDocumento,
  camposDoModelo,
  camposManuaisDoModelo,
  DICIONARIO,
  type DadosDocumento,
  type DocumentoRenderizado,
  type ElRender,
  type Escolhas,
} from '@/lib/modelosSst'
import type { ResponsavelTecnico } from '@/services/responsaveisTecnicos'
import type { DocumentoSst, SecaoDocumento } from '@/services/documentosSst'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Props {
  empresaId: string
  documento: Partial<DocumentoSst>
  travado: boolean
  rts: ResponsavelTecnico[]
  onChange: (patch: Partial<DocumentoSst>) => void
  /** Chamado quando o técnico pede para regenerar as seções a partir do modelo. */
  onReaplicarTexto: (secoes: SecaoDocumento[]) => void
  /** Conteúdo extra mostrado dentro de "Personalizar texto" (editor de capítulos). */
  avancado?: ReactNode
}

const SEM_COORDENADOR = '__nenhum__'

/** Coluna da empresa que alimenta cada campo de texto do modelo. Com isso a
 *  pendência é preenchida ali mesmo, sem ir até o cadastro da empresa. */
const COLUNA_EMPRESA: Record<string, string> = {
  RAZAO_SOCIAL: 'razao_social',
  CNPJ: 'cnpj',
  ENDERECO_COMPLETO: 'endereco',
  TELEFONE: 'contato_telefone',
  CNAE_PRINCIPAL: 'cnae',
  DESCRICAO_CNAE: 'cnae_descricao',
  DESCRICAO_PROCESSO_PRODUTIVO: 'descricao_processo_produtivo',
  JORNADA_TRABALHO: 'jornada_trabalho',
  HORARIO_TRABALHO: 'horario_trabalho',
  TURNOS_TRABALHO: 'turnos_trabalho',
  NOME_REPRESENTANTE_EMPRESA: 'representante_legal_nome',
  CARGO_REPRESENTANTE_EMPRESA: 'representante_legal_cargo',
  CONVENCAO_COLETIVA_CLAUSULA: 'convencao_coletiva_clausula',
  AREA_CONSTRUIDA_PAVIMENTOS: 'area_construida_pavimentos',
  CANAL_COMUNICACAO: 'canal_comunicacao',
  NOME_RESPONSAVEL_PLANO: 'responsavel_plano_nome',
  CARGO_RESPONSAVEL_PLANO: 'responsavel_plano_cargo',
  PERIODICIDADE_ACOMPANHAMENTO: 'periodicidade_acompanhamento',
  FORMA_ACESSO_DOCUMENTO: 'forma_acesso_documento',
  LOCAL_GUARDA: 'local_guarda',
  AVCB_OU_CLCB: 'avcb_clcb',
}

/** Onde preencher o que não dá para preencher na própria pendência. */
const ONDE_PREENCHER: Record<string, string> = {
  setores: 'aba Ambiente',
  funcoes: 'aba Função',
  ghes: 'aba GHE',
  avaliacoes: 'riscos da função ou do GHE',
  epis: 'Catálogo de EPIs',
  acoes_plano: 'aba Plano de ação',
  planejamento: 'aba Planejamento',
  empresa: 'ficha da empresa',
  organizacao: 'Configurações',
}

interface LinhaPendencia {
  descricao: string
  origem: string
  critico: boolean
  locais: string[]
}

/** Qual campo do painel "Dados do documento" responde por uma pendência (a partir da chave dela). */
function campoDoPainel(campo: string): string | null {
  if (/COORDENADOR/.test(campo)) return 'doc-coordenador'
  if (/AUTOR/.test(campo)) return 'doc-autor'
  if (/LEVANTAMENTO/.test(campo)) return 'doc-data'
  if (/(^|_)ART($|_)/.test(campo)) return 'doc-art'
  if (/CIDADE/.test(campo) && /EMISS/.test(campo)) return 'doc-cidade'
  return null
}

/** Bloco recolhível do painel (fora do componente principal para os inputs
 *  dentro dele não perderem o foco a cada render). */
function SecaoPainel({
  aberto,
  onToggle,
  titulo,
  icone,
  resumo,
  children,
}: {
  aberto: boolean
  onToggle: () => void
  titulo: string
  icone?: ReactNode
  resumo?: ReactNode
  children: ReactNode
}) {
  return (
    <Collapsible open={aberto} onOpenChange={onToggle} className="rounded-lg border">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 p-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            {icone}
            {titulo}
          </span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">{resumo}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t p-3">{children}</CollapsibleContent>
    </Collapsible>
  )
}

const escaparHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** HTML simples da pré-visualização (a mesma árvore que vai para o PDF). */
export function renderizadoParaHtml(r: DocumentoRenderizado): string {
  const el = (e: ElRender): string => {
    switch (e.tipo) {
      case 'titulo':
        return `<h${e.nivel + 1}>${escaparHtml(e.texto)}</h${e.nivel + 1}>`
      case 'paragrafo':
        return `<p>${e.runs
          .map((run) => {
            let t = escaparHtml(run.texto).replace(/\n/g, '<br/>')
            if (run.negrito) t = `<strong>${t}</strong>`
            if (run.italico) t = `<em>${t}</em>`
            return t
          })
          .join('')}</p>`
      case 'lista':
        return `<ul>${e.itens
          .map((it) => `<li>${it.map((run) => escaparHtml(run.texto)).join('')}</li>`)
          .join('')}</ul>`
      case 'tabela': {
        if (e.excluido) return ''
        const titulo = e.titulo
          ? `<p class="font-semibold text-primary">${escaparHtml(e.titulo)}</p>`
          : ''
        if (e.linhas.length === 0) {
          const aviso = e.manual
            ? 'Bloco a ser preenchido pelo responsável técnico — sem origem automática no sistema nesta versão.'
            : 'Não há registros para este bloco neste levantamento.'
          return `${titulo}<p><em>${aviso}</em></p>${
            e.observacao ? `<p><em>Observação: ${escaparHtml(e.observacao)}</em></p>` : ''
          }`
        }
        const cab = e.cabecalho.length
          ? `<thead><tr>${e.cabecalho.map((c) => `<th>${escaparHtml(c)}</th>`).join('')}</tr></thead>`
          : ''
        const corpo = e.linhas
          .map((l) => `<tr>${l.map((c) => `<td>${escaparHtml(c)}</td>`).join('')}</tr>`)
          .join('')
        return `${titulo}<table>${cab}<tbody>${corpo}</tbody></table>${
          e.observacao ? `<p><em>Observação: ${escaparHtml(e.observacao)}</em></p>` : ''
        }`
      }
    }
  }
  const capa = `<section class="capa"><h1>${escaparHtml(r.modelo.titulo)}</h1>${r.capa
    .filter((e) => e.tipo !== 'titulo')
    .map(el)
    .join('')}</section>`
  const secoes = r.secoes
    .map(
      (s) => `<section><h2>${escaparHtml(s.titulo)}</h2>${s.elementos.map(el).join('')}</section>`,
    )
    .join('')
  return capa + secoes
}

export function PainelModeloSst({
  empresaId,
  documento,
  travado,
  rts,
  onChange,
  onReaplicarTexto,
  avancado,
}: Props) {
  const tipo = documento.tipo || 'pgr'
  const modelo = useMemo(() => carregarModelo(tipo), [tipo])
  const [dadosBase, setDadosBase] = useState<DadosDocumento | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const [abertos, setAbertos] = useState<Record<string, boolean>>({
    dados: true,
    pendencias: true,
  })
  // Alternativas vigentes quando o texto das seções foi gerado pela última vez.
  const [alternativasAplicadas, setAlternativasAplicadas] = useState<string>(
    JSON.stringify(documento.alternativas || {}),
  )

  const planosChave = JSON.stringify(documento.planos_acao_ids || [])
  useEffect(() => {
    let cancelado = false
    setCarregando(true)
    carregarDadosDocumento(empresaId, documento, tipo)
      .then((d) => {
        if (!cancelado) {
          setDadosBase(d)
          setErro(null)
        }
      })
      .catch((e) => {
        if (!cancelado) setErro(getErrorMessage(e))
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, tipo, documento.id, planosChave])

  useEffect(() => {
    setAlternativasAplicadas(JSON.stringify(documento.alternativas || {}))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documento.id])

  // Dados "ao vivo": o que o técnico muda no painel entra sem ir ao servidor.
  const dados = useMemo<DadosDocumento | null>(() => {
    if (!dadosBase) return null
    return {
      ...dadosBase,
      documento,
      autor: rts.find((r) => r.id === documento.autor_rt_id) || null,
      coordenador: rts.find((r) => r.id === documento.coordenador_rt_id) || null,
    }
  }, [dadosBase, documento, rts])

  const automaticas = useMemo(
    () => (dados ? escolhasAutomaticas(modelo, dados) : {}),
    [modelo, dados],
  )
  const escolhas = useMemo<Escolhas>(
    () => (dados ? resolverEscolhas(modelo, dados, documento.alternativas) : {}),
    [modelo, dados, documento.alternativas],
  )
  const alternativas = useMemo(
    () => listarAlternativas(modelo, escolhas, automaticas),
    [modelo, escolhas, automaticas],
  )
  const condicoes = useMemo(
    () => listarCondicoes(modelo, escolhas, automaticas),
    [modelo, escolhas, automaticas],
  )
  const renderizado = useMemo<DocumentoRenderizado | null>(() => {
    if (!dados) return null
    try {
      return renderizarDocumento(modelo, documento.secoes || [], dados, escolhas)
    } catch (e) {
      console.error(e)
      return null
    }
  }, [modelo, documento.secoes, dados, escolhas])

  const camposManuais = useMemo(() => camposManuaisDoModelo(camposDoModelo(modelo)), [modelo])

  // Pendências, uma linha por campo (o mesmo campo pode faltar em vários
  // capítulos). A linha continua na tela depois de preenchida, marcada como
  // resolvida, para não sumir enquanto a pessoa digita.
  const [linhasPendencia, setLinhasPendencia] = useState<Record<string, LinhaPendencia>>({})
  useEffect(() => {
    setLinhasPendencia({})
  }, [documento.id])
  useEffect(() => {
    if (!renderizado) return
    setLinhasPendencia((atual) => {
      let mudou = false
      const novo = { ...atual }
      for (const p of renderizado.pendencias) {
        if (p.campo.startsWith('BLOCO_')) continue
        const linha = novo[p.campo]
        if (!linha) {
          novo[p.campo] = {
            descricao: p.descricao,
            origem: p.origem,
            critico: p.critico,
            locais: [p.local],
          }
          mudou = true
        } else if (!linha.locais.includes(p.local)) {
          novo[p.campo] = { ...linha, locais: [...linha.locais, p.local] }
          mudou = true
        }
      }
      return mudou ? novo : atual
    })
  }, [renderizado])
  const camposPendentes = new Set((renderizado?.pendencias || []).map((p) => p.campo))
  const linhasOrdenadas = Object.entries(linhasPendencia).sort(
    ([, a], [, b]) => Number(b.critico) - Number(a.critico),
  )
  const totalCriticas = linhasOrdenadas.filter(
    ([c, l]) => l.critico && camposPendentes.has(c),
  ).length
  const totalEmBranco = linhasOrdenadas.filter(
    ([c, l]) => !l.critico && camposPendentes.has(c),
  ).length

  // O que a pessoa digitou nas pendências que vêm do cadastro da empresa;
  // grava na empresa ao sair do campo.
  const [empresaEdit, setEmpresaEdit] = useState<Record<string, string>>({})
  const valorEmpresa = (col: string) =>
    ((dadosBase?.empresa as unknown as Record<string, unknown> | undefined)?.[col] as string) || ''
  const salvarCampoEmpresa = async (campo: string, col: string) => {
    const valor = empresaEdit[campo]
    if (valor === undefined || !dadosBase || valor === valorEmpresa(col)) return
    try {
      await updateEmpresa(empresaId, { [col]: valor } as Partial<Empresa>)
      setDadosBase((d) => (d ? { ...d, empresa: { ...d.empresa, [col]: valor } } : d))
    } catch (e) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(e) })
    }
  }

  /** Campo de preenchimento da pendência, ou null quando ela é resolvida em outra tela. */
  const entradaDaPendencia = (campo: string): ReactNode => {
    if (campo === 'DATA_LEVANTAMENTO' || campo === 'PERIODO_INICIO')
      return (
        <Input
          type="date"
          disabled={travado}
          value={(documento.data_levantamento || '').slice(0, 10)}
          onChange={(e) => onChange({ data_levantamento: e.target.value })}
        />
      )
    if (campo === 'CIDADE')
      return (
        <Input
          disabled={travado}
          placeholder="Cidade/UF"
          value={documento.cidade_emissao || ''}
          onChange={(e) => onChange({ cidade_emissao: e.target.value })}
        />
      )
    if (campo === 'NUMERO_ART')
      return (
        <Input
          disabled={travado}
          value={documento.numero_art || ''}
          onChange={(e) => onChange({ numero_art: e.target.value })}
        />
      )
    if (campo === 'NOME_AUTOR' || campo === 'REGISTRO_AUTOR' || campo === 'CONSELHO_ART')
      return rts.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Cadastre o responsável técnico em Configurações.
        </p>
      ) : (
        <Select
          value={documento.autor_rt_id || ''}
          onValueChange={(v) => onChange({ autor_rt_id: v })}
          disabled={travado}
        >
          <SelectTrigger>
            <SelectValue placeholder="Escolha o autor" />
          </SelectTrigger>
          <SelectContent>
            {rts.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.nome}, {r.tipo_registro} {r.numero_registro}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    const col = COLUNA_EMPRESA[campo]
    if (col)
      return (
        <Input
          disabled={travado}
          value={empresaEdit[campo] ?? valorEmpresa(col)}
          onChange={(e) => setEmpresaEdit((v) => ({ ...v, [campo]: e.target.value }))}
          onBlur={() => salvarCampoEmpresa(campo, col)}
        />
      )
    if (DICIONARIO[campo]?.origem === 'manual')
      return (
        <Input
          disabled={travado}
          value={(documento.campos_manuais || {})[campo] || ''}
          onChange={(e) =>
            onChange({
              campos_manuais: { ...(documento.campos_manuais || {}), [campo]: e.target.value },
            })
          }
        />
      )
    return null
  }

  const blocos = useMemo(() => {
    const lista: { id: string; titulo: string; linhas: number; manual: boolean; secao: string }[] =
      []
    for (const s of renderizado?.secoes || []) {
      for (const e of s.elementos) {
        if (e.tipo === 'tabela' && e.blocoId) {
          lista.push({
            id: e.blocoId,
            titulo: e.titulo || e.blocoId,
            linhas: e.linhas.length,
            manual: !!e.manual,
            secao: s.titulo,
          })
        }
      }
    }
    return lista
  }, [renderizado])

  const alternativasMudaram = alternativasAplicadas !== JSON.stringify(documento.alternativas || {})

  const escolher = (id: string, valor: string) => {
    onChange({ alternativas: { ...(documento.alternativas || {}), [id]: valor } })
  }

  const reaplicar = () => {
    const { secoes, notas } = montarSecoesHtml(modelo, escolhas)
    onReaplicarTexto(secoes)
    setAlternativasAplicadas(JSON.stringify(documento.alternativas || {}))
    toast.success('Texto das seções regenerado a partir do modelo', {
      description: notas.length ? `${notas.length} nota(s) do modelo para conferir.` : undefined,
    })
  }

  const alternar = (chave: string) => setAbertos((v) => ({ ...v, [chave]: !v[chave] }))

  // A prévia manda para cá o campo da pendência clicada: abre a seção, rola e destaca.
  useEffect(() => {
    const ir = (ev: Event) => {
      const campo = (ev as CustomEvent<{ campo: string }>).detail?.campo
      if (!campo) return
      const alvoDoc = campoDoPainel(campo)
      const manual = camposManuais.includes(campo)
      setAbertos((v) => ({
        ...v,
        dados: alvoDoc ? true : v.dados,
        pendencias: !alvoDoc ? true : v.pendencias,
      }))
      setTimeout(() => {
        const el =
          document.querySelector<HTMLElement>(`[data-campo="${alvoDoc || campo}"]`) ||
          document.querySelector<HTMLElement>('[data-campo="__pendencias__"]')
        if (!el) return
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('ring-2', 'ring-primary', 'rounded-md')
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'rounded-md'), 2500)
        const campoNaLinha = el.querySelector<HTMLElement>('input, textarea, button')
        if (alvoDoc || manual || campoNaLinha) campoNaLinha?.focus({ preventScroll: true })
        else
          toast.info(
            'Este dado vem do cadastro da empresa. Preencha na aba de origem e gere a prévia de novo.',
          )
      }, 150)
    }
    window.addEventListener('labora:ir-para-campo', ir)
    return () => window.removeEventListener('labora:ir-para-campo', ir)
  }, [camposManuais])

  if (erro) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
        Não foi possível carregar os dados da empresa para este modelo: {erro}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3">
        <div className="text-sm">
          <span className="font-semibold">Modelo Geral Labora</span>{' '}
          <span className="text-muted-foreground">
            · {modelo.sigla} · texto de {modelo.versaoTexto}
            {documento.modelo_versao && documento.modelo_versao !== modelo.versaoTexto
              ? ` (documento criado com o texto de ${documento.modelo_versao})`
              : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {carregando && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPreview(true)}
            disabled={!renderizado}
          >
            <Eye className="mr-2 h-4 w-4" />
            Pré-visualizar
          </Button>
        </div>
      </div>

      <SecaoPainel
        aberto={!!abertos['dados']}
        onToggle={() => alternar('dados')}
        titulo="Dados do documento"
        resumo={<>autor, coordenador, datas e ART</>}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div data-campo="doc-autor">
            <Label>Autor (responsável técnico)</Label>
            <Select
              value={documento.autor_rt_id || ''}
              onValueChange={(v) => onChange({ autor_rt_id: v })}
              disabled={travado}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Escolha o autor" />
              </SelectTrigger>
              <SelectContent>
                {rts.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.nome}, {r.tipo_registro} {r.numero_registro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div data-campo="doc-coordenador">
            <Label>Coordenador (opcional)</Label>
            <Select
              value={documento.coordenador_rt_id || SEM_COORDENADOR}
              onValueChange={(v) => onChange({ coordenador_rt_id: v === SEM_COORDENADOR ? '' : v })}
              disabled={travado}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Sem coordenador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_COORDENADOR}>Não se aplica</SelectItem>
                {rts.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.nome}, {r.tipo_registro} {r.numero_registro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div data-campo="doc-data">
            <Label>Data do levantamento em campo</Label>
            <Input
              type="date"
              className="mt-1.5"
              disabled={travado}
              value={(documento.data_levantamento || '').slice(0, 10)}
              onChange={(e) => onChange({ data_levantamento: e.target.value })}
            />
          </div>
          <div data-campo="doc-cidade">
            <Label>Cidade de emissão</Label>
            <Input
              className="mt-1.5"
              disabled={travado}
              value={documento.cidade_emissao || ''}
              onChange={(e) => onChange({ cidade_emissao: e.target.value })}
              placeholder="Cidade/UF que sai na assinatura"
            />
          </div>
          <div data-campo="doc-art">
            <Label>Número da ART (quando houver)</Label>
            <Input
              className="mt-1.5"
              disabled={travado}
              value={documento.numero_art || ''}
              onChange={(e) => onChange({ numero_art: e.target.value })}
            />
          </div>
        </div>
      </SecaoPainel>

      <SecaoPainel
        aberto={!!abertos['pendencias']}
        onToggle={() => alternar('pendencias')}
        titulo="Pendências"
        icone={<ListChecks className="h-4 w-4 text-muted-foreground" />}
        resumo={
          <>
            {totalCriticas > 0 && (
              <Badge variant="destructive">
                {totalCriticas} obrigatória{totalCriticas === 1 ? '' : 's'}
              </Badge>
            )}
            {totalEmBranco > 0 && (
              <Badge variant="secondary">
                {totalEmBranco} opciona{totalEmBranco === 1 ? 'l' : 'is'}
              </Badge>
            )}
            {renderizado && totalCriticas + totalEmBranco === 0 && (
              <Badge variant="default">sem pendências</Badge>
            )}
          </>
        }
      >
        <p data-campo="__pendencias__" className="mb-3 text-xs text-muted-foreground">
          Preencha aqui mesmo. As obrigatórias bloqueiam a emissão; as opcionais, se ficarem em
          branco, saem em branco no documento.
        </p>
        <div className="divide-y">
          {linhasOrdenadas.map(([campo, linha]) => {
            const resolvida = !camposPendentes.has(campo)
            const entrada = entradaDaPendencia(campo)
            return (
              <div
                key={campo}
                data-campo={campo}
                className="grid grid-cols-1 gap-1.5 py-2.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-4"
              >
                <div className="min-w-0 text-sm">
                  <span className="flex items-center gap-1.5">
                    {resolvida && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    <span className={resolvida ? 'text-muted-foreground' : ''}>
                      {linha.descricao}
                    </span>
                    {linha.critico && !resolvida && (
                      <span className="text-xs font-medium text-destructive">obrigatória</span>
                    )}
                  </span>
                  <span
                    className="block truncate text-xs text-muted-foreground"
                    title={linha.locais.join('; ')}
                  >
                    Usada em: {linha.locais.join('; ')}
                  </span>
                </div>
                {entrada || (
                  <p className="text-xs text-muted-foreground">
                    Preencha em: {ONDE_PREENCHER[linha.origem] || linha.origem}
                  </p>
                )}
              </div>
            )
          })}
          {linhasOrdenadas.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">Nada falta neste documento.</p>
          )}
        </div>
      </SecaoPainel>

      <SecaoPainel
        aberto={!!abertos['personalizar']}
        onToggle={() => alternar('personalizar')}
        titulo="Personalizar texto"
        resumo={<>opções de texto, tabelas e capítulos</>}
      >
        <div className="space-y-3">
          {!travado && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                O documento já sai pronto com o texto do modelo. Mexa aqui só se precisar ajustar.
              </p>
              <Button
                size="sm"
                variant={alternativasMudaram ? 'default' : 'outline'}
                onClick={reaplicar}
                disabled={!dados}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reaplicar texto do modelo
              </Button>
            </div>
          )}
          {alternativasMudaram && !travado && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Você mudou opções de texto. Os capítulos só mudam quando você clicar em "Reaplicar
              texto do modelo". Isso substitui o texto atual, e o que foi editado à mão nos
              capítulos se perde.
            </p>
          )}
          <SecaoPainel
            aberto={!!abertos['alternativas']}
            onToggle={() => alternar('alternativas')}
            titulo="Opções de texto"
            resumo={<>{alternativas.length + condicoes.length} opção(ões)</>}
          >
            <p className="mb-3 text-xs text-muted-foreground">
              As opções marcadas como "automática" foram escolhidas pelos dados da empresa. Você
              pode trocar.
            </p>
            <div className="space-y-3">
              {alternativas.map((a) => (
                <div
                  key={a.id}
                  className="grid grid-cols-1 gap-1 md:grid-cols-[220px_minmax(0,1fr)] md:items-center"
                >
                  <Label className="text-xs">
                    {a.secao}
                    {a.automatica && (
                      <Badge variant="outline" className="ml-1 text-[10px]">
                        automática
                      </Badge>
                    )}
                  </Label>
                  <Select
                    value={a.escolhida}
                    onValueChange={(v) => escolher(a.id, v)}
                    disabled={travado}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {a.opcoes.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {condicoes.length > 0 && <div className="border-t pt-3" />}
              {condicoes.map((c) => (
                <label key={c.id} className="flex items-start gap-3 text-sm">
                  <Switch
                    checked={c.ativa}
                    disabled={travado}
                    onCheckedChange={(v) => escolher(c.id, v ? 'sim' : 'nao')}
                  />
                  <span>
                    <span className="text-xs text-muted-foreground">{c.secao} · </span>
                    {c.condicao}
                    {c.automatica && (
                      <Badge variant="outline" className="ml-1 text-[10px]">
                        automática
                      </Badge>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </SecaoPainel>

          <SecaoPainel
            aberto={!!abertos['blocos']}
            onToggle={() => alternar('blocos')}
            titulo="Tabelas do documento"
            icone={<Table2 className="h-4 w-4 text-muted-foreground" />}
            resumo={<>{blocos.length} tabela(s)</>}
          >
            <div className="space-y-2">
              {blocos.map((b) => {
                const cfg = (documento.blocos_config || {})[b.id] || {}
                const incluir = cfg.incluir !== false
                return (
                  <div key={b.id} className="rounded border p-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Switch
                        checked={incluir}
                        disabled={travado}
                        onCheckedChange={(v) =>
                          onChange({
                            blocos_config: {
                              ...(documento.blocos_config || {}),
                              [b.id]: { ...cfg, incluir: v },
                            },
                          })
                        }
                      />
                      <span className="font-medium">{b.titulo}</span>
                      <span className="text-xs text-muted-foreground">{b.secao}</span>
                      <Badge
                        variant={b.linhas > 0 ? 'secondary' : 'outline'}
                        className="ml-auto text-[10px]"
                      >
                        {b.manual ? 'manual (em branco)' : `${b.linhas} linha(s)`}
                      </Badge>
                    </div>
                    {incluir && (
                      <Input
                        className="mt-2 text-xs"
                        placeholder="Observação que sai abaixo da tabela (opcional)"
                        disabled={travado}
                        value={cfg.observacao || ''}
                        onChange={(e) =>
                          onChange({
                            blocos_config: {
                              ...(documento.blocos_config || {}),
                              [b.id]: { ...cfg, observacao: e.target.value },
                            },
                          })
                        }
                      />
                    )}
                  </div>
                )
              })}
              {blocos.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhuma tabela encontrada nos capítulos atuais. Se os marcadores foram apagados na
                  edição, use "Reaplicar texto do modelo".
                </p>
              )}
            </div>
          </SecaoPainel>
          {avancado}
        </div>
      </SecaoPainel>

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pré-visualização — {modelo.titulo}</DialogTitle>
          </DialogHeader>
          {renderizado ? (
            <div
              className="prose prose-sm max-w-none [&_table]:w-full [&_table]:text-xs [&_td]:border [&_td]:p-1 [&_th]:border [&_th]:bg-muted [&_th]:p-1"
              dangerouslySetInnerHTML={{ __html: renderizadoParaHtml(renderizado) }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PainelModeloSst
