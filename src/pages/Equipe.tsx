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
  transferirTitularidade,
  getEquipe,
  getPapelUsuarioLogado,
  type MembroEquipe,
} from '@/services/equipe'
import { getMinhaOrganizacao } from '@/services/organizacoes'

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
  dono: 'Gestor',
  gerente: 'Gestor',
  gestor: 'Gestor',
  executor: 'Técnico',
  administrativo: 'Administrativo',
  admin_plataforma: 'Administração da plataforma',
  staff_labora: 'Equipe Labora',
}

export default function Equipe() {
  const [membros, setMembros] = useState<MembroEquipe[]>([])
  const [donoId, setDonoId] = useState('')
  const [vagas, setVagas] = useState<{ plano: string; limite: number } | null>(null)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', papel: 'executor' })
  const [reenviando, setReenviando] = useState<string | null>(null)
  const [paraRemover, setParaRemover] = useState<MembroEquipe | null>(null)
  const [paraTransferir, setParaTransferir] = useState<MembroEquipe | null>(null)
  const [transferindo, setTransferindo] = useState(false)
  const meuPapel = getPapelUsuarioLogado()
  const meuId = pb.authStore.record?.id
  const souTitular = !!meuId && meuId === donoId

  const loadData = useCallback(async () => {
    try {
      const r = await getEquipe()
      setMembros(r.membros)
      setDonoId(r.donoId)
    } catch (error) {
      toast.error('Não foi possível carregar a equipe', { description: getErrorMessage(error) })
    }
    try {
      const org = await getMinhaOrganizacao()
      setVagas({ plano: org.plano || 'individual', limite: org.limite_usuarios ?? 0 })
    } catch (_) {
      setVagas(null)
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
        papel: form.papel as 'gerente' | 'executor' | 'administrativo',
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

  const confirmarTransferencia = async () => {
    if (!paraTransferir) return
    setTransferindo(true)
    try {
      await transferirTitularidade(paraTransferir.id)
      toast.success(`${paraTransferir.name} agora é o titular da conta`)
      setParaTransferir(null)
      loadData()
    } catch (error) {
      toast.error('Não foi possível transferir', { description: getErrorMessage(error) })
    } finally {
      setTransferindo(false)
    }
  }

  // Só o titular da conta convida e remove (cuida do plano e das vagas).
  const podeRemover = (m: MembroEquipe) => souTitular && m.id !== meuId && m.id !== donoId
  const podeVirarTitular = (m: MembroEquipe) =>
    souTitular &&
    m.id !== meuId &&
    m.id !== donoId &&
    ['dono', 'gerente', 'gestor'].includes(m.papel)

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
        {souTitular && (
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
                      <SelectItem value="gerente">Gestor — tudo operacional</SelectItem>
                      <SelectItem value="executor">Técnico — vistorias de campo</SelectItem>
                      <SelectItem value="administrativo">
                        Administrativo — agenda, orçamentos e empresas
                      </SelectItem>
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
            Gestor gerencia tudo; técnico vê todas as empresas, mas só edita as vistorias atribuídas
            a ele.
            {vagas && vagas.limite > 0 && (
              <>
                {' '}
                Vagas do plano {vagas.plano}: {Math.max(membros.length - 1, 0)} de {vagas.limite} em
                uso.
              </>
            )}
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
                    {meuPapel !== 'executor' &&
                      meuPapel !== 'administrativo' &&
                      m.id !== meuId &&
                      m.id !== donoId && (
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
                    {podeVirarTitular(m) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setParaTransferir(m)}
                        title="Passar a titularidade da conta para esta pessoa"
                      >
                        Tornar titular
                      </Button>
                    )}
                    <Badge variant={m.id === donoId ? 'default' : 'secondary'}>
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      {PAPEL_LABEL[m.papel] || m.papel}
                      {m.id === donoId ? ' · titular' : ''}
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

      <AlertDialog open={!!paraTransferir} onOpenChange={(v) => !v && setParaTransferir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tornar {paraTransferir?.name} o titular da conta?</AlertDialogTitle>
            <AlertDialogDescription>
              A partir de agora, só {paraTransferir?.name} convida e remove pessoas da equipe e
              cuida do plano. Você continua gestor, mas sem essas duas ações — a não ser que alguém
              transfira a titularidade de volta para você.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarTransferencia} disabled={transferindo}>
              {transferindo ? 'Transferindo...' : 'Transferir titularidade'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
