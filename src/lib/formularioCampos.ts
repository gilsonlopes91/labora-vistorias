/* Regras dos campos de formulário de campo, usadas na tela de preenchimento
   (dentro da vistoria) e no PDF: visibilidade condicional, cálculo simples,
   campos obrigatórios pendentes e o valor em texto de cada campo. */
import { formatarDataCalendario } from '@/lib/date'
import type { CampoFormulario } from '@/services/formularios'

/** Instâncias de um campo repetível, aceitando os formatos já gravados. */
export function normalizarInstancias(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]
  if (typeof raw === 'string') {
    try {
      return normalizarInstancias(JSON.parse(raw))
    } catch {
      return []
    }
  }
  if (raw && typeof raw === 'object') {
    return Object.values(raw as Record<string, unknown>).filter(
      (v): v is Record<string, unknown> => typeof v === 'object' && v !== null,
    )
  }
  return []
}

/** Lista de nomes de arquivo de um campo de foto. */
export function listaArquivos(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === 'string' && !!x)
  if (typeof raw === 'string' && raw) return [raw]
  return []
}

/** Campo condicional: visível só quando o campo de origem tiver o valor. */
export const campoVisivel = (campo: CampoFormulario, dados: Record<string, unknown>) =>
  !campo.condicaoCampoId ||
  !campo.condicaoValor ||
  String(dados[campo.condicaoCampoId] ?? '') === campo.condicaoValor

/** Cálculo automático simples (soma, média, máximo, mínimo). */
export function calcularCampo(campo: CampoFormulario, dados: Record<string, unknown>): string {
  const valores = (campo.camposOrigem || [])
    .map((origem) => Number(dados[origem]))
    .filter((v) => !Number.isNaN(v))
  if (valores.length === 0) return ''
  let resultado: number
  switch (campo.operacao) {
    case 'media':
      resultado = valores.reduce((a, b) => a + b, 0) / valores.length
      break
    case 'max':
      resultado = Math.max(...valores)
      break
    case 'min':
      resultado = Math.min(...valores)
      break
    default:
      resultado = valores.reduce((a, b) => a + b, 0)
  }
  const unidade = campo.unidade ? ` ${campo.unidade}` : ''
  return `${resultado.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}${unidade}`
}

/** Nomes dos campos obrigatórios (visíveis) ainda sem resposta. */
export function obrigatoriosPendentes(
  campos: CampoFormulario[],
  dados: Record<string, unknown>,
): string[] {
  const pendentes: string[] = []
  for (const campo of campos) {
    if (!campo.obrigatorio || campo.tipo === 'secao' || !campoVisivel(campo, dados)) continue
    const valor = dados[campo.id]
    if (campo.tipo === 'repetivel') {
      if (normalizarInstancias(valor).length === 0) pendentes.push(campo.nome)
      continue
    }
    if (campo.tipo === 'foto') {
      if (listaArquivos(valor).length === 0) pendentes.push(campo.nome)
      continue
    }
    if (Array.isArray(valor) ? valor.length === 0 : String(valor ?? '').trim() === '') {
      pendentes.push(campo.nome)
    }
  }
  return pendentes
}

/** Valor de um campo (ou subcampo) em texto, para o relatório. */
export function valorEmTexto(campo: CampoFormulario, valor: unknown): string {
  if (valor === undefined || valor === null || valor === '') return '—'
  switch (campo.tipo) {
    case 'data':
      return /^\d{4}-\d{2}-\d{2}/.test(String(valor))
        ? formatarDataCalendario(String(valor))
        : String(valor)
    case 'numero':
      return `${String(valor).replace('.', ',')}${campo.unidade ? ` ${campo.unidade}` : ''}`
    case 'multipla': {
      let lista: unknown = valor
      if (typeof valor === 'string') {
        try {
          lista = JSON.parse(valor)
        } catch {
          lista = [valor]
        }
      }
      return Array.isArray(lista) && lista.length ? lista.join(', ') : '—'
    }
    default:
      return String(valor).trim() || '—'
  }
}
