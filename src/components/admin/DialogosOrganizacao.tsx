/* Diálogos de ação sobre uma organização (pacote, plano, nova senha, bloqueio).
   Reaproveitados pela lista e pela página de detalhe do console. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  PLANOS,
  type Modulos,
  type PlanoOrg,
  alternarBloqueio,
  definirNovaSenha,
  gerarSenhaForte,
  salvarPacote,
  salvarPlano,
} from '@/services/admin'

interface OrgBase {
  id: string
  nome: string
  status: string
  plano?: string
  limite_usuarios?: number
  vencimento?: string
}

const MODULOS_UI: { key: keyof Modulos; label: string; desc: string }[] = [
  {
    key: 'auditoria',
    label: 'Auditoria NRs',
    desc: 'Checklists item a item com cálculo de multa NR-28',
  },
  { key: 'relatorios', label: 'Relatórios/PDF', desc: 'Geração do relatório em PDF da vistoria' },
  {
    key: 'formularios',
    label: 'Formulários',
    desc: 'Modelos e registros de campo (ruído, calor, vibração, químicos)',
  },
  { key: 'ia', label: 'Assistente IA', desc: 'Perguntas ao assistente dentro do app' },
  {
    key: 'orcamentos',
    label: 'Orçamentos',
    desc: 'Propostas comerciais e acompanhamento financeiro',
  },
  {
    key: 'documentos',
    label: 'Documentação SST',
    desc: 'PGR, LTCAT e laudos de insalubridade e periculosidade',
  },
]

const TODOS_LIGADOS: Modulos = {
  auditoria: true,
  relatorios: true,
  formularios: true,
  ia: true,
  orcamentos: true,
  documentos: true,
}

export function PacoteDialog({
  org,
  modulos,
  onClose,
  onSalvo,
}: {
  org: OrgBase | null
  modulos?: Partial<Modulos>
  onClose: () => void
  onSalvo: () => void
}) {
  const [valores, setValores] = useState<Modulos>(TODOS_LIGADOS)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!org) return
    const m = modulos || {}
    setValores({
      auditoria: m.auditoria !== false,
      relatorios: m.relatorios !== false,
      formularios: m.formularios !== false,
      ia: m.ia !== false,
      orcamentos: m.orcamentos !== false,
      documentos: m.documentos !== false,
    })
  }, [org, modulos])

  const salvar = async () => {
    if (!org) return
    setSalvando(true)
    try {
      await salvarPacote(org.id, valores)
      toast.success('Pacote atualizado')
      onSalvo()
      onClose()
    } catch (error) {
      toast.error('Não foi possível salvar o pacote', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={!!org} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pacote de {org?.nome}</DialogTitle>
          <DialogDescription>
            Escolha o que esta organização contratou. Módulo desligado fica invisível no app.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {MODULOS_UI.map((m) => (
            <div key={m.key} className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.desc}</div>
              </div>
              <Switch
                checked={valores[m.key]}
                onCheckedChange={(v) => setValores({ ...valores, [m.key]: v })}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar pacote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PlanoDialog({
  org,
  onClose,
  onSalvo,
}: {
  org: OrgBase | null
  onClose: () => void
  onSalvo: () => void
}) {
  const [plano, setPlano] = useState<PlanoOrg>('empresa')
  const [limite, setLimite] = useState('0')
  const [vencimento, setVencimento] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!org) return
    setPlano((org.plano as PlanoOrg) || 'empresa')
    setLimite(String(org.limite_usuarios || 0))
    setVencimento(org.vencimento ? org.vencimento.slice(0, 10) : '')
  }, [org])

  const salvar = async () => {
    if (!org) return
    setSalvando(true)
    try {
      await salvarPlano(org.id, { plano, limite_usuarios: Number(limite) || 0, vencimento })
      toast.success('Plano atualizado')
      onSalvo()
      onClose()
    } catch (error) {
      toast.error('Não foi possível salvar o plano', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={!!org} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Plano de {org?.nome}</DialogTitle>
          <DialogDescription>
            Define quantas vagas a organização tem (o titular não conta) e até quando o plano vale.
            Sem vencimento, a organização nunca vira somente-leitura sozinha.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="plano-select" className="mb-1.5 block text-xs">
              Plano
            </Label>
            <select
              id="plano-select"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={plano}
              onChange={(e) => {
                const p = e.target.value as PlanoOrg
                setPlano(p)
                if (p === 'individual') setLimite('0')
                else if (p === 'equipe') setLimite('3')
                else if (p === 'escritorio') setLimite('8')
              }}
            >
              {PLANOS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} ({p.vagas})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="plano-limite" className="mb-1.5 block text-xs">
              Vagas (sem contar o titular)
            </Label>
            <Input
              id="plano-limite"
              type="number"
              min={0}
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="plano-vencimento" className="mb-1.5 block text-xs">
              Vencimento (opcional)
            </Label>
            <Input
              id="plano-vencimento"
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar plano'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function NovaSenhaDialog({
  alvo,
  onClose,
}: {
  alvo: { userId: string; nome: string; contexto: string } | null
  onClose: () => void
}) {
  const [senha, setSenha] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (alvo) setSenha('')
  }, [alvo])

  const salvar = async () => {
    if (!alvo || senha.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres')
      return
    }
    setSalvando(true)
    try {
      await definirNovaSenha(alvo.userId, senha)
      toast.success('Senha enviada! O usuário redefine no próximo login.')
      onClose()
    } catch (error) {
      toast.error('Não foi possível definir a nova senha', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={!!alvo} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova senha — {alvo?.nome}</DialogTitle>
          <DialogDescription>
            {alvo?.contexto} No próximo login a pessoa será obrigada a criar uma senha nova.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 py-2">
          <Input
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha temporária (mínimo 8)"
          />
          <Button variant="outline" onClick={() => setSenha(gerarSenhaForte())} type="button">
            Gerar
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando || senha.length < 8}>
            {salvando ? 'Salvando...' : 'Definir senha'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function BloqueioDialog({
  org,
  onClose,
  onSalvo,
}: {
  org: OrgBase | null
  onClose: () => void
  onSalvo: () => void
}) {
  const [salvando, setSalvando] = useState(false)
  const bloqueada = org?.status === 'bloqueada'

  const confirmar = async () => {
    if (!org) return
    setSalvando(true)
    try {
      const r = await alternarBloqueio(org.id)
      toast.success(r.status === 'bloqueada' ? 'Organização bloqueada' : 'Organização desbloqueada')
      onSalvo()
      onClose()
    } catch (error) {
      toast.error('Não foi possível alterar o status', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={!!org} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {bloqueada ? 'Desbloquear' : 'Bloquear'} {org?.nome}?
          </DialogTitle>
          <DialogDescription>
            {bloqueada
              ? 'Os usuários voltam a ter acesso normal. Nada é apagado.'
              : 'Os usuários não conseguirão mais usar o app (login bloqueado). Os dados são mantidos e a organização pode ser desbloqueada a qualquer momento.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant={bloqueada ? 'default' : 'destructive'}
            onClick={confirmar}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : bloqueada ? 'Desbloquear' : 'Bloquear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
