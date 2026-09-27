/* Editor de documentos por seções: lista as versões de cada tipo de
 * documento (PGR, LTCAT, Laudo de Insalubridade, Laudo de Periculosidade)
 * de uma empresa e permite editar um rascunho seção a seção antes de
 * emitir. Um novo documento já nasce com o conteúdo básico (fundamentação
 * legal e metodologia) preenchido — só as partes que dependem dos dados da
 * empresa ficam com um texto-guia entre colchetes. O rascunho é salvo
 * automaticamente enquanto a pessoa edita, sem precisar clicar em nada; o
 * botão "Salvar rascunho" continua existindo para quem quiser confirmar na
 * hora. A emissão em PDF (gerarPdfPgr.ts) trava a versão — documento
 * emitido não pode mais ser editado, só uma nova revisão. */
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { FileText, Plus, ChevronUp, ChevronDown, Trash2, Check, Loader2 } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { carregarIdentidade } from '@/lib/identidadeVisual'
import { resolverCelula } from '@/lib/matrizRisco'
import { gerarPdfPgr, nomeArquivoDocumentoSst, hashSha256 } from '@/lib/gerarPdfPgr'
import { getEmpresa } from '@/services/empresas'
import { getGhes } from '@/services/ghes'
import { getAvaliacoesRiscoPorGhes } from '@/services/avaliacoesRisco'
import { getAcoesPlano } from '@/services/acoesPlano'
import { getMatrizOficial } from '@/services/matrizesRisco'
import { buscarResponsavelDoUsuario, formatarRegistroRT } from '@/services/responsaveisTecnicos'
import {
  getDocumentosSst,
  createDocumentoSst,
  updateDocumentoSst,
  revisarDocumentoSst,
  emitirDocumentoSst,
  getTokenArquivos,
  pdfUrlDocumentoSst,
  secoesPadrao,
  TIPO_DOCUMENTO_LABEL,
  TIPO_DOCUMENTO_TITULO_PADRAO,
  type DocumentoSst,
  type SecaoDocumento,
  type TipoDocumentoSst,
} from '@/services/documentosSst'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from '@/components/RichTextEditor'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const STATUS_LABEL: Record<DocumentoSst['status'], string> = {
  rascunho: 'Rascunho',
  em_revisao: 'Em revisão',
  emitido: 'Emitido',
  substituido: 'Substituído',
}

const STATUS_VARIANTE: Record<DocumentoSst['status'], 'secondary' | 'default' | 'outline'> = {
  rascunho: 'secondary',
  em_revisao: 'secondary',
  emitido: 'default',
  substituido: 'outline',
}

const TIPOS: TipoDocumentoSst[] = ['pgr', 'ltcat', 'insalubridade', 'periculosidade']

/** Tempo de inatividade antes de salvar automaticamente o rascunho. */
const AUTOSAVE_DEBOUNCE_MS = 1500

export function DocumentosSstTab({ empresaId }: { empresaId: string }) {
  const { user } = useAuth()
  const organizacaoId = (user?.organizacao_id as string) || ''

  const [tipo, setTipo] = useState<TipoDocumentoSst>('pgr')
  const [documentos, setDocumentos] = useState<DocumentoSst[]>([])
  const [carregando, setCarregando] = useState(true)
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [f, setF] = useState<Partial<DocumentoSst>>({})
  const [salvando, setSalvando] = useState(false)
  const [autosalvando, setAutosalvando] = useState(false)
  const [ultimoAutosalvamento, setUltimoAutosalvamento] = useState<Date | null>(null)
  const [dialogRevisao, setDialogRevisao] = useState(false)
  const [motivoRevisao, setMotivoRevisao] = useState('')
  const [emitindo, setEmitindo] = useState(false)
  const [urlPdf, setUrlPdf] = useState<string | null>(null)
  // Assinatura eletrônica: confirma a identidade por senha antes de emitir.
  const [dialogSenhaAberto, setDialogSenhaAberto] = useState(false)
  const [senha, setSenha] = useState('')
  const [erroSenha, setErroSenha] = useState('')

  const carregar = () => {
    setCarregando(true)
    setSelecionadoId(null)
    getDocumentosSst(empresaId, tipo)
      .then((lista) => {
        setDocumentos(lista)
        if (lista.length > 0) setSelecionadoId(lista[0].id)
      })
      .catch((error) =>
        toast.error('Não foi possível carregar os documentos', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [empresaId, tipo])

  useEffect(() => {
    const doc = documentos.find((d) => d.id === selecionadoId)
    setF(doc || {})
  }, [selecionadoId, documentos])

  const selecionado = documentos.find((d) => d.id === selecionadoId)
  const travado = selecionado?.status === 'emitido' || selecionado?.status === 'substituido'

  // Autosave: salva sozinho pouco tempo depois da última alteração, sem
  // exigir clique no botão "Salvar rascunho". Só roda em documentos que
  // ainda podem ser editados, e não roda na carga inicial de cada seleção.
  const carregadoRef = useRef<string | null>(null)
  useEffect(() => {
    carregadoRef.current = selecionado ? selecionado.id : null
  }, [selecionado?.id])

  useEffect(() => {
    if (!selecionado || travado) return
    if (carregadoRef.current !== selecionado.id) return
    const t = setTimeout(async () => {
      setAutosalvando(true)
      try {
        const atualizado = await updateDocumentoSst(selecionado.id, {
          titulo: f.titulo,
          elaboradores: f.elaboradores,
          secoes: f.secoes,
        })
        setDocumentos((v) => v.map((d) => (d.id === atualizado.id ? atualizado : d)))
        setUltimoAutosalvamento(new Date())
      } catch (error) {
        toast.error('Não foi possível salvar automaticamente', {
          description: getErrorMessage(error),
        })
      } finally {
        setAutosalvando(false)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, AUTOSAVE_DEBOUNCE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.titulo, f.elaboradores, f.secoes])

  useEffect(() => {
    setUrlPdf(null)
    if (selecionado?.pdf) {
      getTokenArquivos()
        .then((token) => setUrlPdf(pdfUrlDocumentoSst(selecionado, token)))
        .catch(() => setUrlPdf(pdfUrlDocumentoSst(selecionado)))
    }
  }, [selecionado?.id, selecionado?.pdf])

  // Abre o diálogo de senha; a emissão em si só roda depois de confirmada.
  const abrirDialogEmissao = () => {
    setSenha('')
    setErroSenha('')
    setDialogSenhaAberto(true)
  }

  const confirmarSenhaEEmitir = async () => {
    if (!senha.trim()) {
      setErroSenha('Informe sua senha')
      return
    }
    setEmitindo(true)
    setErroSenha('')
    try {
      // Reautentica o próprio usuário: confirma que é ele mesmo, sem trocar de conta.
      await pb.collection('users').authWithPassword(user?.email || '', senha)
    } catch (error) {
      setEmitindo(false)
      setErroSenha('Senha incorreta')
      return
    }
    setDialogSenhaAberto(false)
    await emitirPdf()
  }

  const emitirPdf = async () => {
    if (!selecionado) return
    setEmitindo(true)
    try {
      const confirmadaEm = new Date()
      const chaveVerificacao = crypto.randomUUID()
      const rtEmissor = await buscarResponsavelDoUsuario(organizacaoId, user?.id || '').catch(
        () => null,
      )
      const empresa = await getEmpresa(empresaId)
      const nomeEmpresa = empresa.nome_fantasia || empresa.razao_social
      const ghes = await getGhes(empresaId)
      const avaliacoes = await getAvaliacoesRiscoPorGhes(ghes.map((g) => g.id))
      const acoes = await getAcoesPlano(empresaId)
      const dimensao = (Number(empresa.pgr_matriz_padrao_dimensao) || 5) as 3 | 5
      const metodologia = empresa.pgr_matriz_padrao_metodologia || 'AIHA'
      const matriz = await getMatrizOficial(dimensao, metodologia)
      const identidade = await carregarIdentidade()

      const inventario = avaliacoes.map((a) => {
        const s = a.severidade_final ?? a.severidade_sugerida
        const p = a.probabilidade_final ?? a.probabilidade_sugerida
        const celula = matriz && s != null && p != null ? resolverCelula(matriz, p, s) : null
        return {
          unidade: a.expand?.ghe_id?.nome || '—',
          agente: a.expand?.agente_id?.nome || a.perigo_descricao || '—',
          trilha: a.trilha_probabilidade,
          severidade: s ?? '—',
          probabilidade: p ?? '—',
          categoria: celula?.categoria || '—',
        }
      })
      const planoAcao = acoes.map((a) => ({
        medida: a.medida,
        responsavel: a.responsavel || '—',
        prazo: a.prazo ? new Date(a.prazo).toLocaleDateString('pt-BR') : '—',
        status: a.status,
        prioridade: a.prioridade || '—',
      }))

      const proximaVersao = (selecionado.versao || 0) + 1
      const pdf = await gerarPdfPgr({
        organizacaoNome: identidade.nome,
        logoUrl: identidade.logoUrl,
        empresaNome: nomeEmpresa,
        empresaCnpj: empresa.cnpj,
        titulo: f.titulo || TIPO_DOCUMENTO_TITULO_PADRAO[selecionado.tipo],
        versao: proximaVersao,
        dataEmissao: new Date(),
        elaboradores: f.elaboradores,
        secoes: f.secoes || [],
        unidadesAvaliacao: ghes.map((g) => g.nome),
        inventario,
        planoAcao,
        assinatura: {
          nome: rtEmissor?.nome || user?.name || 'Responsável',
          registro: rtEmissor ? formatarRegistroRT(rtEmissor) : undefined,
          confirmadaEm,
          linkVerificacao: `${window.location.origin}/verificar/${chaveVerificacao}`,
        },
      })
      const blob = pdf.output('blob')
      const nomeArquivo = nomeArquivoDocumentoSst(selecionado.tipo, nomeEmpresa, proximaVersao)
      const hash = await hashSha256(blob)

      const emitido = await emitirDocumentoSst(
        selecionado,
        {
          matriz_id: matriz?.id,
          matriz_snapshot: matriz
            ? {
                nome: matriz.nome,
                metodologia: matriz.metodologia,
                dimensao: matriz.dimensao,
                categorias: matriz.categorias,
                celulas: matriz.celulas,
              }
            : undefined,
          dados_emissao: {
            unidades_avaliacao: ghes.length,
            avaliacoes_risco: avaliacoes.length,
            acoes_plano: acoes.length,
          },
          emitido_por: user?.id || '',
          assinatura_confirmada_em: confirmadaEm.toISOString(),
          link_publico_chave: chaveVerificacao,
        },
        blob,
        nomeArquivo,
        hash,
      )
      setDocumentos((v) =>
        v.map((d) => {
          if (d.id === emitido.id) return emitido
          if (selecionado.documento_anterior_id && d.id === selecionado.documento_anterior_id) {
            return { ...d, status: 'substituido' }
          }
          return d
        }),
      )
      setSelecionadoId(emitido.id)
      toast.success(`${TIPO_DOCUMENTO_LABEL[selecionado.tipo]} emitido em PDF`)
    } catch (error) {
      toast.error('Não foi possível emitir o PDF', { description: getErrorMessage(error) })
    } finally {
      setEmitindo(false)
    }
  }

  const novoDocumento = async () => {
    try {
      const criado = await createDocumentoSst({
        organizacao_id: organizacaoId,
        empresa_id: empresaId,
        tipo,
        titulo: TIPO_DOCUMENTO_TITULO_PADRAO[tipo],
        status: 'rascunho',
        secoes: secoesPadrao(tipo),
      })
      toast.success(`Rascunho de ${TIPO_DOCUMENTO_LABEL[tipo]} criado com o modelo básico`)
      setDocumentos((v) => [criado, ...v])
      setSelecionadoId(criado.id)
    } catch (error) {
      toast.error('Não foi possível criar o documento', { description: getErrorMessage(error) })
    }
  }

  const salvar = async () => {
    if (!selecionado) return
    setSalvando(true)
    try {
      const atualizado = await updateDocumentoSst(selecionado.id, {
        titulo: f.titulo,
        elaboradores: f.elaboradores,
        secoes: f.secoes,
      })
      setDocumentos((v) => v.map((d) => (d.id === atualizado.id ? atualizado : d)))
      setUltimoAutosalvamento(new Date())
      toast.success('Rascunho salvo')
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  const criarRevisao = async () => {
    if (!selecionado) return
    setSalvando(true)
    try {
      const criado = await revisarDocumentoSst(selecionado, motivoRevisao)
      toast.success('Nova revisão criada')
      setDocumentos((v) => [criado, ...v])
      setSelecionadoId(criado.id)
      setDialogRevisao(false)
      setMotivoRevisao('')
    } catch (error) {
      toast.error('Não foi possível criar a revisão', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  const secoes = (f.secoes || []).slice().sort((a, b) => a.ordem - b.ordem)

  const atualizarSecao = (id: string, patch: Partial<SecaoDocumento>) => {
    setF((v) => ({
      ...v,
      secoes: (v.secoes || []).map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }))
  }

  const moverSecao = (id: string, direcao: -1 | 1) => {
    const ordenadas = (f.secoes || []).slice().sort((a, b) => a.ordem - b.ordem)
    const i = ordenadas.findIndex((s) => s.id === id)
    const j = i + direcao
    if (i < 0 || j < 0 || j >= ordenadas.length) return
    const troca = ordenadas[i].ordem
    ordenadas[i].ordem = ordenadas[j].ordem
    ordenadas[j].ordem = troca
    setF((v) => ({ ...v, secoes: ordenadas }))
  }

  const removerSecao = (id: string) => {
    setF((v) => ({ ...v, secoes: (v.secoes || []).filter((s) => s.id !== id) }))
  }

  const adicionarSecao = () => {
    const ordenadas = f.secoes || []
    const nova: SecaoDocumento = {
      id: crypto.randomUUID(),
      titulo: 'Nova seção',
      ativo: true,
      ordem: ordenadas.length,
      texto: '',
    }
    setF((v) => ({ ...v, secoes: [...(v.secoes || []), nova] }))
  }

  return (
    <div className="space-y-4">
      <Tabs value={tipo} onValueChange={(v) => setTipo(v as TipoDocumentoSst)}>
        <TabsList className="flex-wrap h-auto">
          {TIPOS.map((t) => (
            <TabsTrigger key={t} value={t}>
              {TIPO_DOCUMENTO_LABEL[t]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-3">
          <Button onClick={novoDocumento} className="w-full" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Novo {TIPO_DOCUMENTO_LABEL[tipo]}
          </Button>
          {carregando ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : documentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum {TIPO_DOCUMENTO_LABEL[tipo]} criado ainda para esta empresa.
            </p>
          ) : (
            <div className="space-y-2">
              {documentos.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelecionadoId(d.id)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                    d.id === selecionadoId ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{d.titulo}</span>
                    <Badge variant={STATUS_VARIANTE[d.status]}>{STATUS_LABEL[d.status]}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {d.versao ? `Versão ${d.versao}` : 'Sem versão emitida'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {!selecionado ? (
            <div className="rounded-2xl border border-dashed bg-card py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Crie um novo {TIPO_DOCUMENTO_LABEL[tipo]} ou escolha um existente na lista ao lado.
                O documento já nasce com o texto normativo e a metodologia básica preenchidos — só é
                preciso completar as partes específicas desta empresa.
              </p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {f.titulo}
                    <Badge variant={STATUS_VARIANTE[selecionado.status]}>
                      {STATUS_LABEL[selecionado.status]}
                    </Badge>
                  </CardTitle>
                  {!travado && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {autosalvando ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...
                        </>
                      ) : ultimoAutosalvamento ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Salvo automaticamente às{' '}
                          {ultimoAutosalvamento.toLocaleTimeString('pt-BR')}
                        </>
                      ) : null}
                    </span>
                  )}
                </div>
                {travado && (
                  <p className="text-sm text-muted-foreground">
                    Este documento está {STATUS_LABEL[selecionado.status].toLowerCase()} e não pode
                    mais ser editado.{' '}
                    {selecionado.status === 'emitido' && 'Para mudar algo, crie uma nova revisão.'}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Título</Label>
                    <Input
                      className="mt-1.5"
                      disabled={travado}
                      value={f.titulo || ''}
                      onChange={(e) => setF((v) => ({ ...v, titulo: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Elaboradores</Label>
                    <Input
                      className="mt-1.5"
                      disabled={travado}
                      placeholder="Nome e registro profissional"
                      value={f.elaboradores || ''}
                      onChange={(e) => setF((v) => ({ ...v, elaboradores: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {secoes.map((secao, i) => (
                    <div key={secao.id} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={secao.ativo}
                          disabled={travado}
                          onCheckedChange={(v) => atualizarSecao(secao.id, { ativo: v })}
                        />
                        <Input
                          className="flex-1 font-medium"
                          disabled={travado}
                          value={secao.titulo}
                          onChange={(e) => atualizarSecao(secao.id, { titulo: e.target.value })}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={travado || i === 0}
                          onClick={() => moverSecao(secao.id, -1)}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={travado || i === secoes.length - 1}
                          onClick={() => moverSecao(secao.id, 1)}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={travado}
                          onClick={() => removerSecao(secao.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {secao.ativo && (
                        <div className="mt-3">
                          {travado ? (
                            <div
                              className="prose prose-sm max-w-none rounded border bg-muted/30 p-3"
                              dangerouslySetInnerHTML={{
                                __html: secao.texto || '<p><em>Vazio</em></p>',
                              }}
                            />
                          ) : (
                            <RichTextEditor
                              value={secao.texto}
                              onChange={(html) => atualizarSecao(secao.id, { texto: html })}
                              placeholder="Texto desta seção..."
                              minHeight="120px"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {!travado && (
                    <Button variant="outline" size="sm" onClick={adicionarSecao}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar seção
                    </Button>
                  )}
                </div>

                {selecionado.status === 'emitido' && urlPdf && (
                  <a
                    href={urlPdf}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline"
                  >
                    Baixar PDF emitido (versão {selecionado.versao})
                  </a>
                )}
                <div className="flex justify-end gap-2">
                  {selecionado.status === 'emitido' && (
                    <Button variant="outline" onClick={() => setDialogRevisao(true)}>
                      Nova revisão
                    </Button>
                  )}
                  {!travado && (
                    <>
                      <Button variant="outline" onClick={salvar} disabled={salvando || emitindo}>
                        Salvar rascunho
                      </Button>
                      <Button onClick={abrirDialogEmissao} disabled={salvando || emitindo}>
                        {emitindo ? 'Emitindo...' : 'Emitir PDF'}
                      </Button>
                    </>
                  )}
                </div>
                {!travado && (
                  <p className="text-xs text-muted-foreground">
                    O rascunho é salvo automaticamente enquanto você edita. Emitir gera o PDF a
                    partir das seções e dos dados atuais de estrutura, inventário e plano de ação, e
                    trava esta versão — se você alterar algo depois, será preciso gerar o documento
                    de novo (criando uma nova revisão) para que a mudança valha oficialmente.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={dialogRevisao} onOpenChange={setDialogRevisao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova revisão do {TIPO_DOCUMENTO_LABEL[tipo]}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Motivo da revisão</Label>
            <Textarea
              className="mt-1.5"
              placeholder="O que mudou desde a última versão emitida?"
              value={motivoRevisao}
              onChange={(e) => setMotivoRevisao(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={criarRevisao} disabled={salvando}>
              Criar revisão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogSenhaAberto} onOpenChange={setDialogSenhaAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirme sua senha para emitir</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            A emissão assina eletronicamente o documento em seu nome. Digite sua senha para
            confirmar que é você.
          </p>
          <div>
            <Label htmlFor="senha-emissao">Senha</Label>
            <Input
              id="senha-emissao"
              type="password"
              className="mt-1.5"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmarSenhaEEmitir()}
              autoFocus
            />
            {erroSenha && <p className="mt-1.5 text-xs text-destructive">{erroSenha}</p>}
          </div>
          <DialogFooter>
            <Button onClick={confirmarSenhaEEmitir} disabled={emitindo}>
              {emitindo ? 'Confirmando...' : 'Confirmar e emitir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DocumentosSstTab
