/* Catálogo de EPIs — cadastrado pelo próprio profissional (técnico/gestor da
   organização), não pela plataforma. Cada EPI pode ser "global" (vale para
   todas as empresas clientes do escritório) ou exclusivo de uma empresa
   específica; só quando é exclusivo de uma empresa é que faz sentido
   vincular a funções dela (função pertence a uma empresa). O número do CA
   pode ser consultado em consultaca.com para pré-preencher fabricante,
   validade e descrição — é uma consulta best-effort a um site de terceiros,
   então sempre dá pra completar/corrigir os campos à mão. */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getEmpresas, type Empresa } from '@/services/empresas'
import {
  getAgentesCatalogo,
  type AgenteCatalogo,
  type TipoAgente,
} from '@/services/agentesCatalogo'
import { getFuncoesSst, type FuncaoSst } from '@/services/funcoesSst'
import {
  consultarCa,
  createEpiCatalogo,
  dataBrParaIso,
  deleteEpiCatalogo,
  getEpisCatalogo,
  updateEpiCatalogo,
  type EpiCatalogo,
  type EpiCatalogoInput,
} from '@/services/episCatalogo'

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
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

const GLOBAL = 'global'

const TIPOS: TipoAgente[] = [
  'Físico',
  'Químico',
  'Biológico',
  'Ergonômico',
  'Acidente',
  'Psicossocial',
]

const EPI_VAZIO: EpiCatalogoInput = {
  organizacao_id: '',
  empresa_id: '',
  numero_ca: '',
  validade_ca: '',
  fabricante: '',
  especificacoes: '',
  agentes_protegidos_ids: [],
  funcoes_ids: [],
}

export function CatalogoEpisTab() {
  const { user } = useAuth()
  const organizacaoId = (user?.organizacao_id as string) || ''
  const podeEditar = user?.papel !== 'executor'

  const [epis, setEpis] = useState<EpiCatalogo[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [agentes, setAgentes] = useState<AgenteCatalogo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroEmpresa, setFiltroEmpresa] = useState('todas')

  const [dialogAberto, setDialogAberto] = useState(false)
  const [editando, setEditando] = useState<EpiCatalogo | null>(null)
  const [form, setForm] = useState<EpiCatalogoInput>(EPI_VAZIO)
  const [funcoesDaEmpresa, setFuncoesDaEmpresa] = useState<FuncaoSst[]>([])
  const [carregandoFuncoes, setCarregandoFuncoes] = useState(false)
  const [consultando, setConsultando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [excluir, setExcluir] = useState<EpiCatalogo | null>(null)

  const carregar = () => {
    setCarregando(true)
    Promise.all([getEpisCatalogo(), getEmpresas(), getAgentesCatalogo()])
      .then(([e, emp, ag]) => {
        setEpis(e)
        setEmpresas(emp)
        setAgentes(ag)
      })
      .catch((error) =>
        toast.error('Não foi possível carregar o catálogo de EPIs', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [])

  // Funções da empresa escolhida no formulário — só carrega quando o EPI
  // deixa de ser global e passa a ser exclusivo de uma empresa.
  useEffect(() => {
    if (!form.empresa_id) {
      setFuncoesDaEmpresa([])
      return
    }
    setCarregandoFuncoes(true)
    getFuncoesSst(form.empresa_id)
      .then(setFuncoesDaEmpresa)
      .catch((error) =>
        toast.error('Não foi possível carregar as funções da empresa', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregandoFuncoes(false))
  }, [form.empresa_id])

  const nomeEmpresa = (id?: string) =>
    empresas.find((e) => e.id === id)?.nome_fantasia ||
    empresas.find((e) => e.id === id)?.razao_social ||
    '—'

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return epis.filter((ep) => {
      if (filtroEmpresa === GLOBAL && ep.empresa_id) return false
      if (filtroEmpresa !== 'todas' && filtroEmpresa !== GLOBAL && ep.empresa_id !== filtroEmpresa)
        return false
      if (!termo) return true
      return (
        ep.numero_ca.toLowerCase().includes(termo) ||
        (ep.fabricante || '').toLowerCase().includes(termo)
      )
    })
  }, [epis, busca, filtroEmpresa])

  const abrirNovo = () => {
    setEditando(null)
    setForm({ ...EPI_VAZIO, organizacao_id: organizacaoId })
    setDialogAberto(true)
  }

  const abrirEdicao = (ep: EpiCatalogo) => {
    setEditando(ep)
    setForm({
      organizacao_id: ep.organizacao_id,
      empresa_id: ep.empresa_id || '',
      numero_ca: ep.numero_ca,
      validade_ca: ep.validade_ca ? ep.validade_ca.slice(0, 10) : '',
      fabricante: ep.fabricante || '',
      especificacoes: ep.especificacoes || '',
      agentes_protegidos_ids: ep.agentes_protegidos_ids || [],
      funcoes_ids: ep.funcoes_ids || [],
    })
    setDialogAberto(true)
  }

  const alternarAgente = (id: string) => {
    setForm((f) => {
      const atuais = f.agentes_protegidos_ids || []
      return {
        ...f,
        agentes_protegidos_ids: atuais.includes(id)
          ? atuais.filter((a) => a !== id)
          : [...atuais, id],
      }
    })
  }

  const alternarFuncao = (id: string) => {
    setForm((f) => {
      const atuais = f.funcoes_ids || []
      return {
        ...f,
        funcoes_ids: atuais.includes(id) ? atuais.filter((a) => a !== id) : [...atuais, id],
      }
    })
  }

  const consultarCaAtual = async () => {
    const numero = (form.numero_ca || '').trim()
    if (!numero) {
      toast.error('Digite o número do CA antes de consultar')
      return
    }
    setConsultando(true)
    try {
      const r = await consultarCa(numero)
      if (!r.encontrado) {
        toast.error('CA não encontrado', {
          description: r.motivo || 'Confira o número e tente de novo.',
        })
        return
      }
      setForm((f) => ({
        ...f,
        fabricante: r.fabricante || f.fabricante,
        validade_ca: r.validade_ca ? dataBrParaIso(r.validade_ca) : f.validade_ca,
        especificacoes: r.descricao || f.especificacoes,
      }))
      toast.success(`CA ${r.situacao || 'consultado'}`, {
        description: r.fabricante || undefined,
      })
    } catch (error) {
      toast.error('Não foi possível consultar o CA agora', { description: getErrorMessage(error) })
    } finally {
      setConsultando(false)
    }
  }

  const salvar = async () => {
    if (!form.numero_ca.trim()) {
      toast.error('Informe o número do CA')
      return
    }
    setSalvando(true)
    try {
      const payload: EpiCatalogoInput = {
        ...form,
        organizacao_id: organizacaoId,
        empresa_id: form.empresa_id || '',
        // Vínculo com funções só faz sentido se o EPI é exclusivo de uma empresa.
        funcoes_ids: form.empresa_id ? form.funcoes_ids : [],
      }
      if (editando) {
        const atualizado = await updateEpiCatalogo(editando.id, payload)
        setEpis((prev) => prev.map((e) => (e.id === editando.id ? atualizado : e)))
        toast.success('EPI atualizado')
      } else {
        const criado = await createEpiCatalogo(payload)
        setEpis((prev) => [...prev, criado])
        toast.success('EPI cadastrado')
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
      await deleteEpiCatalogo(excluir.id)
      setEpis((prev) => prev.filter((e) => e.id !== excluir.id))
      toast.success('EPI removido do catálogo')
    } catch (error) {
      toast.error('Não foi possível excluir', { description: getErrorMessage(error) })
    } finally {
      setExcluir(null)
    }
  }

  const formatarData = (iso?: string) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    } catch {
      return '—'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Catálogo de EPIs</h2>
          <p className="text-sm text-muted-foreground">
            Cadastre os EPIs usados, vinculando a que riscos eles protegem e, quando exclusivos de
            uma empresa, a quais funções dela. Um catálogo pode ser global (todas as empresas) ou
            exclusivo de uma só.
          </p>
        </div>
        {podeEditar && (
          <Button onClick={abrirNovo}>
            <Plus className="mr-2 h-4 w-4" />
            Novo EPI
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por CA ou fabricante..."
            className="pl-9"
          />
        </div>
        <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as empresas</SelectItem>
            <SelectItem value={GLOBAL}>Catálogo global</SelectItem>
            {empresas.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome_fantasia || e.razao_social}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {carregando ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card py-16 text-center text-sm text-muted-foreground">
          Nenhum EPI cadastrado ainda.
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº CA</TableHead>
                <TableHead>Fabricante</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead>Protege contra</TableHead>
                {podeEditar && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((ep) => (
                <TableRow key={ep.id}>
                  <TableCell className="font-mono text-sm">{ep.numero_ca}</TableCell>
                  <TableCell className="text-sm">{ep.fabricante || '—'}</TableCell>
                  <TableCell className="text-sm">{formatarData(ep.validade_ca)}</TableCell>
                  <TableCell>
                    <Badge variant={ep.empresa_id ? 'secondary' : 'outline'}>
                      {ep.empresa_id ? nomeEmpresa(ep.empresa_id) : 'Global'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-64">
                    <div className="flex flex-wrap gap-1">
                      {(ep.expand?.agentes_protegidos_ids || []).length === 0
                        ? '—'
                        : (ep.expand?.agentes_protegidos_ids || []).map((a) => (
                            <Badge key={a.id} variant="outline" className="text-[10px]">
                              {a.nome}
                            </Badge>
                          ))}
                    </div>
                  </TableCell>
                  {podeEditar && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => abrirEdicao(ep)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setExcluir(ep)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar EPI' : 'Cadastrar novo EPI'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Número do CA</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.numero_ca}
                    onChange={(e) => setForm((f) => ({ ...f, numero_ca: e.target.value }))}
                    placeholder="Ex.: 4026"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={consultarCaAtual}
                    disabled={consultando}
                  >
                    {consultando ? 'Consultando...' : 'Consultar'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Consulta pública em consultaca.com — confira os dados antes de salvar.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Data de validade do CA</Label>
                <Input
                  type="date"
                  value={form.validade_ca || ''}
                  onChange={(e) => setForm((f) => ({ ...f, validade_ca: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fabricante</Label>
                <Input
                  value={form.fabricante || ''}
                  onChange={(e) => setForm((f) => ({ ...f, fabricante: e.target.value }))}
                  placeholder="Ex.: MSA, 3M"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Escopo / Empresa</Label>
                <Select
                  value={form.empresa_id || GLOBAL}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      empresa_id: v === GLOBAL ? '' : v,
                      funcoes_ids: v === GLOBAL ? [] : f.funcoes_ids,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GLOBAL}>Catálogo Global (todas as empresas)</SelectItem>
                    {empresas.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome_fantasia || e.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Especificações / Observações</Label>
              <Textarea
                value={form.especificacoes || ''}
                onChange={(e) => setForm((f) => ({ ...f, especificacoes: e.target.value }))}
                rows={2}
                placeholder="Atenuação, restrições de uso, aprovações..."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Vincular para proteção contra riscos
                </Label>
                <div className="max-h-52 space-y-3 overflow-y-auto rounded-md border p-3">
                  {TIPOS.map((tipo) => {
                    const doTipo = agentes.filter((a) => a.tipo === tipo)
                    if (doTipo.length === 0) return null
                    return (
                      <div key={tipo} className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {tipo}
                        </p>
                        {doTipo.map((a) => (
                          <label key={a.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={(form.agentes_protegidos_ids || []).includes(a.id)}
                              onCheckedChange={() => alternarAgente(a.id)}
                            />
                            {a.nome}
                          </label>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Vincular a funções específicas</Label>
                <div className="flex max-h-52 flex-col overflow-y-auto rounded-md border p-3">
                  {!form.empresa_id ? (
                    <p className="m-auto max-w-40 text-center text-xs text-muted-foreground">
                      Para vincular a funções, o EPI deve ser associado a uma empresa específica.
                    </p>
                  ) : carregandoFuncoes ? (
                    <p className="text-xs text-muted-foreground">Carregando funções...</p>
                  ) : funcoesDaEmpresa.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Essa empresa ainda não tem funções cadastradas.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {funcoesDaEmpresa.map((f) => (
                        <label key={f.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={(form.funcoes_ids || []).includes(f.id)}
                            onCheckedChange={() => alternarFuncao(f.id)}
                          />
                          {f.nome}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar EPI'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluir} onOpenChange={(open) => !open && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir CA {excluir?.numero_ca}?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso remove o EPI do catálogo. Avaliações de risco que já citam esse equipamento em
              texto livre não são afetadas.
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

export default CatalogoEpisTab
