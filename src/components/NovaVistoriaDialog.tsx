/* Diálogo compartilhado para agendar uma nova vistoria — usado em /vistorias e /agenda.
   Vistoria multi-item: N checklists NR + N formulários de campo na mesma visita. */
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'

import { toPocketBaseDate } from '@/lib/date'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import { getEmpresas, type Empresa } from '@/services/empresas'
import { getTiposVistoria, type TipoVistoria } from '@/services/tiposVistoria'
import { getResponsaveisTecnicos, type ResponsavelTecnico } from '@/services/responsaveisTecnicos'
import { getModelosFormulario, type ModeloFormulario } from '@/services/formularios'
import { createVistoria } from '@/services/vistorias'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const schema = z.object({
  empresa_id: z.string().min(1, 'Selecione a empresa'),
  tipo_vistoria_id: z.string().min(1, 'Selecione o tipo de vistoria'),
  data_agendada: z.string().min(1, 'Selecione a data'),
  responsavel_tecnico_id: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface NovaVistoriaDialogProps {
  defaultDate?: string
  onCreated?: (vistoriaId: string) => void
  trigger?: React.ReactNode
}

export default function NovaVistoriaDialog({
  defaultDate,
  onCreated,
  trigger,
}: NovaVistoriaDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [tipos, setTipos] = useState<TipoVistoria[]>([])
  const [responsaveis, setResponsaveis] = useState<ResponsavelTecnico[]>([])
  const [modelos, setModelos] = useState<ModeloFormulario[]>([])
  const [formulariosSel, setFormulariosSel] = useState<string[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      empresa_id: '',
      tipo_vistoria_id: '',
      data_agendada: defaultDate || '',
      responsavel_tecnico_id: '',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      empresa_id: '',
      tipo_vistoria_id: '',
      data_agendada: defaultDate || '',
      responsavel_tecnico_id: '',
    })
    setFormulariosSel([])
    getEmpresas()
      .then(setEmpresas)
      .catch((error) =>
        toast.error('Não foi possível carregar as empresas', {
          description: getErrorMessage(error),
        }),
      )
    getTiposVistoria()
      .then((items) => {
        setTipos(items)
        if (items.length === 1) form.setValue('tipo_vistoria_id', items[0].id)
      })
      .catch((error) =>
        toast.error('Não foi possível carregar os tipos de vistoria', {
          description: getErrorMessage(error),
        }),
      )
    getMinhaOrganizacao()
      .then((org) => getResponsaveisTecnicos(org.id))
      .then((rts) => {
        setResponsaveis(rts)
        const padrao = rts.find((rt) => rt.padrao)
        if (padrao) form.setValue('responsavel_tecnico_id', padrao.id)
      })
      .catch(() => setResponsaveis([]))
    getModelosFormulario()
      .then((ms) => setModelos(ms.filter((m) => m.ativo)))
      .catch(() => setModelos([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDate])

  const toggleFormulario = (id: string) => {
    setFormulariosSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      const org = await getMinhaOrganizacao()
      const vistoria = await createVistoria({
        organizacao_id: org.id,
        empresa_id: values.empresa_id,
        tipo_vistoria_id: values.tipo_vistoria_id,
        responsavel_tecnico_id: values.responsavel_tecnico_id || undefined,
        data_agendada: toPocketBaseDate(values.data_agendada),
        status: 'agendada',
        formularios: formulariosSel,
        client_uuid: crypto.randomUUID(),
      })
      toast.success('Vistoria agendada')
      setOpen(false)
      onCreated?.(vistoria.id)
    } catch (error) {
      toast.error('Não foi possível agendar a vistoria', { description: getErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  const modeloPorId = (id: string) => modelos.find((m) => m.id === id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova vistoria
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar vistoria</DialogTitle>
          <DialogDescription>
            Escolha a empresa, os checklists e formulários, a data e o responsável.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="empresa_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            empresas.length ? 'Selecione a empresa' : 'Nenhuma empresa cadastrada'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {empresas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.nome_fantasia || empresa.razao_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipo_vistoria_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Checklist da NR (principal)</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tipos.map((tipo) => {
                        const rotulo =
                          tipo.nr_referencia && tipo.nome.startsWith(tipo.nr_referencia)
                            ? tipo.nome
                            : tipo.nr_referencia
                              ? `${tipo.nr_referencia} — ${tipo.nome}`
                              : tipo.nome
                        return (
                          <SelectItem key={tipo.id} value={tipo.id}>
                            {rotulo}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Formulários de campo adicionais (multi) */}
            <div>
              <FormLabel>Formulários de campo (opcional, vários)</FormLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {formulariosSel.map((id) => {
                  const m = modeloPorId(id)
                  return (
                    <Badge key={id} variant="secondary" className="gap-1 pr-1">
                      {m?.nome || id}
                      <button
                        type="button"
                        onClick={() => toggleFormulario(id)}
                        className="ml-1 rounded-full p-0.5 hover:bg-accent"
                        aria-label={`Remover ${m?.nome || id}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
              <Select value="" onValueChange={(id) => id && toggleFormulario(id)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Adicionar formulário..." />
                </SelectTrigger>
                <SelectContent>
                  {modelos
                    .filter((m) => !formulariosSel.includes(m.id))
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <FormField
              control={form.control}
              name="data_agendada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data agendada</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responsavel_tecnico_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quem vai fazer</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            responsaveis.length
                              ? 'Selecione o responsável'
                              : 'Nenhum responsável cadastrado'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {responsaveis.map((rt) => (
                        <SelectItem key={rt.id} value={rt.id}>
                          {rt.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={submitting || empresas.length === 0}>
                {submitting ? 'Agendando...' : 'Agendar vistoria'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
