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
  Package,
  KeyRound,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'

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
import ListaEsperaPanel from '@/components/ListaEsperaPanel'

interface OrgRow {
  id: string
  nome: string
  status: string
  created: string
  dono_id?: string
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
  acesso_console: boolean
}

interface Modulos {
  auditoria: boolean
  relatorios: boolean
  formularios: boolean
  ia: boolean
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

  // Pacotes (módulos) por organização
  const [pacoteAlvo, setPacoteAlvo] = useState<OrgRow | null>(null)
  const [pacoteModulos, setPacoteModulos] = useState<Modulos>({
    auditoria: true,
    relatorios: true,
    formularios: true,
    ia: true,
  })
  const [salvandoPacote, setSalvandoPacote] = useState(false)

  // Nova senha com troca obrigatória
  const [senhaAlvo, setSenhaAlvo] = useState<OrgRow | null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [gerandoSenha, setGerandoSenha] = useState(false)

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
            filter: pb.filter('organizacao_id = {:org} || id = {:dono}', {
              org: org.id,
              dono: org.dono_id || '__nenhum__',
            }),
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
          const ids = membros.map((m) => m.id)
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
          dono_id: org.dono_id,
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
          acesso_console: !!u.acesso_console,
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

  // ---- Pacotes ----
  const abrirPacote = async (org: OrgRow) => {
    setPacoteAlvo(org)
    try {
      const rec = await pb.collection('organizacoes').getOne(org.id)
      const m = (typeof rec.modulos === 'string' ? JSON.parse(rec.modulos) : rec.modulos) || {}
      setPacoteModulos({
        auditoria: m.auditoria !== false,
        relatorios: m.relatorios !== false,
        formularios: m.formularios !== false,
        ia: m.ia !== false,
      })
    } catch (_) {
      setPacoteModulos({ auditoria: true, relatorios: true, formularios: true, ia: true })
    }
  }

  const salvarPacote = async () => {
    if (!pacoteAlvo) return
    setSalvandoPacote(true)
    try {
      await pb.send('/backend/v1/admin/usuario', {
        method: 'POST',
        body: JSON.stringify({ acao: 'pacotes', org_id: pacoteAlvo.id, modulos: pacoteModulos }),
      })
      toast.success('Pacote atualizado')
      setPacoteAlvo(null)
      carregar()
    } catch (error) {
      toast.error('Não foi possível salvar o pacote', { description: getErrorMessage(error) })
    } finally {
      setSalvandoPacote(false)
    }
  }

  // ---- Nova senha ----
  const gerarSenhaForte = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let s = ''
    for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)]
    setNovaSenha(s)
  }

  const salvarNovaSenha = async () => {
    if (!senhaAlvo || novaSenha.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres')
      return
    }
    setGerandoSenha(true)
    try {
      const dono = await pb.collection('users').getFirstListItem(
        pb.filter('organizacao_id = {:org} || id = {:dono}', {
          org: senhaAlvo.id,
          dono: senhaAlvo.dono_id || '__nenhum__',
        }),
      )
      await pb.send('/backend/v1/admin/usuario', {
        method: 'POST',
        body: JSON.stringify({ acao: 'nova_senha', user_id: dono.id, senha: novaSenha }),
      })
      toast.success('Senha enviada! O usuário redefine no próximo login.')
      setSenhaAlvo(null)
      setNovaSenha('')
    } catch (error) {
      toast.error('Não foi possível definir a nova senha', {
        description: getErrorMessage(error),
      })
    } finally {
      setGerandoSenha(false)
    }
  }

  // ---- Staff console ----
  const alternarStaffConsole = async (s: StaffRow) => {
    try {
      await pb.send('/backend/v1/admin/usuario', {
        method: 'POST',
        body: JSON.stringify({ acao: 'staff_console', user_id: s.id, acesso: !s.acesso_console }),
      })
      toast.success(s.acesso_console ? 'Acesso ao console removido' : 'Acesso ao console concedido')
      carregarStaff()
    } catch (error) {
      toast.error('Não foi possível alterar o acesso', { description: getErrorMessage(error) })
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

  const podeAcessarConsole =
    user?.papel === 'admin_plataforma' || (user?.papel === 'staff_labora' && user?.acesso_console)

  if (!podeAcessarConsole) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <Ban className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área é exclusiva do administrador da plataforma.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/painel">Voltar para o início</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Gerenciamento de contas</h1>
          <p className="text-sm text-muted-foreground">
            Console de administração da plataforma — visão de todas as organizações.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/conteudo">Textos do site</Link>
        </Button>
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
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => abrirPacote(org)}
                  >
                    <Package className="mr-1.5 h-3.5 w-3.5" />
                    Pacote
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setSenhaAlvo(org)}
                    disabled={!org.dono_id}
                  >
                    <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                    Nova senha
                  </Button>
                  <Button
                    size="sm"
                    variant={org.status === 'bloqueada' ? 'default' : 'outline'}
                    className="rounded-full"
                    onClick={() => setAlvo(org)}
                  >
                    {org.status === 'bloqueada' ? 'Desbloquear' : 'Bloquear'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lista de espera (inscritos do site) — só admin da plataforma lê */}
      {user?.papel === 'admin_plataforma' && <ListaEsperaPanel />}

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
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox
                        checked={s.acesso_console}
                        onCheckedChange={() => alternarStaffConsole(s)}
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

      {/* Dialog de pacotes */}
      <Dialog open={!!pacoteAlvo} onOpenChange={(open) => !open && setPacoteAlvo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pacote de {pacoteAlvo?.nome}</DialogTitle>
            <DialogDescription>
              Escolha o que esta organização contratou. Módulo desligado fica invisível no app.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              {
                key: 'auditoria',
                label: 'Auditoria NRs',
                desc: 'Checklists item a item com cálculo de multa NR-28',
              },
              {
                key: 'relatorios',
                label: 'Relatórios/PDF',
                desc: 'Geração do relatório em PDF da vistoria',
              },
              {
                key: 'formularios',
                label: 'Formulários',
                desc: 'Modelos e registros de campo (ruído, calor, vibração, químicos)',
              },
              { key: 'ia', label: 'Assistente IA', desc: 'Perguntas ao assistente dentro do app' },
            ].map((m) => (
              <div key={m.key} className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.desc}</div>
                </div>
                <Switch
                  checked={pacoteModulos[m.key as keyof Modulos]}
                  onCheckedChange={(v) => setPacoteModulos({ ...pacoteModulos, [m.key]: v })}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPacoteAlvo(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarPacote} disabled={salvandoPacote}>
              {salvandoPacote ? 'Salvando...' : 'Salvar pacote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de nova senha */}
      <Dialog open={!!senhaAlvo} onOpenChange={(open) => !open && setSenhaAlvo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova senha — {senhaAlvo?.nome}</DialogTitle>
            <DialogDescription>
              Defina uma senha temporária para o dono. No próximo login ele será obrigado a criar
              uma nova.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 py-2">
            <Input
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Senha temporária (mínimo 8)"
            />
            <Button variant="outline" onClick={gerarSenhaForte} type="button">
              Gerar
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSenhaAlvo(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarNovaSenha} disabled={gerandoSenha || novaSenha.length < 8}>
              {gerandoSenha ? 'Salvando...' : 'Definir senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
