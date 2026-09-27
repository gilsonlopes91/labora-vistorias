/* Editor de documentos por seções (P6): lista as versões do PGR de uma
 * empresa e permite editar um rascunho seção a seção antes de emitir. A
 * emissão em PDF com trava de versão é feita em DocumentosSstTab através do
 * botão "Emitir PDF" (gerarPdfPgr.ts). Documento emitido não pode mais ser
 * editado — só uma nova revisão. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FileText, Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  getDocumentosSst,
  createDocumentoSst,
  updateDocumentoSst,
  revisarDocumentoSst,
  secoesPadraoPgr,
  type DocumentoSst,
  type SecaoDocumento,
} from '@/services/documentosSst'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from '@/components/RichTextEditor'
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

export function DocumentosSstTab({ empresaId }: { empresaId: string }) {
  const { user } = useAuth()
  const organizacaoId = (user?.organizacao_id as string) || ''

  const [documentos, setDocumentos] = useState<DocumentoSst[]>([])
  const [carregando, setCarregando] = useState(true)
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [f, setF] = useState<Partial<DocumentoSst>>({})
  const [salvando, setSalvando] = useState(false)
  const [dialogRevisao, setDialogRevisao] = useState(false)
  const [motivoRevisao, setMotivoRevisao] = useState('')

  const carregar = () => {
    setCarregando(true)
    getDocumentosSst(empresaId, 'pgr')
      .then((lista) => {
        setDocumentos(lista)
        if (lista.length > 0 && !lista.some((d) => d.id === selecionadoId)) {
          setSelecionadoId(lista[0].id)
        }
      })
      .catch((error) =>
        toast.error('Não foi possível carregar os documentos', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [empresaId])

  useEffect(() => {
    const doc = documentos.find((d) => d.id === selecionadoId)
    setF(doc || {})
  }, [selecionadoId, documentos])

  const selecionado = documentos.find((d) => d.id === selecionadoId)
  const travado = selecionado?.status === 'emitido' || selecionado?.status === 'substituido'

  const novoDocumento = async () => {
    try {
      const criado = await createDocumentoSst({
        organizacao_id: organizacaoId,
        empresa_id: empresaId,
        tipo: 'pgr',
        titulo: 'PGR',
        status: 'rascunho',
        secoes: secoesPadraoPgr(),
      })
      toast.success('Rascunho de PGR criado')
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="space-y-3">
        <Button onClick={novoDocumento} className="w-full" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Novo PGR
        </Button>
        {carregando ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : documentos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum PGR criado ainda para esta empresa.
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
              Crie um novo PGR ou escolha um existente na lista ao lado.
            </p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {f.titulo}
                <Badge variant={STATUS_VARIANTE[selecionado.status]}>
                  {STATUS_LABEL[selecionado.status]}
                </Badge>
              </CardTitle>
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

              <div className="flex justify-end gap-2">
                {selecionado.status === 'emitido' && (
                  <Button variant="outline" onClick={() => setDialogRevisao(true)}>
                    Nova revisão
                  </Button>
                )}
                {!travado && (
                  <Button onClick={salvar} disabled={salvando}>
                    Salvar rascunho
                  </Button>
                )}
              </div>
              {!travado && (
                <p className="text-xs text-muted-foreground">
                  A emissão do PDF com trava de versão ainda está em desenvolvimento — por enquanto,
                  salve o rascunho normalmente.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogRevisao} onOpenChange={setDialogRevisao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova revisão do PGR</DialogTitle>
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
    </div>
  )
}

export default DocumentosSstTab
