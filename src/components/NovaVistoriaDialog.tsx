/* Diálogo compartilhado para agendar uma nova vistoria — usado em /vistorias e /agenda.
   Vistoria multi-item: N checklists NR + N formulários de campo na mesma visita. */
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronDown, Plus, Sparkles, X } from 'lucide-react'

import { toPocketBaseDate } from '@/lib/date'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import { getEmpresas, type Empresa } from '@/services/empresas'
import { getTiposVistoria, type TipoVistoria } from '@/services/tiposVistoria'
import { getResponsaveisTecnicos, type ResponsavelTecnico } from '@/services/responsaveisTecnicos'
import {
  getModelosFormulario,
  getModeloFormulario,
  type ModeloFormulario,
} from '@/services/formularios'
import { getItensChecklist } from '@/services/itensChecklist'
import { createVistoria } from '@/services/vistorias'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

// Só empresa e data são obrigatórias. O resto é opcional e aparece no
// evento do Google Agenda / Outlook / iPhone quando preenchido.
const schema = z.object({
  empresa_id: z.string().min(1, 'Selecione a empresa'),
  data_agendada: z.string().min(1, 'Selecione a data'),
  responsavel_tecnico_id: z.string().optional(),
  hora_inicio: z.string().optional(),
  duracao_min: z.string().optional(),
  local_vistoria: z.string().max(300).optional(),
  contato_local_nome: z.string().max(120).optional(),
  contato_local_telefone: z.string().max(40).optional(),
  equipe_apoio: z.string().max(300).optional(),
  equipamentos: z.string().max(500).optional(),
  orientacoes_equipe: z.string().max(1000).optional(),
})

type FormValues = z.infer<typeof schema>

const VALORES_INICIAIS = {
  empresa_id: '',
  data_agendada: '',
  responsavel_tecnico_id: '',
  hora_inicio: '',
  duracao_min: '120',
  local_vistoria: '',
  contato_local_nome: '',
  contato_local_telefone: '',
  equipe_apoio: '',
  equipamentos: '',
  orientacoes_equipe: '',
}

const DURACOES = [
  { v: '60', l: '1 hora' },
  { v: '120', l: '2 horas' },
  { v: '180', l: '3 horas' },
  { v: '240', l: '4 horas (meio período)' },
  { v: '480', l: '8 horas (dia todo)' },
]

// Instrumentos sugeridos a partir dos checklists e formulários escolhidos.
const REGRAS_EQUIPAMENTOS: { teste: RegExp; itens: string[] }[] = [
  {
    teste: /ru[ií]do|NR-15.*Anexo (I|II)\b|dosimetr/i,
    itens: ['Dosímetro de ruído', 'Calibrador acústico'],
  },
  { teste: /calor|IBUTG|t[ée]rmic/i, itens: ['Medidor de IBUTG'] },
  { teste: /ilumin|lux/i, itens: ['Luxímetro'] },
  { teste: /vibra/i, itens: ['Medidor de vibração'] },
  {
    teste: /qu[ií]mic|poeira|s[ií]lica|aerodispers|vapor|gases|amostragem|NR-15.*Anexo (11|12|13)/i,
    itens: ['Bomba de amostragem', 'Calibrador de vazão', 'Cassetes/tubos de coleta'],
  },
  { teste: /NR-33|confinad/i, itens: ['Detector multigás'] },
  { teste: /NR-10|el[ée]tric/i, itens: ['Detector de tensão', 'Luvas isolantes'] },
  { teste: /NR-12|m[áa]quina/i, itens: ['Trena'] },
]

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
  const [checklistsSel, setChecklistsSel] = useState<string[]>([])
  const [detalhesAbertos, setDetalhesAbertos] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...VALORES_INICIAIS, data_agendada: defaultDate || '' },
  })

  useEffect(() => {
    if (!open) return
    form.reset({ ...VALORES_INICIAIS, data_agendada: defaultDate || '' })
    setFormulariosSel([])
    setChecklistsSel([])
    setDetalhesAbertos(false)
    getEmpresas()
      .then(setEmpresas)
      .catch((error) =>
        toast.error('Não foi possível carregar as empresas', {
          description: getErrorMessage(error),
        }),
      )
    getTiposVistoria()
      .then((items) => {
        // Ordena por número de NR (ex.: NR-01, NR-02, ..., NR-38)
        const ordenados = [...items].sort((a, b) => {
          const refA = a.nr_referencia || a.nome || ''
          const refB = b.nr_referencia || b.nome || ''
          return refA.localeCompare(refB, undefined, { numeric: true })
        })
        setTipos(ordenados)
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

  const toggleNr = (id: string) => {
    setChecklistsSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  // Ao escolher a empresa, preenche local e contato com o cadastro dela
  // (só se o usuário ainda não digitou nada nesses campos).
  const empresaId = form.watch('empresa_id')
  useEffect(() => {
    const emp = empresas.find((x) => x.id === empresaId)
    if (!emp) return
    if (!form.getValues('local_vistoria') && emp.endereco)
      form.setValue('local_vistoria', emp.endereco)
    if (!form.getValues('contato_local_nome') && emp.contato_nome)
      form.setValue('contato_local_nome', emp.contato_nome)
    if (!form.getValues('contato_local_telefone') && emp.contato_telefone)
      form.setValue('contato_local_telefone', emp.contato_telefone)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, empresas])

  const sugerirEquipamentos = () => {
    const nomes = [
      ...checklistsSel.map((id) => {
        const t = tipos.find((x) => x.id === id)
        return `${t?.nr_referencia || ''} ${t?.nome || ''}`
      }),
      ...formulariosSel.map((id) => modelos.find((m) => m.id === id)?.nome || ''),
    ].join(' | ')
    const lista: string[] = []
    for (const r of REGRAS_EQUIPAMENTOS) {
      if (r.teste.test(nomes)) for (const i of r.itens) if (!lista.includes(i)) lista.push(i)
    }
    lista.push('EPIs básicos (capacete, óculos, botina)')
    const atual = (form.getValues('equipamentos') || '').trim()
    const jaTem = atual
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    const novos = lista.filter((i) => !jaTem.includes(i.toLowerCase()))
    form.setValue('equipamentos', [atual, ...novos].filter(Boolean).join(', '))
    if (!checklistsSel.length && !formulariosSel.length)
      toast.info('Escolha checklists ou formulários para sugestões mais específicas.')
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      const org = await getMinhaOrganizacao()
      const tipoVistoriaId = checklistsSel[0] || undefined
      const adicionais = checklistsSel.slice(1)
      const t = (s?: string) => (s || '').trim()

      const vistoria = await createVistoria({
        organizacao_id: org.id,
        empresa_id: values.empresa_id,
        tipo_vistoria_id: tipoVistoriaId,
        checklists: adicionais,
        responsavel_tecnico_id: values.responsavel_tecnico_id || undefined,
        data_agendada: toPocketBaseDate(values.data_agendada),
        status: 'agendada',
        formularios: formulariosSel,
        hora_inicio: t(values.hora_inicio),
        duracao_min: values.hora_inicio ? Number(values.duracao_min || 120) : 0,
        local_vistoria: t(values.local_vistoria),
        contato_local_nome: t(values.contato_local_nome),
        contato_local_telefone: t(values.contato_local_telefone),
        equipe_apoio: t(values.equipe_apoio),
        equipamentos: t(values.equipamentos),
        orientacoes_equipe: t(values.orientacoes_equipe),
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

  // Resumo: quantos itens tem cada checklist e quantos campos cada formulário
  // escolhido — para o usuário conferir a cobertura da vistoria antes de agendar.
  const [contagens, setContagens] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!open) return
    const alvos = [...checklistsSel, ...formulariosSel]
    for (const id of alvos) {
      if (contagens[id] !== undefined) continue
      const isForm = formulariosSel.includes(id) && !checklistsSel.includes(id)
      if (isForm) {
        getModeloFormulario(id)
          .then((m) =>
            setContagens((prev) => ({
              ...prev,
              [id]: (m.campos || []).filter((c) => c.tipo !== 'secao').length,
            })),
          )
          .catch(() => setContagens((prev) => ({ ...prev, [id]: 0 })))
      } else {
        import('@/services/itensChecklist')
          .then(({ contarItensChecklist }) => contarItensChecklist(id))
          .then((n) => setContagens((prev) => ({ ...prev, [id]: n })))
          .catch(() => setContagens((prev) => ({ ...prev, [id]: 0 })))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, checklistsSel, formulariosSel])

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
            {/* Checklists (unificado: multi-select) */}
            <div>
              <FormLabel>Checklists (opcional, vários)</FormLabel>
              {checklistsSel.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {checklistsSel.map((id) => {
                    const t = tipos.find((x) => x.id === id)
                    return (
                      <Badge key={id} variant="secondary" className="gap-1 pr-1">
                        {t?.nr_referencia || t?.nome || id}
                        {contagens[id] !== undefined && (
                          <span className="font-normal text-muted-foreground">
                            · {contagens[id]} itens
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleNr(id)}
                          className="ml-1 rounded-full p-0.5 hover:bg-accent"
                          aria-label={`Remover ${t?.nr_referencia || id}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
              <Select value="" onValueChange={(id) => id && toggleNr(id)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Adicionar checklist NR..." />
                </SelectTrigger>
                <SelectContent>
                  {tipos
                    .filter((t) => !checklistsSel.includes(t.id))
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nr_referencia && t.nome.startsWith(t.nr_referencia)
                          ? t.nome
                          : t.nr_referencia
                            ? `${t.nr_referencia} — ${t.nome}`
                            : t.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Formulários de campo adicionais (multi) */}
            <div>
              <FormLabel>Formulários de campo (opcional, vários)</FormLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {formulariosSel.map((id) => {
                  const m = modeloPorId(id)
                  return (
                    <Badge key={id} variant="secondary" className="gap-1 pr-1">
                      {m?.nome || id}
                      {contagens[id] !== undefined && (
                        <span className="font-normal text-muted-foreground">
                          · {contagens[id]} campos
                        </span>
                      )}
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

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="data_agendada"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
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
                name="hora_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário (opcional)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duracao_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração</FormLabel>
                    <Select
                      value={field.value || '120'}
                      onValueChange={field.onChange}
                      disabled={!form.watch('hora_inicio')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DURACOES.map((d) => (
                          <SelectItem key={d.v} value={d.v}>
                            {d.l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            {!form.watch('hora_inicio') && (
              <p className="-mt-2 text-xs text-muted-foreground">
                Sem horário, a vistoria aparece como evento de dia inteiro na agenda.
              </p>
            )}
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

            {/* Detalhes para a equipe — tudo opcional, vai para o evento da agenda */}
            <div className="rounded-md border">
              <button
                type="button"
                onClick={() => setDetalhesAbertos((x) => !x)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
                aria-expanded={detalhesAbertos}
              >
                <span>
                  Detalhes para a equipe{' '}
                  <span className="font-normal text-muted-foreground">
                    (opcional · aparecem no Google Agenda)
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${detalhesAbertos ? 'rotate-180' : ''}`}
                />
              </button>
              {detalhesAbertos && (
                <div className="space-y-3 border-t px-3 pb-3 pt-3">
                  <FormField
                    control={form.control}
                    name="local_vistoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local da vistoria</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Endereço, unidade ou setor (ex.: Galpão 2)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="contato_local_nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contato no local</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome e setor" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contato_local_telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone do contato</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(86) 9...." {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="equipe_apoio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipe de apoio</FormLabel>
                        <FormControl>
                          <Input placeholder="Outros técnicos que vão junto" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="equipamentos"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Equipamentos a levar</FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={sugerirEquipamentos}
                          >
                            <Sparkles className="mr-1 h-3 w-3" />
                            Sugerir pelos checklists
                          </Button>
                        </div>
                        <FormControl>
                          <Input placeholder="Dosímetro, luxímetro, trena..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="orientacoes_equipe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Orientações para a equipe</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={2}
                            placeholder="Ex.: entrar pela portaria 2, levar ASO e crachá"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

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
