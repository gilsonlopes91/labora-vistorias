/* Equipamentos sugeridos para levar à vistoria, a partir dos checklists (NR e
   anexo) e dos formulários de campo escolhidos. A lista é por norma, não por
   palavra no nome: "NR-12" sugere o que se usa numa vistoria de máquinas,
   mesmo que o nome do checklist não fale em trena. */
import { anexoDe, numeroNr, type NormaLike } from '@/lib/normas'

const ROMANOS: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 }

/** Número do anexo ("VIII" → 8, "13-A" → 13), ou 0 para o corpo da norma. */
function numeroAnexo(t: NormaLike): number {
  const a = anexoDe(t)
  if (!a || a === 'ÚNICO') return 0
  const m = /^([IVXLC]+|\d+)/.exec(a)
  if (!m) return 0
  if (/^\d+$/.test(m[1])) return Number(m[1])
  let total = 0
  for (let i = 0; i < m[1].length; i++) {
    const v = ROMANOS[m[1][i]] || 0
    const prox = ROMANOS[m[1][i + 1]] || 0
    total += v < prox ? -v : v
  }
  return total
}

const AMOSTRAGEM = ['Bomba de amostragem', 'Calibrador de vazão', 'Tubos ou cassetes de coleta']
const RUIDO = ['Dosímetro de ruído', 'Decibelímetro', 'Calibrador acústico']
const CALOR = ['Medidor de IBUTG (termômetro de globo)']
const VIBRACAO = ['Medidor de vibração (VMB e VCI)']
const GASES = ['Detector multigás calibrado (O₂, LEL, H₂S, CO)', 'Lanterna à prova de explosão']
const ELETRICA = ['Detector de tensão por aproximação', 'Lanterna']

// Chave "NR" vale para a norma toda; "NR:anexo" só para aquele anexo.
const POR_NORMA: Record<string, string[]> = {
  '8': ['Trena a laser', 'Nível ou inclinômetro (rampas e escadas)', 'Luxímetro'],
  '9:1': VIBRACAO,
  '9:2': [...AMOSTRAGEM.slice(0, 2), 'Tubos de carvão ativo (benzeno)'],
  '9:3': CALOR,
  '10': [...ELETRICA, 'Vestimenta e luvas isolantes (se for abrir painéis)'],
  '11': ['Trena'],
  '12': ['Trena', 'Paquímetro ou gabarito para aberturas das proteções', 'Lanterna'],
  '13': ['Lanterna', 'Termômetro infravermelho'],
  '15:1': RUIDO,
  '15:2': ['Decibelímetro com medição de impacto', 'Calibrador acústico'],
  '15:3': CALOR,
  '15:5': ['Monitor de radiação ionizante'],
  '15:8': VIBRACAO,
  '15:9': ['Termômetro', 'Anemômetro'],
  '15:10': ['Termo-higrômetro'],
  '15:11': AMOSTRAGEM,
  '15:12': [...AMOSTRAGEM.slice(0, 2), 'Ciclone e cassetes (poeira respirável)'],
  '15:13': AMOSTRAGEM,
  '16': ['Trena (distâncias das áreas de risco)'],
  '16:2': GASES,
  '16:4': ELETRICA,
  '17': [
    'Luxímetro',
    'Termo-higrômetro',
    'Anemômetro',
    'Decibelímetro',
    'Trena',
    'Dinamômetro (força de empurrar e puxar)',
  ],
  '18': ['Trena', 'Capacete com jugular', 'Cinto tipo paraquedista (se for subir)'],
  '20': GASES,
  '22': ['Detector multigás calibrado (O₂, LEL, H₂S, CO)', 'Lanterna', 'Dosímetro de ruído'],
  '23': [
    'Trena (distância até extintores e saídas)',
    'Lanterna',
    'Luxímetro (iluminação de emergência)',
  ],
  '24': ['Trena', 'Termômetro'],
  '29': ['Detector multigás calibrado (O₂, LEL, H₂S, CO)', 'Colete salva-vidas'],
  '30': ['Detector multigás calibrado (O₂, LEL, H₂S, CO)', 'Colete salva-vidas'],
  '31': ['Perneira', 'Chapéu e protetor solar'],
  '32': ['Luvas de procedimento', 'Máscara PFF2'],
  '33': GASES,
  '34': [...GASES, 'Trena'],
  '35': [
    'Trena',
    'Cinto tipo paraquedista com talabarte (se for subir)',
    'Binóculo (ancoragens altas)',
  ],
  '36': ['Termômetro', 'Termo-higrômetro', 'Anemômetro', 'Roupa térmica (câmaras frias)'],
}

// Para formulários de campo e checklists próprios, que não têm NR no nome.
const POR_NOME: { teste: RegExp; itens: string[] }[] = [
  { teste: /ru[ií]do|dosimetr/i, itens: RUIDO },
  { teste: /calor|IBUTG|t[ée]rmic/i, itens: CALOR },
  { teste: /ilumin|lux/i, itens: ['Luxímetro'] },
  { teste: /vibra/i, itens: VIBRACAO },
  { teste: /qu[ií]mic|poeira|s[ií]lica|aerodispers|vapor|amostragem/i, itens: AMOSTRAGEM },
  { teste: /confinad|multig[áa]s/i, itens: GASES },
  { teste: /el[ée]tric|painel|quadro/i, itens: ELETRICA },
  { teste: /extintor|inc[êe]ndio|hidrante/i, itens: ['Trena', 'Lanterna'] },
  { teste: /ergonom/i, itens: ['Trena', 'Dinamômetro (força de empurrar e puxar)'] },
  { teste: /altura|andaime|escada/i, itens: ['Trena'] },
]

export const EPIS_BASICOS = 'EPIs básicos (capacete, óculos, protetor auricular, botina)'

export function sugerirEquipamentos(
  checklists: NormaLike[],
  nomesFormularios: string[] = [],
): string[] {
  const lista: string[] = []
  const add = (itens: string[]) => {
    for (const i of itens) if (!lista.includes(i)) lista.push(i)
  }
  for (const t of checklists) {
    const nr = numeroNr(t)
    if (nr === 999) {
      for (const r of POR_NOME) if (r.teste.test(t.nome || '')) add(r.itens)
      continue
    }
    const anexo = numeroAnexo(t)
    if (anexo && POR_NORMA[`${nr}:${anexo}`]) add(POR_NORMA[`${nr}:${anexo}`])
    if (POR_NORMA[String(nr)]) add(POR_NORMA[String(nr)])
  }
  const nomes = nomesFormularios.join(' | ')
  for (const r of POR_NOME) if (r.teste.test(nomes)) add(r.itens)
  add([EPIS_BASICOS])
  return lista
}

/** Junta a sugestão ao que já está digitado, sem repetir, dentro do limite do campo. */
export function juntarEquipamentos(atual: string, sugestao: string[], limite = 500): string {
  const partes = atual
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const jaTem = new Set(partes.map((s) => s.toLowerCase()))
  for (const i of sugestao) {
    if (jaTem.has(i.toLowerCase())) continue
    const proximo = [...partes, i].join(', ')
    if (proximo.length > limite) break
    partes.push(i)
    jaTem.add(i.toLowerCase())
  }
  return partes.join(', ')
}
