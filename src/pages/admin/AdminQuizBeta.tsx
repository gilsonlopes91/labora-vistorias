/* Console de contas — ranking do questionário de seleção do beta. */
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import AdminNav from '@/components/admin/AdminNav'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  marcarConvidadoQuiz,
  obterResumoQuizAdmin,
  type ResumoQuizAdmin,
} from '@/services/quizBeta'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

export default function AdminQuizBeta() {
  const [dados, setDados] = useState<ResumoQuizAdmin | null>(null)
  const [carregando, setCarregando] = useState(true)

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

  const exportarCsv = () => {
    if (!dados) return
    const esc = (v: string | number | boolean) => `"${String(v).replace(/"/g, '""')}"`
    const cabecalho = ['nome', 'email', 'nota', 'convidado', 'email_enviado', 'data'].concat(
      dados.questoes.map((q) => q.chave),
    )
    const linhas = [
      cabecalho.join(';'),
      ...dados.respostas.map((r) =>
        [
          esc(r.nome),
          esc(r.email),
          esc(r.nota),
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

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Questionário do beta</h1>
        <p className="text-sm text-muted-foreground">
          Quem respondeu em /beta, ordenado por nota e depois por quem enviou primeiro.
        </p>
      </div>
      <AdminNav />

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
                      <th className="px-4 py-3">Nota</th>
                      <th className="px-4 py-3">Enviado em</th>
                      <th className="px-4 py-3">E-mail</th>
                      <th className="px-4 py-3">Convidado</th>
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
                        <td className="px-4 py-3 font-semibold">{r.nota}/10</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
