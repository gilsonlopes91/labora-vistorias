/* Builder de formulário customizado — 3 painéis estilo Fulcrum:
   esquerda = paleta de tipos de campo; meio = campos da ficha + configuração;
   direita = detalhes da ficha (título, descrição, ícone). Salva como modelo
   próprio da organização (modelos_formulario, organizacao_id preenchido). */
import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  Calculator,
  Calendar,
  Camera,
  CircleDot,
  Clock,
  Copy,
  Hash,
  ListChecks,
  PenTool,
  Plus,
  Save,
  SeparatorHorizontal,
  ToggleLeft,
  Trash2,
  Type,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import { createModeloFormulario, type CampoFormulario } from '@/services/formularios'
import { ICONES_FORMULARIO } from '@/lib/iconesFormulario'

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

// ---------- Catálogo de tipos de campo (paleta) ----------

interface TipoCampo {
  tipo: string
  label: string
  icone: LucideIcon
}

const PALETA: { categoria: string; itens: TipoCampo[] }[] = [
  {
    categoria: 'Básico',
    itens: [
      { tipo: 'texto', label: 'Texto curto', icone: Type },
      { tipo: 'texto_longo', label: 'Texto longo', icone: AlignLeft },
      { tipo: 'numero', label: 'Número + unidade', icone: Hash },
      { tipo: 'sim_nao', label: 'Sim / Não', icone: ToggleLeft },
      { tipo: 'data', label: 'Data', icone: Calendar },
      { tipo: 'hora', label: 'Hora', icone: Clock },
    ],
  },
  {
    categoria: 'Escolha',
    itens: [
      { tipo: 'selecao', label: 'Seleção única', icone: CircleDot },
      { tipo: 'multipla', label: 'Múltipla escolha', icone: ListChecks },
    ],
  },
  {
    categoria: 'Mídia',
    itens: [
      { tipo: 'foto', label: 'Foto', icone: Camera },
      { tipo: 'assinatura', label: 'Assinatura digital', icone: PenTool },
    ],
  },
  {
    categoria: 'Estrutura',
    itens: [
      { tipo: 'secao', label: 'Seção divisória', icone: SeparatorHorizontal },
      { tipo: 'repetivel', label: 'Grupo repetível', icone: Copy },
    ],
  },
  {
    categoria: 'Avançado',
    itens: [{ tipo: 'calculo', label: 'Cálculo automático', icone: Calculator }],
  },
]

const tipoInfo = (tipo: string) => PALETA.flatMap((g) => g.itens).find((i) => i.tipo === tipo)

// ---------- Estado de configuração do campo em construção/edição ----------

interface ConfigCampo {
  nome: string
  unidade: string
  obrigatorio: boolean
  opcoesTexto: string
  subcampos: { nome: string; tipo: string }[]
  camposOrigem: string[]
  operacao: string
  condicaoCampoId: string
  condicaoValor: string
}

const configVazia: ConfigCampo = {
  nome: '',
  unidade: '',
  obrigatorio: false,
  opcoesTexto: '',
  subcampos: [],
  camposOrigem: [],
  operacao: 'soma',
  condicaoCampoId: '',
  condicaoValor: '',
}

export default function BuilderFormulario() {
  const navigate = useNavigate()

  // Painel direito — detalhes da ficha
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [icone, setIcone] = useState('clipboard-list')

  // Painel do meio — campos
  const [campos, setCampos] = useState<CampoFormulario[]>([])
  const [tipoSelecionado, setTipoSelecionado] = useState<string | null>(null)
  const [config, setConfig] = useState<ConfigCampo>(configVazia)
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null)
  const [salvando, setSalvando] = useState(false)

  const tipoAtual = tipoSelecionado ? tipoInfo(tipoSelecionado) : null

  const camposCondicionaveis = useMemo(
    () => campos.filter((c) => c.tipo === 'selecao' || c.tipo === 'sim_nao'),
    [campos],
  )
  const camposNumericos = useMemo(() => campos.filter((c) => c.tipo === 'numero'), [campos])

  const selecionarTipo = (tipo: string) => {
    setTipoSelecionado(tipo)
    setEditandoIndex(null)
    setConfig({ ...configVazia })
  }

  const editarCampo = (index: number) => {
    const campo = campos[index]
    setEditandoIndex(index)
    setTipoSelecionado(campo.tipo)
    setConfig({
      nome: campo.nome || '',
      unidade: campo.unidade || '',
      obrigatorio: Boolean(campo.obrigatorio),
      opcoesTexto: (campo.opcoes || []).join('\n'),
      subcampos: (campo.subcampos || []).map((s) => ({ nome: s.nome, tipo: s.tipo || 'texto' })),
      camposOrigem: campo.camposOrigem || [],
      operacao: campo.operacao || 'soma',
      condicaoCampoId: campo.condicaoCampoId || '',
      condicaoValor: campo.condicaoValor || '',
    })
  }

  const montarCampo = (id: string): CampoFormulario => {
    const campo: CampoFormulario = { id, tipo: tipoSelecionado!, nome: config.nome.trim() }
    if (config.unidade.trim()) campo.unidade = config.unidade.trim()
    if (config.obrigatorio) campo.obrigatorio = true
    if (tipoSelecionado === 'selecao' || tipoSelecionado === 'multipla') {
      campo.opcoes = config.opcoesTexto
        .split('\n')
        .map((o) => o.trim())
        .filter(Boolean)
    }
    if (tipoSelecionado === 'repetivel') {
      campo.subcampos = config.subcampos
        .filter((s) => s.nome.trim())
        .map((s, i) => ({ id: `${id}s${i + 1}`, nome: s.nome.trim(), tipo: s.tipo }))
    }
    if (tipoSelecionado === 'calculo') {
      campo.camposOrigem = config.camposOrigem
      campo.operacao = config.operacao as CampoFormulario['operacao']
    }
    if (config.condicaoCampoId && config.condicaoValor.trim()) {
      campo.condicaoCampoId = config.condicaoCampoId
      campo.condicaoValor = config.condicaoValor.trim()
    }
    return campo
  }

  const adicionarCampo = () => {
    if (!tipoSelecionado) return
    if (!config.nome.trim()) {
      toast.error('Informe o nome do campo')
      return
    }
    if (
      (tipoSelecionado === 'selecao' || tipoSelecionado === 'multipla') &&
      !config.opcoesTexto.trim()
    ) {
      toast.error('Informe as opções (uma por linha)')
      return
    }
    if (
      tipoSelecionado === 'repetivel' &&
      config.subcampos.filter((s) => s.nome.trim()).length === 0
    ) {
      toast.error('Adicione ao menos um subcampo ao grupo repetível')
      return
    }
    if (tipoSelecionado === 'calculo' && config.camposOrigem.length < 2) {
      toast.error('Selecione ao menos 2 campos numéricos para calcular')
      return
    }
    setCampos((prev) => [...prev, montarCampo(`f${prev.length + 1}`)])
    setTipoSelecionado(null)
    setConfig(configVazia)
    toast.success('Campo adicionado à ficha')
  }

  const salvarEdicao = () => {
    if (editandoIndex === null) return
    if (!config.nome.trim()) {
      toast.error('Informe o nome do campo')
      return
    }
    setCampos((prev) => prev.map((c, i) => (i === editandoIndex ? montarCampo(c.id) : c)))
    setEditandoIndex(null)
    setTipoSelecionado(null)
    setConfig(configVazia)
    toast.success('Campo atualizado')
  }

  const removerCampo = (index: number) => {
    setCampos((prev) => prev.filter((_, i) => i !== index))
    if (editandoIndex === index) {
      setEditandoIndex(null)
      setTipoSelecionado(null)
      setConfig(configVazia)
    }
  }

  const moverCampo = (index: number, direcao: -1 | 1) => {
    const destino = index + direcao
    if (destino < 0 || destino >= campos.length) return
    setCampos((prev) => {
      const copia = [...prev]
      ;[copia[index], copia[destino]] = [copia[destino], copia[index]]
      return copia
    })
  }

  const salvarFicha = async () => {
    if (!titulo.trim()) {
      toast.error('Dê um título à ficha')
      return
    }
    if (campos.length === 0) {
      toast.error('Adicione ao menos um campo à ficha')
      return
    }
    setSalvando(true)
    try {
      const org = await getMinhaOrganizacao()
      await createModeloFormulario(org.id, {
        nome: titulo.trim(),
        descricao: descricao.trim() || undefined,
        icone,
        campos,
      })
      toast.success('Formulário criado — já pode ser preenchido e agendado')
      navigate('/formularios')
    } catch (error) {
      toast.error('Não foi possível criar o formulário', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            to="/formularios"
            className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Formulários
          </Link>
          <h1 className="text-2xl font-bold">Criar formulário</h1>
          <p className="text-sm text-muted-foreground">
            Monte sua ficha de campo escolhendo os campos que precisa.
          </p>
        </div>
        <Button onClick={salvarFicha} disabled={salvando} className="shrink-0 rounded-full">
          <Save className="mr-2 h-4 w-4" />
          {salvando ? 'Salvando...' : 'Salvar ficha'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Painel esquerdo — paleta */}
        <Card className="rounded-2xl border-none bg-card p-4 shadow-subtle lg:col-span-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tipos de campo
          </p>
          <div className="space-y-4">
            {PALETA.map((grupo) => (
              <div key={grupo.categoria}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {grupo.categoria}
                </p>
                <div className="space-y-1">
                  {grupo.itens.map((item) => (
                    <button
                      key={item.tipo}
                      onClick={() => selecionarTipo(item.tipo)}
                      className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                        tipoSelecionado === item.tipo && editandoIndex === null
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <item.icone className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Painel do meio — campos da ficha + configuração */}
        <div className="space-y-4 lg:col-span-6">
          <Card className="rounded-2xl border-none bg-card p-4 shadow-subtle">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Campos da ficha ({campos.length})
            </p>
            {campos.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum campo ainda — escolha um tipo na paleta ao lado.
              </p>
            ) : (
              <ul className="space-y-2">
                {campos.map((campo, index) => {
                  const info = tipoInfo(campo.tipo)
                  const Icone = info?.icone || Type
                  return (
                    <li
                      key={campo.id}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-sm ${
                        editandoIndex === index ? 'border-primary' : ''
                      }`}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <Icone className="h-3.5 w-3.5" />
                      </div>
                      <button
                        className="min-w-0 flex-1 text-left"
                        onClick={() => editarCampo(index)}
                      >
                        <span className="block truncate font-medium">{campo.nome}</span>
                        <span className="text-xs text-muted-foreground">
                          {info?.label || campo.tipo}
                          {campo.unidade ? ` · ${campo.unidade}` : ''}
                          {campo.obrigatorio ? ' · obrigatório' : ''}
                          {campo.condicaoCampoId ? ' · condicional' : ''}
                        </span>
                      </button>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => moverCampo(index, -1)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => moverCampo(index, 1)}
                          disabled={index === campos.length - 1}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removerCampo(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          {tipoAtual && (
            <Card className="rounded-2xl border-none bg-card p-4 shadow-subtle">
              <div className="mb-3 flex items-center gap-2">
                <tipoAtual.icone className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {editandoIndex !== null ? 'Editar campo' : `Configurar: ${tipoAtual.label}`}
                </p>
                {editandoIndex === null && (
                  <Badge variant="secondary" className="ml-auto">
                    novo
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="campo-nome">Nome do campo *</Label>
                  <Input
                    id="campo-nome"
                    value={config.nome}
                    onChange={(e) => setConfig((f) => ({ ...f, nome: e.target.value }))}
                    placeholder="Ex.: Nível de pressão sonora"
                  />
                </div>

                {tipoSelecionado === 'numero' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="campo-unidade">Unidade</Label>
                    <Input
                      id="campo-unidade"
                      value={config.unidade}
                      onChange={(e) => setConfig((f) => ({ ...f, unidade: e.target.value }))}
                      placeholder="Ex.: dB(A), m/s², °C, L/min"
                    />
                  </div>
                )}

                {(tipoSelecionado === 'selecao' || tipoSelecionado === 'multipla') && (
                  <div className="space-y-1.5">
                    <Label htmlFor="campo-opcoes">Opções (uma por linha) *</Label>
                    <Textarea
                      id="campo-opcoes"
                      rows={3}
                      value={config.opcoesTexto}
                      onChange={(e) => setConfig((f) => ({ ...f, opcoesTexto: e.target.value }))}
                      placeholder={'Sim\nNão\nNão se aplica'}
                    />
                  </div>
                )}

                {tipoSelecionado === 'repetivel' && (
                  <div className="space-y-1.5">
                    <Label>Subcampos do grupo (que se repete) *</Label>
                    {config.subcampos.map((sub, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={sub.nome}
                          onChange={(e) =>
                            setConfig((f) => ({
                              ...f,
                              subcampos: f.subcampos.map((s, j) =>
                                j === i ? { ...s, nome: e.target.value } : s,
                              ),
                            }))
                          }
                          placeholder={`Subcampo ${i + 1} — ex.: WET (úmido)`}
                        />
                        <Select
                          value={sub.tipo}
                          onValueChange={(v) =>
                            setConfig((f) => ({
                              ...f,
                              subcampos: f.subcampos.map((s, j) =>
                                j === i ? { ...s, tipo: v } : s,
                              ),
                            }))
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="texto">Texto</SelectItem>
                            <SelectItem value="numero">Número</SelectItem>
                            <SelectItem value="sim_nao">Sim/Não</SelectItem>
                            <SelectItem value="selecao">Seleção</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                          onClick={() =>
                            setConfig((f) => ({
                              ...f,
                              subcampos: f.subcampos.filter((_, j) => j !== i),
                            }))
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() =>
                        setConfig((f) => ({
                          ...f,
                          subcampos: [...f.subcampos, { nome: '', tipo: 'texto' }],
                        }))
                      }
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Adicionar subcampo
                    </Button>
                  </div>
                )}

                {tipoSelecionado === 'calculo' && (
                  <>
                    <div className="space-y-1.5">
                      <Label>Campos numéricos de origem *</Label>
                      {camposNumericos.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Adicione campos de número à ficha primeiro.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {camposNumericos.map((c) => (
                            <label
                              key={c.id}
                              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                            >
                              <input
                                type="checkbox"
                                checked={config.camposOrigem.includes(c.id)}
                                onChange={(e) =>
                                  setConfig((f) => ({
                                    ...f,
                                    camposOrigem: e.target.checked
                                      ? [...f.camposOrigem, c.id]
                                      : f.camposOrigem.filter((id) => id !== c.id),
                                  }))
                                }
                              />
                              {c.nome}
                              {c.unidade ? ` (${c.unidade})` : ''}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Operação</Label>
                      <Select
                        value={config.operacao}
                        onValueChange={(v) => setConfig((f) => ({ ...f, operacao: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soma">Soma</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="max">Máximo</SelectItem>
                          <SelectItem value="min">Mínimo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Lógica condicional */}
                {camposCondicionaveis.length > 0 && tipoSelecionado !== 'calculo' && (
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Zap className="h-3.5 w-3.5" />
                      Lógica condicional (opcional)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={config.condicaoCampoId || undefined}
                        onValueChange={(v) => setConfig((f) => ({ ...f, condicaoCampoId: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Mostrar quando..." />
                        </SelectTrigger>
                        <SelectContent>
                          {camposCondicionaveis.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={config.condicaoValor}
                        onChange={(e) =>
                          setConfig((f) => ({ ...f, condicaoValor: e.target.value }))
                        }
                        placeholder="tiver o valor... ex.: Sim"
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.obrigatorio}
                    onChange={(e) => setConfig((f) => ({ ...f, obrigatorio: e.target.checked }))}
                  />
                  Campo obrigatório (bloqueia a conclusão da ficha se vazio)
                </label>

                <div className="flex justify-end gap-2 pt-1">
                  {editandoIndex !== null ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditandoIndex(null)
                          setTipoSelecionado(null)
                          setConfig(configVazia)
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={salvarEdicao}>Salvar alterações</Button>
                    </>
                  ) : (
                    <Button onClick={adicionarCampo} className="rounded-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar à ficha
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Painel direito — detalhes da ficha */}
        <Card className="rounded-2xl border-none bg-card p-4 shadow-subtle lg:col-span-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Detalhes da ficha
          </p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ficha-titulo">Título *</Label>
              <Input
                id="ficha-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Inspeção de andaimes"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ficha-descricao">Descrição</Label>
              <Textarea
                id="ficha-descricao"
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Para que serve esta ficha (opcional)"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ícone no catálogo</Label>
              <div className="grid grid-cols-4 gap-2">
                {ICONES_FORMULARIO.map((opcao) => {
                  const Icone = opcao.icon
                  return (
                    <button
                      key={opcao.id}
                      type="button"
                      title={opcao.label}
                      aria-label={opcao.label}
                      onClick={() => setIcone(opcao.id)}
                      className={`flex h-10 items-center justify-center rounded-xl border transition-colors ${
                        icone === opcao.id
                          ? 'border-primary bg-accent text-accent-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Icone className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
