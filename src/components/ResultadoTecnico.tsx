/* Resultado de cálculo técnico (calor, ruído) nos formulários de campo:
   tabela de valores, conclusão e observações. Recalcula a cada mudança dos
   campos de origem. Usado no preenchimento avulso e dentro da vistoria. */
import { calcularTecnico, type ResultadoTecnico } from '@/lib/higieneOcupacional'
import type { CampoFormulario } from '@/services/formularios'

/** Texto do resultado para gravar no registro ('' quando falta dado). */
export function resumoCalculosTecnicos(
  campos: CampoFormulario[],
  dados: Record<string, unknown>,
): Record<string, unknown> {
  const saida: Record<string, unknown> = { ...dados }
  for (const campo of campos) {
    if (campo.tipo !== 'calculo_tecnico') continue
    const r = calcularTecnico(
      campo as unknown as import('@/lib/higieneOcupacional').CampoCalculoTecnico,
      dados,
    )
    saida[campo.id] = r && !r.faltando.length ? r.resumo : ''
  }
  return saida
}

export default function ResultadoTecnicoView({
  campo,
  dados,
}: {
  campo: CampoFormulario
  dados: Record<string, unknown>
}) {
  const resultado: ResultadoTecnico | null = calcularTecnico(
    campo as unknown as import('@/lib/higieneOcupacional').CampoCalculoTecnico,
    dados,
  )
  return (
    <div className="space-y-2 rounded-xl border p-4">
      <p className="text-sm font-semibold">{campo.nome} (automático)</p>
      {!resultado ? (
        <p className="text-sm text-muted-foreground">Cálculo não configurado.</p>
      ) : resultado.faltando.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Para calcular, falta: {resultado.faltando.join('; ')}.
        </p>
      ) : (
        <>
          <dl className="divide-y text-sm">
            {resultado.linhas.map(([rotulo, v]) => (
              <div key={rotulo} className="flex justify-between gap-4 py-1.5">
                <dt className="text-muted-foreground">{rotulo}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="space-y-1 pt-1">
            {resultado.conclusoes.map((c) => (
              <p
                key={c.texto}
                className={
                  c.acima ? 'text-sm font-semibold text-destructive' : 'text-sm font-medium'
                }
              >
                {c.texto}
              </p>
            ))}
          </div>
          {resultado.avisos.map((a) => (
            <p key={a} className="text-xs text-muted-foreground">
              Observação: {a}
            </p>
          ))}
        </>
      )}
    </div>
  )
}
