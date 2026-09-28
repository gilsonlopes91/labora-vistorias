/* Console de contas — Staff Labora (equipe da Labora que atua dentro das
   organizações como técnico, sem ver cobrança). */
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { UserPlus, Trash2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AdminNav from '@/components/admin/AdminNav'
import { alternarAcessoConsole } from '@/services/admin'

interface StaffRow {
  id: string
  name: string
  email: string
  orgs: string[]
  acesso_console: boolean
}

interface OrgMin {
  id: string
  nome: string
  staff_ids: string[]
}

export default function AdminStaff() {
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [orgs, setOrgs] = useState<OrgMin[]>([])
  const [loading, setLoading] = useState(true)
  const [novo, setNovo] = useState({ nome: '', email: '', senha: '' })
  const [criando, setCriando] = useState(false)
  const [orgParaVincular, setOrgParaVincular] = useState<Record<string, string>>({})

  const carregar = useCallback(async () => {
    try {
      // Duas chamadas no total (usuários staff + organizações), sem loop.
      const [lista, orgsAll] = await Promise.all([
        pb.collection('users').getFullList({ filter: "papel = 'staff_labora'", sort: 'name' }),
        pb.collection('organizacoes').getFullList({ fields: 'id,nome,staff_ids', sort: 'nome' }),
      ])
      const orgsMin: OrgMin[] = orgsAll.map((o) => ({
        id: o.id,
        nome: o.nome,
        staff_ids: o.staff_ids || [],
      }))
      setOrgs(orgsMin)
      setStaff(
        lista.map((u) => ({
          id: u.id,
          name: u.name || u.email,
          email: u.email,
          orgs: orgsMin.filter((o) => o.staff_ids.includes(u.id)).map((o) => o.id),
          acesso_console: !!u.acesso_console,
        })),
      )
    } catch (error) {
      toast.error('Não foi possível carregar o staff', { description: getErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const criar = async () => {
    if (!novo.nome.trim() || !novo.email.trim() || novo.senha.length < 8) {
      toast.error('Preencha nome, e-mail e senha (mínimo 8 caracteres)')
      return
    }
    setCriando(true)
    try {
      await pb.collection('users').create({
        name: novo.nome.trim(),
        email: novo.email.trim(),
        password: novo.senha,
        passwordConfirm: novo.senha,
        papel: 'staff_labora',
        verified: true,
      })
      toast.success('Staff criado com sucesso')
      setNovo({ nome: '', email: '', senha: '' })
      carregar()
    } catch (error) {
      toast.error('Não foi possível criar o staff', { description: getErrorMessage(error) })
    } finally {
      setCriando(false)
    }
  }

  const vincular = async (staffId: string) => {
    const orgId = orgParaVincular[staffId]
    if (!orgId) {
      toast.error('Escolha uma organização para vincular')
      return
    }
    try {
      const org = orgs.find((o) => o.id === orgId)
      const atual = org?.staff_ids || []
      if (!atual.includes(staffId)) {
        await pb.collection('organizacoes').update(orgId, { staff_ids: [...atual, staffId] })
      }
      toast.success('Vínculo criado')
      carregar()
    } catch (error) {
      toast.error('Não foi possível vincular', { description: getErrorMessage(error) })
    }
  }

  const desvincular = async (staffId: string, orgId: string) => {
    try {
      const org = orgs.find((o) => o.id === orgId)
      const atual = org?.staff_ids || []
      await pb
        .collection('organizacoes')
        .update(orgId, { staff_ids: atual.filter((id) => id !== staffId) })
      toast.success('Vínculo removido')
      carregar()
    } catch (error) {
      toast.error('Não foi possível remover o vínculo', { description: getErrorMessage(error) })
    }
  }

  const alternarConsole = async (s: StaffRow) => {
    try {
      await alternarAcessoConsole(s.id, !s.acesso_console)
      toast.success(s.acesso_console ? 'Acesso ao console removido' : 'Acesso ao console concedido')
      carregar()
    } catch (error) {
      toast.error('Não foi possível alterar o acesso', { description: getErrorMessage(error) })
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Staff Labora</h1>
        <p className="text-sm text-muted-foreground">
          Equipe Labora que atua dentro das organizações como técnico — sem ver cobrança.
        </p>
      </div>
      <AdminNav />

      <Card className="mb-4 rounded-2xl border-none p-4 shadow-subtle">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <Label htmlFor="staff-nome">Nome</Label>
            <Input
              id="staff-nome"
              value={novo.nome}
              onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
              placeholder="Nome da pessoa"
            />
          </div>
          <div>
            <Label htmlFor="staff-email">E-mail</Label>
            <Input
              id="staff-email"
              type="email"
              value={novo.email}
              onChange={(e) => setNovo({ ...novo, email: e.target.value })}
              placeholder="email@labora.com"
            />
          </div>
          <div>
            <Label htmlFor="staff-senha">Senha inicial</Label>
            <Input
              id="staff-senha"
              type="text"
              value={novo.senha}
              onChange={(e) => setNovo({ ...novo, senha: e.target.value })}
              placeholder="mínimo 8 caracteres"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={criar} disabled={criando} className="w-full rounded-full">
              <UserPlus className="mr-2 h-4 w-4" />
              {criando ? 'Criando...' : 'Criar staff'}
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : staff.length === 0 ? (
        <Card className="rounded-2xl border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum staff cadastrado ainda.
        </Card>
      ) : (
        <div className="space-y-3">
          {staff.map((s) => (
            <Card key={s.id} className="rounded-2xl border-none p-4 shadow-subtle">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.email}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.orgs.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        Sem organização vinculada
                      </span>
                    ) : (
                      s.orgs.map((orgId) => {
                        const nome = orgs.find((o) => o.id === orgId)?.nome || orgId
                        return (
                          <Badge
                            key={orgId}
                            variant="secondary"
                            className="gap-1 rounded-full pr-1.5"
                          >
                            {nome}
                            <button
                              type="button"
                              aria-label={`Remover vínculo com ${nome}`}
                              className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/10"
                              onClick={() => desvincular(s.id, orgId)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      checked={s.acesso_console}
                      onCheckedChange={() => alternarConsole(s)}
                    />
                    Acesso ao console
                  </label>
                  <select
                    className="h-9 rounded-full border bg-background px-3 text-sm"
                    value={orgParaVincular[s.id] || ''}
                    onChange={(e) =>
                      setOrgParaVincular({ ...orgParaVincular, [s.id]: e.target.value })
                    }
                  >
                    <option value="">Vincular à organização...</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nome}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => vincular(s.id)}
                  >
                    Vincular
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
