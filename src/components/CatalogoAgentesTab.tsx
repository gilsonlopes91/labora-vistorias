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
import { Copy, Pencil, Plus, Search, Trash2 } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  createAgenteCatalogo,
  deleteAgenteCatalogo,
  duplicarAgenteParaOrganizacao,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  codigo_esocial: '',
  fonte_geradora_tipica: '',
  danos_saude_tipicos: '',
  medidas_controle_tipicas: '',
}

export function CatalogoAgentesTab() {
  const { user } = useAuth()
  const organizacaoId = (user?.organizacao_id as string) || ''
  const podeEditar = user?.papel !== 'executor'

  const [agentes, setAgentes] = useState<AgenteCatalogo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState('todos')

  const [dialogAberto, setDialogAberto] = useState(false)
  const [editando, setEditando] = useState<AgenteCatalogo | null>(null)
  const [form, setForm] = useState<AgenteCatalogoInput>(AGENTE_VAZIO)
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
      if (!termo) return true
      return (
        a.nome.toLowerCase().includes(termo) ||
        (a.sinonimos || '').toLowerCase().includes(termo) ||
        (a.cas || '').toLowerCase().includes(termo) ||
        (a.codigo_esocial || '').includes(termo)
      )
    })
  }, [agentes, busca, tipo])

  const limite = (a: AgenteCatalogo) =>
    a.limite_tolerancia_valor != null
      ? `${a.limite_tolerancia_valor} ${a.limite_tolerancia_unidade || ''}`.trim()
      : a.tlv_acgih_valor != null
        ? `${a.tlv_acgih_valor} ${a.tlv_acgih_unidade || ''} (ACGIH)`.trim()
        : '—'

  const abrirNovo = () => {
    setEditando(null)
    setForm(AGENTE_VAZIO)
    setDialogAberto(true)
  }

  const abrirEdicao = (a: AgenteCatalogo) => {
    setEditando(a)
    setForm({
      nome: a.nome,
      tipo: a.tipo,
      cas: a.cas || '',
      sinonimos: a.sinonimos || '',
      codigo_esocial: a.codigo_esocial || '',
      codigo_anexo_iv: a.codigo_anexo_iv || '',
      fonte_geradora_tipica: a.fonte_geradora_tipica || '',
      danos_saude_tipicos: a.danos_saude_tipicos || '',
      medidas_controle_tipicas: a.medidas_controle_tipicas || '',
    })
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
      </div>

      {carregando ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card py-16 text-center text-sm text-muted-foreground">
          Nenhum agente para esse filtro.
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente / fator de risco</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>eSocial</TableHead>
                <TableHead>Fonte geradora</TableHead>
                <TableHead>Danos à saúde</TableHead>
                <TableHead>Medidas de controle</TableHead>
                <TableHead>Origem</TableHead>
                {podeEditar && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="font-medium">{a.nome}</div>
                    {a.cas && <div className="text-xs text-muted-foreground">CAS {a.cas}</div>}
                    <div className="text-xs text-muted-foreground">
                      {a.anexo_nr15 ? `NR-15 anexo ${a.anexo_nr15}` : null}
                      {a.efeito_saude_aiha != null && (
                        <span> · efeito AIHA {a.efeito_saude_aiha}</span>
                      )}
                      {a.limite_tolerancia_valor != null && <span> · LT {limite(a)}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.tipo}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{a.codigo_esocial || '—'}</TableCell>
                  <TableCell className="max-w-56 text-sm text-muted-foreground">
                    {a.fonte_geradora_tipica || '—'}
                  </TableCell>
                  <TableCell className="max-w-56 text-sm text-muted-foreground">
                    {a.danos_saude_tipicos || '—'}
                  </TableCell>
                  <TableCell className="max-w-56 text-sm text-muted-foreground">
                    {a.medidas_controle_tipicas || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.organizacao_id ? 'secondary' : 'default'}>
                      {a.organizacao_id ? 'Organização' : 'Oficial'}
                    </Badge>
                  </TableCell>
                  {podeEditar && (
                    <TableCell className="text-right">
                      {a.organizacao_id ? (
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => abrirEdicao(a)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setExcluir(a)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => duplicar(a)}>
                          <Copy className="mr-2 h-3.5 w-3.5" />
                          Duplicar para editar
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
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
              <div className="space-y-1.5">
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
