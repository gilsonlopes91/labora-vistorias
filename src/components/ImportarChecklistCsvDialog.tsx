import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Upload, FileUp, AlertTriangle, CheckCircle2 } from 'lucide-react'

import { parseCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { createItensChecklistBulk, type ItemChecklistInput } from '@/services/itensChecklist'
import { isAdmin } from '@/services/equipe'
import type { TipoVistoria } from '@/services/tiposVistoria'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LinhaValida {
  linha: number
  item: ItemChecklistInput
}

interface LinhaInvalida {
  linha: number
  motivo: string
}

const COLUNAS_ACEITAS = ['item_ref', 'codigo', 'grau', 'tipo', 'secao', 'descricao', 'observacao']

function validarLinhas(rows: Record<string, string>[]): {
  validas: LinhaValida[]
  invalidas: LinhaInvalida[]
} {
  const validas: LinhaValida[] = []
  const invalidas: LinhaInvalida[] = []

  rows.forEach((row, idx) => {
    const linha = idx + 2 // +1 cabeçalho, +1 índice 1-based
    const item_ref = row.item_ref?.trim()
    const codigo = row.codigo?.trim()
    const descricao = row.descricao?.trim()

    if (!item_ref && !codigo && !descricao) return // linha em branco, ignora silenciosamente

    const faltando: string[] = []
    if (!item_ref) faltando.push('item_ref')
    if (!codigo) faltando.push('codigo')
    if (!descricao) faltando.push('descricao')
    if (faltando.length > 0) {
      invalidas.push({ linha, motivo: `Faltando: ${faltando.join(', ')}` })
      return
    }

    let grau: number | undefined
    if (row.grau?.trim()) {
      const n = Number(row.grau.trim())
      if (!Number.isInteger(n) || n < 1 || n > 4) {
        invalidas.push({ linha, motivo: `Grau inválido ("${row.grau}") — use 1 a 4` })
        return
      }
      grau = n
    }

    let tipo: 'S' | 'M' | undefined
    if (row.tipo?.trim()) {
      const t = row.tipo.trim().toUpperCase()
      if (t !== 'S' && t !== 'M') {
        invalidas.push({ linha, motivo: `Tipo inválido ("${row.tipo}") — use S ou M` })
        return
      }
      tipo = t
    }

    validas.push({
      linha,
      item: {
        item_ref,
        codigo,
        descricao,
        grau,
        tipo,
        secao: row.secao?.trim() || undefined,
        observacao: row.observacao?.trim() || undefined,
      },
    })
  })

  return { validas, invalidas }
}

interface ImportarChecklistCsvDialogProps {
  tipos: TipoVistoria[]
  onImportado: (tipoVistoriaId: string) => void
}

export function ImportarChecklistCsvDialog({
  tipos,
  onImportado,
}: ImportarChecklistCsvDialogProps) {
  const [open, setOpen] = useState(false)
  const [tipoId, setTipoId] = useState<string>('')
  const [csvText, setCsvText] = useState('')
  const [importando, setImportando] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tiposOrdenados = useMemo(
    () => [...tipos].sort((a, b) => a.nome.localeCompare(b.nome, undefined, { numeric: true })),
    [tipos],
  )

  const { headers, validas, invalidas, colunasFaltando } = useMemo(() => {
    if (!csvText.trim()) {
      return {
        headers: [] as string[],
        validas: [] as LinhaValida[],
        invalidas: [] as LinhaInvalida[],
        colunasFaltando: [] as string[],
      }
    }
    const parsed = parseCsv(csvText)
    const { validas, invalidas } = validarLinhas(parsed.rows)
    const colunasFaltando = ['item_ref', 'codigo', 'descricao'].filter(
      (c) => !parsed.headers.includes(c),
    )
    return { headers: parsed.headers, validas, invalidas, colunasFaltando }
  }, [csvText])

  const handleArquivo = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCsvText(String(reader.result || ''))
    reader.onerror = () => toast.error('Não foi possível ler o arquivo CSV.')
    reader.readAsText(file, 'utf-8')
  }

  const resetar = () => {
    setTipoId('')
    setCsvText('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleImportar = async () => {
    if (!isAdmin()) {
      toast.error('Apenas administradores da plataforma podem importar checklists.')
      setOpen(false)
      return
    }

    if (!tipoId || validas.length === 0) return
    setImportando(true)
    try {
      const { criados, erros } = await createItensChecklistBulk(
        tipoId,
        validas.map((v) => v.item),
      )
      if (criados > 0) {
        toast.success(`${criados} item(ns) importado(s) com sucesso.`)
        onImportado(tipoId)
      }
      if (erros.length > 0) {
        toast.error(`${erros.length} item(ns) falharam ao importar.`, {
          description: erros
            .slice(0, 3)
            .map((e) => `Linha ${e.linha}: ${e.mensagem}`)
            .join(' | '),
        })
      }
      if (erros.length === 0) {
        setOpen(false)
        resetar()
      }
    } catch (error) {
      toast.error('Não foi possível importar o CSV.', { description: getErrorMessage(error) })
    } finally {
      setImportando(false)
    }
  }

  if (!isAdmin()) {
    return null
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isAdmin()) {
          setOpen(false)
          return
        }
        setOpen(v)
        if (!v) resetar()
      }}
    >
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => {
          if (!isAdmin()) {
            toast.error('Ação restrita a administradores.')
            return
          }
          setOpen(true)
        }}
      >
        <Upload className="h-4 w-4" />
        Importar checklist (CSV)
      </Button>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar itens de checklist via CSV</DialogTitle>
          <DialogDescription>
            Escolha o tipo de vistoria (NR/Anexo) e cole ou envie o CSV preenchido. Colunas aceitas:{' '}
            <code className="text-xs">{COLUNAS_ACEITAS.join(', ')}</code>. Obrigatórias: item_ref,
            codigo, descricao.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo de vistoria</Label>
            <Select value={tipoId} onValueChange={setTipoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o modelo (NR / Anexo) que vai receber os itens" />
              </SelectTrigger>
              <SelectContent>
                {tiposOrdenados.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Arquivo CSV ou colar conteúdo</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="h-3.5 w-3.5" />
                Escolher arquivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => handleArquivo(e.target.files?.[0] ?? null)}
              />
            </div>
            <Textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="item_ref,codigo,grau,tipo,secao,descricao,observacao"
              rows={8}
              className="font-mono text-xs"
            />
          </div>

          {csvText.trim() && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              {colunasFaltando.length > 0 ? (
                <p className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Colunas obrigatórias ausentes no CSV: {colunasFaltando.join(', ')}
                </p>
              ) : (
                <>
                  <p className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    {validas.length} linha(s) prontas para importar
                    {invalidas.length > 0 && `, ${invalidas.length} com problema (serão ignoradas)`}
                    . Colunas detectadas: {headers.join(', ')}.
                  </p>
                  {invalidas.length > 0 && (
                    <ul className="mt-2 max-h-24 space-y-0.5 overflow-y-auto text-xs text-muted-foreground">
                      {invalidas.slice(0, 10).map((inv) => (
                        <li key={inv.linha}>
                          Linha {inv.linha}: {inv.motivo}
                        </li>
                      ))}
                      {invalidas.length > 10 && (
                        <li>... e mais {invalidas.length - 10} linha(s)</li>
                      )}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImportar}
            disabled={!tipoId || validas.length === 0 || colunasFaltando.length > 0 || importando}
          >
            {importando ? 'Importando...' : `Importar ${validas.length || ''} item(ns)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
