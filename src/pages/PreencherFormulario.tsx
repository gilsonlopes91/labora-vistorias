/* Preenchimento de formulário em campo — renderiza os campos do modelo,
   incluindo repetíveis (adicionar instâncias), condicionais (mostrar/some),
   assinatura digital (canvas), fotos (anexos) e cálculo automático.
   Salva como rascunho ou concluído (obrigatórios validados). */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Building2, Camera, Check, PenTool, Plus, Save, Trash2, X } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import LoadingScreen from '@/components/LoadingScreen'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import { getEmpresas, type Empresa } from '@/services/empresas'
import {
  getModeloFormulario,
  type CampoFormulario,
  type ModeloFormulario,
} from '@/services/formularios'
import { createFormulario, updateFormulario, enviarAnexos } from '@/services/registrosFormulario'
import ResultadoTecnicoView, { resumoCalculosTecnicos } from '@/components/ResultadoTecnico'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

// ---------- Assinatura digital (canvas) ----------

function AssinaturaCanvas({
  valor,
  onChange,
}: {
  valor?: string // nome do arquivo de anexo já salvo
  onChange: (arquivo: File | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const desenhando = useRef(false)
  const [temTraço, setTemTraço] = useState(false)

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const inicio = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current!.getContext('2d')!
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    desenhando.current = true
    setTemTraço(true)
  }

  const movimento = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!desenhando.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    const p = pos(e)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }

  const fim = () => {
    if (!desenhando.current) return
    desenhando.current = false
    const canvas = canvasRef.current!
    canvas.toBlob((blob) => {
      if (blob) onChange(new File([blob], `assinatura-${Date.now()}.png`, { type: 'image/png' }))
    }, 'image/png')
  }

  const limpar = () => {
    const canvas = canvasRef.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setTemTraço(false)
    onChange(null)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={500}
        height={160}
        className="w-full touch-none rounded-xl border bg-white"
        onPointerDown={inicio}
        onPointerMove={movimento}
        onPointerUp={fim}
        onPointerLeave={fim}
      />
      <div className="mt-1 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Assine com o dedo ou mouse</p>
        {temTraço && (
          <Button size="sm" variant="ghost" onClick={limpar}>
            <X className="mr-1 h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>
      {valor && <p className="text-xs text-muted-foreground">Assinatura salva ({valor})</p>}
    </div>
  )
}

// ---------- Página ----------

export default function PreencherFormulario() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [modelo, setModelo] = useState<ModeloFormulario | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaId, setEmpresaId] = useState<string>('')

  // dados[campoId] = valor | dados[campoId][indice][subcampoId] = valor (repetível)
  const [dados, setDados] = useState<Record<string, unknown>>({})
  const [repetiveis, setRepetiveis] = useState<Record<string, number>>({}) // campoId → nº instâncias
  const arquivos = useRef<Record<string, File>>({}) // chave → arquivo (foto/assinatura)

  useEffect(() => {
    if (!id) return
    Promise.all([getModeloFormulario(id), getEmpresas()])
      .then(([m, es]) => {
        setModelo(m)
        setEmpresas(es)
      })
      .catch((error) =>
        toast.error('Não foi possível carregar o modelo', { description: getErrorMessage(error) }),
      )
      .finally(() => setLoading(false))
  }, [id])

  const setValor = (campoId: string, valor: unknown) =>
    setDados((prev) => ({ ...prev, [campoId]: valor }))

  const getValor = (campoId: string) => dados[campoId]

  const normalizarInstancias = (raw: unknown): Record<string, unknown>[] => {
    if (Array.isArray(raw)) return raw as Record<string, unknown>[]
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed as Record<string, unknown>[]
        if (parsed && typeof parsed === 'object') {
          return Object.values(parsed).filter(
            (v): v is Record<string, unknown> => typeof v === 'object' && v !== null,
          )
        }
      } catch {
        return []
      }
    }
    if (raw && typeof raw === 'object') {
      return Object.values(raw as Record<string, unknown>).filter(
        (v): v is Record<string, unknown> => typeof v === 'object' && v !== null,
      )
    }
    return []
  }

  const setValorRepetivel = (campoId: string, indice: number, subcampoId: string, valor: unknown) =>
    setDados((prev) => {
      const lista = [...normalizarInstancias(prev[campoId])]
      const item = { ...((lista[indice] as Record<string, unknown>) || {}) }
      item[subcampoId] = valor
      lista[indice] = item
      return { ...prev, [campoId]: lista }
    })

  // Condicional: campo visível só quando o campo de origem tiver o valor.
  const visivel = (campo: CampoFormulario) => {
    if (!campo.condicaoCampoId || !campo.condicaoValor) return true
    return String(getValor(campo.condicaoCampoId) ?? '') === campo.condicaoValor
  }

  // Cálculo automático sobre campos numéricos.
  const calcular = (campo: CampoFormulario): string => {
    const valores = (campo.camposOrigem || [])
      .map((origem) => Number(dados[origem]))
      .filter((v) => !Number.isNaN(v))
    if (valores.length === 0) return ''
    let resultado: number
    switch (campo.operacao) {
      case 'media':
        resultado = valores.reduce((a, b) => a + b, 0) / valores.length
        break
      case 'max':
        resultado = Math.max(...valores)
        break
      case 'min':
        resultado = Math.min(...valores)
        break
      default:
        resultado = valores.reduce((a, b) => a + b, 0)
    }
    const unidade = campo.unidade ? ` ${campo.unidade}` : ''
    return `${resultado.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}${unidade}`
  }

  const obrigatoriosPendentes = useMemo(() => {
    if (!modelo) return []
    const pendentes: string[] = []
    for (const campo of modelo.campos) {
      if (!campo.obrigatorio || !visivel(campo)) continue
      if (campo.tipo === 'secao') continue
      const valor = dados[campo.id]
      if (campo.tipo === 'repetivel') {
        const lista = normalizarInstancias(valor)
        if (lista.length === 0) pendentes.push(campo.nome)
        continue
      }
      if (valor === undefined || valor === null || String(valor).trim() === '') {
        pendentes.push(campo.nome)
      }
    }
    return pendentes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelo, dados])

  // ---- Seções do modelo (todas exibidas na mesma página) ----
  const secoes = useMemo(() => {
    if (!modelo) return []
    const lista: { nome: string; campos: CampoFormulario[] }[] = []
    let atual: { nome: string; campos: CampoFormulario[] } | null = null
    for (const campo of modelo.campos) {
      if (campo.tipo === 'secao') {
        atual = { nome: campo.nome, campos: [] }
        lista.push(atual)
        continue
      }
      if (!atual) {
        atual = { nome: 'Dados gerais', campos: [] }
        lista.push(atual)
      }
      atual.campos.push(campo)
    }
    if (lista.length === 0) lista.push({ nome: 'Formulário', campos: [...modelo.campos] })
    return lista
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelo])

  const salvar = async (status: 'rascunho' | 'concluido') => {
    if (!modelo) return
    if (status === 'concluido' && obrigatoriosPendentes.length > 0) {
      toast.error('Campos obrigatórios pendentes', {
        description: obrigatoriosPendentes.join(', '),
      })
      return
    }
    setSalvando(true)
    try {
      const org = await getMinhaOrganizacao()
      // anexos: nomes de arquivo referenciados nos dados
      const listaAnexos = Object.values(arquivos.current)
      const registro = await createFormulario({
        organizacao_id: org.id,
        modelo_formulario_id: modelo.id,
        empresa_id: empresaId || undefined,
        // resultado dos cálculos técnicos (calor, ruído) vai junto, em texto
        dados: resumoCalculosTecnicos(modelo.campos, dados),
        status,
        data_campo: new Date().toISOString(),
        client_uuid: crypto.randomUUID(),
      })
      if (listaAnexos.length > 0) {
        await enviarAnexos(registro.id, listaAnexos)
      }
      toast.success(status === 'concluido' ? 'Formulário concluído' : 'Rascunho salvo')
      navigate('/auditoria-formularios?aba=formularios')
    } catch (error) {
      toast.error('Não foi possível salvar o formulário', {
        description: getErrorMessage(error),
      })
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <LoadingScreen fullScreen={false} mensagem="Carregando formulário..." />
      </div>
    )
  }

  if (!modelo) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <p className="py-16 text-center text-sm text-muted-foreground">Modelo não encontrado.</p>
      </div>
    )
  }

  const renderCampo = (campo: CampoFormulario) => {
    if (!visivel(campo)) return null
    const valor = dados[campo.id]

    switch (campo.tipo) {
      case 'secao':
        return (
          <div key={campo.id} className="border-b pb-1 pt-4 first:pt-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {campo.nome}
            </p>
          </div>
        )

      case 'texto':
        return (
          <div key={campo.id} className="space-y-1.5">
            <Label>
              {campo.nome}
              {campo.obrigatorio && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              value={String(valor ?? '')}
              onChange={(e) => setValor(campo.id, e.target.value)}
            />
          </div>
        )

      case 'texto_longo':
        return (
          <div key={campo.id} className="space-y-1.5">
            <Label>
              {campo.nome}
              {campo.obrigatorio && <span className="text-destructive"> *</span>}
            </Label>
            <Textarea
              rows={3}
              value={String(valor ?? '')}
              onChange={(e) => setValor(campo.id, e.target.value)}
            />
          </div>
        )

      case 'numero':
        return (
          <div key={campo.id} className="space-y-1.5">
            <Label>
              {campo.nome}
              {campo.unidade ? ` (${campo.unidade})` : ''}
              {campo.obrigatorio && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              value={String(valor ?? '')}
              onChange={(e) => setValor(campo.id, e.target.value)}
            />
          </div>
        )

      case 'sim_nao':
        return (
          <div key={campo.id} className="space-y-1.5">
            <Label>
              {campo.nome}
              {campo.obrigatorio && <span className="text-destructive"> *</span>}
            </Label>
            <Select
              value={valor === undefined ? undefined : String(valor)}
              onValueChange={(v) => setValor(campo.id, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sim">Sim</SelectItem>
                <SelectItem value="Não">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )

      case 'selecao':
        return (
          <div key={campo.id} className="space-y-1.5">
            <Label>
              {campo.nome}
              {campo.obrigatorio && <span className="text-destructive"> *</span>}
            </Label>
            <Select
              value={valor === undefined ? undefined : String(valor)}
              onValueChange={(v) => setValor(campo.id, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {(campo.opcoes || []).map((opcao) => (
                  <SelectItem key={opcao} value={opcao}>
                    {opcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'multipla':
        return (
          <div key={campo.id} className="space-y-1.5">
            <Label>
              {campo.nome}
              {campo.obrigatorio && <span className="text-destructive"> *</span>}
            </Label>
            <div className="space-y-1">
              {(campo.opcoes || []).map((opcao) => {
                const selecionadas = Array.isArray(valor)
                  ? (valor as string[])
                  : typeof valor === 'string'
                    ? (() => {
                        try {
                          const parsed = JSON.parse(valor)
                          return Array.isArray(parsed) ? (parsed as string[]) : [valor]
                        } catch {
                          return [valor]
                        }
                      })()
                    : []
                const marcada = selecionadas.includes(opcao)
                return (
                  <label
                    key={opcao}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={marcada}
                      onChange={(e) =>
                        setValor(
                          campo.id,
                          e.target.checked
                            ? [...selecionadas, opcao]
                            : selecionadas.filter((o) => o !== opcao),
                        )
                      }
                    />
                    {opcao}
                  </label>
                )
              })}
            </div>
          </div>
        )

      case 'data':
        return (
          <div key={campo.id} className="space-y-1.5">
            <Label>
              {campo.nome}
              {campo.obrigatorio && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              type="date"
              value={String(valor ?? '')}
              onChange={(e) => setValor(campo.id, e.target.value)}
            />
          </div>
        )

      case 'hora':
        return (
          <div key={campo.id} className="space-y-1.5">
            <Label>
              {campo.nome}
              {campo.obrigatorio && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              type="time"
              value={String(valor ?? '')}
              onChange={(e) => setValor(campo.id, e.target.value)}
            />
          </div>
        )

      case 'foto': {
        const chave = campo.id
        const arquivo = arquivos.current[chave]
        return (
          <div key={campo.id} className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              {campo.nome}
              {campo.obrigatorio && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                files.forEach((f, i) => {
                  arquivos.current[`${chave}_${i}`] = f
                })
                setValor(
                  chave,
                  files.map((f) => f.name),
                )
              }}
            />
            {arquivo && <p className="text-xs text-muted-foreground">{String(valor)}</p>}
          </div>
        )
      }

      case 'assinatura': {
        const chave = campo.id
        return (
          <div key={campo.id} className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <PenTool className="h-3.5 w-3.5" />
              {campo.nome}
              {campo.obrigatorio && <span className="text-destructive"> *</span>}
            </Label>
            <AssinaturaCanvas
              valor={String(valor ?? '')}
              onChange={(arquivo) => {
                if (arquivo) {
                  arquivos.current[chave] = arquivo
                  setValor(chave, arquivo.name)
                } else {
                  delete arquivos.current[chave]
                  setValor(chave, '')
                }
              }}
            />
          </div>
        )
      }

      case 'calculo':
        return (
          <div key={campo.id} className="space-y-1.5">
            <Label>{campo.nome} (automático)</Label>
            <div className="rounded-xl bg-muted px-3 py-2 text-lg font-semibold">
              {calcular(campo) || '—'}
            </div>
          </div>
        )

      case 'calculo_tecnico':
        return <ResultadoTecnicoView key={campo.id} campo={campo} dados={dados} />

      case 'repetivel': {
        const instancias = normalizarInstancias(valor)
        const total = repetiveis[campo.id] ?? instancias.length ?? 0
        return (
          <div key={campo.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                {campo.nome}
                {campo.obrigatorio && <span className="text-destructive"> *</span>}
              </Label>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setRepetiveis((prev) => ({ ...prev, [campo.id]: total + 1 }))
                  setValorRepetivel(campo.id, total, '__novo', true)
                }}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>
            {instancias.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum registro — toque em "Adicionar" para criar o primeiro.
              </p>
            )}
            {instancias.map((item, indice) => (
              <Card key={indice} className="rounded-xl border bg-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="secondary">
                    {campo.nome} {indice + 1}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => {
                      const lista = normalizarInstancias(dados[campo.id]).filter(
                        (_, i) => i !== indice,
                      )
                      setValor(campo.id, lista)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {(campo.subcampos || []).map((sub) => {
                    const valorSub = item[sub.id]
                    return (
                      <div key={sub.id} className="space-y-1">
                        <Label className="text-xs">
                          {sub.nome}
                          {sub.unidade ? ` (${sub.unidade})` : ''}
                        </Label>
                        {sub.tipo === 'numero' ? (
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={String(valorSub ?? '')}
                            onChange={(e) =>
                              setValorRepetivel(campo.id, indice, sub.id, e.target.value)
                            }
                          />
                        ) : sub.tipo === 'sim_nao' ? (
                          <Select
                            value={valorSub === undefined ? undefined : String(valorSub)}
                            onValueChange={(v) => setValorRepetivel(campo.id, indice, sub.id, v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sim">Sim</SelectItem>
                              <SelectItem value="Não">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : sub.tipo === 'selecao' ? (
                          <Select
                            value={valorSub === undefined ? undefined : String(valorSub)}
                            onValueChange={(v) => setValorRepetivel(campo.id, indice, sub.id, v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              {(sub.opcoes || []).map((opcao) => (
                                <SelectItem key={opcao} value={opcao}>
                                  {opcao}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={String(valorSub ?? '')}
                            onChange={(e) =>
                              setValorRepetivel(campo.id, indice, sub.id, e.target.value)
                            }
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        )
      }

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            to="/auditoria-formularios?aba=formularios"
            className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Auditoria e Formulários
          </Link>{' '}
          <h1 className="text-2xl font-bold">{modelo.nome}</h1>
          {modelo.descricao && <p className="text-sm text-muted-foreground">{modelo.descricao}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => salvar('rascunho')} disabled={salvando}>
            <Save className="mr-2 h-4 w-4" />
            Rascunho
          </Button>
          <Button onClick={() => salvar('concluido')} disabled={salvando} className="rounded-full">
            <Check className="mr-2 h-4 w-4" />
            {salvando ? 'Salvando...' : 'Concluir'}
          </Button>
        </div>
      </div>

      {obrigatoriosPendentes.length > 0 && (
        <p className="mb-4 text-xs text-muted-foreground">
          {obrigatoriosPendentes.length} campo(s) obrigatório(s) pendente(s) para concluir.
        </p>
      )}

      {/* Empresa à qual o registro se refere — vincula o registro ao cliente,
          aparece na página da empresa e permite filtro na lista de registros. */}
      <Card className="mb-4 rounded-2xl border-none bg-card p-4 shadow-subtle">
        <div className="space-y-1.5">
          <Label>
            <Building2 className="mr-1.5 inline h-3.5 w-3.5" />
            Empresa (cliente)
          </Label>
          <Select value={empresaId || undefined} onValueChange={setEmpresaId}>
            <SelectTrigger>
              <SelectValue placeholder="Vincular a uma empresa (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.nome_fantasia || emp.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Vinculando, o registro aparece na página da empresa e nos relatórios dela.
          </p>
        </div>
      </Card>

      {/* Formulário inteiro em uma única página: cada seção do modelo vira um
          bloco com título, um abaixo do outro. */}
      {secoes.length > 0 && (
        <>
          <Card className="space-y-6 rounded-2xl border-none bg-card p-5 shadow-subtle">
            {secoes.map((sec, i) => (
              <section key={i} className="space-y-4">
                {secoes.length > 1 && (
                  <h2 className="border-b pb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {sec.nome}
                  </h2>
                )}
                {sec.campos.map(renderCampo)}
              </section>
            ))}
          </Card>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => salvar('rascunho')} disabled={salvando}>
              <Save className="mr-2 h-4 w-4" />
              Salvar rascunho
            </Button>
            <Button
              onClick={() => salvar('concluido')}
              disabled={salvando}
              className="rounded-full"
            >
              <Check className="mr-2 h-4 w-4" />
              {salvando ? 'Salvando...' : 'Concluir'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
