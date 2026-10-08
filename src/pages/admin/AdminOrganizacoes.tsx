/* Console de contas — lista paginada de organizações com busca e filtros.
   As contagens vêm prontas do backend numa chamada por página. */
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Search, ChevronLeft, ChevronRight, ArrowRight as Abrir, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import AdminNav from '@/components/admin/AdminNav'
import ImportarContasDialog from '@/components/admin/ImportarContasDialog'
import {
  criarConta,
  listarOrganizacoes,
  PLANOS,
  STATUS_LABEL,
  type ListaOrgs,
  type PlanoOrg,
} from '@/services/admin'

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ativa: 'default',
  trial: 'secondary',
  bloqueada: 'destructive',
  vencida: 'destructive',
}

function fmtData(d: string) {
  return d ? new Date(d).toLocaleDateString('pt-BR') : '—'
}

export default function AdminOrganizacoes() {
  const [params, setParams] = useSearchParams()
  const pagina = Number(params.get('pagina') || '1')
  const status = params.get('status') || ''
  const plano = params.get('plano') || ''
  const buscaUrl = params.get('busca') || ''

  const [busca, setBusca] = useState(buscaUrl)
  const [dados, setDados] = useState<ListaOrgs | null>(null)
  const [loading, setLoading] = useState(true)

  // Nova conta de cliente (usuário + organização própria).
  const [novaAberta, setNovaAberta] = useState(false)
  const [criando, setCriando] = useState(false)
  const [nova, setNova] = useState<{
    nome: string
    email: string
    org_nome: string
    plano: PlanoOrg
  }>({ nome: '', email: '', org_nome: '', plano: 'individual' })
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nova.email.trim())

  const atualizarParam = (chave: string, valor: string) => {
    const p = new URLSearchParams(params)
    if (valor) p.set(chave, valor)
    else p.delete(chave)
    if (chave !== 'pagina') p.delete('pagina')
    setParams(p)
  }

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      setDados(await listarOrganizacoes({ pagina, busca: buscaUrl, status, plano, por_pagina: 20 }))
    } catch (error) {
      toast.error('Não foi possível carregar as organizações', {
        description: getErrorMessage(error),
      })
    } finally {
      setLoading(false)
    }
  }, [pagina, buscaUrl, status, plano])

  useEffect(() => {
    carregar()
  }, [carregar])

  const criar = async () => {
    setCriando(true)
    try {
      await criarConta({
        nome: nova.nome.trim(),
        email: nova.email.trim().toLowerCase(),
        org_nome: nova.org_nome.trim() || undefined,
        plano: nova.plano,
      })
      toast.success(`Conta criada para ${nova.nome.trim()}`, {
        description: 'Entra com o e-mail e a senha padrão e precisa trocá-la no primeiro acesso.',
      })
      setNovaAberta(false)
      setNova({ nome: '', email: '', org_nome: '', plano: 'individual' })
      carregar()
    } catch (error) {
      toast.error('Não foi possível criar a conta', { description: getErrorMessage(error) })
    } finally {
      setCriando(false)
    }
  }

  // Busca com pequeno atraso, para não disparar uma chamada por tecla.
  useEffect(() => {
    if (busca === buscaUrl) return
    const t = setTimeout(() => atualizarParam('busca', busca.trim()), 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca])

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Organizações</h1>
          <p className="text-sm text-muted-foreground">
            Clique numa organização para abrir plano, módulos, equipe, uso e histórico.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportarContasDialog onConcluido={carregar} />
          <Button className="rounded-full" onClick={() => setNovaAberta(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nova organização
          </Button>
        </div>
      </div>
      <Dialog open={novaAberta} onOpenChange={setNovaAberta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova organização (cliente)</DialogTitle>
            <DialogDescription>
              Cria o usuário e a organização dele, separada de todas as outras. A conta nasce com a
              senha padrão e a pessoa é obrigada a trocá-la no primeiro acesso. Nenhum e-mail é
              enviado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da pessoa</Label>
              <Input
                value={nova.nome}
                onChange={(e) => setNova((v) => ({ ...v, nome: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail (será o login)</Label>
              <Input
                type="email"
                value={nova.email}
                onChange={(e) => setNova((v) => ({ ...v, email: e.target.value }))}
                placeholder="email@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome da organização (opcional)</Label>
              <Input
                value={nova.org_nome}
                onChange={(e) => setNova((v) => ({ ...v, org_nome: e.target.value }))}
                placeholder="Se vazio, usa o nome da pessoa"
              />
            </div>
            <div className="space-y-2">
              <Label>Plano</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={nova.plano}
                onChange={(e) => setNova((v) => ({ ...v, plano: e.target.value as PlanoOrg }))}
              >
                {PLANOS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label} — {p.vagas}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={criar} disabled={criando || !nova.nome.trim() || !emailValido}>
              {criando ? 'Criando...' : 'Criar organização'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AdminNav />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por organização, dono ou e-mail..."
            className="pl-9"
          />
        </div>
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={status}
          onChange={(e) => atualizarParam('status', e.target.value)}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={plano}
          onChange={(e) => atualizarParam('plano', e.target.value)}
        >
          <option value="">Todos os planos</option>
          {PLANOS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {loading && !dados ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : !dados || dados.itens.length === 0 ? (
        <Card className="rounded-2xl border-dashed p-12 text-center text-sm text-muted-foreground">
          Nenhuma organização encontrada.
        </Card>
      ) : (
        <>
          <Card
            className={`overflow-hidden rounded-2xl border-none shadow-subtle ${loading ? 'opacity-60' : ''}`}
          >
            <table className="w-full text-sm">
              <thead className="bg-accent/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Organização</th>
                  <th className="px-4 py-2.5 font-medium">Plano</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Vencimento</th>
                  <th className="px-4 py-2.5 text-right font-medium">Usuários</th>
                  <th className="px-4 py-2.5 text-right font-medium">Empresas</th>
                  <th className="px-4 py-2.5 text-right font-medium">Vistorias</th>
                  <th className="px-4 py-2.5 text-right font-medium">IA</th>
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {dados.itens.map((o) => (
                  <tr key={o.id} className="hover:bg-accent/30">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/organizacoes/${o.id}`}
                        className="font-semibold hover:underline"
                      >
                        {o.nome}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {o.dono_nome || '—'}
                        {o.dono_email ? ` · ${o.dono_email}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="capitalize">{o.plano || '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.limite_usuarios} {o.limite_usuarios === 1 ? 'vaga' : 'vagas'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[o.status] || 'default'}>
                        {STATUS_LABEL[o.status] || o.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{fmtData(o.vencimento)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{o.usuarios}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{o.empresas}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{o.vistorias}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{o.perguntas_ia}</td>
                    <td className="px-2 py-3">
                      <Button asChild size="sm" variant="ghost" className="rounded-full">
                        <Link to={`/admin/organizacoes/${o.id}`} aria-label={`Abrir ${o.nome}`}>
                          <Abrir className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {dados.total} {dados.total === 1 ? 'organização' : 'organizações'} · página{' '}
              {dados.pagina} de {dados.total_paginas}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={pagina <= 1}
                onClick={() => atualizarParam('pagina', String(pagina - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={pagina >= dados.total_paginas}
                onClick={() => atualizarParam('pagina', String(pagina + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
