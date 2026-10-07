/* Catálogo de agentes e perigos: o catálogo oficial da plataforma (somente
   leitura, mantido pelo admin) mais os agentes customizados da própria
   organização (criar, editar, excluir). Como o oficial não pode ser editado
   direto, cada linha oficial tem um botão "Duplicar para editar" que cria
   uma cópia na organização — é ali que fonte geradora, danos à saúde e
   medidas de controle viram exemplos que o usuário pode alterar.
   Os campos de código eSocial ficam vazios de propósito quando não
   conferidos na fonte oficial (Tabela 24 só cobre agentes físicos, químicos
   e biológicos ligados à aposentadoria especial — ergonômico e acidente não
   têm código próprio nela). */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ChevronRight, Copy, Pencil, Plus, Search, Trash2 } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  createAgenteCatalogo,
  deleteAgenteCatalogo,
  duplicarAgenteParaOrganizacao,
  ESCOPOS_PADRAO,
  getAgentesCatalogo,
  updateAgenteCatalogo,
  type AgenteCatalogo,
  type AgenteCatalogoInput,
  type TipoAgente,
} from '@/services/agentesCatalogo'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const TIPOS: TipoAgente[] = [
  'Físico',
  'Químico',
  'Biológico',
  'Ergonômico',
  'Acidente',
  'Psicossocial',
]

const AGENTE_VAZIO: AgenteCatalogoInput = {
  nome: '',
  tipo: 'Físico',
  escopo: 'Geral',
  codigo_esocial: '',
  fonte_geradora_tipica: '',
  danos_saude_tipicos: '',
  medidas_controle_tipicas: '',
}

// Sentinela pro select do escopo cair em "digitar outro valor".
const ESCOPO_OUTRO = '__outro__'

const COR_TIPO: Record<string, string> = {
  Físico: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  Químico: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  Biológico: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  Ergonômico: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  Acidente: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  Psicossocial: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
}

/** Uma linha do catálogo: resumo sempre visível e detalhes (fonte, danos, medidas) ao expandir. */
function LinhaAgente({
  agente: a,
  limite,
  podeEditar,
  onEditar,
  onExcluir,
  onDuplicar,
}: {
  agente: AgenteCatalogo
  limite: string
  podeEditar: boolean
  onEditar: () => void
  onExcluir: () => void
  onDuplicar: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const detalhes = [
    { titulo: 'Fonte geradora', texto: a.fonte_geradora_tipica },
    { titulo: 'Danos à saúde', texto: a.danos_saude_tipicos },
    { titulo: 'Medidas de controle', texto: a.medidas_controle_tipicas },
  ]
  const meta = [
    a.cas ? `CAS ${a.cas}` : null,
    a.anexo_nr15 ? `NR-15 anexo ${a.anexo_nr15}` : null,
    a.limite_tolerancia_valor != null ? `LT ${limite}` : null,
    a.efeito_saude_aiha != null ? `efeito AIHA ${a.efeito_saude_aiha}` : null,
  ].filter(Boolean)

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          <ChevronRight
            className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${aberto ? 'rotate-90' : ''}`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${COR_TIPO[a.tipo] || 'bg-muted'}`}
              >
                {a.tipo}
              </span>
              <span className="font-semibold leading-snug">{a.nome}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-[10px] font-normal">
                {a.escopo || 'Geral'}
              </Badge>
              <Badge
                variant={a.organizacao_id ? 'outline' : 'default'}
                className="text-[10px] font-normal"
              >
                {a.organizacao_id ? 'Organização' : 'Oficial'}
              </Badge>
              {a.codigo_esocial && <span className="font-mono">eSocial {a.codigo_esocial}</span>}
              {meta.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </button>
        {podeEditar && (
          <div className="flex shrink-0 items-center gap-1">
            {a.organizacao_id ? (
              <>
                <Button size="icon" variant="ghost" onClick={onEditar} title="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={onExcluir} title="Excluir">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={onDuplicar}>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Duplicar para editar
              </Button>
            )}
          </div>
        )}
      </div>
      {aberto && (
        <div className="grid grid-cols-1 gap-4 border-t bg-muted/30 p-4 md:grid-cols-3">
          {detalhes.map((d) => (
            <div key={d.titulo}>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {d.titulo}
              </p>
              <p className="text-sm leading-relaxed">{d.texto || '—'}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export function CatalogoAgentesTab() {
  const { user } = useAuth()
  const organizacaoId = (user?.organizacao_id as string) || ''
  const podeEditar = user?.papel !== 'executor'

  const [agentes, setAgentes] = useState<AgenteCatalogo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState('todos')
  const [escopoFiltro, setEscopoFiltro] = useState('todos')

  const [dialogAberto, setDialogAberto] = useState(false)
  const [editando, setEditando] = useState<AgenteCatalogo | null>(null)
  const [form, setForm] = useState<AgenteCatalogoInput>(AGENTE_VAZIO)
  const [escopoCustom, setEscopoCustom] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [excluir, setExcluir] = useState<AgenteCatalogo | null>(null)

  useEffect(() => {
    getAgentesCatalogo()
      .then(setAgentes)
      .catch((error) =>
        toast.error('Não foi possível carregar o catálogo', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregando(false))
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return agentes.filter((a) => {
      if (tipo !== 'todos' && a.tipo !== tipo) return false
      if (escopoFiltro !== 'todos' && (a.escopo || 'Geral') !== escopoFiltro) return false
      if (!termo) return true
      return (
        a.nome.toLowerCase().includes(termo) ||
        (a.sinonimos || '').toLowerCase().includes(termo) ||
        (a.cas || '').toLowerCase().includes(termo) ||
        (a.codigo_esocial || '').includes(termo)
      )
    })
  }, [agentes, busca, tipo, escopoFiltro])

  // Opções do filtro de escopo: os presets primeiro, depois qualquer valor
  // customizado que já exista nos dados (a pessoa pode ter digitado outro).
  const opcoesEscopo = useMemo(() => {
    const customizados = Array.from(
      new Set(
        agentes
          .map((a) => a.escopo)
          .filter(
            (e): e is string =>
              !!e && !ESCOPOS_PADRAO.includes(e as (typeof ESCOPOS_PADRAO)[number]),
          ),
      ),
    ).sort()
    return [...ESCOPOS_PADRAO, ...customizados]
  }, [agentes])

  const limite = (a: AgenteCatalogo) =>
    a.limite_tolerancia_valor != null
      ? `${a.limite_tolerancia_valor} ${a.limite_tolerancia_unidade || ''}`.trim()
      : a.tlv_acgih_valor != null
        ? `${a.tlv_acgih_valor} ${a.tlv_acgih_unidade || ''} (ACGIH)`.trim()
        : '—'

  const abrirNovo = () => {
    setEditando(null)
    setForm(AGENTE_VAZIO)
    setEscopoCustom(false)
    setDialogAberto(true)
  }

  const abrirEdicao = (a: AgenteCatalogo) => {
    setEditando(a)
    const escopo = a.escopo || 'Geral'
    setForm({
      nome: a.nome,
      tipo: a.tipo,
      escopo,
      cas: a.cas || '',
      sinonimos: a.sinonimos || '',
      codigo_esocial: a.codigo_esocial || '',
      codigo_anexo_iv: a.codigo_anexo_iv || '',
      fonte_geradora_tipica: a.fonte_geradora_tipica || '',
      danos_saude_tipicos: a.danos_saude_tipicos || '',
      medidas_controle_tipicas: a.medidas_controle_tipicas || '',
    })
    setEscopoCustom(!ESCOPOS_PADRAO.includes(escopo as (typeof ESCOPOS_PADRAO)[number]))
    setDialogAberto(true)
  }

  const duplicar = async (a: AgenteCatalogo) => {
    try {
      const copia = await duplicarAgenteParaOrganizacao(a, organizacaoId)
      toast.success('Cópia criada na sua organização — já pode editar os exemplos')
      setAgentes((prev) => [...prev, copia])
      abrirEdicao(copia)
    } catch (error) {
      toast.error('Não foi possível duplicar', { description: getErrorMessage(error) })
    }
  }

  const salvar = async () => {
    if (!form.nome.trim()) {
      toast.error('Informe o nome do agente/fator de risco')
      return
    }
    setSalvando(true)
    try {
      if (editando) {
        const atualizado = await updateAgenteCatalogo(editando.id, form)
        setAgentes((prev) => prev.map((a) => (a.id === editando.id ? atualizado : a)))
        toast.success('Agente atualizado')
      } else {
        const criado = await createAgenteCatalogo({ ...form, organizacao_id: organizacaoId })
        setAgentes((prev) => [...prev, criado])
        toast.success('Agente adicionado ao catálogo da organização')
      }
      setDialogAberto(false)
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  const confirmarExclusao = async () => {
    if (!excluir) return
    try {
      await deleteAgenteCatalogo(excluir.id)
      setAgentes((prev) => prev.filter((a) => a.id !== excluir.id))
      toast.success('Agente removido do catálogo da organização')
    } catch (error) {
      toast.error('Não foi possível excluir', { description: getErrorMessage(error) })
    } finally {
      setExcluir(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Catálogo de agentes e perigos</h2>
          <p className="text-sm text-muted-foreground">
            Nome, tipo (Físico, Químico, Biológico, Ergonômico, Acidente), código eSocial (Tabela
            24, quando existe para o grupo), e exemplos de fonte geradora, danos à saúde e medidas
            de controle — todos editáveis. Agentes "Oficial" são da plataforma; duplique para editar
            os exemplos na sua organização.
          </p>
        </div>
        {podeEditar && (
          <Button onClick={abrirNovo}>
            <Plus className="mr-2 h-4 w-4" />
            Novo agente
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, sinônimo, CAS ou código eSocial..."
            className="pl-9"
          />
        </div>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {TIPOS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={escopoFiltro} onValueChange={setEscopoFiltro}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os escopos</SelectItem>
            {opcoesEscopo.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {carregando ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card py-16 text-center text-sm text-muted-foreground">
          Nenhum agente para esse filtro.
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {filtrados.length} {filtrados.length === 1 ? 'agente' : 'agentes'}. Clique em um agente
            para ver fonte geradora, danos à saúde e medidas de controle.
          </p>
          {filtrados.map((a) => (
            <LinhaAgente
              key={a.id}
              agente={a}
              limite={limite(a)}
              podeEditar={podeEditar}
              onEditar={() => abrirEdicao(a)}
              onExcluir={() => setExcluir(a)}
              onDuplicar={() => duplicar(a)}
            />
          ))}
        </div>
      )}

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar agente' : 'Novo agente do catálogo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nome / agente ou fator de risco</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex.: Ruído contínuo ou intermitente"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as TipoAgente }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Escopo</Label>
                {escopoCustom ? (
                  <div className="flex gap-2">
                    <Input
                      value={form.escopo || ''}
                      onChange={(e) => setForm((f) => ({ ...f, escopo: e.target.value }))}
                      placeholder="Digite o escopo (ex.: Periculosidade)"
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEscopoCustom(false)
                        setForm((f) => ({ ...f, escopo: 'Geral' }))
                      }}
                    >
                      Usar lista
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={form.escopo || 'Geral'}
                    onValueChange={(v) => {
                      if (v === ESCOPO_OUTRO) {
                        setEscopoCustom(true)
                        setForm((f) => ({ ...f, escopo: '' }))
                      } else {
                        setForm((f) => ({ ...f, escopo: v }))
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESCOPOS_PADRAO.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                      <SelectItem value={ESCOPO_OUTRO}>Outro (digitar)...</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  Para que serve esse agente no catálogo — além dos 3 padrões, você pode digitar
                  qualquer outro valor.
                </p>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Código eSocial (Tabela 24)</Label>
                <Input
                  value={form.codigo_esocial || ''}
                  onChange={(e) => setForm((f) => ({ ...f, codigo_esocial: e.target.value }))}
                  placeholder="Ex.: 01.01.001 (deixe vazio se não conferido)"
                />
              </div>
              <div className="space-y-1.5">
                <Label>CAS (se químico)</Label>
                <Input
                  value={form.cas || ''}
                  onChange={(e) => setForm((f) => ({ ...f, cas: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sinônimos</Label>
                <Input
                  value={form.sinonimos || ''}
                  onChange={(e) => setForm((f) => ({ ...f, sinonimos: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Fonte geradora (exemplos)</Label>
              <Textarea
                value={form.fonte_geradora_tipica || ''}
                onChange={(e) => setForm((f) => ({ ...f, fonte_geradora_tipica: e.target.value }))}
                rows={2}
                placeholder="Ex.: máquinas, motores, ferramentas..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Possíveis danos à saúde (exemplos)</Label>
              <Textarea
                value={form.danos_saude_tipicos || ''}
                onChange={(e) => setForm((f) => ({ ...f, danos_saude_tipicos: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Medidas de controle padrão (exemplos)</Label>
              <Textarea
                value={form.medidas_controle_tipicas || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, medidas_controle_tipicas: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluir} onOpenChange={(open) => !open && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{excluir?.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Só remove da sua organização — o catálogo oficial não é afetado. Avaliações de risco
              que já usam esse agente não são apagadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CatalogoAgentesTab
