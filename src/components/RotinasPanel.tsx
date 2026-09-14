/* Painel de rotinas recorrentes — exibido dentro da página Agenda. */
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CalendarClock, Pause, Play, Plus, Trash2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { toPocketBaseDate } from '@/lib/date'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import { getEmpresas, type Empresa } from '@/services/empresas'
import { getTiposVistoria, type TipoVistoria } from '@/services/tiposVistoria'
import {
  createRotina,
  deleteRotina,
  getRotinas,
  toggleRotina,
  type FrequenciaRotina,
  type Rotina,
} from '@/services/rotinas'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const FREQUENCIA_LABEL: Record<FrequenciaRotina, string> = {
  semanal: 'Semanal',
  mensal: 'Mensal',
  bimestral: 'Bimestral',
  trimestral: 'A cada 3 meses',
  semestral: 'A cada 6 meses',
  anual: 'Anual',
}

export default function RotinasPanel() {
  const [rotinas, setRotinas] = useState<Rotina[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [tipos, setTipos] = useState<TipoVistoria[]>([])
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    empresa_id: '',
    tipo_vistoria_id: '',
    frequencia: 'trimestral' as FrequenciaRotina,
    proxima_data: '',
  })

  const loadData = useCallback(async () => {
    try {
      const [rotinasData, empresasData, tiposData] = await Promise.all([
        getRotinas(),
        getEmpresas(),
        getTiposVistoria(),
      ])
      setRotinas(rotinasData)
      setEmpresas(empresasData)
      setTipos(tiposData)
    } catch (error) {
      toast.error('Não foi possível carregar as rotinas', { description: getErrorMessage(error) })
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onSubmit = async () => {
    setSubmitting(true)
    try {
      const org = await getMinhaOrganizacao()
      await createRotina({
        organizacao_id: org.id,
        empresa_id: form.empresa_id,
        tipo_vistoria_id: form.tipo_vistoria_id,
        frequencia: form.frequencia,
        proxima_data: toPocketBaseDate(form.proxima_data),
        ativo: true,
      })
      toast.success('Rotina criada — a próxima vistoria será agendada automaticamente')
      setOpen(false)
      setForm({ empresa_id: '', tipo_vistoria_id: '', frequencia: 'trimestral', proxima_data: '' })
      loadData()
    } catch (error) {
      toast.error('Não foi possível criar a rotina', { description: getErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  const onToggle = async (rotina: Rotina) => {
    try {
      await toggleRotina(rotina.id, !rotina.ativo)
      loadData()
    } catch (error) {
      toast.error('Não foi possível atualizar a rotina', { description: getErrorMessage(error) })
    }
  }

  const onDelete = async (rotina: Rotina) => {
    try {
      await deleteRotina(rotina.id)
      loadData()
    } catch (error) {
      toast.error('Não foi possível excluir a rotina', { description: getErrorMessage(error) })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">Rotinas recorrentes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Quando você conclui uma vistoria vinculada a uma rotina, a próxima é agendada
            automaticamente.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova rotina
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova rotina recorrente</DialogTitle>
              <DialogDescription>
                Escolha a empresa, o tipo de vistoria, a frequência e a data da próxima visita.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Select
                  value={form.empresa_id || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, empresa_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        empresas.length ? 'Selecione a empresa' : 'Nenhuma empresa cadastrada'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nome_fantasia || empresa.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de vistoria</Label>
                <Select
                  value={form.tipo_vistoria_id || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, tipo_vistoria_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.nr_referencia && tipo.nome.startsWith(tipo.nr_referencia)
                          ? tipo.nome
                          : tipo.nr_referencia
                            ? `${tipo.nr_referencia} — ${tipo.nome}`
                            : tipo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select
                  value={form.frequencia}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, frequencia: v as FrequenciaRotina }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FREQUENCIA_LABEL) as FrequenciaRotina[]).map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {FREQUENCIA_LABEL[freq]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Próxima visita</Label>
                <Input
                  type="date"
                  value={form.proxima_data}
                  onChange={(e) => setForm((f) => ({ ...f, proxima_data: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={onSubmit}
                disabled={
                  submitting || !form.empresa_id || !form.tipo_vistoria_id || !form.proxima_data
                }
              >
                {submitting ? 'Criando...' : 'Criar rotina'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {rotinas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
            <CalendarClock className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma rotina ainda. Crie uma para o cliente visitado a cada 3 meses ou semanalmente.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rotinas.map((rotina) => (
              <div
                key={rotina.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">
                    {rotina.expand?.empresa_id?.nome_fantasia ||
                      rotina.expand?.empresa_id?.razao_social ||
                      '—'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {rotina.expand?.tipo_vistoria_id?.nr_referencia &&
                    !rotina.expand?.tipo_vistoria_id?.nome.startsWith(
                      rotina.expand.tipo_vistoria_id.nr_referencia,
                    )
                      ? `${rotina.expand.tipo_vistoria_id.nr_referencia} — `
                      : ''}
                    {rotina.expand?.tipo_vistoria_id?.nome || '—'} ·{' '}
                    {FREQUENCIA_LABEL[rotina.frequencia]} · próxima:{' '}
                    {rotina.proxima_data
                      ? new Date(rotina.proxima_data).toLocaleDateString('pt-BR')
                      : '—'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={rotina.ativo ? 'default' : 'secondary'}>
                    {rotina.ativo ? 'Ativa' : 'Pausada'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => onToggle(rotina)}>
                    {rotina.ativo ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(rotina)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
