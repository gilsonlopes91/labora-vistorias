/* Planejamento do PGR (E0 do desenho de processo — manual de interpretação
   do capítulo 1.5 da NR-1, MTE). Antes de iniciar o levantamento em si, o
   profissional registra como vai organizar esta empresa (GHE/GES ou
   atividade/posto/função/setor — a escolha fica livre por unidade em
   "Estrutura SST", isto aqui é só a orientação geral), qual matriz de risco
   usar por padrão, quem participa e a data de início. Fica salvo em
   empresas.pgr_* e pode ser reaberto e mudado a qualquer momento. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ClipboardList } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getEmpresa, updateEmpresa, type Empresa } from '@/services/empresas'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const MODOS_ORGANIZACAO = ['GHE/GES', 'Atividade, posto, função ou setor', 'Misto'] as const

export function PlanejamentoPgrTab({ empresaId }: { empresaId: string }) {
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [f, setF] = useState<Partial<Empresa>>({})

  useEffect(() => {
    setCarregando(true)
    getEmpresa(empresaId)
      .then((e) => {
        setF(e)
      })
      .catch((error) =>
        toast.error('Não foi possível carregar o planejamento', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregando(false))
  }, [empresaId])

  const salvar = async () => {
    setSalvando(true)
    try {
      const atualizado = await updateEmpresa(empresaId, {
        pgr_data_inicio_levantamento: f.pgr_data_inicio_levantamento || undefined,
        pgr_modo_organizacao: f.pgr_modo_organizacao,
        pgr_matriz_padrao_metodologia: f.pgr_matriz_padrao_metodologia,
        pgr_matriz_padrao_dimensao: f.pgr_matriz_padrao_dimensao,
        pgr_participantes: f.pgr_participantes,
        pgr_observacoes_planejamento: f.pgr_observacoes_planejamento,
      })
      setF(atualizado)
      toast.success('Planejamento salvo')
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Planejamento do PGR
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Etapa E0 do processo: antes do levantamento, defina como esta empresa vai ser organizada e
          qual matriz de risco usar por padrão. Nada aqui é definitivo — dá para reabrir e mudar a
          qualquer momento, e cada unidade de avaliação pode ter seu próprio tipo de agrupamento em
          "Estrutura SST".
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Data de início do levantamento</Label>
            <Input
              className="mt-1.5"
              type="date"
              value={f.pgr_data_inicio_levantamento?.slice(0, 10) || ''}
              onChange={(e) =>
                setF((v) => ({ ...v, pgr_data_inicio_levantamento: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Modo de organização predominante</Label>
            <Select
              value={f.pgr_modo_organizacao || '__vazio'}
              onValueChange={(v) =>
                setF((s) => ({
                  ...s,
                  pgr_modo_organizacao:
                    v === '__vazio' ? undefined : (v as Empresa['pgr_modo_organizacao']),
                }))
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Ainda não decidido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__vazio">Ainda não decidido</SelectItem>
                {MODOS_ORGANIZACAO.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Metodologia de matriz padrão</Label>
            <Select
              value={f.pgr_matriz_padrao_metodologia || '__vazio'}
              onValueChange={(v) =>
                setF((s) => ({
                  ...s,
                  pgr_matriz_padrao_metodologia:
                    v === '__vazio' ? undefined : (v as Empresa['pgr_matriz_padrao_metodologia']),
                  ...(v === 'ISO45002' ? { pgr_matriz_padrao_dimensao: '5' as const } : {}),
                }))
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Ainda não decidido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__vazio">Ainda não decidido</SelectItem>
                <SelectItem value="AIHA">AIHA (adaptação BS 8800)</SelectItem>
                <SelectItem value="ISO45002">ISO 45002 (manual do MTE)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Dimensão da matriz padrão</Label>
            <Select
              value={f.pgr_matriz_padrao_dimensao || '__vazio'}
              onValueChange={(v) =>
                setF((s) => ({
                  ...s,
                  pgr_matriz_padrao_dimensao:
                    v === '__vazio' ? undefined : (v as Empresa['pgr_matriz_padrao_dimensao']),
                }))
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Ainda não decidido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__vazio">Ainda não decidido</SelectItem>
                <SelectItem value="5">5 x 5</SelectItem>
                <SelectItem value="3" disabled={f.pgr_matriz_padrao_metodologia === 'ISO45002'}>
                  3 x 3
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Participantes do levantamento</Label>
          <Textarea
            className="mt-1.5"
            placeholder="Técnico responsável, representantes da empresa, CIPA, SESMT..."
            value={f.pgr_participantes || ''}
            onChange={(e) => setF((v) => ({ ...v, pgr_participantes: e.target.value }))}
          />
        </div>
        <div>
          <Label>Observações do planejamento</Label>
          <Textarea
            className="mt-1.5"
            placeholder="Escopo, restrições de acesso, particularidades desta empresa..."
            value={f.pgr_observacoes_planejamento || ''}
            onChange={(e) => setF((v) => ({ ...v, pgr_observacoes_planejamento: e.target.value }))}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={salvar} disabled={salvando}>
            Salvar planejamento
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default PlanejamentoPgrTab
