/* Admin > Normas > "Atualizar NR" (etapa 3 da atualização de NRs sem IA).
   1. O admin envia o PDF oficial da NR (e, se saiu, o PDF novo da NR-28).
   2. O navegador lê o texto do PDF (pdf.js) e monta o checklist pelas regras
      fixas de numeração + códigos de ementa do Anexo II da NR-28.
   3. Tela de conferência: itens novos, revogados, grau/tipo alterado, texto
      alterado (antes/depois) e pendências.
   4. "Aplicar" grava pela rota /backend/v1/admin/sync-catalogo, uma seção por
      vez. Laudos concluídos não mudam (cada resposta guarda uma cópia do item). */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, FileUp, Loader2, Play, RefreshCw } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { extrairLinhasPdf } from '@/lib/leitorPdf'
import {
  lerAnexoII,
  lerTextoNR,
  montarSecoes,
  nrDoNomeArquivo,
  ultimaPortaria,
  type LinhaAnexoII,
  type SecaoCatalogo,
} from '@/lib/catalogoNR'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

interface TipoDb {
  id: string
  nome: string
  nr_referencia: string
  secao_oficial?: string
  norma_versao?: string
  norma_versao_dou?: string
}

interface ItemDb {
  id: string
  tipo_vistoria_id: string
  item_ref: string
  codigo: string
  grau?: number | null
  tipo?: string
  descricao: string
  observacao?: string
  revogado?: boolean
  pendente_revisao?: boolean
}

interface Mudanca {
  codigo: string
  item_ref: string
  antes?: string
  depois?: string
  detalhe?: string
}

interface DiffSecao {
  secao: SecaoCatalogo
  tipo?: TipoDb
  nome: string
  novos: Mudanca[]
  reativados: Mudanca[]
  revogados: Mudanca[]
  grauTipo: Mudanca[]
  refAlterada: Mudanca[]
  texto: Mudanca[]
  pendencias: Mudanca[]
  mantidos: Mudanca[]
  semMudanca: number
}

const NRS = [
  1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 29,
  30, 31, 32, 33, 34, 35, 36, 37, 38,
].map((n) => `NR-${String(n).padStart(2, '0')}`)

const limpa = (s?: string) => (s || '').replace(/\s+/g, ' ').trim()
const grauTipo = (g?: number | null, t?: string | null) => (g ? `I${g} ${t || ''}`.trim() : '—')
const corta = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '…' : s)

function Lista({
  titulo,
  itens,
  cor,
  mostrarAntes,
}: {
  titulo: string
  itens: Mudanca[]
  cor: string
  mostrarAntes?: boolean
}) {
  if (!itens.length) return null
  return (
    <div className="mt-3">
      <div className={`mb-1 text-xs font-bold uppercase tracking-wide ${cor}`}>
        {titulo} ({itens.length})
      </div>
      <div className="space-y-2">
        {itens.map((m) => (
          <div key={titulo + m.codigo} className="rounded-lg border p-2 text-xs">
            <div className="font-semibold">
              {m.item_ref} <span className="font-mono text-muted-foreground">{m.codigo}</span>
              {m.detalhe && (
                <span className="ml-2 font-normal text-muted-foreground">{m.detalhe}</span>
              )}
            </div>
            {mostrarAntes && m.antes !== undefined && (
              <div className="mt-1 whitespace-pre-line rounded bg-red-50 p-1.5 text-red-900 dark:bg-red-950/40 dark:text-red-200">
                <span className="font-semibold">Antes: </span>
                {corta(m.antes, 900)}
              </div>
            )}
            {m.depois !== undefined && (
              <div className="mt-1 whitespace-pre-line rounded bg-emerald-50 p-1.5 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                {mostrarAntes && <span className="font-semibold">Depois: </span>}
                {corta(m.depois, 900)}
              </div>
            )}
            {!mostrarAntes && m.antes !== undefined && m.depois === undefined && (
              <div className="mt-1 whitespace-pre-line text-muted-foreground">
                {corta(m.antes, 400)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface Props {
  aberto: boolean
  onFechar: () => void
  onAplicado: () => void
  nrInicial?: string
}

export default function AtualizarNrDialog({ aberto, onFechar, onAplicado, nrInicial }: Props) {
  const [nr, setNr] = useState(nrInicial || '')
  const [pdfNr, setPdfNr] = useState<File | null>(null)
  const [pdf28, setPdf28] = useState<File | null>(null)
  const [lendo, setLendo] = useState('')
  const [portaria, setPortaria] = useState('')
  const [dou, setDou] = useState('')
  const [versaoAtual, setVersaoAtual] = useState('')
  const [diffs, setDiffs] = useState<DiffSecao[] | null>(null)
  const [orfaos, setOrfaos] = useState<TipoDb[]>([])
  const [aviso, setAviso] = useState('')
  const [confirmaAviso, setConfirmaAviso] = useState(false)
  const [aplicando, setAplicando] = useState(false)
  const [aberta, setAberta] = useState<string | null>(null)

  useEffect(() => {
    if (aberto && nrInicial) setNr(nrInicial)
  }, [aberto, nrInicial])

  const reiniciar = () => {
    setDiffs(null)
    setOrfaos([])
    setAviso('')
    setConfirmaAviso(false)
    setAberta(null)
  }

  const fechar = () => {
    reiniciar()
    setPdfNr(null)
    setPdf28(null)
    onFechar()
  }

  const escolherPdfNr = (f?: File) => {
    if (!f) return
    setPdfNr(f)
    const detectada = nrDoNomeArquivo(f.name)
    if (detectada && NRS.includes(detectada)) setNr(detectada)
    reiniciar()
  }

  const analisar = async () => {
    if (!nr || !pdfNr) {
      toast.error('Escolha a NR e o PDF oficial')
      return
    }
    reiniciar()
    try {
      // 1) catálogo atual desta NR
      setLendo('Carregando o checklist atual...')
      const tipos = await pb.collection('tipos_vistoria').getFullList<TipoDb>({
        filter: pb.filter("organizacao_id = '' && nr_referencia = {:nr}", { nr }),
        fields: 'id,nome,nr_referencia,secao_oficial,norma_versao,norma_versao_dou',
      })
      const itensDb = await pb.collection('itens_checklist').getFullList<ItemDb>({
        filter: pb.filter(
          "tipo_vistoria_id.organizacao_id = '' && tipo_vistoria_id.nr_referencia = {:nr}",
          { nr },
        ),
        fields:
          'id,tipo_vistoria_id,item_ref,codigo,grau,tipo,descricao,observacao,revogado,pendente_revisao',
        batch: 1000,
      })
      const tipoPorSecao = new Map<string, TipoDb>()
      for (const t of tipos) if (t.secao_oficial) tipoPorSecao.set(t.secao_oficial, t)
      const secaoDoTipo = new Map(tipos.map((t) => [t.id, t.secao_oficial || '']))
      setVersaoAtual(tipos.find((t) => t.norma_versao)?.norma_versao || '')

      // 2) linhas do Anexo II: do PDF novo da NR-28 ou do catálogo atual
      let linhasA2: LinhaAnexoII[]
      if (pdf28) {
        setLendo('Lendo o PDF da NR-28...')
        const linhas28 = await extrairLinhasPdf(pdf28, (p, t) =>
          setLendo(`Lendo o PDF da NR-28... página ${p} de ${t}`),
        )
        linhasA2 = lerAnexoII(linhas28)
        if (linhasA2.length < 1000) {
          throw new Error(
            'Não encontrei a tabela do Anexo II nesse PDF da NR-28. Confira se é o arquivo certo.',
          )
        }
      } else {
        linhasA2 = itensDb
          .filter((i) => !i.revogado && secaoDoTipo.get(i.tipo_vistoria_id))
          .map((i) => ({
            sec: secaoDoTipo.get(i.tipo_vistoria_id) || '',
            item: i.item_ref,
            codigo: i.codigo,
            grau: i.grau || null,
            tipo: i.tipo === 'S' || i.tipo === 'M' ? i.tipo : null,
          }))
      }
      if (!linhasA2.some((r) => r.sec.startsWith(nr))) {
        throw new Error(`Nenhum código de ementa da ${nr} encontrado no Anexo II.`)
      }

      // 3) texto da NR
      setLendo(`Lendo o PDF da ${nr}...`)
      const linhas = await extrairLinhasPdf(pdfNr, (p, t) =>
        setLendo(`Lendo o PDF da ${nr}... página ${p} de ${t}`),
      )
      const port = ultimaPortaria(linhas)
      setPortaria(port?.portaria || '')
      setDou(port?.dou || '')
      const texto = lerTextoNR(nr, linhas)
      const vigentes = itensDb.filter((i) => !i.revogado)
      const secoes = montarSecoes(
        nr,
        linhasA2,
        texto,
        vigentes.map((i) => ({
          codigo: i.codigo,
          descricao: i.descricao,
          observacao: i.observacao,
          pendente_revisao: !!i.pendente_revisao,
        })),
      )

      // 4) diferenças por seção
      setLendo('Comparando com o checklist atual...')
      const lista: DiffSecao[] = secoes.map((s) => {
        const tipo = tipoPorSecao.get(s.secao_oficial)
        const doTipo = tipo ? itensDb.filter((i) => i.tipo_vistoria_id === tipo.id) : []
        const porCodigo = new Map<string, ItemDb>()
        for (const i of doTipo)
          if (!porCodigo.has(i.codigo) || !i.revogado) porCodigo.set(i.codigo, i)
        const d: DiffSecao = {
          secao: s,
          tipo,
          nome:
            tipo?.nome ||
            (s.segmento === 'CORPO'
              ? `${nr} — Corpo da Norma`
              : `${nr} — Anexo ${s.segmento}${s.titulo_anexo ? ` (${s.titulo_anexo})` : ''}`),
          novos: [],
          reativados: [],
          revogados: [],
          grauTipo: [],
          refAlterada: [],
          texto: [],
          pendencias: [],
          mantidos: [],
          semMudanca: 0,
        }
        const vistos = new Set<string>()
        for (const it of s.itens) {
          vistos.add(it.codigo)
          const velho = porCodigo.get(it.codigo)
          const m: Mudanca = { codigo: it.codigo, item_ref: it.item_ref }
          if (it.pendente_revisao)
            d.pendencias.push({ ...m, detalhe: it.observacao, depois: it.descricao })
          if (it.mantido)
            d.mantidos.push({
              ...m,
              detalhe:
                'Não localizado no PDF; fica o texto já conferido. Confira se o subitem ainda existe.',
            })
          if (!velho) {
            d.novos.push({ ...m, depois: it.descricao, detalhe: grauTipo(it.grau, it.tipo) })
            continue
          }
          if (velho.revogado) {
            d.reativados.push({ ...m, depois: it.descricao })
            continue
          }
          let mudou = false
          if (
            (velho.grau || null) !== (it.grau || null) ||
            (velho.tipo || '') !== (it.tipo || '')
          ) {
            d.grauTipo.push({
              ...m,
              antes: grauTipo(velho.grau, velho.tipo),
              depois: grauTipo(it.grau, it.tipo),
            })
            mudou = true
          }
          if (limpa(velho.item_ref) !== limpa(it.item_ref)) {
            d.refAlterada.push({ ...m, antes: velho.item_ref, depois: it.item_ref })
            mudou = true
          }
          if (limpa(velho.descricao) !== limpa(it.descricao)) {
            d.texto.push({ ...m, antes: velho.descricao, depois: it.descricao })
            mudou = true
          }
          if (!mudou) d.semMudanca++
        }
        for (const i of doTipo)
          if (!i.revogado && !vistos.has(i.codigo))
            d.revogados.push({ codigo: i.codigo, item_ref: i.item_ref, antes: i.descricao })
        for (const r of s.sem_texto)
          d.pendencias.push({
            codigo: r.codigo,
            item_ref: r.item,
            detalhe:
              'Código novo sem texto localizado no PDF. Não será criado; cadastre à mão depois de aplicar.',
          })
        return d
      })
      setOrfaos(
        tipos.filter(
          (t) =>
            !!t.secao_oficial &&
            !secoes.some((s) => s.secao_oficial === t.secao_oficial) &&
            itensDb.some((i) => i.tipo_vistoria_id === t.id && !i.revogado),
        ),
      )

      // 5) sanidade: o PDF é mesmo desta NR?
      const total = secoes.reduce((a, s) => a + s.itens.length, 0)
      const ok = secoes.reduce((a, s) => a + s.itens.filter((i) => i.status === 'OK').length, 0)
      if (total === 0 || ok / total < 0.6) {
        setAviso(
          `Só ${ok} de ${total} itens tiveram o texto localizado no PDF. Ele pode não ser da ${nr} ou ter um formato diferente do habitual. Confira antes de aplicar.`,
        )
      }
      setDiffs(lista)
    } catch (error) {
      toast.error('Não foi possível ler os arquivos', { description: getErrorMessage(error) })
    } finally {
      setLendo('')
    }
  }

  const resumo = useMemo(() => {
    const r = {
      novos: 0,
      reativados: 0,
      revogados: 0,
      grauTipo: 0,
      texto: 0,
      ref: 0,
      pend: 0,
      mantidos: 0,
      iguais: 0,
    }
    for (const d of diffs || []) {
      r.novos += d.novos.length
      r.reativados += d.reativados.length
      r.revogados += d.revogados.length
      r.grauTipo += d.grauTipo.length
      r.texto += d.texto.length
      r.ref += d.refAlterada.length
      r.pend += d.pendencias.length
      r.mantidos += d.mantidos.length
      r.iguais += d.semMudanca
    }
    return r
  }, [diffs])

  const aplicar = async () => {
    if (!diffs) return
    setAplicando(true)
    const falhas: string[] = []
    const douIso = dou ? `${dou} 12:00:00.000Z` : ''
    try {
      for (const d of diffs) {
        if (!d.secao.itens.length) continue
        setLendo(`Gravando ${d.nome}...`)
        try {
          await pb.send('/backend/v1/admin/sync-catalogo', {
            method: 'POST',
            body: JSON.stringify({
              simular: false,
              secao: {
                secao_oficial: d.secao.secao_oficial,
                nr_referencia: nr,
                nome: d.nome,
                tipo_vistoria_id: d.tipo?.id || '',
                norma_versao: portaria.trim(),
                norma_versao_dou: douIso,
                itens: d.secao.itens.map((i) => ({
                  item_ref: i.item_ref,
                  codigo: i.codigo,
                  grau: i.grau,
                  tipo: i.tipo,
                  descricao: i.descricao,
                  ordem: i.ordem,
                  secao: i.secao,
                  observacao: i.observacao,
                  pendente_revisao: i.pendente_revisao,
                })),
              },
            }),
          })
        } catch (error) {
          falhas.push(`${d.nome}: ${getErrorMessage(error)}`)
        }
      }
      // versão também nos checklists desta NR que não vieram no Anexo II
      if (portaria.trim()) {
        const tipos = await pb.collection('tipos_vistoria').getFullList<TipoDb>({
          filter: pb.filter("organizacao_id = '' && nr_referencia = {:nr}", { nr }),
          fields: 'id,norma_versao',
        })
        for (const t of tipos)
          if (t.norma_versao !== portaria.trim())
            await pb
              .collection('tipos_vistoria')
              .update(t.id, { norma_versao: portaria.trim(), norma_versao_dou: douIso })
      }
      if (falhas.length) {
        toast.error(`${falhas.length} parte(s) não foram gravadas`, {
          description: falhas.join('\n'),
        })
      } else {
        toast.success(`${nr} atualizada`, {
          description: 'Novas vistorias já usam o texto novo. Laudos concluídos não mudam.',
        })
        onAplicado()
        fechar()
      }
    } catch (error) {
      toast.error('Não foi possível aplicar', { description: getErrorMessage(error) })
    } finally {
      setAplicando(false)
      setLendo('')
    }
  }

  const temMudanca =
    !!diffs &&
    resumo.novos +
      resumo.reativados +
      resumo.revogados +
      resumo.grauTipo +
      resumo.texto +
      resumo.ref >
      0

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && !aplicando && fechar()}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atualizar NR a partir do PDF oficial</DialogTitle>
          <DialogDescription>
            O site lê o PDF, monta o checklist pelos códigos de ementa do Anexo II da NR-28 e mostra
            tudo o que muda antes de gravar. Laudos já concluídos não são alterados.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Norma</Label>
            <select
              className="mt-1 h-10 w-full rounded-md border bg-background px-2 text-sm"
              value={nr}
              onChange={(e) => {
                setNr(e.target.value)
                reiniciar()
              }}
            >
              <option value="">Escolha...</option>
              {NRS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>PDF oficial da NR (gov.br)</Label>
            <label className="mt-1 flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm hover:bg-accent/40">
              <FileUp className="h-4 w-4 shrink-0" />
              <span className="truncate">{pdfNr ? pdfNr.name : 'Escolher PDF...'}</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => escolherPdfNr(e.target.files?.[0])}
              />
            </label>
          </div>
          <div>
            <Label>PDF novo da NR-28 (opcional)</Label>
            <label className="mt-1 flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm hover:bg-accent/40">
              <FileUp className="h-4 w-4 shrink-0" />
              <span className="truncate">{pdf28 ? pdf28.name : 'Só se a NR-28 também mudou'}</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  setPdf28(e.target.files?.[0] || null)
                  reiniciar()
                }}
              />
            </label>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Sem o PDF da NR-28, os códigos de ementa, graus e tipos continuam os atuais e só o texto
          da norma é atualizado. Envie a NR-28 nova quando ela trouxer códigos novos ou revogados.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={analisar} disabled={!!lendo || !nr || !pdfNr} className="rounded-full">
            {lendo && !aplicando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Ler PDF e comparar
          </Button>
          {lendo && <span className="text-xs text-muted-foreground">{lendo}</span>}
        </div>

        {diffs && (
          <div className="mt-2 space-y-4">
            {aviso && (
              <div className="rounded-xl border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{aviso}</span>
                </div>
                <label className="mt-2 flex items-center gap-2">
                  <Checkbox
                    checked={confirmaAviso}
                    onCheckedChange={(v) => setConfirmaAviso(!!v)}
                  />
                  Conferi e quero aplicar mesmo assim
                </label>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Portaria da última alteração (lida do PDF)</Label>
                <Input
                  value={portaria}
                  onChange={(e) => setPortaria(e.target.value)}
                  className="mt-1"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {versaoAtual
                    ? limpa(versaoAtual) === limpa(portaria)
                      ? 'Mesma versão que já está cadastrada.'
                      : `Cadastrada hoje: ${versaoAtual}`
                    : 'Nenhuma versão cadastrada hoje.'}
                </p>
              </div>
              <div>
                <Label>Publicação no DOU</Label>
                <Input
                  type="date"
                  value={dou}
                  onChange={(e) => setDou(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">{resumo.iguais} sem mudança</Badge>
              <Badge variant="outline" className="border-emerald-500 text-emerald-700">
                {resumo.novos} novos
              </Badge>
              {resumo.reativados > 0 && (
                <Badge variant="outline" className="border-emerald-500 text-emerald-700">
                  {resumo.reativados} reativados
                </Badge>
              )}
              <Badge variant="outline" className="border-red-500 text-red-700">
                {resumo.revogados} revogados
              </Badge>
              <Badge variant="outline" className="border-blue-500 text-blue-700">
                {resumo.texto} com texto alterado
              </Badge>
              <Badge variant="outline" className="border-violet-500 text-violet-700">
                {resumo.grauTipo} com grau/tipo alterado
              </Badge>
              {resumo.ref > 0 && (
                <Badge variant="outline">{resumo.ref} com referência alterada</Badge>
              )}
              <Badge variant="outline" className="border-amber-500 text-amber-700">
                {resumo.pend} pendências de revisão
              </Badge>
              {resumo.mantidos > 0 && (
                <Badge variant="outline" className="border-amber-500 text-amber-700">
                  {resumo.mantidos} conferidos à mão, não achados no PDF
                </Badge>
              )}
            </div>

            {orfaos.length > 0 && (
              <div className="rounded-xl border border-amber-400 p-3 text-xs">
                <b>Checklists que não aparecem mais no Anexo II:</b>{' '}
                {orfaos.map((t) => t.nome).join('; ')}. Eles não serão alterados; revise à mão se o
                anexo foi revogado.
              </div>
            )}

            <div className="space-y-2">
              {diffs.map((d) => {
                const n =
                  d.novos.length +
                  d.reativados.length +
                  d.revogados.length +
                  d.grauTipo.length +
                  d.texto.length +
                  d.refAlterada.length
                const conferir = d.pendencias.length + d.mantidos.length
                const estaAberta = aberta === d.secao.secao_oficial
                return (
                  <div key={d.secao.secao_oficial} className="rounded-xl border">
                    <button
                      type="button"
                      onClick={() => setAberta(estaAberta ? null : d.secao.secao_oficial)}
                      className="flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left text-sm hover:bg-accent/30"
                    >
                      <span className="font-semibold">
                        {d.nome}
                        {!d.tipo && (
                          <Badge className="ml-2" variant="secondary">
                            checklist novo
                          </Badge>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {d.secao.itens.length} itens · {n ? `${n} mudança(s)` : 'sem mudanças'}
                        {conferir ? ` · ${conferir} para conferir` : ''}
                      </span>
                    </button>
                    {estaAberta && (
                      <div className="border-t px-3 pb-3">
                        {n === 0 && conferir === 0 && (
                          <p className="pt-3 text-xs text-muted-foreground">
                            Nada muda neste checklist.
                          </p>
                        )}
                        <Lista titulo="Itens novos" itens={d.novos} cor="text-emerald-700" />
                        <Lista titulo="Reativados" itens={d.reativados} cor="text-emerald-700" />
                        <Lista titulo="Serão revogados" itens={d.revogados} cor="text-red-700" />
                        <Lista
                          titulo="Grau/tipo alterado"
                          itens={d.grauTipo}
                          cor="text-violet-700"
                          mostrarAntes
                        />
                        <Lista
                          titulo="Referência alterada"
                          itens={d.refAlterada}
                          cor="text-muted-foreground"
                          mostrarAntes
                        />
                        <Lista
                          titulo="Texto alterado"
                          itens={d.texto}
                          cor="text-blue-700"
                          mostrarAntes
                        />
                        <Lista
                          titulo="Pendências de revisão"
                          itens={d.pendencias}
                          cor="text-amber-700"
                        />
                        <Lista
                          titulo="Conferidos à mão, não achados no PDF"
                          itens={d.mantidos}
                          cor="text-amber-700"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={fechar} disabled={aplicando}>
            Cancelar
          </Button>
          <Button
            onClick={aplicar}
            disabled={
              !diffs || aplicando || (!!aviso && !confirmaAviso) || (!temMudanca && !portaria)
            }
          >
            {aplicando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {temMudanca ? 'Aplicar mudanças' : 'Só registrar a versão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
