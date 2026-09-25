/* Página Equipe — gerencia membros da organização (dono/gerente). */
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Mail, ShieldCheck, UserMinus, UserPlus, Users } from 'lucide-react'

import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  convidarMembro,
  enviarLinkDeAcesso,
  removerMembro,
  getEquipe,
  getPapelUsuarioLogado,
  type MembroEquipe,
} from '@/services/equipe'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const PAPEL_LABEL: Record<string, string> = {
  dono: 'Dono',
  gerente: 'Gerente',
  gestor: 'Gestor',
  executor: 'Executor (técnico)',
  admin_plataforma: 'Administração da plataforma',
  staff_labora: 'Equipe Labora',
}

export default function Equipe() {
  const [membros, setMembros] = useState<MembroEquipe[]>([])
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', papel: 'executor' })
  const [reenviando, setReenviando] = useState<string | null>(null)
  const [paraRemover, setParaRemover] = useState<MembroEquipe | null>(null)
  const meuPapel = getPapelUsuarioLogado()
  const meuId = pb.authStore.record?.id

  const loadData = useCallback(async () => {
    try {
      setMembros(await getEquipe())
    } catch (error) {
      toast.error('Não foi possível carregar a equipe', { description: getErrorMessage(error) })
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onSubmit = async () => {
    setSubmitting(true)
    const email = form.email.trim().toLowerCase()
    try {
      await convidarMembro({
        email,
        nome: form.nome.trim(),
        papel: form.papel as 'gerente' | 'executor',
      })
    } catch (error) {
      toast.error('Não foi possível adicionar o membro', { description: getErrorMessage(error) })
      setSubmitting(false)
      return
    }
    // A conta já existe; falta a pessoa criar a senha pelo link do e-mail.
    try {
      await enviarLinkDeAcesso(email)
      toast.success(`Convite enviado para ${email}`, {
        description: 'A pessoa recebe um link para criar a própria senha e entrar.',
      })
    } catch (error) {
      toast.warning('A pessoa foi adicionada, mas o e-mail não saiu', {
        description: `Use "Reenviar link" na lista. (${getErrorMessage(error)})`,
      })
    }
    setOpen(false)
    setForm({ nome: '', email: '', papel: 'executor' })
    setSubmitting(false)
    loadData()
  }

  const reenviarLink = async (m: MembroEquipe) => {
    setReenviando(m.id)
    try {
      await enviarLinkDeAcesso(m.email)
      toast.success(`Link enviado para ${m.email}`, {
        description: 'Serve para entrar pela primeira vez ou para trocar a senha.',
      })
    } catch (error) {
      toast.error('Não foi possível enviar o link', { description: getErrorMessage(error) })
    } finally {
      setReenviando(null)
    }
  }

  const confirmarRemocao = async () => {
    if (!paraRemover) return
    try {
      await removerMembro(paraRemover.id)
      toast.success(`${paraRemover.name} saiu da equipe`)
      setParaRemover(null)
      loadData()
    } catch (error) {
      toast.error('Não foi possível remover', { description: getErrorMessage(error) })
    }
  }

  // Dono remove qualquer um (menos ele mesmo); gerente e gestor removem executores.
  const podeRemover = (m: MembroEquipe) =>
    m.id !== meuId &&
    m.papel !== 'dono' &&
    (meuPapel === 'dono' ||
      ((meuPapel === 'gerente' || meuPapel === 'gestor') && m.papel === 'executor'))

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipe</h1>
          <p className="text-sm text-muted-foreground">
            Pessoas com acesso à organização e o que cada uma pode fazer.
          </p>
        </div>
        {meuPapel !== 'executor' && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar pessoa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar membro</DialogTitle>
                <DialogDescription>
                  A pessoa recebe um e-mail com um link para criar a própria senha. Ninguém mais
                  fica sabendo a senha dela.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="email@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Papel</Label>
                  <Select
                    value={form.papel}
                    onValueChange={(v) => setForm((f) => ({ ...f, papel: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o papel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gerente">Gerente — tudo operacional</SelectItem>
                      <SelectItem value="executor">Executor — técnico de campo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={onSubmit}
                  disabled={submitting || !form.nome.trim() || !emailValido}
                >
                  {submitting ? 'Enviando convite...' : 'Enviar convite'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-4 w-4" />
            Membros ({membros.length})
          </CardTitle>
          <CardDescription>
            Dono e gerente gerenciam tudo; executor vê todas as empresas, mas só edita as vistorias
            atribuídas a ele.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {membros.length <= 1 && (
            <p className="py-2 text-center text-sm text-muted-foreground">
              Nenhum membro além de você ainda.
            </p>
          )}
          {membros.length === 0
            ? null
            : membros.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium">
                      {m.name}
                      {m.id === meuId && (
                        <span className="font-normal text-muted-foreground"> (você)</span>
                      )}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">{m.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {meuPapel !== 'executor' && m.id !== meuId && m.papel !== 'dono' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => reenviarLink(m)}
                        disabled={reenviando === m.id}
                        title="Manda de novo o e-mail para a pessoa criar ou trocar a senha"
                      >
                        <Mail className="mr-1 h-3 w-3" />
                        {reenviando === m.id ? 'Enviando...' : 'Reenviar link'}
                      </Button>
                    )}
                    <Badge variant={m.papel === 'dono' ? 'default' : 'secondary'}>
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      {PAPEL_LABEL[m.papel] || m.papel}
                    </Badge>
                    {podeRemover(m) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setParaRemover(m)}
                        title="Remover da equipe"
                        aria-label={`Remover ${m.name} da equipe`}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
        </CardContent>
      </Card>

      <AlertDialog open={!!paraRemover} onOpenChange={(v) => !v && setParaRemover(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {paraRemover?.name} da equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              A pessoa perde o acesso na hora. As vistorias e os orçamentos que ela fez continuam,
              com o nome dela. Se precisar voltar, é só convidar o mesmo e-mail de novo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarRemocao}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
