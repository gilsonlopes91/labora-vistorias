/* Dados do estabelecimento que entram nos Modelos Gerais Labora (PGR, LTCAT
   e laudos) e que o cadastro básico da empresa não tinha: representante
   legal, gestão de SST, jornada, canal de comunicação, responsável pelo
   plano de ação, guarda do documento, convenção coletiva, AVCB, CNO.
   Fica na aba Planejamento porque é preenchido uma vez por empresa e vale
   para todos os documentos dela (migration 0181). Campo em branco aqui vira
   pendência no documento, nunca é inventado. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FileText } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getEmpresa, updateEmpresa, type Empresa } from '@/services/empresas'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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

const GESTAO_SST = ['SESMT', 'CIPA', 'Designado de CIPA', 'Dispensado'] as const
const FORMAS_ACESSO = [
  'Cópia física no estabelecimento',
  'Cópia digital enviada à empresa',
  'Acesso pelo portal do cliente',
] as const

type Campos = Pick<
  Empresa,
  | 'nome_estabelecimento'
  | 'representante_legal_nome'
  | 'representante_legal_cargo'
  | 'gestao_sst'
  | 'jornada_trabalho'
  | 'horario_trabalho'
  | 'turnos_trabalho'
  | 'descricao_processo_produtivo'
  | 'canal_comunicacao'
  | 'responsavel_plano_nome'
  | 'responsavel_plano_cargo'
  | 'periodicidade_acompanhamento'
  | 'forma_acesso_documento'
  | 'local_guarda'
  | 'convencao_coletiva_insalubridade'
  | 'convencao_coletiva_clausula'
  | 'area_construida_pavimentos'
  | 'numero_cno'
  | 'avcb_clcb'
>

export function DadosDocumentosEmpresaCard({ empresaId }: { empresaId: string }) {
  const [f, setF] = useState<Partial<Campos>>({})
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    getEmpresa(empresaId)
      .then((e) => setF(e))
      .catch(() => setF({}))
      .finally(() => setCarregando(false))
  }, [empresaId])

  const texto = (campo: keyof Campos, rotulo: string, placeholder?: string) => (
    <div>
      <Label>{rotulo}</Label>
      <Input
        className="mt-1.5"
        placeholder={placeholder}
        value={(f[campo] as string) || ''}
        onChange={(e) => setF((v) => ({ ...v, [campo]: e.target.value }))}
      />
    </div>
  )

  const salvar = async () => {
    setSalvando(true)
    try {
      await updateEmpresa(empresaId, {
        nome_estabelecimento: f.nome_estabelecimento || '',
        representante_legal_nome: f.representante_legal_nome || '',
        representante_legal_cargo: f.representante_legal_cargo || '',
        gestao_sst: f.gestao_sst,
        jornada_trabalho: f.jornada_trabalho || '',
        horario_trabalho: f.horario_trabalho || '',
        turnos_trabalho: f.turnos_trabalho || '',
        descricao_processo_produtivo: f.descricao_processo_produtivo || '',
        canal_comunicacao: f.canal_comunicacao || '',
        responsavel_plano_nome: f.responsavel_plano_nome || '',
        responsavel_plano_cargo: f.responsavel_plano_cargo || '',
        periodicidade_acompanhamento: f.periodicidade_acompanhamento || '',
        forma_acesso_documento: f.forma_acesso_documento || '',
        local_guarda: f.local_guarda || '',
        convencao_coletiva_insalubridade: !!f.convencao_coletiva_insalubridade,
        convencao_coletiva_clausula: f.convencao_coletiva_clausula || '',
        area_construida_pavimentos: f.area_construida_pavimentos || '',
        numero_cno: f.numero_cno || '',
        avcb_clcb: f.avcb_clcb || '',
      })
      toast.success('Dados para os documentos salvos')
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Dados do estabelecimento para os documentos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Entram na capa e nos capítulos fixos do PGR, do LTCAT e dos laudos. O que ficar em branco
          aparece como pendência no documento; nada é preenchido por suposição.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {texto('nome_estabelecimento', 'Nome do estabelecimento', 'Ex.: Matriz, Unidade Sul')}
          <div>
            <Label>Gestão de SST</Label>
            <Select
              value={f.gestao_sst || '__vazio'}
              onValueChange={(v) =>
                setF((s) => ({
                  ...s,
                  gestao_sst: v === '__vazio' ? undefined : (v as Campos['gestao_sst']),
                }))
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__vazio">Não informado</SelectItem>
                {GESTAO_SST.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {texto('representante_legal_nome', 'Representante legal')}
          {texto('representante_legal_cargo', 'Cargo do representante legal')}
          {texto('jornada_trabalho', 'Jornada de trabalho', 'Ex.: 44 h semanais, segunda a sexta')}
          {texto('horario_trabalho', 'Horário de trabalho', 'Ex.: 7h30 às 17h18')}
          {texto('turnos_trabalho', 'Turnos', 'Ex.: turno único diurno')}
          {texto('area_construida_pavimentos', 'Área construída e pavimentos')}
        </div>
        <div>
          <Label>Descrição da atividade econômica e dos processos produtivos</Label>
          <Textarea
            className="mt-1.5"
            value={f.descricao_processo_produtivo || ''}
            onChange={(e) => setF((v) => ({ ...v, descricao_processo_produtivo: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {texto(
            'canal_comunicacao',
            'Canal de comunicação de perigos e incidentes',
            'Ex.: caixa de sugestões, e-mail do SESMT',
          )}
          {texto(
            'periodicidade_acompanhamento',
            'Periodicidade de acompanhamento do plano de ação',
            'Ex.: mensal',
          )}
          {texto('responsavel_plano_nome', 'Responsável pelo plano de ação')}
          {texto('responsavel_plano_cargo', 'Cargo do responsável pelo plano')}
          <div>
            <Label>Forma de acesso dos trabalhadores ao documento</Label>
            <Select
              value={f.forma_acesso_documento || '__vazio'}
              onValueChange={(v) =>
                setF((s) => ({ ...s, forma_acesso_documento: v === '__vazio' ? '' : v }))
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__vazio">Não informado</SelectItem>
                {FORMAS_ACESSO.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {texto(
            'local_guarda',
            'Local de guarda do documento',
            'Ex.: servidor da empresa e portal do cliente',
          )}
          {texto('avcb_clcb', 'AVCB ou CLCB (número e validade)')}
          {texto('numero_cno', 'Matrícula CNO (obras), se houver')}
        </div>
        <div className="rounded-md border p-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!f.convencao_coletiva_insalubridade}
              onCheckedChange={(c) =>
                setF((v) => ({ ...v, convencao_coletiva_insalubridade: !!c }))
              }
            />
            Há convenção ou acordo coletivo com cláusula de insalubridade
          </label>
          {f.convencao_coletiva_insalubridade && (
            <div className="mt-2">
              {texto('convencao_coletiva_clausula', 'Instrumento coletivo e cláusula')}
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={salvar} disabled={salvando}>
            Salvar dados para os documentos
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default DadosDocumentosEmpresaCard
