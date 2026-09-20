/* Tabela do Anexo I da NR-28 na identidade Labora — grade de faixas de
   trabalhadores × grau de infração, valores em reais (UFIR já convertida).
   A célula usada no cálculo vem destacada (célulaDestaque). */
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'

interface Celula {
  faixa_ordem: number
  grau: number
  min: number
  max: number
}

const FAIXAS = [
  '01 a 10',
  '11 a 25',
  '26 a 50',
  '51 a 100',
  '101 a 250',
  '251 a 500',
  '501 a 1000',
  'mais de 1000',
]

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export default function TabelaAnexoI({
  celulaDestaque,
}: {
  celulaDestaque?: { faixa_ordem: number; grau: number; tipo: string } | null
}) {
  const [grade, setGrade] = useState<Celula[] | null>(null)
  const [tipo, setTipo] = useState<'S' | 'M'>('S')

  useEffect(() => {
    setGrade(null)
    pb.send<{ grade?: Celula[] }>(`/backend/v1/public/tabela?tipo=${tipo}`, { method: 'GET' })
      .then((data) => setGrade(data.grade || []))
      .catch(() => setGrade([]))
  }, [tipo])

  const celula = (f: number, g: number) => grade?.find((c) => c.faixa_ordem === f && c.grau === g)
  const ehDestaque = (f: number, g: number) =>
    celulaDestaque &&
    celulaDestaque.grau === g &&
    celulaDestaque.faixa_ordem === f &&
    (celulaDestaque.tipo || 'S') === tipo

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold">Anexo I da NR-28 — valores da multa</div>
          <div className="text-xs text-muted-foreground">
            Nossa versão da tabela oficial, já em reais (UFIR R$ 1,0641)
          </div>
        </div>
        <div className="flex gap-1 rounded-full border p-1">
          {(['S', 'M'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                tipo === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {t === 'S' ? 'Segurança' : 'Medicina'}
            </button>
          ))}
        </div>
      </div>

      {grade === null ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : grade.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tabela indisponível no momento.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30">
                <th
                  colSpan={5}
                  className="px-2 py-1 text-left text-[10px] font-medium text-muted-foreground"
                >
                  {tipo === 'S' ? 'SEGURANÇA DO TRABALHO' : 'MEDICINA DO TRABALHO'}
                </th>
              </tr>
              <tr className="bg-muted/60">
                <th className="px-2 py-2 text-left font-semibold">Número de Empregados</th>
                {['I1', 'I2', 'I3', 'I4'].map((g) => (
                  <th key={g} className="px-2 py-2 text-center font-semibold">
                    {g}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FAIXAS.map((label, f) => (
                <tr key={label} className="border-t">
                  <td className="px-2 py-1.5 font-medium">{label}</td>
                  {[1, 2, 3, 4].map((g) => {
                    const c = celula(f, g)
                    const destaque = ehDestaque(f, g)
                    return (
                      <td
                        key={g}
                        className={`px-2 py-1.5 text-center tabular-nums ${
                          destaque
                            ? 'bg-primary font-bold text-primary-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {c ? `${brl.format(c.min)}–${brl.format(c.max)}` : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-[10px] text-muted-foreground">
        Valores por infração. A célula destacada é a aplicada ao cálculo (nº de trabalhadores × grau
        da infração).
      </p>
    </div>
  )
}
