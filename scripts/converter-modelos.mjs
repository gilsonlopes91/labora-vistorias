// Converte os Modelos Gerais Labora (modelos-sst/*.md, texto normalizado com
// campos [NOME_CANONICO]) na estrutura que o app usa para montar os
// documentos (src/modelos-sst/gerados/*.json). Roda no prebuild e pode ser
// rodado à mão: node scripts/converter-modelos.mjs
//
// O .md é a fonte da verdade do texto. Este script não altera texto: só
// reconhece a estrutura (capa, seções, subtítulos, parágrafos, listas,
// tabelas fixas, blocos "preenchido pelo app", alternativas [MANTER APENAS
// UMA] e condicionais [SE HOUVER ...]) e a grava em JSON.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const ORIGEM = join(raiz, 'modelos-sst')
const DESTINO = join(raiz, 'src', 'modelos-sst', 'gerados')

const MODELOS = {
  pgr: { arquivo: 'pgr.md', titulo: 'Programa de Gerenciamento de Riscos', sigla: 'PGR' },
  ltcat: {
    arquivo: 'ltcat.md',
    titulo: 'Laudo Técnico das Condições Ambientais do Trabalho',
    sigla: 'LTCAT',
  },
  insalubridade: {
    arquivo: 'insalubridade.md',
    titulo: 'Laudo de Insalubridade',
    sigla: 'NR-15',
  },
  periculosidade: {
    arquivo: 'periculosidade.md',
    titulo: 'Laudo de Periculosidade',
    sigla: 'NR-16',
  },
}

// Ajustes que o texto sozinho não resolve.
// - alternativasParagrafos: quantos parágrafos depois de um
//   "[MANTER APENAS UMA]" solto são opções (padrão: até o próximo título ou
//   bloco).
// - tabelasMatriz: tabelas fixas do capítulo 11 do PGR que o app gera a
//   partir da matriz de risco escolhida, na ordem em que aparecem.
const CONFIG = {
  insalubridade: { alternativasParagrafos: { 2: 2, 14: 1 } },
  ltcat: { alternativasParagrafos: { 3: 2 } },
  pgr: {
    tabelasMatriz: {
      11: ['matriz_severidade', 'matriz_probabilidade', 'matriz_celulas', 'matriz_prazos'],
    },
  },
}

const VERSAO_TEXTO = '2026-09-29'
const doc_hash = {}

// ---------- utilidades ----------

/** Encontra o fim do colchete aberto em `inicio`, respeitando aninhamento. */
function fimColchete(texto, inicio) {
  let nivel = 0
  for (let i = inicio; i < texto.length; i++) {
    if (texto[i] === '[') nivel++
    else if (texto[i] === ']') {
      nivel--
      if (nivel === 0) return i
    }
  }
  return -1
}

/** Marcadores especiais no início de um colchete. */
const eMarcadorAlternativa = (t) => t.startsWith('MANTER APENAS UMA')
const eMarcadorCondicional = (t) => /^SE (HOUVER|NÃO|ME\/EPP)/.test(t)

/** Separa um parágrafo em segmentos: texto comum, campo, alternativa inline,
 *  condicional inline. Campos ficam como texto "[CAMPO]". */
function segmentar(linha, ids) {
  const segs = []
  let i = 0
  let buf = ''
  const flush = () => {
    if (buf) segs.push({ t: 'texto', texto: buf })
    buf = ''
  }
  while (i < linha.length) {
    if (linha[i] !== '[') {
      buf += linha[i]
      i++
      continue
    }
    const fim = fimColchete(linha, i)
    if (fim < 0) {
      buf += linha.slice(i)
      break
    }
    const interno = linha.slice(i + 1, fim)
    if (eMarcadorAlternativa(interno)) {
      flush()
      const corpo = interno.replace(/^MANTER APENAS UMA:?\s*/, '')
      if (corpo) {
        // alternativa inline: "[MANTER APENAS UMA: a / b / c]" ou "(i) ...; (ii) ..."
        let prefixo = ''
        let opcoes
        if (/\(i\)/.test(corpo)) {
          const partes = corpo.split(/\s*\((?:i|ii|iii|iv|v)\)\s*/)
          prefixo = partes[0].trim()
          opcoes = partes
            .slice(1)
            .map((s) => s.replace(/[;.]\s*$/, '').trim())
            .filter(Boolean)
        } else {
          opcoes = corpo.split(/\s+\/\s+/).map((s) => s.trim())
        }
        if (prefixo) segs.push({ t: 'texto', texto: prefixo + ' ' })
        segs.push({
          t: 'alternativa',
          id: ids.alternativa(),
          inline: true,
          opcoes: opcoes.map((texto, n) => ({ id: `op${n + 1}`, texto })),
        })
      } else {
        segs.push({ t: 'marcador_alternativa' })
      }
      i = fim + 1
      continue
    }
    if (interno.startsWith('CONFIRMAR')) {
      flush()
      segs.push({ t: 'nota', texto: interno })
      i = fim + 1
      continue
    }
    if (eMarcadorCondicional(interno)) {
      flush()
      const dois = interno.indexOf(':')
      if (dois > 0) {
        const condicao = interno.slice(0, dois).trim()
        segs.push({
          t: 'condicional',
          id: ids.condicional(condicao),
          condicao,
          texto: interno.slice(dois + 1).trim(),
        })
      } else {
        // sem texto próprio: vale para o resto do parágrafo (ou para o bloco)
        segs.push({
          t: 'condicional_prefixo',
          id: ids.condicional(interno.trim()),
          condicao: interno.trim(),
        })
      }
      i = fim + 1
      continue
    }
    // campo canônico ou outro colchete literal: fica no texto
    buf += linha.slice(i, fim + 1)
    i = fim + 1
  }
  flush()
  return segs
}

/** Parágrafo -> elemento. Condicional-prefixo engloba o resto. */
function paragrafo(linha, ids) {
  const segs = segmentar(linha, ids)
  if (segs.length && segs[0].t === 'texto') segs[0].texto = segs[0].texto.replace(/^\s+/, '')
  const saida = []
  for (let k = 0; k < segs.length; k++) {
    const s = segs[k]
    if (s.t === 'condicional_prefixo') {
      const resto = segs.slice(k + 1)
      saida.push({ t: 'condicional', id: s.id, condicao: s.condicao, segmentos: resto })
      break
    }
    saida.push(s)
  }
  return { tipo: 'paragrafo', segmentos: saida }
}

function linhaTabela(l) {
  return l
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())
}

// ---------- parser ----------

function converter(chave) {
  const cfg = MODELOS[chave]
  const extra = CONFIG[chave] || {}
  // O modelo pode estar inteiro (pgr.md) ou repartido em partes numeradas
  // (pgr/01.md, pgr/02.md…) que são concatenadas na ordem dos nomes.
  const pasta = join(ORIGEM, cfg.arquivo.replace(/\.md$/, ''))
  const texto = existsSync(pasta)
    ? readdirSync(pasta)
        .filter((f) => f.endsWith('.md'))
        .sort()
        .map((f) => readFileSync(join(pasta, f), 'utf-8'))
        .join('')
    : readFileSync(join(ORIGEM, cfg.arquivo), 'utf-8')
  const linhas = texto.split('\n')
  // Impressão digital do texto-fonte, para conferir que o modelo publicado é o mesmo do original.
  doc_hash[chave] = createHash('sha256').update(texto).digest('hex').slice(0, 16)

  let nAlt = 0
  let nCond = 0
  let secaoAtualId = 'capa'
  const slug = (t) =>
    t
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/^se (nao houver|nao houve|houver|me\/epp)\s*/, (m) =>
        m.includes('nao') ? 'nao_' : '',
      )
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 60)
  const ids = {
    alternativa: () => `${secaoAtualId}.alt${++nAlt}`,
    condicional: (condicao) => {
      const base = slug(condicao || '')
      return base && base !== 'nao' ? `cond_${base}` : `${secaoAtualId}.cond${++nCond}`
    },
  }

  const doc = {
    tipo: chave,
    sigla: cfg.sigla,
    titulo: cfg.titulo,
    versaoTexto: VERSAO_TEXTO,
    capa: [],
    secoes: [],
  }

  let destino = doc.capa
  let secao = null
  let emSumario = false
  let i = 0
  // bloco pendente: marcador "*Bloco preenchido pelo app: X*" até o próximo título
  let blocoPendente = null
  let rotuloBloco = null
  let tabelasMatrizSecao = null
  let indiceTabelaMatriz = 0

  const novaSecao = (nivel, textoTitulo) => {
    const m = textoTitulo.match(/^(\d+(?:\.\d+)?|ANEXO [A-Z])\s*[–-]\s*(.+)$/)
    const numero = m ? m[1] : ''
    const titulo = m ? m[2].trim() : textoTitulo.trim()
    return { nivel, numero, titulo }
  }

  while (i < linhas.length) {
    const l = linhas[i]
    const t = l.trim()

    if (t.startsWith('# ') && !t.startsWith('## ')) {
      i++
      continue
    }
    if (t.startsWith('## ')) {
      const info = novaSecao(2, t.slice(3))
      blocoPendente = null
      rotuloBloco = null
      if (info.titulo.toUpperCase() === 'SUMÁRIO') {
        emSumario = true
        i++
        continue
      }
      emSumario = false
      if (info.numero.startsWith('ANEXO')) break
      if (!info.numero && doc.secoes.length === 0) {
        // título do documento dentro da capa (ex.: "## Laudo de Insalubridade")
        destino.push({ tipo: 'titulo_documento', texto: info.titulo })
        i++
        continue
      }
      secaoAtualId = info.numero
      nAlt = 0
      nCond = 0
      secao = { id: info.numero, numero: info.numero, titulo: info.titulo, elementos: [] }
      doc.secoes.push(secao)
      destino = secao.elementos
      tabelasMatrizSecao = extra.tabelasMatriz?.[info.numero] || null
      indiceTabelaMatriz = 0
      i++
      continue
    }
    if (emSumario) {
      i++
      continue
    }
    if (t.startsWith('### ')) {
      const info = novaSecao(3, t.slice(4))
      blocoPendente = null
      rotuloBloco = null
      destino.push({ tipo: 'subtitulo', numero: info.numero, texto: info.titulo })
      i++
      continue
    }
    if (t === '---' || t === '') {
      i++
      continue
    }

    // marcador de bloco (pode vir com condicional na frente e nota depois)
    const mb = t.match(/^(\[[^\]]+\]\s*)?\*Bloco preenchido pelo app: (.+?)\*\s*(.*)$/)
    if (mb) {
      const condBloco = mb[1] ? mb[1].trim().replace(/^\[|\]$/g, '') : null
      blocoPendente = {
        titulo: mb[2].trim(),
        condicao: condBloco,
        condicaoId: condBloco ? ids.condicional(condBloco) : null,
        nota: mb[3] ? mb[3].trim().replace(/^\(|\)$/g, '') : null,
        n: 0,
      }
      rotuloBloco = null
      i++
      continue
    }

    // tabela
    if (t.startsWith('|')) {
      const linhasTab = []
      while (i < linhas.length && linhas[i].trim().startsWith('|')) {
        linhasTab.push(linhas[i])
        i++
      }
      const cab = linhaTabela(linhasTab[0])
      const corpo = linhasTab.slice(2).map(linhaTabela)
      const temCampo = corpo.some((r) => r.some((c) => /\[[A-Z0-9_]+\]/.test(c)))
      if (blocoPendente && corpo.length === 1 && temCampo) {
        blocoPendente.n++
        const sufixo = rotuloBloco ? ` – ${rotuloBloco}` : ''
        const idBloco = `${secaoAtualId}:${slug(`${blocoPendente.titulo}${sufixo}`)}`
        destino.push({
          tipo: 'bloco',
          id: idBloco,
          titulo: `${blocoPendente.titulo}${sufixo}`,
          rotulo: rotuloBloco,
          condicao: blocoPendente.condicao,
          condicaoId: blocoPendente.condicaoId,
          nota: blocoPendente.nota,
          cabecalho: cab,
          modeloLinha: corpo[0],
        })
        rotuloBloco = null
        continue
      }
      const tabela = {
        tipo: 'tabela',
        cabecalho: cab,
        linhas: corpo.map((r) => r.map((c) => segmentar(c, ids))),
      }
      if (tabelasMatrizSecao && indiceTabelaMatriz < tabelasMatrizSecao.length) {
        tabela.blocoMatriz = tabelasMatrizSecao[indiceTabelaMatriz++]
      }
      destino.push(tabela)
      continue
    }

    // lista
    if (t.startsWith('- ')) {
      const itens = []
      while (i < linhas.length && linhas[i].trim().startsWith('- ')) {
        itens.push(linhas[i].trim().slice(2))
        i++
      }
      // lista de opções de alternativa: "- [ROTULO] texto" logo após um marcador solto
      const ultimo = destino[destino.length - 1]
      const todosRotulados = itens.every((it) => /^\[[^\]]+\]\s/.test(it))
      if (ultimo && ultimo.tipo === 'paragrafo' && ultimo.marcadorAlternativa && todosRotulados) {
        const opcoes = itens.map((it) => {
          const m = it.match(/^\[([^\]]+)\]\s*(.*)$/)
          return { id: m[1], rotulo: m[1], texto: m[2] }
        })
        destino.push({ tipo: 'alternativa', id: ids.alternativa(), prefixo: ultimo, opcoes })
        destino.splice(destino.indexOf(ultimo), 1)
        continue
      }
      destino.push({ tipo: 'lista', itens: itens.map((it) => segmentar(it, ids)) })
      continue
    }

    // parágrafo
    const p = paragrafo(t, ids)
    // "[MANTER APENAS UMA]" solto no fim da linha: as opções vêm a seguir
    const temMarcador = p.segmentos.some((s) => s.t === 'marcador_alternativa')
    if (temMarcador) {
      p.segmentos = p.segmentos.filter((s) => s.t !== 'marcador_alternativa')
      p.marcadorAlternativa = true
      // Estilo NR-16: o próprio parágrafo é uma opção ("[MANTER APENAS UMA] texto").
      const textoRestante = p.segmentos
        .map((s) => (s.t === 'texto' ? s.texto : '[...]'))
        .join('')
        .trim()
      const ultimo = destino[destino.length - 1]
      if (textoRestante && t.startsWith('[MANTER APENAS UMA]')) {
        if (ultimo && ultimo.tipo === 'alternativa' && ultimo.estilo === 'paragrafos') {
          ultimo.opcoes.push({ id: `op${ultimo.opcoes.length + 1}`, segmentos: p.segmentos })
        } else {
          destino.push({
            tipo: 'alternativa',
            id: ids.alternativa(),
            estilo: 'paragrafos',
            opcoes: [{ id: 'op1', segmentos: p.segmentos }],
          })
        }
        i++
        continue
      }
      // Estilo LTCAT/NR-15: marcador solto, opções são os parágrafos seguintes.
      if (!textoRestante) {
        const qtd = extra.alternativasParagrafos?.[secaoAtualId]
        const opcoes = []
        let j = i + 1
        while (j < linhas.length) {
          const lj = linhas[j].trim()
          if (lj === '') {
            j++
            continue
          }
          if (
            lj.startsWith('#') ||
            lj.startsWith('|') ||
            lj.startsWith('- ') ||
            lj.startsWith('*Bloco')
          )
            break
          if (lj.startsWith('- [')) break
          if (qtd && opcoes.length >= qtd) break
          opcoes.push({ id: `op${opcoes.length + 1}`, segmentos: paragrafo(lj, ids).segmentos })
          j++
        }
        if (opcoes.length > 0) {
          destino.push({ tipo: 'alternativa', id: ids.alternativa(), estilo: 'paragrafos', opcoes })
          i = j
          continue
        }
        // sem parágrafos: lista rotulada logo abaixo (PGR) — fica para a lista tratar
        destino.push(p)
        i++
        continue
      }
      // Estilo PGR: "**3.4 Título.** [MANTER APENAS UMA]" seguido de lista rotulada
      destino.push(p)
      i++
      continue
    }
    // parágrafo-rótulo de bloco ("Ruído (Anexos 1 e 2):") quando há bloco pendente
    if (blocoPendente && /:\s*$/.test(t) && t.length < 160) {
      rotuloBloco = t.replace(/:\s*$/, '')
      i++
      continue
    }
    destino.push(p)
    i++
  }

  return doc
}

mkdirSync(DESTINO, { recursive: true })
const resumo = []
for (const chave of Object.keys(MODELOS)) {
  const doc = converter(chave)
  writeFileSync(join(DESTINO, `${chave}.json`), JSON.stringify(doc), 'utf-8')
  const blocos = doc.secoes.flatMap((s) => s.elementos.filter((e) => e.tipo === 'bloco'))
  const alts = doc.secoes.flatMap((s) => s.elementos.filter((e) => e.tipo === 'alternativa'))
  resumo.push(
    `${chave}: ${doc.secoes.length} seções, ${blocos.length} blocos, ${alts.length} alternativas, sha256 ${doc_hash[chave]}`,
  )
}
console.log(resumo.join('\n'))
