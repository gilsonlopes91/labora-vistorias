/**
 * Utilitários para manuseio de datas sem deslocamento indevido de fuso horário.
 *
 * O PocketBase armazena campos do tipo "date" como ISO strings UTC
 * (ex: "2026-09-15 00:00:00.000Z" ou "2026-09-15T00:00:00.000Z").
 *
 * Ao fazer `new Date("2026-09-15 00:00:00.000Z")` num navegador em UTC-3 (Brasil),
 * o horário vira "2026-09-14 21:00:00", mudando o dia para a véspera.
 *
 * Estas funções garantem que a data seja sempre interpretada como a data de calendário
 * pretendida (ano, mês, dia locais).
 */

/**
 * Converte uma string de data vinda do PocketBase ou de um input HTML ("YYYY-MM-DD" ou ISO)
 * em um objeto Date local configurado para as 00:00:00 daquele dia exato no calendário local.
 */
export function parseLocalDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null

  // Extrai ano, mês e dia dos primeiros dígitos da string
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) {
    const fallback = new Date(dateStr)
    return isNaN(fallback.getTime()) ? null : fallback
  }

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10) - 1
  const day = parseInt(match[3], 10)

  return new Date(year, month, day, 0, 0, 0, 0)
}

/**
 * Converte um objeto Date (ou string) no formato 'yyyy-MM-dd' usando os componentes locais
 * de ano, mês e dia, sem passar por toISOString() que converteria para UTC.
 */
export function formatLocalDate(date: Date | string | null | undefined): string {
  if (!date) return ''

  if (typeof date === 'string') {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) return `${match[1]}-${match[2]}-${match[3]}`
  }

  const d = date instanceof Date ? date : parseLocalDate(date)
  if (!d || isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formata uma data no formato brasileiro "dd/MM/yyyy" sem risco de deslocamento por fuso horário.
 */
export function formatBrazilianDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—'

  const d = dateStr instanceof Date ? dateStr : parseLocalDate(dateStr)
  if (!d || isNaN(d.getTime())) return '—'

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// Data "de calendário" gravada pelo PocketBase: só o dia, ou o dia às 00:00 UTC.
const SO_DIA = /^\d{4}-\d{2}-\d{2}([ T]00:00:00(\.0+)?Z?)?$/

/**
 * Converte o valor em Date local tratando os dois casos que o app grava:
 * - campo de data (dia de calendário, 00:00 UTC) → aquele dia, sem voltar um dia;
 * - carimbo de data e hora real (ex.: new Date().toISOString()) → a hora local.
 */
export function dataCalendario(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null
  if (valor instanceof Date) return isNaN(valor.getTime()) ? null : valor
  const texto = valor.trim()
  if (SO_DIA.test(texto)) return parseLocalDate(texto)
  const d = new Date(texto)
  return isNaN(d.getTime()) ? parseLocalDate(texto) : d
}

/** "dd/MM/yyyy" para campos de data ou carimbos de data e hora, sem erro de fuso. */
export function formatarDataCalendario(valor: string | Date | null | undefined): string {
  const d = dataCalendario(valor)
  return d ? formatBrazilianDate(d) : ''
}

/**
 * Prepara uma string "YYYY-MM-DD" para envio ao PocketBase garantindo que seja
 * tratada como o início daquele dia em UTC ("YYYY-MM-DDT00:00:00.000Z") ou "YYYY-MM-DD 00:00:00.000Z",
 * preservando exatamente o dia escolhido pelo usuário.
 */
export function toPocketBaseDate(dateInput: string | Date): string {
  const dateStr = typeof dateInput === 'string' ? dateInput : formatLocalDate(dateInput)
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return dateStr
  return `${match[1]}-${match[2]}-${match[3]} 00:00:00.000Z`
}
