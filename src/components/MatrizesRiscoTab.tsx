/* Matrizes de risco: mostra as matrizes AIHA 3x3 e 5x5 gravadas no banco —
   critérios de probabilidade, de severidade, a grade colorida e a ação/prazo
   de cada categoria. É a mesma informação que vai para a seção "Critérios
   de avaliação" do PGR (NR-01, 1.5.4.4.2.2). */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getMatrizesRisco, type MatrizRisco } from '@/services/matrizesRisco'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function GradeMatriz({ matriz }: { matriz: MatrizRisco }) {
  const n = Number(matriz.dimensao)
  const niveis = Array.from({ length: n }, (_, i) => i + 1)
  const cor = (categoria: string) =>
    matriz.categorias.find((c) => c.categoria === categoria)?.cor || '#94a3b8'
  return (
    <div className="overflow-x-auto">
      <table className="text-xs">
        <thead>
          <tr>
            <th className="p-1 text-left text-muted-foreground">P \ S</th>
            {niveis.map((s) => (
              <th key={s} className="p-1 text-center font-semibold">
                S{s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...niveis].reverse().map((p) => (
            <tr key={p}>
              <td className="p-1 font-semibold">P{p}</td>
              {niveis.map((s) => {
                const celula = matriz.celulas.find((c) => c.p === p && c.s === s)
                return (
                  <td key={s} className="p-1">
                    <div
                      className="flex h-14 w-24 flex-col items-center justify-center rounded text-white"
                      style={{ backgroundColor: celula ? cor(celula.categoria) : '#94a3b8' }}
                    >
                      <span className="font-semibold leading-tight">
                        {celula?.categoria || '—'}
                      </span>
                      {celula && <span className="text-[10px] opacity-90">{celula.pontuacao}</span>}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DetalheMatriz({ matriz }: { matriz: MatrizRisco }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Probabilidade</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">P</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Com medição (exposição ÷ limite)</TableHead>
                <TableHead>Sem medição (controle existente)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matriz.criterios_probabilidade.map((c) => (
                <TableRow key={c.nivel}>
                  <TableCell className="font-semibold">{c.nivel}</TableCell>
                  <TableCell>{c.nome}</TableCell>
                  <TableCell className="text-sm">{c.quantitativo}</TableCell>
                  <TableCell className="text-sm">{c.qualitativo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Severidade (pior dano plausível)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">S</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Afastamento</TableHead>
                <TableHead>Efeito AIHA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matriz.criterios_severidade.map((c) => (
                <TableRow key={c.nivel}>
                  <TableCell className="font-semibold">{c.nivel}</TableCell>
                  <TableCell>{c.nome}</TableCell>
                  <TableCell className="text-sm">{c.descricao}</TableCell>
                  <TableCell className="text-sm">{c.dias_afastamento}</TableCell>
                  <TableCell className="text-sm">{String(c.aiha_efeito)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matriz</CardTitle>
        </CardHeader>
        <CardContent>
          <GradeMatriz matriz={matriz} />
          <p className="mt-3 text-xs text-muted-foreground">
            A categoria vem da célula gravada, não de faixa de pontuação — o número é só P × S para
            referência.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ação e prazo por categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Prazo sugerido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matriz.categorias.map((c) => (
                <TableRow key={c.categoria}>
                  <TableCell>
                    <Badge style={{ backgroundColor: c.cor, color: '#fff' }}>{c.categoria}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{c.acao}</TableCell>
                  <TableCell className="text-sm">
                    {c.prazo_dias == null
                      ? 'não gera ação'
                      : c.prazo_dias === 0
                        ? 'imediato'
                        : `até ${c.prazo_dias} dias`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export function MatrizesRiscoTab() {
  const [matrizes, setMatrizes] = useState<MatrizRisco[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    getMatrizesRisco()
      .then(setMatrizes)
      .catch((error) =>
        toast.error('Não foi possível carregar as matrizes', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
  }
  if (matrizes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card py-16 text-center text-sm text-muted-foreground">
        Nenhuma matriz cadastrada.
      </div>
    )
  }

  const padrao = matrizes.find((m) => Number(m.dimensao) === 5) || matrizes[0]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Matrizes de risco (metodologia AIHA)</h2>
        <p className="text-sm text-muted-foreground">
          As duas matrizes oficiais usam as mesmas cinco categorias, então a tabela de ações e
          prazos é uma só. A matriz é escolhida no PGR, e trocar de uma para outra só recalcula a
          sugestão — o dado bruto da avaliação não muda.
        </p>
      </div>
      <Tabs defaultValue={padrao.id} className="space-y-6">
        <TabsList>
          {matrizes.map((m) => (
            <TabsTrigger key={m.id} value={m.id}>
              {m.nome}
              {m.somente_leitura ? '' : ' (personalizada)'}
            </TabsTrigger>
          ))}
        </TabsList>
        {matrizes.map((m) => (
          <TabsContent key={m.id} value={m.id} className="mt-0 focus-visible:outline-none">
            <DetalheMatriz matriz={m} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default MatrizesRiscoTab
