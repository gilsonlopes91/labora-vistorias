/* Campo "EPIs utilizados" do formulário de risco: o técnico escolhe EPIs do
   catálogo (cada escolha entra no texto como "nome (CA 1234)") ou cadastra
   um EPI novo ali mesmo, sem sair do formulário. O texto continua editável.
   O cadastro completo (funções vinculadas, agentes protegidos) segue na
   aba "Catálogo de EPIs". */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PackagePlus, ShieldCheck } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { listarTodosItensNr06 } from '@/lib/episNr06'
import {
  consultarCa,
  createEpiCatalogo,
  dataBrParaIso,
  getEpisCatalogo,
  type EpiCatalogo,
  type EpiCatalogoInput,
} from '@/services/episCatalogo'
import { VincularEpisNr06Combobox } from '@/components/VincularEpisNr06Combobox'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'

interface EpiRiscoSeletorProps {
  empresaId: string
  value: string
  onChange: (texto: string) => void
}

const EPI_NOVO = {
  numero_ca: '',
  validade_ca: '',
  fabricante: '',
  especificacoes: '',
  epis_nr06: [] as string[],
  soEstaEmpresa: false,
}

export function EpiRiscoSeletor({ empresaId, value, onChange }: EpiRiscoSeletorProps) {
  const { user } = useAuth()
  const organizacaoId = (user?.organizacao_id as string) || ''
  const [epis, setEpis] = useState<EpiCatalogo[]>([])
  const [listaAberta, setListaAberta] = useState(false)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [form, setForm] = useState(EPI_NOVO)
  const [consultando, setConsultando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const nomesNr06 = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const item of listarTodosItensNr06()) mapa.set(item.id, item.nome)
    return mapa
  }, [])

  const carregarEpis = () =>
    getEpisCatalogo(empresaId)
      .then(setEpis)
      .catch(() => setEpis([]))

  useEffect(() => {
    carregarEpis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  const nomeDoEpi = (ep: EpiCatalogo) =>
    (ep.epis_nr06 || [])
      .map((id) => nomesNr06.get(id))
      .filter(Boolean)
      .join(' / ') ||
    ep.especificacoes?.split(/[.\n]/)[0]?.slice(0, 60) ||
    'EPI'

  const linhaDoEpi = (ep: EpiCatalogo) => `${nomeDoEpi(ep)} (CA ${ep.numero_ca})`

  const acrescentar = (linha: string) => {
    const atual = value.trim()
    if (atual.includes(linha)) return toast.info('Esse EPI já está na lista')
    onChange(atual ? `${atual}\n${linha}` : linha)
  }

  const consultar = async () => {
    const numero = form.numero_ca.trim()
    if (!numero) return toast.error('Digite o número do CA antes de consultar')
    setConsultando(true)
    try {
      const r = await consultarCa(numero)
      if (!r.encontrado) {
        return toast.error('CA não encontrado', {
          description: r.motivo || 'Confira o número e tente de novo.',
        })
      }
      setForm((f) => ({
        ...f,
        fabricante: r.fabricante || f.fabricante,
        validade_ca: r.validade_ca ? dataBrParaIso(r.validade_ca) : f.validade_ca,
        especificacoes: r.descricao || f.especificacoes,
      }))
      toast.success(`CA ${r.situacao || 'consultado'}`, { description: r.fabricante || undefined })
    } catch (error) {
      toast.error('Não foi possível consultar o CA agora', { description: getErrorMessage(error) })
    } finally {
      setConsultando(false)
    }
  }

  const salvarNovo = async () => {
    if (!form.numero_ca.trim()) return toast.error('Informe o número do CA')
    setSalvando(true)
    try {
      const dados: EpiCatalogoInput = {
        organizacao_id: organizacaoId,
        empresa_id: form.soEstaEmpresa ? empresaId : '',
        numero_ca: form.numero_ca.trim(),
        validade_ca: form.validade_ca || undefined,
        fabricante: form.fabricante,
        especificacoes: form.especificacoes,
        epis_nr06: form.epis_nr06,
      }
      const criado = await createEpiCatalogo(dados)
      toast.success('EPI cadastrado no catálogo')
      setEpis((lista) => [...lista, criado])
      acrescentar(linhaDoEpi(criado))
      setDialogAberto(false)
    } catch (error) {
      toast.error('Não foi possível cadastrar o EPI', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Popover open={listaAberta} onOpenChange={setListaAberta}>
          <PopoverTrigger asChild>
            <Button type="button" size="sm" variant="outline">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              Escolher do catálogo de EPIs
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 max-w-[95vw] p-1" align="start">
            {epis.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                Nenhum EPI cadastrado ainda. Use &ldquo;Cadastrar novo EPI&rdquo;.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {epis.map((ep) => (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => {
                      acrescentar(linhaDoEpi(ep))
                      setListaAberta(false)
                    }}
                    className="flex w-full flex-col rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    <span className="font-medium leading-snug">{nomeDoEpi(ep)}</span>
                    <span className="text-xs text-muted-foreground">
                      CA {ep.numero_ca}
                      {ep.fabricante ? ` · ${ep.fabricante}` : ''}
                      {ep.empresa_id ? ' · só desta empresa' : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setForm(EPI_NOVO)
            setDialogAberto(true)
          }}
        >
          <PackagePlus className="mr-1.5 h-3.5 w-3.5" />
          Cadastrar novo EPI
        </Button>
      </div>

      <Textarea
        placeholder="EPIs utilizados (um por linha)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar novo EPI</DialogTitle>
            <DialogDescription>
              O EPI entra no catálogo e já é incluído na lista deste risco.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Número do CA</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.numero_ca}
                    onChange={(e) => setForm((f) => ({ ...f, numero_ca: e.target.value }))}
                    placeholder="Ex.: 4026"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={consultar}
                    disabled={consultando}
                  >
                    {consultando ? '...' : 'Consultar'}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Validade do CA</Label>
                <Input
                  type="date"
                  value={form.validade_ca}
                  onChange={(e) => setForm((f) => ({ ...f, validade_ca: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Fabricante</Label>
              <Input
                value={form.fabricante}
                onChange={(e) => setForm((f) => ({ ...f, fabricante: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de equipamento (classificação da NR-06)</Label>
              <VincularEpisNr06Combobox
                selecionados={form.epis_nr06}
                onChange={(novos) => setForm((f) => ({ ...f, epis_nr06: novos }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Especificações / observações</Label>
              <Textarea
                rows={2}
                value={form.especificacoes}
                onChange={(e) => setForm((f) => ({ ...f, especificacoes: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.soEstaEmpresa}
                onCheckedChange={(c) => setForm((f) => ({ ...f, soEstaEmpresa: !!c }))}
              />
              Vale só para esta empresa (desmarcado: fica no catálogo de todas as empresas)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvarNovo} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar EPI'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EpiRiscoSeletor
