/* Pop-up para adicionar uma ação (5W2H) ao plano de ação, usado de dentro do
   formulário de risco: a ação já nasce vinculada à avaliação de risco
   (avaliacao_id) e, se o técnico quiser, a um plano nomeado da empresa.
   A edição completa e a organização em planos continuam na aba "Plano de
   ação" (PlanoAcaoTab). */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useAuth } from '@/hooks/use-auth'
import {
  createAcaoPlano,
  type AcaoPlanoInput,
  type PrioridadeAcaoPlano,
  type StatusAcaoPlano,
} from '@/services/acoesPlano'
import { getPlanosAcao, type PlanoAcao } from '@/services/planosAcao'

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

const SEM_PLANO = '__sem_plano'
const NIVEIS_HIERARQUIA = [
  'Eliminação',
  'Substituição',
  'Engenharia',
  'Administrativa',
  'EPI',
] as const

interface AcaoPlanoDialogProps {
  open: boolean
  onOpenChange: (aberto: boolean) => void
  empresaId: string
  avaliacaoId: string
  /** Texto de contexto mostrado no topo (ex.: nome do risco). */
  contexto?: string
  prioridadePadrao?: PrioridadeAcaoPlano
  numeroExpostosPadrao?: number
  localPadrao?: string
  onSalvo?: () => void
}

export function AcaoPlanoDialog({
  open,
  onOpenChange,
  empresaId,
  avaliacaoId,
  contexto,
  prioridadePadrao,
  numeroExpostosPadrao,
  localPadrao,
  onSalvo,
}: AcaoPlanoDialogProps) {
  const { user } = useAuth()
  const organizacaoId = (user?.organizacao_id as string) || ''
  const [planos, setPlanos] = useState<PlanoAcao[]>([])
  const [f, setF] = useState<Partial<AcaoPlanoInput>>({})
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!open) return
    setF({
      status: 'Pendente' as StatusAcaoPlano,
      prioridade: prioridadePadrao,
      numero_expostos: numeroExpostosPadrao,
      local: localPadrao,
    })
    getPlanosAcao(empresaId)
      .then((lista) => setPlanos(lista.filter((p) => p.status === 'Ativo')))
      .catch(() => setPlanos([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, avaliacaoId])

  const salvar = async () => {
    if (!f.medida?.trim()) return toast.error('Descreva o que será feito (a medida)')
    setSalvando(true)
    try {
      await createAcaoPlano({
        ...f,
        organizacao_id: organizacaoId,
        empresa_id: empresaId,
        avaliacao_id: avaliacaoId,
        origem: 'Manual',
      } as AcaoPlanoInput)
      toast.success('Ação adicionada ao plano de ação')
      onOpenChange(false)
      onSalvo?.()
    } catch (error) {
      toast.error('Não foi possível salvar a ação', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar ação ao plano de ação</DialogTitle>
          <DialogDescription>
            {contexto ? `Risco: ${contexto}. ` : ''}Preencha o essencial (5W2H); você pode completar
            depois na aba Plano de ação.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>O quê (a medida)</Label>
            <Textarea
              className="mt-1.5"
              placeholder="Ex.: Instalar exaustão local no posto de solda"
              value={f.medida || ''}
              onChange={(e) => setF((v) => ({ ...v, medida: e.target.value }))}
            />
          </div>
          <div>
            <Label>Por quê (justificativa)</Label>
            <Textarea
              className="mt-1.5"
              value={f.justificativa || ''}
              onChange={(e) => setF((v) => ({ ...v, justificativa: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Onde</Label>
              <Input
                className="mt-1.5"
                value={f.local || ''}
                onChange={(e) => setF((v) => ({ ...v, local: e.target.value }))}
              />
            </div>
            <div>
              <Label>Quando (prazo)</Label>
              <Input
                className="mt-1.5"
                type="date"
                value={f.prazo ? f.prazo.slice(0, 10) : ''}
                onChange={(e) => setF((v) => ({ ...v, prazo: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quem (responsável)</Label>
              <Input
                className="mt-1.5"
                value={f.responsavel || ''}
                onChange={(e) => setF((v) => ({ ...v, responsavel: e.target.value }))}
              />
            </div>
            <div>
              <Label>Quanto custa (R$, estimado)</Label>
              <Input
                className="mt-1.5"
                type="number"
                value={f.custo_estimado ?? ''}
                onChange={(e) =>
                  setF((v) => ({ ...v, custo_estimado: Number(e.target.value) || undefined }))
                }
              />
            </div>
          </div>
          <div>
            <Label>Como (método de execução)</Label>
            <Textarea
              className="mt-1.5"
              value={f.como || ''}
              onChange={(e) => setF((v) => ({ ...v, como: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nível de controle</Label>
              <Select
                value={f.nivel_hierarquia || '__vazio'}
                onValueChange={(v) =>
                  setF((s) => ({
                    ...s,
                    nivel_hierarquia:
                      v === '__vazio' ? undefined : (v as (typeof NIVEIS_HIERARQUIA)[number]),
                  }))
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__vazio">—</SelectItem>
                  {NIVEIS_HIERARQUIA.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plano de ação</Label>
              <Select
                value={f.plano_id || SEM_PLANO}
                onValueChange={(v) =>
                  setF((s) => ({ ...s, plano_id: v === SEM_PLANO ? undefined : v }))
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_PLANO}>Sem plano (organizar depois)</SelectItem>
                  {planos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            Adicionar ação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AcaoPlanoDialog
