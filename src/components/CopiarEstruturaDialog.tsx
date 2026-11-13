/* Copia a estrutura de SST de outra empresa da mesma organização para uma
   empresa que ainda não tem levantamento: setores, GHEs, funções e,
   opcionalmente, os riscos. Serve de ponto de partida para empresas
   parecidas; o técnico revisa depois.

   O que NÃO é copiado, porque é próprio de cada empresa: número de
   trabalhadores, medições, fotos, a probabilidade e a severidade de cada
   risco e as conclusões de insalubridade, periculosidade e aposentadoria
   especial. */
import { useState } from 'react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import type { Empresa } from '@/services/empresas'
import { createSetor, getSetores, type SetorInput } from '@/services/setores'
import { createGhe, getGhes, type GheInput } from '@/services/ghes'
import { createFuncaoSst, getFuncoesSst, type FuncaoSstInput } from '@/services/funcoesSst'
import {
  createAvaliacaoRisco,
  getAvaliacoesRiscoDaEmpresa,
  type AvaliacaoRiscoInput,
} from '@/services/avaliacoesRisco'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
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

const CAMPOS_FORA_DA_COPIA = [
  // do sistema
  'id',
  'collectionId',
  'collectionName',
  'created',
  'updated',
  'expand',
  // próprios da empresa de origem
  'fotos',
  'numero_empregados',
  'numero_homens',
  'numero_mulheres',
  'numero_expostos',
  'formulario_origem_id',
  'resposta_vistoria_origem_id',
  'categoria_aiha_exposicao',
  // avaliação do risco: probabilidade e severidade vêm em branco, e também o
  // que faria o sistema sugeri-las sozinho
  'probabilidade_sugerida',
  'probabilidade_final',
  'severidade_sugerida',
  'severidade_final',
  'justificativa_ajuste',
  'controle_nivel',
  'resultado_aep_aet',
  'efeito_saude_aiha',
  'incerteza',
  'nr_especifica_aplicavel',
  'nr_especifica_referencia',
  'nr_especifica_atendida',
  'nr_especifica_justificativa',
  'insalubridade_sugerida',
  'insalubridade_final',
  'insalubridade_justificativa',
  'periculosidade_sugerida',
  'periculosidade_final',
  'periculosidade_justificativa',
  'ltcat_enquadra_sugerido',
  'ltcat_enquadra_final',
  'ltcat_justificativa',
]

function paraCopia(registro: object): Record<string, unknown> {
  const copia = { ...(registro as Record<string, unknown>) }
  CAMPOS_FORA_DA_COPIA.forEach((campo) => delete copia[campo])
  return copia
}

export function CopiarEstruturaDialog({
  destino,
  empresas,
  onCopiado,
}: {
  destino: Empresa
  /** Empresas que o usuário enxerga; só as da mesma organização viram origem. */
  empresas: Empresa[]
  onCopiado: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const [origemId, setOrigemId] = useState('')
  const [comRiscos, setComRiscos] = useState(true)
  const [copiando, setCopiando] = useState(false)

  const origens = empresas.filter(
    (e) => e.id !== destino.id && e.organizacao_id === destino.organizacao_id,
  )

  const copiar = async () => {
    if (!origemId) return toast.error('Escolha a empresa de origem')
    setCopiando(true)
    try {
      const [setores, ghes, funcoes] = await Promise.all([
        getSetores(origemId),
        getGhes(origemId),
        getFuncoesSst(origemId),
      ])
      if (setores.length + ghes.length + funcoes.length === 0) {
        toast.error('A empresa escolhida ainda não tem estrutura para copiar')
        return
      }
      const avaliacoes = comRiscos
        ? await getAvaliacoesRiscoDaEmpresa(
            ghes.map((g) => g.id),
            funcoes.map((f) => f.id),
          )
        : []
      const base = { organizacao_id: destino.organizacao_id, empresa_id: destino.id }

      const mapaSetor: Record<string, string> = {}
      for (const s of setores) {
        const novo = await createSetor({ ...paraCopia(s), ...base } as SetorInput)
        mapaSetor[s.id] = novo.id
      }
      const mapaGhe: Record<string, string> = {}
      for (const g of ghes) {
        const novo = await createGhe({
          ...paraCopia(g),
          ...base,
          setor_id: g.setor_id ? mapaSetor[g.setor_id] : undefined,
        } as GheInput)
        mapaGhe[g.id] = novo.id
      }
      const mapaFuncao: Record<string, string> = {}
      for (const f of funcoes) {
        const novo = await createFuncaoSst({
          ...paraCopia(f),
          ...base,
          setor_id: f.setor_id ? mapaSetor[f.setor_id] : undefined,
          ghe_id: f.ghe_id ? mapaGhe[f.ghe_id] : undefined,
        } as FuncaoSstInput)
        mapaFuncao[f.id] = novo.id
      }
      for (const a of avaliacoes) {
        await createAvaliacaoRisco({
          ...paraCopia(a),
          organizacao_id: destino.organizacao_id,
          ghe_id: a.ghe_id ? mapaGhe[a.ghe_id] : undefined,
          funcao_id: a.funcao_id ? mapaFuncao[a.funcao_id] : undefined,
          ativo: true,
        } as AvaliacaoRiscoInput)
      }
      toast.success(
        `Copiado: ${setores.length} ambiente(s), ${ghes.length} GHE(s), ${funcoes.length} função(ões) e ${avaliacoes.length} risco(s)`,
      )
      setAberto(false)
      onCopiado()
    } catch (error) {
      toast.error('A cópia parou no meio. Confira o que já foi criado antes de tentar de novo.', {
        description: getErrorMessage(error),
      })
      onCopiado()
    } finally {
      setCopiando(false)
    }
  }

  if (origens.length === 0) return null

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
        Copiar estrutura de outra empresa
      </Button>
      <Dialog open={aberto} onOpenChange={(o) => !copiando && setAberto(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Copiar estrutura de outra empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copia ambientes, GHEs e funções para esta empresa, como ponto de partida. Número de
              trabalhadores, medições e conclusões de insalubridade, periculosidade e aposentadoria
              especial não são copiados.
            </p>
            <div>
              <Label>Empresa de origem</Label>
              <Select value={origemId} onValueChange={setOrigemId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Escolha a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {origens.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome_fantasia || e.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                className="mt-0.5"
                checked={comRiscos}
                onCheckedChange={(c) => setComRiscos(!!c)}
              />
              <span>
                Copiar também os riscos
                <span className="block text-xs text-muted-foreground">
                  Os riscos vêm sem probabilidade e sem severidade, para você avaliar nesta empresa.
                </span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)} disabled={copiando}>
              Cancelar
            </Button>
            <Button onClick={copiar} disabled={copiando || !origemId}>
              {copiando ? 'Copiando...' : 'Copiar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CopiarEstruturaDialog
