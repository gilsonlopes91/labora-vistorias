/* Formulários — biblioteca de modelos (fixos do catálogo + customizados da
   organização) e lista dos registros preenchidos. Como na auditoria de NRs,
   aqui só se vê o modelo: o preenchimento acontece dentro de uma vistoria
   ("Usar numa vistoria" cria a vistoria já com o formulário). */
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, Download, Eye, FilePlus2, Lock, Plus, Trash2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { camposDoRegistro, gerarPdfFormularios, nomeArquivoFormularios } from '@/lib/pdfFormulario'
import NovaVistoriaDialog from '@/components/NovaVistoriaDialog'
import { getEmpresas, type Empresa } from '@/services/empresas'
import {
  getModelosFormulario,
  createModeloFormulario,
  deleteModeloFormulario,
  type ModeloFormulario,
  type CampoFormulario,
} from '@/services/formularios'
import { getFormularios, type Formulario } from '@/services/registrosFormulario'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import { getIconeFormulario } from '@/lib/iconesFormulario'
import SeletorIcone from '@/components/SeletorIcone'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const iconeDe = (modelo: { icone?: string | null }) => getIconeFormulario(modelo.icone)

const TIPO_CAMPO: Record<string, string> = {
  texto: 'Texto curto',
  texto_longo: 'Texto longo',
  numero: 'Número',
  sim_nao: 'Sim / Não',
  selecao: 'Escolha única',
  multipla: 'Múltipla escolha',
  data: 'Data',
  hora: 'Hora',
  foto: 'Foto',
  assinatura: 'Assinatura',
  repetivel: 'Lista de medições',
  calculo: 'Cálculo automático',
  calculo_tecnico: 'Cálculo técnico',
  codigo: 'Código',
  url: 'Link',
}

interface CampoRapido {
  nome: string
  tipo: string
  obrigatorio: boolean
}

export function FormulariosTab() {
  const [modelos, setModelos] = useState<ModeloFormulario[]>([])
  const [registros, setRegistros] = useState<Formulario[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('todas')
  const [loading, setLoading] = useState(true)
  const [modalNovoAberto, setModalNovoAberto] = useState(false)
  const [salvandoNovo, setSalvandoNovo] = useState(false)
  const [modeloParaExcluir, setModeloParaExcluir] = useState<ModeloFormulario | null>(null)
  const [modeloVendo, setModeloVendo] = useState<ModeloFormulario | null>(null)
  const navigate = useNavigate()

  // PDF de um registro preenchido.
  const baixarPdfRegistro = async (r: Formulario) => {
    toast.info('Gerando o PDF...')
    try {
      const modelo = r.expand?.modelo_formulario_id
      const empresa = r.expand?.empresa_id as
        | { razao_social: string; nome_fantasia?: string; cnpj?: string; endereco?: string }
        | undefined
      const nomeEmpresa = empresa?.nome_fantasia || empresa?.razao_social || 'Empresa'
      const titulo = modelo?.nome || 'Formulário'
      const doc = await gerarPdfFormularios({
        formularios: [{ registro: r, campos: camposDoRegistro(r), titulo }],
        empresa: { nome: nomeEmpresa, cnpj: empresa?.cnpj, endereco: empresa?.endereco },
        titulo,
      })
      doc.save(nomeArquivoFormularios(nomeEmpresa, titulo))
    } catch (error) {
      toast.error('Não foi possível gerar o PDF', { description: getErrorMessage(error) })
    }
  }

  // Dados do formulário de criação rápida
  const [novoNome, setNovoNome] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')
  const [novoIcone, setNovoIcone] = useState('clipboard-list')
  const [novosCampos, setNovosCampos] = useState<CampoRapido[]>([
    { nome: 'Data e Hora', tipo: 'data', obrigatorio: true },
    { nome: 'Observações de Campo', tipo: 'texto_longo', obrigatorio: false },
  ])

  const carregarDados = useCallback(async () => {
    try {
      const org = await getMinhaOrganizacao()
      const [ms, rs, es] = await Promise.all([
        getModelosFormulario(org.id),
        getFormularios(),
        getEmpresas(),
      ])
      setModelos(ms)
      setRegistros(rs)
      setEmpresas(es)
    } catch (error) {
      toast.error('Não foi possível carregar os formulários', {
        description: getErrorMessage(error),
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const abrirModalNovo = () => {
    setNovoNome('')
    setNovaDescricao('')
    setNovoIcone('clipboard-list')
    setNovosCampos([
      { nome: 'Data e Hora', tipo: 'data', obrigatorio: true },
      { nome: 'Observações de Campo', tipo: 'texto_longo', obrigatorio: false },
    ])
    setModalNovoAberto(true)
  }

  const adicionarCampoRapido = () => {
    setNovosCampos((prev) => [...prev, { nome: '', tipo: 'texto', obrigatorio: false }])
  }

  const removerCampoRapido = (index: number) => {
    setNovosCampos((prev) => prev.filter((_, i) => i !== index))
  }

  const atualizarCampoRapido = (index: number, chave: keyof CampoRapido, valor: unknown) => {
    setNovosCampos((prev) => prev.map((c, i) => (i === index ? { ...c, [chave]: valor } : c)))
  }

  const salvarNovoFormulario = async () => {
    if (!novoNome.trim()) {
      toast.error('Informe o nome do formulário')
      return
    }

    setSalvandoNovo(true)
    try {
      const org = await getMinhaOrganizacao()
      const camposMontados: CampoFormulario[] = novosCampos
        .filter((c) => c.nome.trim())
        .map((c, i) => ({
          id: `f${i + 1}`,
          nome: c.nome.trim(),
          tipo: c.tipo,
          obrigatorio: c.obrigatorio,
        }))

      await createModeloFormulario(org.id, {
        nome: novoNome.trim(),
        descricao: novaDescricao.trim() || undefined,
        icone: novoIcone,
        campos:
          camposMontados.length > 0
            ? camposMontados
            : [{ id: 'f1', nome: 'Observações', tipo: 'texto_longo' }],
      })

      toast.success('Formulário criado com sucesso na sua conta')
      setModalNovoAberto(false)
      carregarDados()
    } catch (error) {
      toast.error('Erro ao criar formulário', { description: getErrorMessage(error) })
    } finally {
      setSalvandoNovo(false)
    }
  }

  const excluirModeloProprio = async () => {
    if (!modeloParaExcluir) return
    try {
      await deleteModeloFormulario(modeloParaExcluir.id)
      toast.success('Formulário excluído com sucesso')
      setModeloParaExcluir(null)
      carregarDados()
    } catch (error) {
      toast.error('Não foi possível excluir o formulário', {
        description: getErrorMessage(error),
      })
    }
  }

  const fixos = modelos.filter((m) => m.fixo)
  const proprios = modelos.filter((m) => !m.fixo)

  const registrosFiltrados =
    filtroEmpresa === 'todas' ? registros : registros.filter((r) => r.empresa_id === filtroEmpresa)

  const CardModelo = ({ modelo }: { modelo: ModeloFormulario }) => {
    const Icone = iconeDe(modelo)
    return (
      <Card className="flex flex-col rounded-2xl border-none bg-card p-5 shadow-subtle">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icone className="h-5 w-5" />
        </div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{modelo.nome}</h3>
          {modelo.fixo ? (
            <Badge variant="secondary" className="shrink-0 gap-1">
              <Lock className="h-3 w-3" />
              Fixo
            </Badge>
          ) : (
            <div className="flex items-center gap-1">
              <Badge
                variant="outline"
                className="border-primary/40 text-primary shrink-0 text-[10px]"
              >
                Sua conta
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => setModeloParaExcluir(modelo)}
                title="Excluir formulário"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
        {modelo.descricao && (
          <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{modelo.descricao}</p>
        )}
        <div className="mt-auto flex gap-2 pt-4">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 rounded-full"
            onClick={() => setModeloVendo(modelo)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Ver campos
          </Button>
          <NovaVistoriaDialog
            formulariosIniciais={[modelo.id]}
            onCreated={(vistoriaId) => navigate(`/vistorias/${vistoriaId}`)}
            trigger={
              <Button size="sm" className="flex-1 rounded-full">
                Usar numa vistoria
              </Button>
            }
          />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Formulários e Fichas de Campo</h2>
          <p className="text-sm text-muted-foreground">
            Modelos de fichas de campo — medições, inspeções e verificações. O preenchimento é feito
            dentro de uma vistoria.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={abrirModalNovo} className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Novo formulário
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/formularios/novo">
              <FilePlus2 className="mr-2 h-4 w-4" />
              Construtor avançado
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="modelos">
          <TabsList className="mb-4">
            <TabsTrigger value="modelos">Modelos ({modelos.length})</TabsTrigger>
            <TabsTrigger value="registros">Registros ({registros.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="modelos">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Catálogo — prontos para uso
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fixos.map((m) => (
                <CardModelo key={m.id} modelo={m} />
              ))}
            </div>

            {proprios.length > 0 && (
              <>
                <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Da sua organização
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {proprios.map((m) => (
                    <CardModelo key={m.id} modelo={m} />
                  ))}
                </div>
              </>
            )}

            {modelos.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
                <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Nenhum modelo de formulário ainda.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="registros">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Registros preenchidos
              </p>
              <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filtrar por empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as empresas</SelectItem>
                  {empresas.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nome_fantasia || emp.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {registrosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
                <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {registros.length === 0
                    ? 'Nenhum registro preenchido ainda. Use um modelo numa vistoria para preenchê-lo.'
                    : 'Nenhum registro para a empresa selecionada.'}
                </p>
              </div>
            ) : (
              <Card className="divide-y divide-border/60 overflow-hidden rounded-2xl border-none bg-card p-2 shadow-subtle">
                {registrosFiltrados.map((r) => {
                  const modelo = r.expand?.modelo_formulario_id
                  const empresa = r.expand?.empresa_id
                  const Icone = getIconeFormulario(modelo?.icone)
                  return (
                    <div key={r.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <Icone className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {modelo?.nome || 'Formulário'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {empresa ? `${empresa.nome_fantasia || empresa.razao_social} · ` : ''}
                          {new Date(r.data_campo || r.created).toLocaleDateString('pt-BR')}
                          {r.vistoria_id ? '' : ' · preenchido fora de vistoria'}
                        </p>
                      </div>
                      <Badge
                        variant={r.status === 'concluido' ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {r.status === 'concluido' ? 'Concluído' : 'Rascunho'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 shrink-0 gap-1.5"
                        onClick={() => baixarPdfRegistro(r)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                      {r.vistoria_id && (
                        <Button asChild size="sm" variant="outline" className="h-8 shrink-0">
                          <Link to={`/vistorias/${r.vistoria_id}`}>Abrir vistoria</Link>
                        </Button>
                      )}
                    </div>
                  )
                })}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Modal de Criação Rápida de Novo Formulário */}
      <Dialog open={modalNovoAberto} onOpenChange={setModalNovoAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo formulário</DialogTitle>
            <DialogDescription>
              Crie uma ficha de campo personalizada. Este formulário ficará visível apenas na sua
              conta (organização).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="form-nome">Nome do formulário *</Label>
              <Input
                id="form-nome"
                placeholder="Ex.: Checklist Diário de Empilhadeira"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="form-desc">Descrição (opcional)</Label>
              <Textarea
                id="form-desc"
                rows={2}
                placeholder="Breve instrução de preenchimento ou finalidade"
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Ícone identificador</Label>
              <div className="rounded-xl border bg-muted/20 p-2">
                <SeletorIcone value={novoIcone} onChange={setNovoIcone} variante="compacto" />
              </div>
            </div>

            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Campos do formulário</Label>
                  <p className="text-xs text-muted-foreground">
                    Defina as perguntas e campos a serem respondidos na vistoria.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={adicionarCampoRapido}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Adicionar campo
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {novosCampos.map((campo, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl border bg-card p-2 text-sm shadow-2xs"
                  >
                    <Input
                      placeholder={`Nome do campo ${idx + 1}`}
                      value={campo.nome}
                      onChange={(e) => atualizarCampoRapido(idx, 'nome', e.target.value)}
                      className="flex-1"
                    />
                    <Select
                      value={campo.tipo}
                      onValueChange={(val) => atualizarCampoRapido(idx, 'tipo', val)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="texto">Texto curto</SelectItem>
                        <SelectItem value="texto_longo">Texto longo</SelectItem>
                        <SelectItem value="numero">Número</SelectItem>
                        <SelectItem value="sim_nao">Sim / Não</SelectItem>
                        <SelectItem value="data">Data</SelectItem>
                        <SelectItem value="hora">Hora</SelectItem>
                        <SelectItem value="foto">Foto</SelectItem>
                        <SelectItem value="assinatura">Assinatura</SelectItem>
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={campo.obrigatorio}
                        onChange={(e) => atualizarCampoRapido(idx, 'obrigatorio', e.target.checked)}
                      />
                      Obrigatório
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                      onClick={() => removerCampoRapido(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalNovoAberto(false)}
              disabled={salvandoNovo}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={salvarNovoFormulario} disabled={salvandoNovo}>
              {salvandoNovo ? 'Criando formulário...' : 'Criar formulário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campos do modelo, só para consulta (como os itens da auditoria de NRs). */}
      <Dialog open={!!modeloVendo} onOpenChange={(aberto) => !aberto && setModeloVendo(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modeloVendo?.nome}</DialogTitle>
            <DialogDescription>
              Campos do modelo. Para preencher, use o modelo numa vistoria.
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y text-sm">
            {(modeloVendo?.campos || []).map((campo) =>
              campo.tipo === 'secao' ? (
                <p
                  key={campo.id}
                  className="pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:pt-0"
                >
                  {campo.nome}
                </p>
              ) : (
                <div key={campo.id} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <span>{campo.nome}</span>
                    {campo.obrigatorio && <span className="text-destructive"> *</span>}
                    {campo.tipo === 'repetivel' && !!campo.subcampos?.length && (
                      <p className="text-xs text-muted-foreground">
                        {campo.subcampos.map((s) => s.nome).join(' · ')}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {TIPO_CAMPO[campo.tipo] || campo.tipo}
                    {campo.unidade ? ` (${campo.unidade})` : ''}
                  </Badge>
                </div>
              ),
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModeloVendo(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão de modelo próprio */}
      <AlertDialog
        open={!!modeloParaExcluir}
        onOpenChange={(aberto) => !aberto && setModeloParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir formulário?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá o modelo "{modeloParaExcluir?.nome}" da sua organização. Essa ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluirModeloProprio}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
