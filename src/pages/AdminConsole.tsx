/* Console Admin — camada PLATAFORMA (só papel admin_plataforma).
   Onda 1: lista de organizações + consumo do assistente IA + bloqueio +
   métricas globais. Gerenciar Staff Labora entra na mesma tela (Onda 1). */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Building2,
  Ban,
  ShieldCheck,
  Users,
  ClipboardCheck,
  Bot,
  Search,
  UserPlus,
  Trash2,
} from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface OrgRow {
  id: string
  nome: string
  status: string
  created: string
  dono_nome?: string
  dono_email?: string
  usuarios: number
  empresas: number
  vistorias: number
  perguntas_ia: number
}

interface StaffRow {
  id: string
  name: string
  email: string
  orgs: string[]
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ativa: 'default',
  trial: 'secondary',
  bloqueada: 'destructive',
}

export default function AdminConsole() {
  const { user } = useAuth()
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [alvo, setAlvo] = useState<OrgRow | null>(null)
  const [bloqueando, setBloqueando] = useState(false)

  // Staff Labora
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [novoStaff, setNovoStaff] = useState({ nome: '', email: '', senha: '' })
  const [criandoStaff, setCriandoStaff] = useState(false)
  const [orgParaVincular, setOrgParaVincular] = useState<Record<string, string>>({})

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      // Admin vê todas as organizações (RLS permite).
      const orgsList = await pb.collection('organizacoes').getFullList({
        sort: '-created',
        expand: 'dono_id',
      })
      const linhas: OrgRow[] = []
      for (const org of orgsList) {
        // Contagens por organização (consultas leves; admin tem permissão).
        // Usuários: por organizacao_id OU dono da org (orgs antigas têm o dono
        // sem organizacao_id preenchido — ex.: "Labora Vistoria").
        const [usuarios, empresas, vistorias] = await Promise.all([
          pb.collection('users').getList(1, 1, {
            filter: pb.filter('organizacao_id = {:org} || id = dono_id', { org: org.id }),
          }),
          pb.collection('empresas').getList(1, 1, {
            filter: pb.filter('organizacao_id = {:org}', { org: org.id }),
          }),
          pb.collection('vistorias').getList(1, 1, {
            filter: pb.filter('organizacao_id = {:org}', { org: org.id }),
          }),
        ])
        // Consumo do assistente IA: conversas do agente por usuário da org.
        let perguntasIa = 0
        try {
          const membros = await pb.collection('users').getFullList({
            filter: pb.filter('organizacao_id = {:org}', { org: org.id }),
            fields: 'id',
          })
          const ids = membros.items.map((m) => m.id)
          if (ids.length > 0) {
            const convs = await pb.collection('ai_conversations').getList(1, 1, {
              filter: pb.filter('user_id ?= {:ids}', { ids }),
            })
            perguntasIa = convs.totalItems
          }
        } catch (_) {
          // coleção indisponível — mantém 0 sem quebrar a tela
        }
        linhas.push({
          id: org.id,
          nome: org.nome,
          status: org.status || 'ativa',
          created: org.created,
          dono_nome: org.expand?.dono_id?.name || '',
          dono_email: org.expand?.dono_id?.email || '',
          usuarios: usuarios.totalItems,
          empresas: empresas.totalItems,
          vistorias: vistorias.totalItems,
          perguntas_ia: perguntasIa,
        })
      }
      setOrgs(linhas)
    } catch (error) {
      toast.error('Não foi possível carregar as organizações', {
        description: getErrorMessage(error),
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  // ---- Staff Labora ----
  const carregarStaff = useCallback(async () => {
    try {
      const lista = await pb.collection('users').getFullList({
        filter: "papel = 'staff_labora'",
        sort: 'name',
      })
      const orgsAll = await pb.collection('organizacoes').getFullList({ fields: 'id,staff_ids' })
      const porUsuario: Record<string, string[]> = {}
      for (const org of orgsAll) {
        for (const sid of org.staff_ids || [])
          porUsuario[sid] = [...(porUsuario[sid] || []), org.id]
      }
      setStaff(
        lista.map((u) => ({
          id: u.id,
          name: u.name || u.email,
          email: u.email,
          orgs: porUsuario[u.id] || [],
        })),
      )
    } catch (_) {
      // sem permissão ou vazio — mantém lista vazia
    }
  }, [])

  useEffect(() => {
    if (user?.papel === 'admin_plataforma') carregarStaff()
  }, [user?.papel, carregarStaff])

  const criarStaff = async () => {
    if (!novoStaff.nome.trim() || !novoStaff.email.trim() || novoStaff.senha.length < 8) {
      toast.error('Preencha nome, e-mail e senha (mínimo 8 caracteres)')
      return
    }
    setCriandoStaff(true)
    try {
      await pb.collection('users').create({
        name: novoStaff.nome.trim(),
        email: novoStaff.email.trim(),
        password: novoStaff.senha,
        passwordConfirm: novoStaff.senha,
        papel: 'staff_labora',
        verified: true,
      })
      toast.success('Staff criado com sucesso')
      setNovoStaff({ nome: '', email: '', senha: '' })
      carregarStaff()
    } catch (error) {
      toast.error('Não foi possível criar o staff', { description: getErrorMessage(error) })
    } finally {
      setCriandoStaff(false)
    }
  }

  const vincularStaff = async (staffId: string) => {
    const orgId = orgParaVincular[staffId]
    if (!orgId) {
      toast.error('Escolha uma organização para vincular')
      return
    }
    try {
      const org = await pb.collection('organizacoes').getOne(orgId)
      const atual = org.staff_ids || []
      if (!atual.includes(staffId)) {
        await pb.collection('organizacoes').update(orgId, { staff_ids: [...atual, staffId] })
      }
      toast.success('Vínculo criado')
      carregarStaff()
    } catch (error) {
      toast.error('Não foi possível vincular', { description: getErrorMessage(error) })
    }
  }

  const desvincularStaff = async (staffId: string, orgId: string) => {
    try {
      const org = await pb.collection('organizacoes').getOne(orgId)
      const atual = org.staff_ids || []
      await pb
        .collection('organizacoes')
        .update(orgId, { staff_ids: atual.filter((id: string) => id !== staffId) })
      toast.success('Vínculo removido')
      carregarStaff()
    } catch (error) {
      toast.error('Não foi possível remover o vínculo', { description: getErrorMessage(error) })
    }
  }

  const alternarBloqueio = async () => {
    if (!alvo) return
    setBloqueando(true)
    try {
      const novoStatus = alvo.status === 'bloqueada' ? 'ativa' : 'bloqueada'
      await pb.collection('organizacoes').update(alvo.id, { status: novoStatus })
      toast.success(
        novoStatus === 'bloqueada' ? 'Organização bloqueada' : 'Organização desbloqueada',
      )
      setAlvo(null)
      carregar()
    } catch (error) {
      toast.error('Não foi possível alterar o status', { description: getErrorMessage(error) })
    } finally {
      setBloqueando(false)
    }
  }

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return orgs
    return orgs.filter(
      (o) =>
        o.nome.toLowerCase().includes(q) ||
        (o.dono_email || '').toLowerCase().includes(q) ||
        (o.dono_nome || '').toLowerCase().includes(q),
    )
  }, [orgs, busca])

  const metricas = useMemo(
    () => ({
      total: orgs.length,
      ativas: orgs.filter((o) => o.status !== 'bloqueada').length,
      usuarios: orgs.reduce((s, o) => s + o.usuarios, 0),
      vistorias: orgs.reduce((s, o) => s + o.vistorias, 0),
      ia: orgs.reduce((s, o) => s + o.perguntas_ia, 0),
    }),
    [orgs],
  )

  if (user?.papel !== 'admin_plataforma') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <Ban className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área é exclusiva do administrador da plataforma.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/">Voltar para o início</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Gerenciamento de contas</h1>
        <p className="text-sm text-muted-foreground">
          Console de administração da plataforma — visão de todas as organizações.
        </p>
      </div>

      {/* Métricas globais */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { icon: Building2, label: 'Organizações', value: metricas.total },
          { icon: ShieldCheck, label: 'Ativas', value: metricas.ativas },
          { icon: Users, label: 'Usuários', value: metricas.usuarios },
          { icon: ClipboardCheck, label: 'Vistorias', value: metricas.vistorias },
          { icon: Bot, label: 'Perguntas IA (total)', value: metricas.ia },
        ].map((m) => (
          <Card key={m.label} className="rounded-2xl border-none p-4 shadow-subtle">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-extrabold leading-none">{m.value}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {m.label}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por organização ou dono..."
          className="pl-9"
        />
      </div>

      {/* Lista de organizações */}
      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : filtradas.length === 0 ? (
        <Card className="rounded-2xl border-dashed p-12 text-center text-sm text-muted-foreground">
          Nenhuma organização encontrada.
        </Card>
      ) : (
        <div className="space-y-3">
          {filtradas.map((org) => (
            <Card key={org.id} className="rounded-2xl border-none p-4 shadow-subtle">
              <div className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{org.nome}</span>
                    <Badge variant={STATUS_VARIANT[org.status] || 'default'}>
                      {org.status || 'ativa'}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Dono: {org.dono_nome || '—'} {org.dono_email ? `· ${org.dono_email}` : ''} ·
                    desde {new Date(org.created).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="flex items-center gap-5 text-center text-xs text-muted-foreground">
                  <div>
                    <div className="text-lg font-bold text-foreground">{org.usuarios}</div>
                    usuários
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{org.empresas}</div>
                    empresas
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{org.vistorias}</div>
                    vistorias
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{org.perguntas_ia}</div>
                    perguntas IA
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={org.status === 'bloqueada' ? 'default' : 'outline'}
                  className="rounded-full"
                  onClick={() => setAlvo(org)}
                >
                  {org.status === 'bloqueada' ? 'Desbloquear' : 'Bloquear'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Staff Labora */}
      <div className="mt-10">
        <h2 className="mb-1 text-xl font-bold">Staff Labora</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Equipe Labora que atua dentro das organizações como executor — sem ver cobrança.
        </p>

        <Card className="mb-4 rounded-2xl border-none p-4 shadow-subtle">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-1">
              <Label htmlFor="staff-nome">Nome</Label>
              <Input
                id="staff-nome"
                value={novoStaff.nome}
                onChange={(e) => setNovoStaff({ ...novoStaff, nome: e.target.value })}
                placeholder="Nome da pessoa"
              />
            </div>
            <div className="sm:col-span-1">
              <Label htmlFor="staff-email">E-mail</Label>
              <Input
                id="staff-email"
                type="email"
                value={novoStaff.email}
                onChange={(e) => setNovoStaff({ ...novoStaff, email: e.target.value })}
                placeholder="email@labora.com"
              />
            </div>
            <div className="sm:col-span-1">
              <Label htmlFor="staff-senha">Senha inicial</Label>
              <Input
                id="staff-senha"
                type="text"
                value={novoStaff.senha}
                onChange={(e) => setNovoStaff({ ...novoStaff, senha: e.target.value })}
                placeholder="mínimo 8 caracteres"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={criarStaff} disabled={criandoStaff} className="w-full rounded-full">
                <UserPlus className="mr-2 h-4 w-4" />
                {criandoStaff ? 'Criando...' : 'Criar staff'}
              </Button>
            </div>
          </div>
        </Card>

        {staff.length === 0 ? (
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
                                onClick={() => desvincularStaff(s.id, orgId)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </Badge>
                          )
                        })
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                      onClick={() => vincularStaff(s.id)}
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

      {/* Confirmação de bloqueio */}
      <Dialog open={!!alvo} onOpenChange={(open) => !open && setAlvo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {alvo?.status === 'bloqueada' ? 'Desbloquear' : 'Bloquear'} {alvo?.nome}?
            </DialogTitle>
            <DialogDescription>
              {alvo?.status === 'bloqueada'
                ? 'Os usuários voltam a ter acesso normal. Nada é apagado.'
                : 'Os usuários não conseguirão mais usar o app (login bloqueado). Os dados são mantidos e a organização pode ser desbloqueada a qualquer momento.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlvo(null)}>
              Cancelar
            </Button>
            <Button
              variant={alvo?.status === 'bloqueada' ? 'default' : 'destructive'}
              onClick={alternarBloqueio}
              disabled={bloqueando}
            >
              {bloqueando
                ? 'Salvando...'
                : alvo?.status === 'bloqueada'
                  ? 'Desbloquear'
                  : 'Bloquear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
