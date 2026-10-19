const SIGLAS = [
  'PGR',
  'LTCAT',
  'GRO',
  'GHE',
  'EPI',
  'EPC',
  'PCMSO',
  'PPP',
  'AEP',
  'AET',
  'CIPA',
  'SESMT',
  'CNAE',
  'ART',
  'LGPD',
  'SST',
  'CLT',
  'MEI',
  'NHO',
]

/** Título em maiúsculas vira caso de sentença, preservando siglas e normas. Título em caixa mista não muda. */
export function casoSentenca(titulo: string): string {
  const letras = titulo.replace(/[^A-Za-zÀ-ÿ]/g, '')
  if (letras === '' || letras !== letras.toUpperCase()) return titulo
  let t = titulo.toLowerCase()
  t = t.charAt(0).toUpperCase() + t.slice(1)
  for (const sigla of SIGLAS) t = t.replace(new RegExp(`\\b${sigla.toLowerCase()}\\b`, 'g'), sigla)
  t = t.replace(/\bnr-?(\d+)/g, (_m, n) => `NR-${n}`)
  t = t.replace(/\besocial\b/g, 'eSocial')
  return t
}

export function separarNumero(titulo: string): { numero: string; titulo: string } {
  const m = titulo.match(/^(\d+)\s*[–-]\s*(.+)$/)
  return m ? { numero: m[1], titulo: m[2] } : { numero: '', titulo }
}
