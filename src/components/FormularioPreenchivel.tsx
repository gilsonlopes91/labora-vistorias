/* Formulário de campo reutilizável: usado pela tela de preenchimento
   independente (/formularios/:id/preencher) e dentro do fluxo da vistoria
   multi-item (VistoriaDetalhe). Recebe o modelo, os dados carregados e
   devolve as mudanças via callbacks. */
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Camera, Check, PenTool, Plus, Save, Trash2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import ResultadoTecnicoView, { resumoCalculosTecnicos } from '@/components/ResultadoTecnico'
import type { CampoFormulario, ModeloFormulario } from '@/services/formularios'
import {
  createFormulario,
  updateFormulario,
  enviarAnexos,
  type Formulario,
} from '@/services/registrosFormulario'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FormularioPreenchivelProps {
  modelo: ModeloFormulario
  registroExistente?: Formulario | null
  vistoriaId?: string
  onSalvo?: (registro: Formulario) => void
  compacto?: boolean
}

export default function FormularioPreenchivel({
  modelo,
  registroExistente,
  vistoriaId,
  onSalvo,
  compacto,
}: FormularioPreenchivelProps) {
  const [dados, setDados] = useState<Record<string, unknown>>(registroExistente?.dados || {})
  // Registro já existente abre com os campos que o modelo tinha quando foi
  // preenchido (cópia guardada no registro), mesmo que o modelo tenha mudado.
  const campos =
    Array.isArray(registroExistente?.campos_snapshot) && registroExistente.campos_snapshot.length
      ? registroExistente.campos_snapshot
      : modelo.campos
  const [repetiveis, setRepetiveis] = useState<Record<string, number>>({})
  const [salvando, setSalvando] = useState(false)
  const arquivos = useRef<Record<string, File>>({})

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

  const visivel = (campo: CampoFormulario) => {
    if (!campo.condicaoCampoId || !campo.condicaoValor) return true
    return String(getValor(campo.condicaoCampoId) ?? '') === campo.condicaoValor
  }

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
    const pendentes: string[] = []
    for (const campo of campos) {
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

  const salvar = async (status: 'rascunho' | 'concluido') => {
    if (status === 'concluido' && obrigatoriosPendentes.length > 0) {
      toast.error('Campos obrigatórios pendentes', {
        description: obrigatoriosPendentes.join(', '),
      })
      return
    }
    setSalvando(true)
    try {
      // Resultado dos cálculos técnicos (calor, ruído) vai junto, em texto,
      // para aparecer em qualquer lugar que leia o registro.
      const dadosFinal = resumoCalculosTecnicos(campos, dados)
      let registro: Formulario
      if (registroExistente) {
        registro = await updateFormulario(registroExistente.id, { dados: dadosFinal, status })
      } else {
        const { getMinhaOrganizacao } = await import('@/services/organizacoes')
        const org = await getMinhaOrganizacao()
        registro = await createFormulario({
          organizacao_id: org.id,
          modelo_formulario_id: modelo.id,
          vistoria_id: vistoriaId,
          dados: dadosFinal,
          status,
          data_campo: new Date().toISOString(),
          client_uuid: crypto.randomUUID(),
        })
      }
      const listaAnexos = Object.values(arquivos.current)
      if (listaAnexos.length > 0) {
        await enviarAnexos(registro.id, listaAnexos)
      }
      toast.success(status === 'concluido' ? 'Formulário concluído' : 'Rascunho salvo')
      onSalvo?.(registro)
    } catch (error) {
      toast.error('Não foi possível salvar o formulário', {
        description: getErrorMessage(error),
      })
    } finally {
      setSalvando(false)
    }
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
    <div className={compacto ? 'space-y-3' : 'space-y-4'}>
      {!compacto && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{modelo.nome}</h1>
            {modelo.descricao && (
              <p className="text-sm text-muted-foreground">{modelo.descricao}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={() => salvar('rascunho')} disabled={salvando}>
              <Save className="mr-2 h-4 w-4" />
              Rascunho
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
        </div>
      )}
      {obrigatoriosPendentes.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {obrigatoriosPendentes.length} campo(s) obrigatório(s) pendente(s) para concluir.
        </p>
      )}
      <Card className="space-y-4 rounded-2xl border-none bg-card p-5 shadow-subtle">
        {campos.map(renderCampo)}
      </Card>
    </div>
  )
}

// Canvas de assinatura (desenha com mouse/toque e gera um PNG).
function AssinaturaCanvas({
  valor,
  onChange,
}: {
  valor: string
  onChange: (arquivo: File | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const desenhando = useRef(false)
  const [temRascunho, setTemRascunho] = useState(!!valor)

  const iniciar = (e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    desenhando.current = true
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }
  const mover = (e: React.PointerEvent) => {
    if (!desenhando.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
    setTemRascunho(true)
  }
  const terminar = () => {
    desenhando.current = false
  }

  const exportar = () => {
    const canvas = canvasRef.current
    if (!canvas || !temRascunho) return
    canvas.toBlob((blob) => {
      if (!blob) return
      onChange(new File([blob], `assinatura-${Date.now()}.png`, { type: 'image/png' }))
    })
  }

  return (
    <div className="space-y-1.5">
      <canvas
        ref={canvasRef}
        width={400}
        height={140}
        className="w-full rounded-xl border bg-white touch-none"
        onPointerDown={iniciar}
        onPointerMove={mover}
        onPointerUp={() => {
          terminar()
          exportar()
        }}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => {
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            ctx?.clearRect(0, 0, canvas.width, canvas.height)
            setTemRascunho(false)
            onChange(null)
          }}
        >
          Limpar
        </Button>
        {temRascunho && (
          <span className="text-xs text-muted-foreground">Assinatura registrada ✓</span>
        )}
      </div>
    </div>
  )
}
