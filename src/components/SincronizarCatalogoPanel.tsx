/* Sincronização do catálogo oficial de NRs com o Anexo II da NR-28 vigente.
   Recebe o arquivo catalogo_oficial.json (gerado a partir dos PDFs oficiais) e
   envia uma seção por vez para a rota /backend/v1/admin/sync-catalogo.
   "Simular" não grava nada; "Aplicar" grava. Só admin_plataforma. */
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { FileJson, Play, FlaskConical } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

interface ItemCatalogo {
  item_ref: string
  codigo: string
  grau: number | null
  tipo: 'S' | 'M' | null
  descricao: string
  ordem: number
  secao?: string
  observacao?: string
}

interface SecaoCatalogo {
  secao_oficial: string
  nr_referencia: string
  nome: string
  tipo_vistoria_id?: string
  descricao_tipo?: string
  itens: ItemCatalogo[]
}

interface ArquivoCatalogo {
  versao: string
  fonte: string
  secoes: SecaoCatalogo[]
}

interface Resultado {
  secao_oficial: string
  tipo_vistoria_id: string
  tipo_criado: boolean
  atualizados: number
  criados: number
  inativados: number
  sem_mudanca: number
  erros: { linha: number; codigo: string; erro: string }[]
  falha?: string
}

export default function SincronizarCatalogoPanel() {
  const [arquivo, setArquivo] = useState<ArquivoCatalogo | null>(null)
  const [marcadas, setMarcadas] = useState<Record<string, boolean>>({})
  const [rodando, setRodando] = useState(false)
  const [modo, setModo] = useState<'simular' | 'aplicar' | null>(null)
  const [resultados, setResultados] = useState<Resultado[]>([])

  const lerArquivo = async (f: File | undefined) => {
    if (!f) return
    try {
      const json = JSON.parse(await f.text()) as ArquivoCatalogo
      if (!Array.isArray(json.secoes)) throw new Error('arquivo sem "secoes"')
      setArquivo(json)
      setMarcadas({})
      setResultados([])
      toast.success(`Arquivo carregado: ${json.secoes.length} seções`)
    } catch (error) {
      toast.error('Arquivo inválido', { description: getErrorMessage(error) })
    }
  }

  const selecionadas = useMemo(
    () => (arquivo ? arquivo.secoes.filter((s) => marcadas[s.secao_oficial]) : []),
    [arquivo, marcadas],
  )

  const executar = async (simular: boolean) => {
    if (selecionadas.length === 0) {
      toast.error('Marque ao menos uma seção')
      return
    }
    setRodando(true)
    setModo(simular ? 'simular' : 'aplicar')
    setResultados([])
    const acumulado: Resultado[] = []
    for (const secao of selecionadas) {
      try {
        const res = await pb.send('/backend/v1/admin/sync-catalogo', {
          method: 'POST',
          body: JSON.stringify({ simular, secao }),
        })
        acumulado.push(res.resultado as Resultado)
      } catch (error) {
        acumulado.push({
          secao_oficial: secao.secao_oficial,
          tipo_vistoria_id: '',
          tipo_criado: false,
          atualizados: 0,
          criados: 0,
          inativados: 0,
          sem_mudanca: 0,
          erros: [],
          falha: getErrorMessage(error),
        })
      }
      setResultados([...acumulado])
    }
    setRodando(false)
    const falhas = acumulado.filter((r) => r.falha).length
    if (falhas) toast.error(`${falhas} seção(ões) com falha`)
    else toast.success(simular ? 'Simulação concluída (nada foi gravado)' : 'Catálogo atualizado')
  }

  const todasMarcadas = !!arquivo && arquivo.secoes.every((s) => marcadas[s.secao_oficial])

  return (
    <div className="mt-10">
      <h2 className="mb-1 text-xl font-bold">Catálogo oficial de NRs</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Sincroniza os checklists com o Anexo II da NR-28 vigente e o texto literal de cada norma.
        Itens com código de ementa revogado saem das novas vistorias, sem apagar vistorias antigas.
      </p>

      <Card className="rounded-2xl border-none p-4 shadow-subtle">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <FileJson className="h-4 w-4" />
          <span className="underline">Escolher arquivo catalogo_oficial.json</span>
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => lerArquivo(e.target.files?.[0])}
          />
        </label>

        {arquivo && (
          <>
            <div className="mt-3 text-xs text-muted-foreground">
              Versão {arquivo.versao} · {arquivo.fonte}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Checkbox
                checked={todasMarcadas}
                onCheckedChange={(v) => {
                  const m: Record<string, boolean> = {}
                  arquivo.secoes.forEach((s) => (m[s.secao_oficial] = !!v))
                  setMarcadas(m)
                }}
              />
              Marcar todas
            </div>
            <div className="mt-2 grid max-h-72 gap-1 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {arquivo.secoes.map((s) => (
                <label key={s.secao_oficial} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={!!marcadas[s.secao_oficial]}
                    onCheckedChange={(v) => setMarcadas({ ...marcadas, [s.secao_oficial]: !!v })}
                  />
                  <span>
                    {s.secao_oficial}{' '}
                    <span className="text-muted-foreground">
                      ({s.itens.length} itens{s.tipo_vistoria_id ? '' : ', tipo novo'})
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                disabled={rodando}
                onClick={() => executar(true)}
              >
                <FlaskConical className="mr-2 h-4 w-4" />
                {rodando && modo === 'simular' ? 'Simulando...' : 'Simular'}
              </Button>
              <Button className="rounded-full" disabled={rodando} onClick={() => executar(false)}>
                <Play className="mr-2 h-4 w-4" />
                {rodando && modo === 'aplicar' ? 'Aplicando...' : 'Aplicar no catálogo'}
              </Button>
            </div>
          </>
        )}

        {resultados.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <div className="mb-2 text-sm font-semibold">
              {modo === 'simular' ? 'Resultado da simulação (nada gravado)' : 'Resultado'}
            </div>
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-1 pr-3">Seção</th>
                  <th className="py-1 pr-3">Atualizados</th>
                  <th className="py-1 pr-3">Criados</th>
                  <th className="py-1 pr-3">Revogados</th>
                  <th className="py-1 pr-3">Sem mudança</th>
                  <th className="py-1 pr-3">Observação</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r) => (
                  <tr key={r.secao_oficial} className="border-t">
                    <td className="py-1 pr-3">{r.secao_oficial}</td>
                    <td className="py-1 pr-3">{r.atualizados}</td>
                    <td className="py-1 pr-3">{r.criados}</td>
                    <td className="py-1 pr-3">{r.inativados}</td>
                    <td className="py-1 pr-3">{r.sem_mudanca}</td>
                    <td className="py-1 pr-3">
                      {r.falha
                        ? `Falha: ${r.falha}`
                        : [
                            r.tipo_criado ? 'tipo de vistoria novo' : '',
                            r.erros.length ? `${r.erros.length} linha(s) com erro` : '',
                          ]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
