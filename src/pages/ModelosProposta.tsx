/* Modelos de proposta: escolhe o desenho do PDF, a logo, as cores e quais
   seções entram no documento. Cada organização nasce com três modelos prontos
   e pode ajustar todos. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, ImageOff, Star, Upload } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
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
  type ChaveSecao,
  type ModeloProposta,
} from '@/services/modelosProposta'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

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
  const [modelos, setModelos] = useState<ModeloProposta[]>([])
  const [selecionadoId, setSelecionadoId] = useState<string>('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [nome, setNome] = useState('')
  const [corPrimaria, setCorPrimaria] = useState(COR_PRIMARIA_PADRAO)
  const [corSecundaria, setCorSecundaria] = useState(COR_SECUNDARIA_PADRAO)
  const [apresentacao, setApresentacao] = useState('')
  const [encerramento, setEncerramento] = useState('')
  const [secoes, setSecoes] = useState<Record<string, boolean>>({})

  const selecionado = modelos.find((m) => m.id === selecionadoId) || null

  const carregar = async () => {
    try {
      const lista = await getModelosProposta()
      setModelos(lista)
      if (lista.length && !selecionadoId) setSelecionadoId(lista[0].id)
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

  // Carrega o modelo selecionado no formulário.
  useEffect(() => {
    if (!selecionado) return
    setNome(selecionado.nome)
    setCorPrimaria(selecionado.cor_primaria || COR_PRIMARIA_PADRAO)
    setCorSecundaria(selecionado.cor_secundaria || COR_SECUNDARIA_PADRAO)
    setApresentacao(selecionado.texto_apresentacao || '')
    setEncerramento(selecionado.texto_encerramento || '')
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
        secoes,
      })
      toast.success('Modelo salvo')
      await carregar()
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  const enviarArquivo = async (campo: 'logo' | 'imagem_capa', arquivo: File | null) => {
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
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Modelos de proposta</h1>
        <p className="text-sm text-muted-foreground">
          Escolha o desenho do PDF, ajuste as cores e a logo, e marque quais seções entram no
          documento. O modelo marcado como padrão é o sugerido em cada orçamento novo.
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
            <p className="text-sm text-muted-foreground">{LAYOUT_DESCRICAO[selecionado.layout]}</p>

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
                          <img src={url} alt={rotulo} className="h-full w-full object-contain" />
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
                Desmarque o que não deve sair no PDF. Uma seção sem conteúdo no orçamento é pulada
                mesmo quando está marcada aqui.
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
    </div>
  )
}
