/* Ordem, nomes curtos e rótulos das normas (checklists) e dos itens.
   - Ordem: número da NR; dentro da NR, o corpo primeiro e depois os anexos em
     ordem numérica (I, II, ..., IX, X; 1, 2, ..., 13, 13-A, 14).
   - A NR-28 é a tabela de multas, não é checklist de vistoria.
   - Referências longas de item ("12.6.3, alínea "a", 12.6.3, alínea "b", ...")
     viram "12.6.3, alíneas a a f". */

export interface NormaLike {
  nome?: string
  nr_referencia?: string
  secao_oficial?: string
  organizacao_id?: string
}

const ROMANOS: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 }

function romanoParaNumero(s: string): number {
  let total = 0
  for (let i = 0; i < s.length; i++) {
    const v = ROMANOS[s[i]] || 0
    const prox = ROMANOS[s[i + 1]] || 0
    total += v < prox ? -v : v
  }
  return total
}

/** Número da NR (12 para "NR-12 — ..."); 999 quando não há. */
export function numeroNr(t: NormaLike): number {
  for (const fonte of [t.nr_referencia, t.secao_oficial, t.nome]) {
    const m = /NR[\s-]*0*(\d{1,2})\b/i.exec(fonte || '')
    if (m) return Number(m[1])
  }
  return 999
}

/** Anexo do checklist ("VIII", "13-A") ou null quando é o corpo da norma. */
export function anexoDe(t: NormaLike): string | null {
  // secao_oficial (catálogo oficial) é a fonte mais confiável: "NR-12 - ANEXO VIII".
  const fontes = t.secao_oficial ? [t.secao_oficial] : [t.nome || '']
  for (const f of fontes) {
    if (/\banexo\s+[úu]nico\b/i.test(f)) return 'ÚNICO'
    const m = /\banexo\s+(?:n[º°o]\.?\s*)?([IVXLC]+|\d+)(?:\s*-\s*([A-Z])\b)?/i.exec(f)
    if (m) return m[1].toUpperCase() + (m[2] ? '-' + m[2].toUpperCase() : '')
  }
  return null
}

function ordemAnexo(anexo: string | null): number {
  if (!anexo) return 0
  if (anexo === 'ÚNICO') return 1
  const m = /^([IVXLC]+|\d+)(?:-([A-Z]))?$/.exec(anexo)
  if (!m) return 9999
  const base = /^\d+$/.test(m[1]) ? Number(m[1]) : romanoParaNumero(m[1])
  const letra = m[2] ? (m[2].charCodeAt(0) - 64) / 100 : 0
  return base + letra
}

/** Compara dois checklists para ordenar listas de normas. */
export function compararNormas(a: NormaLike, b: NormaLike): number {
  const na = numeroNr(a)
  const nb = numeroNr(b)
  if (na !== nb) return na - nb
  const oa = ordemAnexo(anexoDe(a))
  const ob = ordemAnexo(anexoDe(b))
  if (oa !== ob) return oa - ob
  // catálogo oficial antes dos checklists próprios da organização
  const ga = a.organizacao_id ? 1 : 0
  const gb = b.organizacao_id ? 1 : 0
  if (ga !== gb) return ga - gb
  return (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { numeric: true })
}

export const ordenarNormas = <T extends NormaLike>(lista: T[]): T[] =>
  [...lista].sort(compararNormas)

/** NR-28 do catálogo oficial: é a tabela de multas, não um checklist de vistoria. */
export const ehTabelaDeMultas = (t: NormaLike) => !t.organizacao_id && numeroNr(t) === 28

/** Nome curto para etiquetas: "NR-12", "NR-12 · Anexo VIII". */
export function rotuloCurtoNorma(t: NormaLike): string {
  const n = numeroNr(t)
  if (n === 999) return t.nome || 'Checklist'
  const nr = `NR-${String(n).padStart(2, '0')}`
  const anexo = anexoDe(t)
  if (!anexo) return nr
  return anexo === 'ÚNICO' ? `${nr} · Anexo Único` : `${nr} · Anexo ${anexo}`
}

/** Nome para listas de escolha, sem repetir "NR-12 — NR-12 — ...". */
export function nomeNormaCompleto(t: NormaLike): string {
  const nome = t.nome || ''
  if (!t.nr_referencia || nome.toUpperCase().startsWith(t.nr_referencia.toUpperCase())) return nome
  return `${t.nr_referencia} — ${nome}`
}

function juntarLetras(letras: string[]): string {
  const unicas = Array.from(new Set(letras)).sort()
  const consecutivas = unicas.every(
    (l, i) => i === 0 || l.charCodeAt(0) === unicas[i - 1].charCodeAt(0) + 1,
  )
  if (unicas.length >= 3 && consecutivas) return `${unicas[0]} a ${unicas[unicas.length - 1]}`
  if (unicas.length === 1) return unicas[0]
  return `${unicas.slice(0, -1).join(', ')} e ${unicas[unicas.length - 1]}`
}

/** Referência do item em forma curta. Só mexe quando a referência é uma lista
 *  de alíneas do mesmo subitem; qualquer outro formato volta como veio. */
export function rotuloItemRef(ref?: string): string {
  const s = (ref || '').trim()
  if (!s) return ''
  // Anexo I da NR-12: a letra maiúscula é a parte do anexo (A, B, C), não
  // uma alínea. "1.1, alínea B" vira "1.1 da parte B".
  const parte = /^(\d+(?:\.\d+)*)\s*,\s*al[íi]nea\s*["“]?([A-Z])["”]?$/.exec(s)
  if (parte) return `${parte[1]} da parte ${parte[2]}`
  const re = /(\d{1,2}(?:\.\d{1,3})+)\s*,?\s*al[íi]nea\s*["“]?([a-z])["”]?/gi
  const partes: { num: string; letra: string }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) partes.push({ num: m[1], letra: m[2].toLowerCase() })
  if (partes.length < 2) return s
  const sobra = s.replace(re, '').replace(/,|\be\b|\s/g, '')
  if (sobra) return s
  const grupos: { num: string; letras: string[] }[] = []
  for (const p of partes) {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.num === p.num) ultimo.letras.push(p.letra)
    else grupos.push({ num: p.num, letras: [p.letra] })
  }
  return grupos
    .map((g) =>
      g.letras.length > 1
        ? `${g.num}, alíneas ${juntarLetras(g.letras)}`
        : `${g.num}, alínea ${g.letras[0]}`,
    )
    .join('; ')
}

/** Compara itens pelo número real da norma (1.4.2 antes de 1.4.10). */
export const compararRefItem = (a?: string, b?: string) =>
  (a || '').localeCompare(b || '', undefined, { numeric: true })
