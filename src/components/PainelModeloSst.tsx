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
import { AlertTriangle, Eye, RefreshCw, Loader2, ListChecks, Table2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
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
import { Textarea } from '@/components/ui/textarea'
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
}

const SEM_COORDENADOR = '__nenhum__'

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
  const manuais = documento.campos_manuais || {}

  const pendenciasCriticas = renderizado?.pendencias.filter((p) => p.critico) || []
  const pendenciasDados =
    renderizado?.pendencias.filter(
      (p) =>
        !p.critico && DICIONARIO[p.campo]?.origem !== 'manual' && !p.campo.startsWith('BLOCO_'),
    ) || []
  const pendenciasManuais =
    renderizado?.pendencias.filter((p) => !p.critico && DICIONARIO[p.campo]?.origem === 'manual') ||
    []

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
          {!travado && (
            <Button
              size="sm"
              variant={alternativasMudaram ? 'default' : 'outline'}
              onClick={reaplicar}
              disabled={!dados}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reaplicar texto do modelo
            </Button>
          )}
        </div>
      </div>
      {alternativasMudaram && !travado && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Você mudou alternativas ou trechos condicionais. O texto das seções só muda quando você
          clicar em "Reaplicar texto do modelo" — isso substitui o texto atual das seções (edições
          feitas à mão nas seções serão perdidas).
        </p>
      )}

      <SecaoPainel
        aberto={!!abertos['dados']}
        onToggle={() => alternar('dados')}
        titulo="Dados do documento"
        resumo={<>autor, coordenador, datas e ART</>}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
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
                    {r.nome} — {r.tipo_registro} {r.numero_registro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
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
                    {r.nome} — {r.tipo_registro} {r.numero_registro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data do levantamento em campo</Label>
            <Input
              type="date"
              className="mt-1.5"
              disabled={travado}
              value={(documento.data_levantamento || '').slice(0, 10)}
              onChange={(e) => onChange({ data_levantamento: e.target.value })}
            />
          </div>
          <div>
            <Label>Cidade de emissão</Label>
            <Input
              className="mt-1.5"
              disabled={travado}
              value={documento.cidade_emissao || ''}
              onChange={(e) => onChange({ cidade_emissao: e.target.value })}
              placeholder="Cidade/UF que sai na assinatura"
            />
          </div>
          <div>
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
        aberto={!!abertos['alternativas']}
        onToggle={() => alternar('alternativas')}
        titulo="Alternativas e trechos condicionais do texto"
        resumo={
          <>
            {alternativas.length} alternativa(s) · {condicoes.length} trecho(s)
          </>
        }
      >
        <p className="mb-3 text-xs text-muted-foreground">
          O app sugere a opção pelos dados da empresa (marcadas como "automática"). Você pode
          trocar; depois clique em "Reaplicar texto do modelo".
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
        aberto={!!abertos['pendencias']}
        onToggle={() => alternar('pendencias')}
        titulo="Pendências e campos manuais"
        icone={<ListChecks className="h-4 w-4 text-muted-foreground" />}
        resumo={
          <>
            {pendenciasCriticas.length > 0 && (
              <Badge variant="destructive">{pendenciasCriticas.length} crítica(s)</Badge>
            )}
            {pendenciasManuais.length + pendenciasDados.length > 0 && (
              <Badge variant="secondary">
                {pendenciasManuais.length + pendenciasDados.length} em branco
              </Badge>
            )}
            {renderizado && renderizado.pendencias.length === 0 && (
              <Badge variant="default">sem pendências</Badge>
            )}
          </>
        }
      >
        {pendenciasCriticas.length > 0 && (
          <div className="mb-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs">
            <p className="mb-1 font-semibold text-destructive">Bloqueiam a emissão:</p>
            <ul className="list-disc pl-4">
              {pendenciasCriticas.map((p) => (
                <li key={`${p.campo}-${p.local}`}>
                  {p.descricao} <span className="text-muted-foreground">({p.local})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mb-2 text-xs text-muted-foreground">
          Campos que o sistema não tem de onde puxar. O que você preencher aqui entra no texto no
          lugar do colchete; o que ficar em branco sai em branco no documento.
        </p>
        <div className="space-y-2">
          {camposManuais.map((campo) => {
            const dic = DICIONARIO[campo]
            const longo = dic?.tipo === 'texto longo'
            return (
              <div
                key={campo}
                className="grid grid-cols-1 gap-1 md:grid-cols-[260px_minmax(0,1fr)]"
              >
                <Label className="text-xs">
                  {dic?.descricao || campo}
                  <span className="block font-mono text-[10px] text-muted-foreground">
                    [{campo}]
                  </span>
                </Label>
                {longo ? (
                  <Textarea
                    rows={2}
                    disabled={travado}
                    value={manuais[campo] || ''}
                    onChange={(e) =>
                      onChange({ campos_manuais: { ...manuais, [campo]: e.target.value } })
                    }
                  />
                ) : (
                  <Input
                    disabled={travado}
                    value={manuais[campo] || ''}
                    onChange={(e) =>
                      onChange({ campos_manuais: { ...manuais, [campo]: e.target.value } })
                    }
                  />
                )}
              </div>
            )
          })}
        </div>
        {pendenciasDados.length > 0 && (
          <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs">
            <p className="mb-1 font-semibold">
              Dados da empresa em branco (preencha na aba de origem):
            </p>
            <ul className="list-disc pl-4">
              {pendenciasDados.map((p) => (
                <li key={`${p.campo}-${p.local}`}>
                  {p.descricao}{' '}
                  <span className="text-muted-foreground">
                    — origem: {p.origem}; em: {p.local}
                    {p.vezes > 1 ? ` (${p.vezes}×)` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SecaoPainel>

      <SecaoPainel
        aberto={!!abertos['blocos']}
        onToggle={() => alternar('blocos')}
        titulo="Blocos de dados (tabelas geradas pelo app)"
        icone={<Table2 className="h-4 w-4 text-muted-foreground" />}
        resumo={<>{blocos.length} bloco(s)</>}
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
              Nenhum bloco encontrado nas seções atuais. Se você apagou os marcadores de bloco ao
              editar, use "Reaplicar texto do modelo".
            </p>
          )}
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
