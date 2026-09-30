/* Console de contas — ranking do questionário de seleção do beta. */
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Copy, Download, ExternalLink, Trash2 } from 'lucide-react'
import AdminNav from '@/components/admin/AdminNav'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  apagarRespostaQuiz,
  marcarConvidadoQuiz,
  obterResumoQuizAdmin,
  type ResumoQuizAdmin,
} from '@/services/quizBeta'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const formatarTelefone = (v: string) => {
  const d = (v || '').replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return v || '—'
}

export default function AdminQuizBeta() {
  const [dados, setDados] = useState<ResumoQuizAdmin | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [apagar, setApagar] = useState<{ id: string; nome: string } | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      setDados(await obterResumoQuizAdmin())
    } catch (error) {
      toast.error('Não foi possível carregar o questionário', {
        description: getErrorMessage(error),
      })
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const alternarConvidado = async (id: string, valor: boolean) => {
    try {
      await marcarConvidadoQuiz(id, valor)
      setDados((d) =>
        d
          ? {
              ...d,
              respostas: d.respostas.map((r) => (r.id === id ? { ...r, convidado: valor } : r)),
            }
          : d,
      )
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    }
  }

  const confirmarApagar = async () => {
    if (!apagar) return
    try {
      await apagarRespostaQuiz(apagar.id)
      toast.success(`Resposta de ${apagar.nome} apagada`)
      setApagar(null)
      await carregar()
    } catch (error) {
      toast.error('Não foi possível apagar', { description: getErrorMessage(error) })
    }
  }

  const exportarCsv = () => {
    if (!dados) return
    const esc = (v: string | number | boolean) => `"${String(v).replace(/"/g, '""')}"`
    const cabecalho = [
      'nome',
      'email',
      'telefone',
      'nota',
      'saidas',
      'segundos_fora',
      'convidado',
      'email_enviado',
      'data',
    ].concat(dados.questoes.map((q) => q.chave))
    const linhas = [
      cabecalho.join(';'),
      ...dados.respostas.map((r) =>
        [
          esc(r.nome),
          esc(r.email),
          esc(formatarTelefone(r.telefone)),
          esc(r.nota),
          esc(r.saidas || 0),
          esc(r.segundos_fora || 0),
          esc(r.convidado ? 'sim' : 'não'),
          esc(r.email_enviado ? 'sim' : 'não'),
          esc(new Date(r.created).toLocaleString('pt-BR')),
        ]
          .concat(dados.questoes.map((q) => esc(r.acertos[q.chave] ? 1 : 0)))
          .join(';'),
      ),
    ]
    const blob = new Blob(['﻿' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quiz-beta-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const total = dados?.total || 0
  const linkPublico = `${window.location.origin}/beta`

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(linkPublico)
      toast.success('Link copiado')
    } catch {
      toast.error('Não foi possível copiar. Selecione o link e copie manualmente.')
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Questionário do beta</h1>
        <p className="text-sm text-muted-foreground">
          Quem respondeu em /beta, ordenado por nota e depois por quem enviou primeiro.
        </p>
      </div>
      <AdminNav />

      <Card className="mb-6 rounded-2xl border-none p-5 shadow-subtle">
        <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Link para enviar aos alunos
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="select-all rounded-lg bg-muted px-3 py-2 text-sm">{linkPublico}</code>
          <Button variant="outline" size="sm" className="rounded-full" onClick={copiarLink}>
            <Copy className="mr-1.5 h-4 w-4" />
            Copiar link
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full" asChild>
            <a href={linkPublico} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Abrir
            </a>
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          A página é pública e não aparece no menu do site: só chega nela quem tiver o link.
        </p>
      </Card>

      {carregando || !dados ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : (
        <>
          <Card className="mb-6 rounded-2xl border-none p-5 shadow-subtle">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Acertos por questão ({total} respondente{total === 1 ? '' : 's'})
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {dados.questoes.map((q) => {
                const n = dados.acertos_por_questao[q.chave] || 0
                const pct = total ? Math.round((n / total) * 100) : 0
                return (
                  <div
                    key={q.chave}
                    className="rounded-xl bg-muted/50 p-3 text-sm"
                    title={q.enunciado}
                  >
                    <div className="font-semibold">
                      Q{q.ordem} · {q.tema}
                    </div>
                    <div className="text-muted-foreground">
                      {n} de {total} ({pct}%)
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <div className="mb-4 flex justify-end">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={exportarCsv}
              disabled={dados.respostas.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          {dados.respostas.length === 0 ? (
            <Card className="rounded-2xl border-dashed p-8 text-center text-sm text-muted-foreground">
              Ninguém respondeu ainda.
            </Card>
          ) : (
            <Card className="overflow-hidden rounded-2xl border-none shadow-subtle">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">E-mail</th>
                      <th className="px-4 py-3">Telefone</th>
                      <th className="px-4 py-3">Nota</th>
                      <th className="px-4 py-3">Saídas da página</th>
                      <th className="px-4 py-3">Enviado em</th>
                      <th className="px-4 py-3">E-mail</th>
                      <th className="px-4 py-3">Convidado</th>
                      <th className="px-4 py-3">
                        <span className="sr-only">Apagar</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.respostas.map((r, i) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-3 font-medium">{r.nome}</td>
                        <td className="px-4 py-3">
                          <a href={`mailto:${r.email}`} className="hover:underline">
                            {r.email}
                          </a>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {r.telefone ? (
                            <a
                              href={`https://wa.me/55${r.telefone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                              title="Abrir no WhatsApp"
                            >
                              {formatarTelefone(r.telefone)}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold">{r.nota}/10</td>
                        <td
                          className={`px-4 py-3 ${
                            r.saidas > 0 ? 'font-semibold text-amber-600' : 'text-muted-foreground'
                          }`}
                        >
                          {r.saidas > 0
                            ? `${r.saidas}× · ${
                                r.segundos_fora >= 60
                                  ? `${Math.floor(r.segundos_fora / 60)} min ${r.segundos_fora % 60} s`
                                  : `${r.segundos_fora} s`
                              }`
                            : '0'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(r.created).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {r.email_enviado ? 'enviado' : 'falhou'}
                        </td>
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={r.convidado}
                            onCheckedChange={(v) => alternarConvidado(r.id, v === true)}
                            aria-label={`Marcar ${r.nome} como convidado`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setApagar({ id: r.id, nome: r.nome })}
                            aria-label={`Apagar resposta de ${r.nome}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <AlertDialog open={!!apagar} onOpenChange={(o) => !o && setApagar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar a resposta de {apagar?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Não dá para desfazer. A nota sai do ranking e esse e-mail poderá responder o
              questionário de novo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarApagar}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
