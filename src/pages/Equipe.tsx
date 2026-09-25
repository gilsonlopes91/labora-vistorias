/* Página Equipe — gerencia membros da organização (dono/gerente). */
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, ShieldCheck, UserPlus, Users } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  convidarMembro,
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

const PAPEL_LABEL: Record<string, string> = {
  dono: 'Dono',
  gerente: 'Gerente',
  executor: 'Executor (técnico)',
  admin_plataforma: 'Administração da plataforma',
  staff_labora: 'Equipe Labora',
}

export default function Equipe() {
  const [membros, setMembros] = useState<MembroEquipe[]>([])
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', senha: '', papel: 'executor' })
  const meuPapel = getPapelUsuarioLogado()

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
    try {
      await convidarMembro({
        email: form.email,
        nome: form.nome,
        senha: form.senha,
        papel: form.papel as 'gerente' | 'executor',
      })
      toast.success('Membro adicionado à equipe')
      setOpen(false)
      setForm({ nome: '', email: '', senha: '', papel: 'executor' })
      loadData()
    } catch (error) {
      toast.error('Não foi possível adicionar o membro', { description: getErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

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
                  Crie o acesso e passe o e-mail e a senha para a pessoa. Ela pode trocar a senha
                  depois.
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
                  <Label>Senha temporária</Label>
                  <Input
                    type="text"
                    value={form.senha}
                    onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
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
                  disabled={submitting || !form.nome || !form.email || form.senha.length < 8}
                >
                  {submitting ? 'Adicionando...' : 'Adicionar'}
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
                <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-sm text-muted-foreground">{m.email}</div>
                  </div>
                  <Badge variant={m.papel === 'dono' ? 'default' : 'secondary'}>
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    {PAPEL_LABEL[m.papel] || m.papel}
                  </Badge>
                </div>
              ))}
        </CardContent>
      </Card>
    </div>
  )
}
