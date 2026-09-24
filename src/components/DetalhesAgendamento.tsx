/* Resumo dos detalhes do agendamento (horário, local, contato, equipe,
   equipamentos, orientações) na tela da vistoria, com edição rápida.
   Esses dados também vão para o evento no Google Agenda / Outlook / iPhone. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CalendarClock, MapPin, Pencil, Phone, Users, Wrench, Info } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { toPocketBaseDate } from '@/lib/date'
import { updateVistoria, type Vistoria } from '@/services/vistorias'
import { Button } from '@/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const DURACOES = [
  { v: '60', l: '1 hora' },
  { v: '120', l: '2 horas' },
  { v: '180', l: '3 horas' },
  { v: '240', l: '4 horas' },
  { v: '480', l: '8 horas' },
]

const fimHorario = (hora: string, min: number) => {
  const [h, m] = hora.split(':').map(Number)
  const total = h * 60 + m + (min || 120)
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

interface Props {
  vistoria: Vistoria
  onSaved: (v: Vistoria) => void
  podeEditar?: boolean
}

export default function DetalhesAgendamento({ vistoria, onSaved, podeEditar = true }: Props) {
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [f, setF] = useState({
    data: '',
    hora_inicio: '',
    duracao_min: '120',
    local_vistoria: '',
    contato_local_nome: '',
    contato_local_telefone: '',
    equipe_apoio: '',
    equipamentos: '',
    orientacoes_equipe: '',
  })

  useEffect(() => {
    if (!aberto) return
    setF({
      data: (vistoria.data_agendada || '').slice(0, 10),
      hora_inicio: vistoria.hora_inicio || '',
      duracao_min: String(vistoria.duracao_min || 120),
      local_vistoria: vistoria.local_vistoria || '',
      contato_local_nome: vistoria.contato_local_nome || '',
      contato_local_telefone: vistoria.contato_local_telefone || '',
      equipe_apoio: vistoria.equipe_apoio || '',
      equipamentos: vistoria.equipamentos || '',
      orientacoes_equipe: vistoria.orientacoes_equipe || '',
    })
  }, [aberto, vistoria])

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((p) => ({ ...p, [k]: e.target.value }))

  const salvar = async () => {
    if (!f.data) {
      toast.error('Informe a data')
      return
    }
    setSalvando(true)
    try {
      const t = (s: string) => s.trim()
      const v = await updateVistoria(vistoria.id, {
        data_agendada: toPocketBaseDate(f.data),
        hora_inicio: t(f.hora_inicio),
        duracao_min: f.hora_inicio ? Number(f.duracao_min || 120) : 0,
        local_vistoria: t(f.local_vistoria),
        contato_local_nome: t(f.contato_local_nome),
        contato_local_telefone: t(f.contato_local_telefone),
        equipe_apoio: t(f.equipe_apoio),
        equipamentos: t(f.equipamentos),
        orientacoes_equipe: t(f.orientacoes_equipe),
      })
      onSaved({ ...vistoria, ...v, expand: vistoria.expand })
      toast.success('Agendamento atualizado')
      setAberto(false)
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  const linhas: { icone: React.ReactNode; texto: string }[] = []
  if (vistoria.hora_inicio)
    linhas.push({
      icone: <CalendarClock className="h-3 w-3" />,
      texto: `${vistoria.hora_inicio} às ${fimHorario(vistoria.hora_inicio, vistoria.duracao_min || 120)}`,
    })
  if (vistoria.local_vistoria)
    linhas.push({ icone: <MapPin className="h-3 w-3" />, texto: vistoria.local_vistoria })
  if (vistoria.contato_local_nome || vistoria.contato_local_telefone)
    linhas.push({
      icone: <Phone className="h-3 w-3" />,
      texto: [vistoria.contato_local_nome, vistoria.contato_local_telefone]
        .filter(Boolean)
        .join(' · '),
    })
  if (vistoria.equipe_apoio)
    linhas.push({ icone: <Users className="h-3 w-3" />, texto: vistoria.equipe_apoio })
  if (vistoria.equipamentos)
    linhas.push({ icone: <Wrench className="h-3 w-3" />, texto: vistoria.equipamentos })
  if (vistoria.orientacoes_equipe)
    linhas.push({ icone: <Info className="h-3 w-3" />, texto: vistoria.orientacoes_equipe })

  return (
    <div className="mt-2">
      {linhas.length > 0 && (
        <ul className="space-y-0.5">
          {linhas.map((l, i) => (
            <li key={i} className="flex items-start gap-1 text-xs text-muted-foreground">
              <span className="mt-0.5 shrink-0">{l.icone}</span>
              <span className="whitespace-pre-line">{l.texto}</span>
            </li>
          ))}
        </ul>
      )}
      {podeEditar && vistoria.status !== 'concluida' && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0 text-xs"
          onClick={() => setAberto(true)}
        >
          <Pencil className="mr-1 h-3 w-3" />
          {linhas.length ? 'Editar agendamento' : 'Adicionar horário, local e detalhes'}
        </Button>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agendamento</DialogTitle>
            <DialogDescription>
              Só a data é obrigatória. O que for preenchido aparece no evento da agenda.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="col-span-2 space-y-1 sm:col-span-1">
                <Label>Data</Label>
                <Input type="date" value={f.data} onChange={set('data')} />
              </div>
              <div className="space-y-1">
                <Label>Horário</Label>
                <Input type="time" value={f.hora_inicio} onChange={set('hora_inicio')} />
              </div>
              <div className="space-y-1">
                <Label>Duração</Label>
                <Select
                  value={f.duracao_min}
                  onValueChange={(v) => setF((p) => ({ ...p, duracao_min: v }))}
                  disabled={!f.hora_inicio}
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
            <div className="space-y-1">
              <Label>Local da vistoria</Label>
              <Input value={f.local_vistoria} onChange={set('local_vistoria')} maxLength={300} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Contato no local</Label>
                <Input
                  value={f.contato_local_nome}
                  onChange={set('contato_local_nome')}
                  maxLength={120}
                />
              </div>
              <div className="space-y-1">
                <Label>Telefone do contato</Label>
                <Input
                  type="tel"
                  value={f.contato_local_telefone}
                  onChange={set('contato_local_telefone')}
                  maxLength={40}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Equipe de apoio</Label>
              <Input value={f.equipe_apoio} onChange={set('equipe_apoio')} maxLength={300} />
            </div>
            <div className="space-y-1">
              <Label>Equipamentos a levar</Label>
              <Input value={f.equipamentos} onChange={set('equipamentos')} maxLength={500} />
            </div>
            <div className="space-y-1">
              <Label>Orientações para a equipe</Label>
              <Textarea
                rows={2}
                value={f.orientacoes_equipe}
                onChange={set('orientacoes_equipe')}
                maxLength={1000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
