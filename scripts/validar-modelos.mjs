// Confere, a cada build, que os Modelos Gerais convertidos estão completos:
// todo campo [NOME] existe no dicionário, todo bloco "preenchido pelo app"
// tem gerador em src/lib/modelosSst/blocos.ts e não há ids repetidos.
// Falha o build se algo ficou sem dono — é o que impede um colchete passar
// despercebido quando o modelo .md mudar.
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const dirGerados = join(raiz, 'src', 'modelos-sst', 'gerados')
const dicionario = JSON.parse(
  readFileSync(join(raiz, 'src', 'modelos-sst', 'dicionario.json'), 'utf-8'),
)
const blocosTs = readFileSync(join(raiz, 'src', 'lib', 'modelosSst', 'blocos.ts'), 'utf-8')
const CAMPOS_DO_MOTOR = new Set(['NOME_MATRIZ', 'METODOLOGIA_MATRIZ'])

const RE = /\[([A-Z][A-Z0-9_]+)\]/g
const problemas = []

function* textos(segs) {
  for (const s of segs || []) {
    if (s.t === 'texto') yield s.texto
    else if (s.t === 'alternativa') for (const o of s.opcoes) yield o.texto
    else if (s.t === 'condicional') {
      if (s.texto) yield s.texto
      yield* textos(s.segmentos)
    }
  }
}

for (const arquivo of readdirSync(dirGerados).filter(
  (f) => f.endsWith('.json') && f !== 'hashes.json',
)) {
  const doc = JSON.parse(readFileSync(join(dirGerados, arquivo), 'utf-8'))
  const campos = new Set()
  const blocos = []
  const secoesVistas = new Set()
  const varrer = (t) => {
    for (const m of t.matchAll(RE)) campos.add(m[1])
  }
  const todas = [{ numero: 'capa', elementos: doc.capa }, ...doc.secoes]
  for (const s of todas) {
    if (s.numero !== 'capa') {
      if (secoesVistas.has(s.numero)) problemas.push(`${doc.tipo}: seção ${s.numero} repetida`)
      secoesVistas.add(s.numero)
    }
    for (const el of s.elementos) {
      if (el.tipo === 'paragrafo') for (const t of textos(el.segmentos)) varrer(t)
      if (el.tipo === 'lista') for (const it of el.itens) for (const t of textos(it)) varrer(t)
      if (el.tipo === 'tabela')
        for (const r of el.linhas) for (const c of r) for (const t of textos(c)) varrer(t)
      if (el.tipo === 'alternativa') {
        if (el.prefixo) for (const t of textos(el.prefixo.segmentos)) varrer(t)
        for (const o of el.opcoes) {
          if (o.texto) varrer(o.texto)
          for (const t of textos(o.segmentos)) varrer(t)
        }
      }
      if (el.tipo === 'bloco') {
        blocos.push(el)
        el.modeloLinha.forEach(varrer)
        if (el.modeloLinha.length !== el.cabecalho.length)
          problemas.push(
            `${doc.tipo}: bloco ${el.id} tem ${el.cabecalho.length} colunas e ${el.modeloLinha.length} células`,
          )
      }
    }
  }
  for (const c of campos) {
    if (!dicionario[c] && !CAMPOS_DO_MOTOR.has(c))
      problemas.push(`${doc.tipo}: campo [${c}] não está no dicionário`)
  }
  const ids = new Set()
  for (const b of blocos) {
    if (ids.has(b.id)) problemas.push(`${doc.tipo}: bloco ${b.id} repetido`)
    ids.add(b.id)
    const comTipo = `'${doc.tipo}/${b.id}'`
    const semTipo = `'${b.id}'`
    if (!blocosTs.includes(comTipo) && !blocosTs.includes(semTipo))
      problemas.push(`${doc.tipo}: bloco ${b.id} sem gerador em blocos.ts`)
  }
  console.log(
    `${doc.tipo}: ${campos.size} campos, ${blocos.length} blocos, ${doc.secoes.length} seções`,
  )
}

if (problemas.length) {
  console.error('\nModelos Gerais com pendências:')
  for (const p of problemas) console.error(' - ' + p)
  process.exit(1)
}
console.log('Modelos Gerais validados.')
