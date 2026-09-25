/* Painel de rotinas recorrentes — exibido dentro da página Agenda.
   A rotina tem os mesmos dados de uma vistoria avulsa: vários checklists,
   formulários, responsável e horário. Ao criar a rotina, a primeira vistoria
   já entra na agenda; quando ela é concluída, o servidor agenda a próxima. */
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CalendarClock, Pause, Pencil, Play, Plus, Trash2, X } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { formatarDataCalendario, toPocketBaseDate } from '@/lib/date'
import { ehTabelaDeMultas, nomeNormaCompleto, rotuloCurtoNorma } from '@/lib/normas'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import { getEmpresas, type Empresa } from '@/services/empresas'
import { getTiposVistoria, type TipoVistoria } from '@/services/tiposVistoria'
import { getResponsaveisTecnicos, type ResponsavelTecnico } from '@/services/responsaveisTecnicos'
import { getModelosFormulario, type ModeloFormulario } from '@/services/formularios'
import { createVistoria, getVistoria, updateVistoria } from '@/services/vistorias'
import {
  createRotina,
  deleteRotina,
  getRotinas,
  toggleRotina,
  updateRotina,
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

const DURACOES = [
  { v: '60', l: '1 hora' },
  { v: '120', l: '2 horas' },
  { v: '180', l: '3 horas' },
  { v: '240', l: '4 horas (meio período)' },
  { v: '480', l: '8 horas (dia todo)' },
]

interface FormRotina {
  empresa_id: string
  checklists: string[]
  formularios: string[]
  frequencia: FrequenciaRotina
  proxima_data: string
  hora_inicio: string
  duracao_min: string
  responsavel_tecnico_id: string
}

const FORM_VAZIO: FormRotina = {
  empresa_id: '',
  checklists: [],
  formularios: [],
  frequencia: 'trimestral',
  proxima_data: '',
  hora_inicio: '',
  duracao_min: '120',
  responsavel_tecnico_id: '',
}

const nomeEmpresa = (e?: Empresa) => e?.nome_fantasia || e?.razao_social || '—'

export default function RotinasPanel() {
  const [rotinas, setRotinas] = useState<Rotina[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [tipos, setTipos] = useState<TipoVistoria[]>([])
  const [modelos, setModelos] = useState<ModeloFormulario[]>([])
  const [responsaveis, setResponsaveis] = useState<ResponsavelTecnico[]>([])
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Rotina | null>(null)
  const [excluindo, setExcluindo] = useState<Rotina | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormRotina>(FORM_VAZIO)

  const loadData = useCallback(async () => {
    try {
      const [rotinasData, empresasData, tiposData, org] = await Promise.all([
        getRotinas(),
        getEmpresas(),
        getTiposVistoria(),
        getMinhaOrganizacao(),
      ])
      setRotinas(rotinasData)
      setEmpresas(empresasData)
      setTipos(tiposData.filter((t) => !ehTabelaDeMultas(t)))
      getResponsaveisTecnicos(org.id)
        .then(setResponsaveis)
        .catch(() => setResponsaveis([]))
      getModelosFormulario()
        .then((ms) => setModelos(ms.filter((m) => m.ativo)))
        .catch(() => setModelos([]))
    } catch (error) {
      toast.error('Não foi possível carregar as rotinas', { description: getErrorMessage(error) })
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const abrirNova = () => {
    setEditando(null)
    const padrao = responsaveis.find((rt) => rt.padrao)
    setForm({ ...FORM_VAZIO, responsavel_tecnico_id: padrao?.id || '' })
    setOpen(true)
  }

  const abrirEdicao = (rotina: Rotina) => {
    setEditando(rotina)
    setForm({
      empresa_id: rotina.empresa_id,
      checklists: [rotina.tipo_vistoria_id, ...(rotina.checklists || [])].filter(Boolean),
      formularios: rotina.formularios || [],
      frequencia: rotina.frequencia,
      proxima_data: (rotina.proxima_data || '').slice(0, 10),
      hora_inicio: rotina.hora_inicio || '',
      duracao_min: String(rotina.duracao_min || 120),
      responsavel_tecnico_id: rotina.responsavel_tecnico_id || '',
    })
    setOpen(true)
  }

  const alternar = (campo: 'checklists' | 'formularios', id: string) =>
    setForm((f) => ({
      ...f,
      [campo]: f[campo].includes(id) ? f[campo].filter((x) => x !== id) : [...f[campo], id],
    }))

  // Campos que a rotina passa para cada vistoria que ela agenda.
  const dadosDaVisita = () => ({
    tipo_vistoria_id: form.checklists[0],
    checklists: form.checklists.slice(1),
    formularios: form.formularios,
    responsavel_tecnico_id: form.responsavel_tecnico_id || undefined,
    hora_inicio: form.hora_inicio,
    duracao_min: form.hora_inicio ? Number(form.duracao_min || 120) : 0,
  })

  const onSubmit = async () => {
    setSubmitting(true)
    try {
      const org = await getMinhaOrganizacao()
      const visita = dadosDaVisita()
      const dataPb = toPocketBaseDate(form.proxima_data)

      if (editando) {
        await updateRotina(editando.id, {
          empresa_id: form.empresa_id,
          frequencia: form.frequencia,
          proxima_data: dataPb,
          ...visita,
          responsavel_tecnico_id: form.responsavel_tecnico_id,
        })
        // A vistoria já agendada pela rotina acompanha a mudança.
        let atualizouVisita = false
        if (editando.ultima_vistoria_id) {
          try {
            const pendente = await getVistoria(editando.ultima_vistoria_id)
            if (pendente.status === 'agendada') {
              await updateVistoria(pendente.id, {
                empresa_id: form.empresa_id,
                data_agendada: dataPb,
                ...visita,
                responsavel_tecnico_id: form.responsavel_tecnico_id,
              })
              atualizouVisita = true
            }
          } catch {
            // vistoria apagada: só a rotina muda
          }
        }
        toast.success(
          atualizouVisita
            ? 'Rotina atualizada, junto com a vistoria já agendada'
            : 'Rotina atualizada. Vale a partir da próxima vistoria agendada por ela.',
        )
      } else {
        const rotina = await createRotina({
          organizacao_id: org.id,
          empresa_id: form.empresa_id,
          frequencia: form.frequencia,
          proxima_data: dataPb,
          ativo: true,
          ...visita,
        })
        // Primeira visita já na agenda. O prefixo "rot-<id>-" liga a vistoria
        // à rotina; ao concluir, o servidor agenda a seguinte.
        const empresa = empresas.find((x) => x.id === form.empresa_id)
        const vistoria = await createVistoria({
          organizacao_id: org.id,
          empresa_id: form.empresa_id,
          data_agendada: dataPb,
          status: 'agendada',
          ...visita,
          local_vistoria: empresa?.endereco || '',
          contato_local_nome: empresa?.contato_nome || '',
          contato_local_telefone: empresa?.contato_telefone || '',
          client_uuid: `rot-${rotina.id}-${crypto.randomUUID()}`,
        })
        await updateRotina(rotina.id, { ultima_vistoria_id: vistoria.id })
        toast.success('Rotina criada', {
          description: `A primeira vistoria já está na agenda em ${formatarDataCalendario(
            dataPb,
          )}. As próximas entram sozinhas quando cada uma for concluída.`,
        })
      }
      setOpen(false)
      loadData()
    } catch (error) {
      toast.error(
        editando ? 'Não foi possível salvar a rotina' : 'Não foi possível criar a rotina',
        {
          description: getErrorMessage(error),
        },
      )
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

  const onDelete = async () => {
    if (!excluindo) return
    try {
      await deleteRotina(excluindo.id)
      setExcluindo(null)
      loadData()
    } catch (error) {
      toast.error('Não foi possível excluir a rotina', { description: getErrorMessage(error) })
    }
  }

  const rotuloChecklists = (rotina: Rotina) => {
    const lista = [rotina.expand?.tipo_vistoria_id, ...(rotina.expand?.checklists || [])].filter(
      (t): t is TipoVistoria => !!t,
    )
    return lista.length ? lista.map((t) => rotuloCurtoNorma(t)).join(' + ') : '—'
  }

  const podeSalvar =
    !!form.empresa_id && form.checklists.length > 0 && !!form.proxima_data && !submitting

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">Rotinas recorrentes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Para o cliente visitado toda semana, todo mês ou a cada 3 meses. A primeira vistoria
            entra na agenda ao criar a rotina, e cada vistoria concluída agenda a seguinte.
          </p>
        </div>
        <Button size="sm" onClick={abrirNova}>
          <Plus className="mr-2 h-4 w-4" />
          Nova rotina
        </Button>
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
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <div className="font-medium">{nomeEmpresa(rotina.expand?.empresa_id)}</div>
                  <div className="text-sm text-muted-foreground">
                    {rotuloChecklists(rotina)}
                    {rotina.formularios?.length
                      ? ` · ${rotina.formularios.length} formulário${rotina.formularios.length > 1 ? 's' : ''}`
                      : ''}{' '}
                    · {FREQUENCIA_LABEL[rotina.frequencia]}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Próxima:{' '}
                    {rotina.proxima_data ? formatarDataCalendario(rotina.proxima_data) : '—'}
                    {rotina.hora_inicio ? ` às ${rotina.hora_inicio}` : ''}
                    {rotina.expand?.responsavel_tecnico_id?.nome
                      ? ` · ${rotina.expand.responsavel_tecnico_id.nome}`
                      : ''}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={rotina.ativo ? 'default' : 'secondary'}>
                    {rotina.ativo ? 'Ativa' : 'Pausada'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => abrirEdicao(rotina)}
                    aria-label="Editar rotina"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggle(rotina)}
                    aria-label={rotina.ativo ? 'Pausar rotina' : 'Retomar rotina'}
                  >
                    {rotina.ativo ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExcluindo(rotina)}
                    aria-label="Excluir rotina"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar rotina' : 'Nova rotina recorrente'}</DialogTitle>
            <DialogDescription>
              {editando
                ? 'As mudanças valem para a vistoria já agendada pela rotina e para as próximas.'
                : 'Escolha a empresa, os checklists, a frequência e a data da primeira visita.'}
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
                      {nomeEmpresa(empresa)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Checklists (um ou mais)</Label>
              {form.checklists.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.checklists.map((id) => {
                    const t = tipos.find((x) => x.id === id)
                    return (
                      <Badge key={id} variant="secondary" className="gap-1 pr-1">
                        {t ? rotuloCurtoNorma(t) : id}
                        <button
                          type="button"
                          onClick={() => alternar('checklists', id)}
                          className="ml-1 rounded-full p-0.5 hover:bg-accent"
                          aria-label={`Remover ${t ? rotuloCurtoNorma(t) : id}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
              <Select value="" onValueChange={(id) => id && alternar('checklists', id)}>
                <SelectTrigger>
                  <SelectValue placeholder="Adicionar checklist NR..." />
                </SelectTrigger>
                <SelectContent>
                  {tipos
                    .filter((t) => !form.checklists.includes(t.id))
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {nomeNormaCompleto(t)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {modelos.length > 0 && (
              <div className="space-y-2">
                <Label>Formulários de campo (opcional)</Label>
                {form.formularios.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.formularios.map((id) => {
                      const m = modelos.find((x) => x.id === id)
                      return (
                        <Badge key={id} variant="secondary" className="gap-1 pr-1">
                          {m?.nome || id}
                          <button
                            type="button"
                            onClick={() => alternar('formularios', id)}
                            className="ml-1 rounded-full p-0.5 hover:bg-accent"
                            aria-label={`Remover ${m?.nome || id}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                )}
                <Select value="" onValueChange={(id) => id && alternar('formularios', id)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Adicionar formulário..." />
                  </SelectTrigger>
                  <SelectContent>
                    {modelos
                      .filter((m) => !form.formularios.includes(m.id))
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <Label>{editando ? 'Próxima visita' : 'Primeira visita'}</Label>
                <Input
                  type="date"
                  value={form.proxima_data}
                  onChange={(e) => setForm((f) => ({ ...f, proxima_data: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Horário (opcional)</Label>
                <Input
                  type="time"
                  value={form.hora_inicio}
                  onChange={(e) => setForm((f) => ({ ...f, hora_inicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Duração</Label>
                <Select
                  value={form.duracao_min}
                  onValueChange={(v) => setForm((f) => ({ ...f, duracao_min: v }))}
                  disabled={!form.hora_inicio}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURACOES.map((d) => (
                      <SelectItem key={d.v} value={d.v}>
                        {d.l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quem vai fazer</Label>
              <Select
                value={form.responsavel_tecnico_id || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, responsavel_tecnico_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      responsaveis.length
                        ? 'Selecione o responsável'
                        : 'Nenhum responsável cadastrado'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {responsaveis.map((rt) => (
                    <SelectItem key={rt.id} value={rt.id}>
                      {rt.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={onSubmit} disabled={!podeSalvar}>
              {submitting ? 'Salvando...' : editando ? 'Salvar' : 'Criar rotina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluindo} onOpenChange={(v) => !v && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir a rotina?</AlertDialogTitle>
            <AlertDialogDescription>
              Novas vistorias deixam de ser agendadas para{' '}
              {nomeEmpresa(excluindo?.expand?.empresa_id)}. A vistoria que já está na agenda
              continua lá; apague pela tela dela, se for o caso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Excluir rotina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
