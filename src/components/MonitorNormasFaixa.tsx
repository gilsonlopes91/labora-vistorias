/* Faixa da aba Admin > Normas com o resultado da verificação semanal no gov.br
   (etapa 4). Mostra as NRs com possível atualização, com atalhos para a página
   oficial, o PDF e o botão Atualizar; e permite verificar na hora. */
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Check,
  ExternalLink,
  FileDown,
  FileUp,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'

export interface MonitorNorma {
  id: string
  nr: string
  url?: string
  pdf_url?: string
  pagina_atualizada?: string
  portaria_site?: string
  status: 'em_dia' | 'mudou' | 'erro'
  mudancas?: string
  detectado_em?: string
  verificado_em?: string
  erro?: string
}

const dataHora = (s?: string) =>
  s
    ? new Date(s).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

/** Marca a NR como conferida: sai do selo e da faixa até a próxima mudança. */
export async function marcarNormaConferida(nr: string) {
  const r = await pb
    .collection('normas_monitor')
    .getFirstListItem<MonitorNorma>(pb.filter('nr = {:nr}', { nr }), { requestKey: null })
  await pb.collection('normas_monitor').update(r.id, {
    status: 'em_dia',
    mudancas: '',
    portaria_ignorada: r.portaria_site || '',
  })
}

export default function MonitorNormasFaixa({
  onAtualizar,
  recarregar,
}: {
  onAtualizar: (nr: string) => void
  recarregar?: number
}) {
  const [linhas, setLinhas] = useState<MonitorNorma[]>([])
  const [verificando, setVerificando] = useState('')

  const carregar = useCallback(async () => {
    try {
      const lista = await pb
        .collection('normas_monitor')
        .getFullList<MonitorNorma>({ sort: 'nr', requestKey: null })
      setLinhas(lista)
    } catch {
      setLinhas([])
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar, recarregar])

  // Verifica uma NR por requisição, para mostrar o progresso e não estourar o
  // tempo limite da conexão.
  const verificarAgora = async () => {
    setVerificando('Preparando...')
    try {
      const tipos = await pb.collection('tipos_vistoria').getFullList<{ nr_referencia: string }>({
        filter: "organizacao_id = '' && secao_oficial != ''",
        fields: 'nr_referencia',
        requestKey: null,
      })
      const nrs = Array.from(new Set(tipos.map((t) => t.nr_referencia).filter(Boolean))).sort()
      const mudou: string[] = []
      const erros: string[] = []
      for (let i = 0; i < nrs.length; i++) {
        setVerificando(`Verificando ${nrs[i]} (${i + 1} de ${nrs.length})...`)
        try {
          const res = await pb.send('/backend/v1/admin/verificar-normas', {
            method: 'POST',
            body: JSON.stringify({ nrs: [nrs[i]] }),
            requestKey: null,
          })
          mudou.push(...((res.resultado?.mudou as string[]) || []))
          erros.push(...((res.resultado?.erros as string[]) || []))
        } catch {
          erros.push(nrs[i])
        }
      }
      toast.success(`${nrs.length} NRs verificadas no gov.br`, {
        description:
          (mudou.length
            ? `${mudou.length} com possível atualização: ${mudou.join(', ')}.`
            : 'Nenhuma mudança encontrada.') +
          (erros.length ? ` Não foi possível ler: ${erros.join(', ')}.` : ''),
      })
      await carregar()
    } catch (error) {
      toast.error('Não foi possível verificar agora', { description: getErrorMessage(error) })
    } finally {
      setVerificando('')
    }
  }

  const marcarVisto = async (nr: string) => {
    try {
      await marcarNormaConferida(nr)
      toast.success(`${nr} marcada como conferida`)
      carregar()
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    }
  }

  const mudaram = linhas.filter((l) => l.status === 'mudou')
  const erros = linhas.filter((l) => l.status === 'erro')
  const ultima = linhas.reduce(
    (m, l) => (l.verificado_em && l.verificado_em > m ? l.verificado_em : m),
    '',
  )

  return (
    <div className="mb-6">
      {mudaram.length > 0 && (
        <div className="mb-3 rounded-2xl border border-amber-400 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          <div className="mb-2 flex items-center gap-2 font-bold">
            <AlertTriangle className="h-4 w-4" />
            {mudaram.length === 1
              ? '1 norma com possível atualização no gov.br'
              : `${mudaram.length} normas com possível atualização no gov.br`}
          </div>
          <div className="space-y-3">
            {mudaram.map((l) => (
              <div key={l.id} className="rounded-xl bg-white/70 p-3 text-sm dark:bg-black/20">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">
                      {l.nr}
                      {l.detectado_em && (
                        <span className="ml-2 text-xs font-normal opacity-70">
                          detectado em {dataHora(l.detectado_em)}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed">{l.mudancas}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {l.url && (
                      <Button asChild size="sm" variant="outline" className="h-8 rounded-full">
                        <a href={l.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          Página
                        </a>
                      </Button>
                    )}
                    {l.pdf_url && (
                      <Button asChild size="sm" variant="outline" className="h-8 rounded-full">
                        <a href={l.pdf_url} target="_blank" rel="noreferrer">
                          <FileDown className="mr-1 h-3.5 w-3.5" />
                          PDF
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="h-8 rounded-full"
                      onClick={() => onAtualizar(l.nr)}
                    >
                      <FileUp className="mr-1 h-3.5 w-3.5" />
                      Atualizar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-full"
                      onClick={() => marcarVisto(l.nr)}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Já conferi
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          {ultima
            ? `Última verificação no gov.br: ${dataHora(ultima)}. Verificação automática toda segunda-feira.`
            : 'Verificação automática no gov.br toda segunda-feira, ainda não executada.'}
          {erros.length > 0 &&
            ` Não foi possível ler a página de: ${erros.map((e) => e.nr).join(', ')}.`}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 rounded-full"
          onClick={verificarAgora}
          disabled={!!verificando}
        >
          {verificando ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
          )}
          {verificando || 'Verificar agora'}
        </Button>
      </div>
    </div>
  )
}
