/* Console de contas — página de uma organização, com abas: visão geral,
   plano e cobrança, módulos, equipe, uso, histórico. Ações perigosas ficam
   no fim da aba de plano (zona de perigo). Tudo vem de uma chamada só. */
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, KeyRound, Package, CalendarClock, Ban, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import AdminNav from '@/components/admin/AdminNav'
import {
  BloqueioDialog,
  NovaSenhaDialog,
  PacoteDialog,
  PlanoDialog,
} from '@/components/admin/DialogosOrganizacao'
import {
  obterOrganizacao,
  ACAO_LABEL,
  PLANOS,
  STATUS_LABEL,
  type OrgDetalhe,
} from '@/services/admin'

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ativa: 'default',
  trial: 'secondary',
  bloqueada: 'destructive',
  vencida: 'destructive',
}

const MODULO_LABEL: Record<string, string> = {
  auditoria: 'Auditoria NRs',
  relatorios: 'Relatórios/PDF',
  formularios: 'Formulários',
  ia: 'Assistente IA',
  orcamentos: 'Orçamentos',
  documentos: 'Documentação SST',
}

const PAPEL_LABEL: Record<string, string> = {
  admin_plataforma: 'Admin da plataforma',
  staff_labora: 'Staff Labora',
  gestor: 'Gestor',
  gerente: 'Gerente',
  executor: 'Técnico',
  cliente: 'Cliente',
}

function fmtData(d?: string) {
  return d ? new Date(d).toLocaleDateString('pt-BR') : '—'
}

function fmtMes(m: string) {
  const [a, mes] = m.split('-')
  const nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${nomes[Number(mes) - 1] || mes}/${a.slice(2)}`
}

function Dado({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{rotulo}</div>
      <div className="text-sm font-medium">{valor}</div>
    </div>
  )
}

function Numero({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <Card className="rounded-2xl border-none p-4 shadow-subtle">
      <div className="text-2xl font-extrabold leading-none">{valor}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{rotulo}</div>
    </Card>
  )
}

export default function AdminOrganizacaoDetalhe() {
  const { id = '' } = useParams()
  const [org, setOrg] = useState<OrgDetalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  const [pacoteAberto, setPacoteAberto] = useState(false)
  const [planoAberto, setPlanoAberto] = useState(false)
  const [bloqueioAberto, setBloqueioAberto] = useState(false)
  const [senhaAlvo, setSenhaAlvo] = useState<{
    userId: string
    nome: string
    contexto: string
  } | null>(null)

  const carregar = useCallback(async () => {
    try {
      setOrg(await obterOrganizacao(id))
      setErro('')
    } catch (error) {
      setErro(getErrorMessage(error))
      toast.error('Não foi possível abrir a organização', { description: getErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    carregar()
  }, [carregar])

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <AdminNav />
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <AdminNav />
        <Card className="rounded-2xl border-dashed p-12 text-center text-sm text-muted-foreground">
          {erro || 'Organização não encontrada.'}
          <div className="mt-4">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/admin/organizacoes">Voltar para a lista</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const planoInfo = PLANOS.find((p) => p.value === org.plano)
  const orgBase = {
    id: org.id,
    nome: org.nome,
    status: org.status,
    plano: org.plano,
    limite_usuarios: org.limite_usuarios,
    vencimento: org.vencimento,
  }
  const modulosLigados = Object.keys(MODULO_LABEL).filter(
    (k) => (org.modulos as Record<string, boolean | undefined>)[k] !== false,
  )
  const modulosDesligados = Object.keys(MODULO_LABEL).filter(
    (k) => (org.modulos as Record<string, boolean | undefined>)[k] === false,
  )

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <AdminNav />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/admin/organizacoes"
            className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Organizações
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight">{org.nome}</h1>
            <Badge variant={STATUS_VARIANT[org.status] || 'default'}>
              {STATUS_LABEL[org.status] || org.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Dono: {org.dono?.name || '—'}
            {org.dono?.email ? ` · ${org.dono.email}` : ''} · desde {fmtData(org.created)}
          </p>
        </div>
        {org.pode_editar && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setPlanoAberto(true)}
            >
              <CalendarClock className="mr-1.5 h-3.5 w-3.5" /> Plano
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setPacoteAberto(true)}
            >
              <Package className="mr-1.5 h-3.5 w-3.5" /> Pacote
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="visao">
        <TabsList className="mb-4 flex h-auto flex-wrap justify-start rounded-full">
          <TabsTrigger value="visao" className="rounded-full">
            Visão geral
          </TabsTrigger>
          <TabsTrigger value="plano" className="rounded-full">
            Plano e cobrança
          </TabsTrigger>
          <TabsTrigger value="modulos" className="rounded-full">
            Módulos
          </TabsTrigger>
          <TabsTrigger value="equipe" className="rounded-full">
            Equipe
          </TabsTrigger>
          <TabsTrigger value="uso" className="rounded-full">
            Uso
          </TabsTrigger>
          <TabsTrigger value="historico" className="rounded-full">
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Numero rotulo="Usuários" valor={org.contagens.usuarios} />
            <Numero rotulo="Empresas" valor={org.contagens.empresas} />
            <Numero rotulo="Vistorias" valor={org.contagens.vistorias} />
            <Numero rotulo="Perguntas IA" valor={org.contagens.perguntas_ia} />
          </div>
          <Card className="grid gap-4 rounded-2xl border-none p-5 shadow-subtle sm:grid-cols-3">
            <Dado
              rotulo="Plano"
              valor={planoInfo ? `${planoInfo.label} (${planoInfo.vagas})` : '—'}
            />
            <Dado
              rotulo="Vagas"
              valor={`${org.contagens.usuarios > 0 ? org.contagens.usuarios - 1 : 0} de ${org.limite_usuarios} em uso`}
            />
            <Dado rotulo="Vencimento" valor={fmtData(org.vencimento)} />
            <Dado rotulo="Vistorias concluídas" valor={org.contagens.vistorias_concluidas} />
            <Dado rotulo="Documentos SST" valor={org.contagens.documentos} />
            <Dado rotulo="Orçamentos" valor={org.contagens.orcamentos} />
          </Card>
          <Card className="rounded-2xl border-none p-5 shadow-subtle">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Módulos</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {modulosLigados.map((k) => (
                <Badge key={k} variant="secondary">
                  {MODULO_LABEL[k]}
                </Badge>
              ))}
              {modulosDesligados.map((k) => (
                <Badge key={k} variant="outline" className="text-muted-foreground line-through">
                  {MODULO_LABEL[k]}
                </Badge>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="plano" className="space-y-6">
          <Card className="rounded-2xl border-none p-5 shadow-subtle">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Dado rotulo="Plano" valor={planoInfo ? planoInfo.label : '—'} />
                <Dado rotulo="Vagas contratadas" valor={org.limite_usuarios} />
                <Dado rotulo="Vencimento" valor={fmtData(org.vencimento)} />
              </div>
              {org.pode_editar && (
                <Button size="sm" className="rounded-full" onClick={() => setPlanoAberto(true)}>
                  <CalendarClock className="mr-1.5 h-3.5 w-3.5" /> Alterar plano
                </Button>
              )}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              O vencimento controla quando a organização vira somente-leitura. Sem vencimento, ela
              nunca vence sozinha.
            </p>
          </Card>

          <Card className="rounded-2xl border-dashed p-5 text-sm text-muted-foreground">
            <div className="font-semibold text-foreground">Cobrança</div>
            <p className="mt-1">
              Assinatura, faturas e link de pagamento entram aqui na próxima etapa. Esta aba já é o
              lugar deles, para não voltar a espalhar botões pela lista.
            </p>
          </Card>

          {org.pode_editar && (
            <Card className="rounded-2xl border border-destructive/30 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">Zona de perigo</div>
                  <div className="text-sm text-muted-foreground">
                    {org.status === 'bloqueada'
                      ? 'A organização está bloqueada. Desbloquear devolve o acesso a todos os usuários.'
                      : 'Bloquear impede o login de todos os usuários. Nada é apagado.'}
                  </div>
                </div>
                <Button
                  variant={org.status === 'bloqueada' ? 'default' : 'destructive'}
                  className="rounded-full"
                  onClick={() => setBloqueioAberto(true)}
                >
                  {org.status === 'bloqueada' ? (
                    <>
                      <ShieldCheck className="mr-1.5 h-4 w-4" /> Desbloquear
                    </>
                  ) : (
                    <>
                      <Ban className="mr-1.5 h-4 w-4" /> Bloquear organização
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="modulos">
          <Card className="rounded-2xl border-none p-5 shadow-subtle">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">Pacote contratado</div>
                <div className="text-sm text-muted-foreground">
                  Módulo desligado fica invisível para os usuários da organização.
                </div>
              </div>
              {org.pode_editar && (
                <Button size="sm" className="rounded-full" onClick={() => setPacoteAberto(true)}>
                  <Package className="mr-1.5 h-3.5 w-3.5" /> Editar pacote
                </Button>
              )}
            </div>
            <div className="mt-4 divide-y">
              {Object.keys(MODULO_LABEL).map((k) => {
                const ligado = (org.modulos as Record<string, boolean | undefined>)[k] !== false
                return (
                  <div key={k} className="flex items-center justify-between py-2.5 text-sm">
                    <span>{MODULO_LABEL[k]}</span>
                    <Badge variant={ligado ? 'default' : 'outline'}>
                      {ligado ? 'Ligado' : 'Desligado'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="equipe" className="space-y-6">
          <div>
            <h2 className="mb-2 text-lg font-bold">Membros da organização</h2>
            <Card className="divide-y rounded-2xl border-none shadow-subtle">
              {org.membros.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Sem membros.</div>
              ) : (
                org.membros.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">
                        {m.name || m.email}
                        {m.eh_dono && (
                          <Badge variant="secondary" className="ml-2">
                            Titular
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {m.email} · {PAPEL_LABEL[m.papel] || m.papel || '—'} · desde{' '}
                        {fmtData(m.created)}
                      </div>
                    </div>
                    {org.pode_editar && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() =>
                          setSenhaAlvo({
                            userId: m.id,
                            nome: m.name || m.email,
                            contexto: `Senha temporária para ${m.name || m.email}.`,
                          })
                        }
                      >
                        <KeyRound className="mr-1.5 h-3.5 w-3.5" /> Nova senha
                      </Button>
                    )}
                  </div>
                ))
              )}
            </Card>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-bold">Staff Labora vinculado</h2>
            <Card className="divide-y rounded-2xl border-none shadow-subtle">
              {org.staff.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum staff vinculado.{' '}
                  <Link to="/admin/staff" className="underline">
                    Vincular na página de Staff
                  </Link>
                  .
                </div>
              ) : (
                org.staff.map((s) => (
                  <div key={s.id} className="px-4 py-3 text-sm">
                    <div className="font-semibold">{s.name || s.email}</div>
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                  </div>
                ))
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="uso">
          <Card className="overflow-hidden rounded-2xl border-none shadow-subtle">
            {org.uso_mensal.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Sem atividade nos últimos 6 meses.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-accent/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Mês</th>
                    <th className="px-4 py-2.5 text-right font-medium">Vistorias criadas</th>
                    <th className="px-4 py-2.5 text-right font-medium">Perguntas IA</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {org.uso_mensal.map((u) => (
                    <tr key={u.mes}>
                      <td className="px-4 py-2.5">{fmtMes(u.mes)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{u.vistorias}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{u.perguntas_ia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card className="divide-y rounded-2xl border-none shadow-subtle">
            {org.atividades.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma ação registrada nesta organização.
              </div>
            ) : (
              org.atividades.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <span className="w-36 shrink-0 text-xs text-muted-foreground">
                    {new Date(a.created).toLocaleString('pt-BR')}
                  </span>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs">
                    {ACAO_LABEL[a.acao] || a.acao}
                  </span>
                  <span className="min-w-0 flex-1">{a.descricao}</span>
                  <span className="text-xs text-muted-foreground">{a.usuario_nome}</span>
                </div>
              ))
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <PacoteDialog
        org={pacoteAberto ? orgBase : null}
        modulos={org.modulos}
        onClose={() => setPacoteAberto(false)}
        onSalvo={carregar}
      />
      <PlanoDialog
        org={planoAberto ? orgBase : null}
        onClose={() => setPlanoAberto(false)}
        onSalvo={carregar}
      />
      <BloqueioDialog
        org={bloqueioAberto ? orgBase : null}
        onClose={() => setBloqueioAberto(false)}
        onSalvo={carregar}
      />
      <NovaSenhaDialog
        alvo={senhaAlvo}
        onClose={() => {
          setSenhaAlvo(null)
          carregar()
        }}
      />
    </div>
  )
}
