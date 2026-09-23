/* Leitura das NRs e do Anexo II da NR-28 a partir do texto dos PDFs oficiais,
   sem IA: regras fixas de numeração (12.6.1, alíneas a), b)...) e cruzamento
   pelo código de ementa. Mesma lógica usada na auditoria de 23/09/2026.

   Entrada: linhas de texto do PDF (ver extrairLinhasPdf em leitorPdf.ts).
   Saída: seções do catálogo prontas para a rota /backend/v1/admin/sync-catalogo. */

export interface LinhaAnexoII {
  sec: string // ex.: "NR-12" ou "NR-12 - ANEXO VIII"
  item: string // ex.: '12.6.3, alínea "b"'
  codigo: string
  grau: number | null
  tipo: 'S' | 'M' | null
}

interface ItemNorma {
  num: string
  text: string
}

interface Segmento {
  name: string
  items: ItemNorma[]
  last: number[] | null
  start: number
  head?: boolean
}

export interface TextoNR {
  nr: string
  linhas: string[]
  itens: Record<string, ItemNorma[]> // por segmento: CORPO, I, II, 1, 13-A...
  ranges: Record<string, [number, number]>
}

export interface ItemCatalogo {
  item_ref: string
  codigo: string
  grau: number | null
  tipo: 'S' | 'M' | null
  descricao: string
  ordem: number
  secao: string
  observacao: string
  pendente_revisao: boolean
  status: 'OK' | 'PARCIAL' | 'NAO_ENCONTRADO'
  /** texto não localizado no PDF; mantido o texto já conferido à mão */
  mantido?: boolean
}

export interface SecaoCatalogo {
  sem_texto: LinhaAnexoII[] // linhas do Anexo II sem texto localizado e sem item atual
  secao_oficial: string
  nr_referencia: string
  segmento: string
  titulo_anexo: string
  itens: ItemCatalogo[]
}

const nrPad = (n: number) => `NR-${String(n).padStart(2, '0')}`

// ---------------------------------------------------------------------------
// Anexo II da NR-28
// ---------------------------------------------------------------------------

export function lerAnexoII(linhas: string[]): LinhaAnexoII[] {
  let inicio = linhas.findIndex((l) => l.trim() === 'ANEXO II')
  if (inicio < 0) inicio = 0
  const rows: LinhaAnexoII[] = []
  const reRow = /^\s*(.*?)\s*(\d{6}-\d)(?:\s+I?(\d)(?:\s+([SMsm]))?)?\s*$/
  const reHead = /^\s*(NR[- ]?\s?\d+)(\s*-\s*An[eê]xo\s+([\w-]+))?/i
  let sec: string | null = null
  let pend = ''
  let aberta = false
  for (let i = inicio; i < linhas.length; i++) {
    const l = linhas[i]
    const s = l.trim()
    if (!s) continue
    const m = reRow.exec(l)
    if (m) {
      let it = m[1].trim()
      if (!it) {
        it = pend
        aberta = true
      } else {
        if (pend) it = pend + ' ' + it
        aberta = false
      }
      pend = ''
      if (sec) {
        rows.push({
          sec,
          item: it,
          codigo: m[2],
          grau: m[3] ? Number(m[3]) : null,
          tipo: m[4] ? (m[4].toUpperCase() as 'S' | 'M') : null,
        })
      }
      continue
    }
    const h = reHead.exec(l)
    if (h && s.length < 90 && !/\d{6}-\d/.test(s)) {
      const n = Number(h[1].replace(/\D/g, ''))
      sec = nrPad(n) + (h[3] ? ' - ANEXO ' + h[3].toUpperCase() : '')
      pend = ''
      aberta = false
      continue
    }
    if (
      s.startsWith('Item/Subitem') ||
      s.startsWith('(Portaria') ||
      /^\d+$/.test(s) ||
      s.startsWith('Código')
    )
      continue
    if (!sec) continue
    const ultima = rows[rows.length - 1]
    if (ultima && (aberta || /(,| e)$/.test(ultima.item))) ultima.item += ' ' + s
    else pend = (pend + ' ' + s).trim()
  }
  // O mesmo código pode aparecer em duas tabelas (ex.: NR-05 corpo e NR-05 Anexo I);
  // a NR-28 lista nas duas e o catálogo também. Só repetição na mesma seção é descartada.
  const ultimaPos = new Map<string, number>()
  rows.forEach((r, i) => ultimaPos.set(r.sec + '|' + r.codigo, i))
  return rows.filter((r, i) => ultimaPos.get(r.sec + '|' + r.codigo) === i)
}

// ---------------------------------------------------------------------------
// Texto da NR: itens numerados por segmento (corpo e anexos)
// ---------------------------------------------------------------------------

const NOISE = /^(Este texto não substitui.*|\d{1,3}|Página \d+.*)$/
const HEAD =
  /^(?:ANEXO|Anexo)\s+(?:N[º°o]\.?\s*)?["“]?([IVXL]+|\d+(?:-A)?)["”]?\s*(?:(?:da|DA) NR.*|[-–—(:].*|[A-ZÇÃÕÉÍÓÚÂÊ ]+)?$/
const ITEM = /^(\d{1,2}(?:\.\d{1,3})*)\.?\s+(\S.*)$/

function igualPrefixo(a: number[], b: number[], n: number) {
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return false
  return true
}

function sucessor(prev: number[] | null, n: number[]): boolean {
  if (!prev) return n.length <= 2 || n[n.length - 1] === 1
  const p = prev
  if (
    n.length === p.length + 1 &&
    igualPrefixo(n, p, p.length) &&
    (n[n.length - 1] === 1 || n[n.length - 1] === 2)
  )
    return true
  for (let k = p.length; k >= 1; k--) {
    if (
      n.length === k &&
      igualPrefixo(n, p, k - 1) &&
      n[k - 1] - p[k - 1] > 0 &&
      n[k - 1] - p[k - 1] <= 3
    )
      return true
  }
  return false
}

/** Palavra quebrada no fim da linha com hífen ("não-\nrotineiras", "NR-\n05"): junta sem espaço. */
export const juntaHifen = (t: string) => t.replace(/(\p{L})-\n(?=[\p{L}\d])/gu, '$1-')

const igual = (a: number[], b: number[]) => a.length === b.length && igualPrefixo(a, b, a.length)

export function lerTextoNR(nr: string, linhas: string[]): TextoNR {
  const nrnum = Number(nr.replace(/\D/g, ''))
  const segs: Segmento[] = []
  let cur: Segmento = { name: 'CORPO', items: [], last: null, start: 0 }
  segs.push(cur)
  linhas.forEach((raw, ln) => {
    const s = raw.trim()
    if (!s || NOISE.test(s)) return
    let h = HEAD.exec(s)
    if (h && s.startsWith('Anexo')) {
      const mm = /da NR[- ]?(\d+)\s*$/.exec(s)
      if (!mm || Number(mm[1]) !== nrnum) h = null
    }
    if (h && /[;,]$/.test(s)) h = null
    if (h && s.length < 160) {
      cur = { name: h[1].toUpperCase(), items: [], last: null, start: ln, head: true }
      segs.push(cur)
      return
    }
    const m = ITEM.exec(s)
    if (m) {
      const num = m[1].split('.').map(Number)
      let ok = false
      if (igual(num, [nrnum, 1])) {
        cur = { name: 'CORPO', items: [], last: null, start: ln }
        segs.push(cur)
        ok = true
      } else if (cur.name === 'CORPO') {
        ok = num[0] === nrnum && sucessor(cur.last, num)
      } else {
        if (
          (igual(num, [1]) || igual(num, [1, 1])) &&
          cur.items.length &&
          !sucessor(cur.last, num)
        ) {
          cur = { name: cur.name, items: [], last: null, start: ln }
          segs.push(cur)
        }
        ok = sucessor(cur.last, num)
      }
      if (ok) {
        cur.items.push({ num: m[1], text: s })
        cur.last = num
        return
      }
    }
    if (cur.items.length) cur.items[cur.items.length - 1].text += '\n' + s
  })

  const best: Record<string, Segmento> = {}
  for (const sg of segs)
    if (!best[sg.name] || sg.items.length > best[sg.name].items.length) best[sg.name] = sg
  const heads = segs
    .filter((sg) => sg.head || (sg.name === 'CORPO' && sg === best.CORPO))
    .sort((a, b) => a.start - b.start)
  const itens: Record<string, ItemNorma[]> = {}
  const ranges: Record<string, [number, number]> = {}
  for (const [k, sg] of Object.entries(best)) {
    const hs = heads.filter((h) => h.name === k && h.start <= sg.start)
    const a = hs.length ? hs[hs.length - 1].start : sg.start
    const nxt = heads.filter((h) => h.start > sg.start && h.name !== k).map((h) => h.start)
    ranges[k] = [a, nxt.length ? Math.min(...nxt) : linhas.length]
    itens[k] = sg.items.map((i) => ({
      num: i.num,
      text: juntaHifen(i.text).replace(/(?<![.:;])\n(?![a-z]\)|[IVX]+\s*[-–])/g, ' '),
    }))
  }
  return { nr, linhas, itens, ranges }
}

// ---------------------------------------------------------------------------
// Cruzamento: linha do Anexo II -> texto literal dos subitens citados
// ---------------------------------------------------------------------------

const NUMLINE = /^\d{1,2}(?:\.\d{1,3})*\.?\s+\S/
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function fallback(t: TextoNR, seg: string, num: string): ItemNorma | null {
  const [a, b] = t.ranges[seg] || [0, 0]
  const L = t.linhas
  let hit = -1
  const re = new RegExp('^' + esc(num) + '\\.?\\s+\\S')
  for (let i = a; i < b; i++) if (re.test(L[i].trim())) hit = i
  if (hit < 0) return null
  const txt = [L[hit].trim()]
  for (let j = hit + 1; j < b; j++) {
    const s = L[j].trim()
    if (NUMLINE.test(s) || s.startsWith('ANEXO')) break
    if (s && !s.startsWith('Este texto n')) txt.push(s)
  }
  return { num, text: juntaHifen(txt.join('\n')) }
}

function referencias(item: string, corpo: boolean) {
  const t = item.replace(/["“][^"”]*["”]/g, '').replace(/\([^)]*\)/g, '')
  const toks: string[] = []
  const re = /(\d{1,2}(?:\.\d{1,3})*)\.?|\s(a|até)\s/g
  let m: RegExpExecArray | null
  while ((m = re.exec(t))) {
    if (m[1]) toks.push(m[1].replace(/\.$/, ''))
    else toks.push('RANGE')
  }
  const filtrados = corpo ? toks.filter((x) => x === 'RANGE' || x.includes('.')) : toks
  return { toks: filtrados, sub: /subitens|subitem/.test(item) }
}

function alineasDe(num: string, ref: string): Set<string> {
  const out = new Set<string>()
  const re = new RegExp(
    esc(num) +
      '(?![\\d.]),?\\s*al[íi]neas?\\s*((?:["“][a-z]["”](?:\\s*,\\s*|\\s+e\\s+|\\s*a\\s*)?)+)',
    'g',
  )
  let m: RegExpExecArray | null
  while ((m = re.exec(ref))) {
    const seg = m[1]
    for (const x of seg.matchAll(/["“]([a-z])["”]/g)) out.add(x[1])
    const faixa = /["“]([a-z])["”]\s*a\s*["“]([a-z])["”]/.exec(seg)
    if (faixa)
      for (let c = faixa[1].charCodeAt(0); c <= faixa[2].charCodeAt(0); c++)
        out.add(String.fromCharCode(c))
  }
  return out
}

function filtraAlineas(texto: string, letras: Set<string>) {
  if (!letras.size) return texto
  const keep: string[] = []
  let cur: string | null = null
  for (const l of texto.split('\n')) {
    const m = /^([a-z])\)/.exec(l)
    if (m) cur = m[1]
    if (cur === null || letras.has(cur)) keep.push(l)
  }
  return keep.join('\n')
}

export function normaliza(t: string) {
  return t
    .split('\n\n')
    .map((b) =>
      b
        .replace(
          /\n(?!\s*(?:[a-z]\)|[IVX]+\s*[-–)]|-\s|(?:\d+(?:\.\d+)+\.?|\d+\.)\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]))/g,
          ' ',
        )
        .replace(/[ \t]+/g, ' ')
        .trim(),
    )
    .filter(Boolean)
    .join('\n\n')
    .replace(/\s*Este texto não substitui o publicado no DOU\s*/g, ' ')
}

export function resolverTexto(
  linha: LinhaAnexoII,
  t: TextoNR,
): { texto: string; status: 'OK' | 'PARCIAL' | 'NAO_ENCONTRADO'; faltando: string[] } {
  let seg = /ANEXO (\S+)/.exec(linha.sec)?.[1] || 'CORPO'
  const m2 = /(?:(?:do|no)\s+)?Anexo\s+([IVXL]+|\d+)\b/i.exec(linha.item)
  if (m2) seg = m2[1].toUpperCase()
  const items = t.itens[seg]
  if (!items) return { texto: '', status: 'NAO_ENCONTRADO', faltando: [] }
  const idx = new Map(items.map((it, i) => [it.num, i]))
  const { toks, sub } = referencias(linha.item, seg === 'CORPO')
  let sel: number[] = []
  const miss: string[] = []
  const extra: ItemNorma[] = []
  toks.forEach((tk, k) => {
    if (tk === 'RANGE') return
    if (k >= 2 && toks[k - 1] === 'RANGE' && idx.has(toks[k - 2]) && idx.has(tk)) {
      for (let i = idx.get(toks[k - 2])!; i <= idx.get(tk)!; i++) sel.push(i)
      return
    }
    if (idx.has(tk)) sel.push(idx.get(tk)!)
    else {
      const fb = fallback(t, seg, tk)
      if (fb) extra.push(fb)
      else miss.push(tk)
    }
  })
  if (sub) {
    for (const i of [...sel]) {
      const p = items[i].num + '.'
      items.forEach((it, j) => {
        if (it.num.startsWith(p)) sel.push(j)
      })
    }
  }
  sel = Array.from(new Set(sel)).sort((a, b) => a - b)
  const achados = [...sel.map((i) => items[i]), ...extra]
  if (!achados.length) return { texto: '', status: 'NAO_ENCONTRADO', faltando: miss }
  const texto = normaliza(
    achados.map((a) => filtraAlineas(a.text, alineasDe(a.num, linha.item))).join('\n\n'),
  )
  return { texto, status: miss.length ? 'PARCIAL' : 'OK', faltando: miss }
}

// ---------------------------------------------------------------------------
// Montagem das seções (corpo e anexos) de uma NR
// ---------------------------------------------------------------------------

function chaveNatural(ref: string) {
  const m = /[\d.]+/.exec(ref.trim())
  const nums = (m ? m[0].replace(/^\.+|\.+$/g, '') : '999')
    .split('.')
    .filter((x) => /^\d+$/.test(x))
    .map(Number)
  while (nums.length < 8) nums.push(0)
  return nums.slice(0, 8)
}

function compararRef(a: string, b: string) {
  const ka = chaveNatural(a)
  const kb = chaveNatural(b)
  for (let i = 0; i < 8; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i]
  return a.localeCompare(b)
}

function capitulo(t: TextoNR, seg: string, ref: string) {
  const m = /[\d.]+/.exec(ref.trim())
  if (!m) return ''
  const partes = m[0].replace(/^\.+|\.+$/g, '').split('.')
  const key = seg === 'CORPO' ? partes.slice(0, 2).join('.') : partes[0]
  const tx = (t.itens[seg] || []).find((i) => i.num === key)?.text || ''
  const first = tx.split('\n')[0]
  if (
    first &&
    first.length <= 90 &&
    !first.trim().endsWith(':') &&
    /^[\d.]+\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(first)
  ) {
    let r = first.replace(/\.$/, '')
    const mm = /^([\d.]+\s+)(.*)$/.exec(r)
    if (mm && mm[2].toUpperCase() === mm[2]) r = mm[1] + mm[2][0] + mm[2].slice(1).toLowerCase()
    return r
  }
  return 'Item ' + key
}

export function tituloAnexo(t: TextoNR, seg: string) {
  const r = t.ranges[seg]
  if (!r) return ''
  const partes: string[] = []
  for (const l of t.linhas.slice(r[0] + 1, r[0] + 6)) {
    const s = l.trim()
    if (!s) continue
    if (s.toUpperCase() === s && !/^\d/.test(s) && !s.startsWith('(')) partes.push(s)
    else break
  }
  const tt = partes
    .join(' ')
    .replace(/\s*SUMÁRIO\s*$/, '')
    .trim()
  return tt ? tt[0] + tt.slice(1).toLowerCase() : ''
}

/** Última portaria de alteração listada no cabeçalho do PDF da NR. */
export function ultimaPortaria(linhas: string[]): { portaria: string; dou: string } | null {
  let last: { portaria: string; dou: string } | null = null
  for (const l of linhas.slice(0, 200)) {
    const m = /^\s*(Portaria\s.*?\d{4})\s+(?:Rep\.|Retif\.)?\s*(\d{2})\/(\d{2})\/(\d{2})\s*$/.exec(
      l,
    )
    if (m) {
      const yy = Number(m[4])
      const ano = yy > 50 ? 1900 + yy : 2000 + yy
      last = { portaria: m[1].replace(/\s+/g, ' ').trim(), dou: `${ano}-${m[3]}-${m[2]}` }
    }
  }
  return last
}

export interface TextoAtual {
  codigo: string
  descricao: string
  observacao?: string
  pendente_revisao?: boolean
}

/**
 * Gera as seções do catálogo de uma NR.
 * - linhasAnexoII: linhas oficiais do Anexo II (da NR-28 nova ou, se não houver,
 *   montadas a partir do catálogo atual).
 * - atuais: itens vigentes já cadastrados, usados quando o texto não é localizado
 *   no PDF (mantém o texto atual; não apaga correção manual).
 */
export function montarSecoes(
  nr: string,
  linhasAnexoII: LinhaAnexoII[],
  texto: TextoNR,
  atuais: TextoAtual[],
): SecaoCatalogo[] {
  const porCodigo = new Map(atuais.map((a) => [a.codigo, a]))
  const grupos = new Map<string, LinhaAnexoII[]>()
  for (const r of linhasAnexoII) {
    if (!r.sec.startsWith(nr)) continue
    if (!grupos.has(r.sec)) grupos.set(r.sec, [])
    grupos.get(r.sec)!.push(r)
  }
  const out: SecaoCatalogo[] = []
  for (const [sec, rows] of grupos) {
    const seg = /ANEXO (\S+)/.exec(sec)?.[1] || 'CORPO'
    rows.sort((a, b) => compararRef(a.item, b.item))
    const itens: ItemCatalogo[] = []
    const semTexto: LinhaAnexoII[] = []
    rows.forEach((r) => {
      const res = resolverTexto(r, texto)
      const atual = porCodigo.get(r.codigo)
      let descricao = res.texto
      let observacao = ''
      let pendente = false
      let mantido = false
      if (res.status !== 'OK' && atual && atual.pendente_revisao === false) {
        // Item já conferido à mão pelo admin: o texto revisado prevalece.
        mantido = true
        descricao = atual.descricao
        observacao = atual.observacao || ''
      } else if (res.status === 'NAO_ENCONTRADO') {
        if (!atual) {
          // sem texto e sem item atual: fica de fora (aparece na tela de conferência)
          semTexto.push(r)
          return
        }
        descricao = atual.descricao
        observacao =
          'Texto literal não localizado no PDF oficial. Descrição atual mantida até revisão manual.'
        pendente = true
      } else if (res.status === 'PARCIAL') {
        observacao = `Subitem(ns) ${res.faltando.join(', ')} citado(s) no Anexo II da NR-28 não localizado(s) no texto da NR. Conferir com a fonte oficial.`
        pendente = true
      }
      itens.push({
        item_ref: r.item,
        codigo: r.codigo,
        grau: r.grau,
        tipo: r.tipo,
        descricao,
        ordem: itens.length,
        secao: capitulo(texto, seg, r.item),
        observacao,
        pendente_revisao: pendente,
        status: res.status,
        mantido,
      })
    })
    out.push({
      sem_texto: semTexto,
      secao_oficial: sec,
      nr_referencia: nr,
      segmento: seg,
      titulo_anexo: seg === 'CORPO' ? '' : tituloAnexo(texto, seg),
      itens,
    })
  }
  return out
}

export function nrDoNomeArquivo(nome: string): string | null {
  const m = /nr[-_ ]?(\d{1,2})/i.exec(nome)
  return m ? nrPad(Number(m[1])) : null
}
