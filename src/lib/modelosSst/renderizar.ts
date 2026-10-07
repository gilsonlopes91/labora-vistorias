/* Transforma as seções editadas (HTML com campos [NOME] e marcadores de
   bloco) no documento final: substitui cada campo pelo dado do app, gera as
   tabelas dos blocos e anota as pendências (campo sem dado, bloco manual
   vazio). O resultado é uma árvore simples, usada tanto pela
   pré-visualização quanto pelo PDF (pdfModeloSst.ts). */
import type { ModeloDocumento } from '@/modelos-sst/tipos'
import type { MatrizRisco } from '@/services/matrizesRisco'
import type { SecaoDocumento } from '@/services/documentosSst'
import type { DadosDocumento } from './dados'
import { CAMPOS_CRITICOS, DICIONARIO, resolverCamposDocumento, type Valores } from './campos'
import { gerarBloco } from './blocos'
import { textoDosSegmentos, type Escolhas } from './montar'

export interface Run {
  texto: string
  negrito?: boolean
  italico?: boolean
}
export type ElRender =
  | { tipo: 'titulo'; nivel: 1 | 2 | 3; texto: string }
  | { tipo: 'paragrafo'; runs: Run[] }
  | { tipo: 'lista'; itens: Run[][] }
  | {
      tipo: 'tabela'
      titulo?: string
      cabecalho: string[]
      linhas: string[][]
      /** Bloco sem dado nenhum: sai a frase "Não há registros". */
      vazia?: boolean
      manual?: boolean
      observacao?: string
    }

export interface SecaoRender {
  id: string
  titulo: string
  elementos: ElRender[]
}

export interface Pendencia {
  campo: string
  descricao: string
  origem: string
  /** Onde apareceu (seção ou bloco). */
  local: string
  /** Quantas vezes faltou (linhas de bloco). */
  vezes: number
  critico: boolean
}

export interface DocumentoRenderizado {
  modelo: ModeloDocumento
  campos: Valores
  capa: ElRender[]
  secoes: SecaoRender[]
  pendencias: Pendencia[]
  notas: string[]
  camposCriticosVazios: string[]
}

const RE_CAMPO = /\[([A-Z][A-Z0-9_]+)\]/g

class Coletor {
  pendencias = new Map<string, Pendencia>()
  registrar(campo: string, local: string) {
    const chave = `${campo}|${local}`
    const atual = this.pendencias.get(chave)
    if (atual) {
      atual.vezes++
      return
    }
    const dic = DICIONARIO[campo]
    this.pendencias.set(chave, {
      campo,
      descricao: dic?.descricao || campo,
      origem: dic?.origem || 'desconhecida',
      local,
      vezes: 1,
      critico: CAMPOS_CRITICOS.includes(campo),
    })
  }
  lista() {
    return Array.from(this.pendencias.values()).sort((a, b) =>
      a.critico === b.critico ? a.local.localeCompare(b.local) : a.critico ? -1 : 1,
    )
  }
}

/** Substitui os campos de um texto; campo sem valor vira `vazio` e é anotado. */
function substituir(
  texto: string,
  valores: Valores,
  local: string,
  col: Coletor,
  vazio = '',
): string {
  return texto.replace(RE_CAMPO, (_m, campo: string) => {
    const v = valores[campo]
    if (v === undefined || v === '') {
      col.registrar(campo, local)
      return vazio
    }
    return v
  })
}

// ---------- matriz de risco (capítulo 11 do PGR) ----------

function tabelaMatriz(id: string, matriz: MatrizRisco | null): ElRender {
  if (!matriz) {
    return {
      tipo: 'tabela',
      cabecalho: ['Matriz de risco'],
      linhas: [],
      vazia: true,
      titulo: 'Matriz de risco não encontrada',
    }
  }
  if (id === 'matriz_severidade') {
    return {
      tipo: 'tabela',
      cabecalho: ['Nível', 'Denominação', 'Descrição do dano'],
      linhas: matriz.criterios_severidade.map((c) => [String(c.nivel), c.nome, c.descricao]),
    }
  }
  if (id === 'matriz_probabilidade') {
    return {
      tipo: 'tabela',
      cabecalho: [
        'Nível',
        'Denominação',
        'Agentes físicos, químicos e biológicos',
        'Acidentes, ergonômicos e psicossociais',
      ],
      linhas: matriz.criterios_probabilidade.map((c) => [
        String(c.nivel),
        c.nome,
        c.quantitativo,
        c.qualitativo,
      ]),
    }
  }
  if (id === 'matriz_celulas') {
    const n = Number(matriz.dimensao)
    const sev = matriz.criterios_severidade
    const prob = [...matriz.criterios_probabilidade].sort((a, b) => b.nivel - a.nivel)
    return {
      tipo: 'tabela',
      cabecalho: ['P \\ S', ...sev.map((s) => `${s.nivel} ${s.nome}`)],
      linhas: prob
        .map((p) => [
          `${p.nivel} ${p.nome}`,
          ...sev.map((s) => {
            const c = matriz.celulas.find((x) => x.p === p.nivel && x.s === s.nivel)
            return c ? `${c.categoria} (${c.pontuacao ?? p.nivel * s.nivel})` : '—'
          }),
        ])
        .slice(0, n),
    }
  }
  return {
    tipo: 'tabela',
    cabecalho: ['Nível', 'Decisão', 'Prazo para ação'],
    linhas: [...matriz.categorias]
      .reverse()
      .map((c) => [
        c.categoria,
        c.acao,
        c.prazo_dias == null
          ? 'Sem ação adicional'
          : c.prazo_dias === 0
            ? 'Imediato'
            : `Até ${c.prazo_dias} dias`,
      ]),
  }
}

// ---------- blocos ----------

function renderBloco(
  id: string,
  titulo: string,
  modelo: ModeloDocumento,
  dados: DadosDocumento,
  valores: Valores,
  col: Coletor,
  config: { incluir?: boolean; observacao?: string } | undefined,
): ElRender | null {
  if (id.startsWith('matriz_')) return tabelaMatriz(id, dados.matriz)
  const def = modelo.secoes
    .flatMap((s) => s.elementos)
    .find((e) => e.tipo === 'bloco' && e.id === id)
  if (!def || def.tipo !== 'bloco') {
    col.registrar(`BLOCO_${id}`, titulo)
    return {
      tipo: 'tabela',
      titulo,
      cabecalho: ['Bloco não encontrado no modelo'],
      linhas: [],
      vazia: true,
    }
  }
  if (config?.incluir === false) return null
  const resultado = gerarBloco(modelo.tipo, id, dados)
  if (!resultado) {
    col.registrar(`BLOCO_${id}`, titulo)
    return {
      tipo: 'tabela',
      titulo,
      cabecalho: def.cabecalho,
      linhas: [],
      vazia: true,
      observacao: config?.observacao,
    }
  }
  const linhas = resultado.linhas.map((ctx) =>
    def.modeloLinha.map((celula) =>
      substituir(celula, { ...valores, ...ctx }, `${titulo}`, col, '—'),
    ),
  )
  return {
    tipo: 'tabela',
    titulo: def.titulo,
    cabecalho: def.cabecalho,
    linhas,
    vazia: linhas.length === 0,
    manual: resultado.manual,
    observacao: config?.observacao,
  }
}

// ---------- HTML -> árvore ----------

function runsDe(
  no: Node,
  herdado: { negrito?: boolean; italico?: boolean },
  valores: Valores,
  local: string,
  col: Coletor,
): Run[] {
  const runs: Run[] = []
  no.childNodes.forEach((filho) => {
    if (filho.nodeType === 3) {
      const texto = substituir(filho.textContent || '', valores, local, col)
      if (texto) runs.push({ texto, ...herdado })
      return
    }
    if (filho.nodeType !== 1) return
    const el = filho as Element
    const tag = el.tagName.toLowerCase()
    if (tag === 'br') {
      runs.push({ texto: '\n', ...herdado })
      return
    }
    const estilo = {
      negrito: herdado.negrito || tag === 'strong' || tag === 'b',
      italico: herdado.italico || tag === 'em' || tag === 'i',
    }
    runs.push(...runsDe(el, estilo, valores, local, col))
  })
  return runs
}

const textoDe = (runs: Run[]) => runs.map((r) => r.texto).join('')

function elementosDeHtml(
  html: string,
  local: string,
  modelo: ModeloDocumento,
  dados: DadosDocumento,
  valores: Valores,
  col: Coletor,
  blocosConfig: Record<string, { incluir?: boolean; observacao?: string }>,
): ElRender[] {
  if (typeof DOMParser === 'undefined') return []
  const doc = new DOMParser().parseFromString(`<div id="raiz">${html}</div>`, 'text/html')
  const raiz = doc.getElementById('raiz')
  if (!raiz) return []
  const saida: ElRender[] = []
  const visitar = (no: Element) => {
    no.childNodes.forEach((filho) => {
      if (filho.nodeType === 3) {
        const t = (filho.textContent || '').trim()
        if (t)
          saida.push({ tipo: 'paragrafo', runs: [{ texto: substituir(t, valores, local, col) }] })
        return
      }
      if (filho.nodeType !== 1) return
      const el = filho as Element
      const tag = el.tagName.toLowerCase()
      const bloco = el.getAttribute('data-bloco')
      if (bloco) {
        const r = renderBloco(
          bloco,
          el.getAttribute('data-titulo') || bloco,
          modelo,
          dados,
          valores,
          col,
          blocosConfig[bloco],
        )
        if (r) saida.push(r)
        return
      }
      if (/^\[\[BLOCO:([^\]]+)\]\]$/.test((el.textContent || '').trim())) {
        const id = (el.textContent || '').trim().replace(/^\[\[BLOCO:|\]\]$/g, '')
        const r = renderBloco(id, id, modelo, dados, valores, col, blocosConfig[id])
        if (r) saida.push(r)
        return
      }
      if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
        saida.push({
          tipo: 'titulo',
          nivel: tag === 'h1' ? 1 : tag === 'h2' ? 2 : 3,
          texto: textoDe(runsDe(el, {}, valores, local, col)),
        })
        return
      }
      if (tag === 'p' || tag === 'blockquote' || tag === 'pre') {
        const runs = runsDe(el, {}, valores, local, col)
        if (textoDe(runs).trim()) saida.push({ tipo: 'paragrafo', runs })
        return
      }
      if (tag === 'ul' || tag === 'ol') {
        const itens: Run[][] = []
        el.querySelectorAll(':scope > li').forEach((li) =>
          itens.push(runsDe(li, {}, valores, local, col)),
        )
        if (itens.length) saida.push({ tipo: 'lista', itens })
        return
      }
      if (tag === 'table') {
        const linhasEl = Array.from(el.querySelectorAll('tr'))
        if (linhasEl.length === 0) return
        const temTh = !!linhasEl[0].querySelector('th')
        const celulas = (tr: Element) =>
          Array.from(tr.querySelectorAll('th,td')).map((c) =>
            textoDe(runsDe(c, {}, valores, local, col)),
          )
        const cabecalho = temTh ? celulas(linhasEl[0]) : []
        const corpo = (temTh ? linhasEl.slice(1) : linhasEl).map(celulas)
        saida.push({ tipo: 'tabela', cabecalho, linhas: corpo })
        return
      }
      // div, span, figure etc.: desce
      visitar(el)
    })
  }
  visitar(raiz)
  return saida
}

// ---------- capa ----------

function renderCapa(
  modelo: ModeloDocumento,
  valores: Valores,
  col: Coletor,
  escolhas: Escolhas,
): ElRender[] {
  const saida: ElRender[] = []
  for (const el of modelo.capa) {
    if (el.tipo === 'paragrafo') {
      const t = textoDosSegmentos(el.segmentos, escolhas).replace(/<[^>]+>/g, '')
      const texto = substituir(t, valores, 'Capa', col)
      if (texto.trim()) saida.push({ tipo: 'paragrafo', runs: [{ texto }] })
    } else if (el.tipo === 'tabela') {
      saida.push({
        tipo: 'tabela',
        titulo: 'Identificação',
        cabecalho: el.cabecalho,
        linhas: el.linhas.map((r) =>
          r.map((c) =>
            substituir(
              textoDosSegmentos(c, escolhas).replace(/<[^>]+>/g, ''),
              valores,
              'Capa',
              col,
            ),
          ),
        ),
      })
    } else if (el.tipo === 'titulo_documento') {
      saida.push({ tipo: 'titulo', nivel: 1, texto: el.texto })
    }
  }
  return saida
}

// ---------- principal ----------

export function renderizarDocumento(
  modelo: ModeloDocumento,
  secoes: SecaoDocumento[],
  dados: DadosDocumento,
  escolhas: Escolhas,
): DocumentoRenderizado {
  const col = new Coletor()
  const valores = resolverCamposDocumento(dados)
  valores.NOME_MATRIZ = dados.matriz?.nome
  valores.METODOLOGIA_MATRIZ = dados.matriz?.metodologia
  const blocosConfig = dados.documento.blocos_config || {}
  const capa = renderCapa(modelo, valores, col, escolhas)
  const secoesRender: SecaoRender[] = secoes
    .filter((s) => s.ativo)
    .sort((a, b) => a.ordem - b.ordem)
    .map((s) => ({
      id: s.id,
      titulo: substituir(s.titulo, valores, s.titulo, col),
      elementos: elementosDeHtml(s.texto, s.titulo, modelo, dados, valores, col, blocosConfig),
    }))
  const pendencias = col.lista()
  const camposCriticosVazios = CAMPOS_CRITICOS.filter((c) => !valores[c])
  return {
    modelo,
    campos: valores,
    capa,
    secoes: secoesRender,
    pendencias,
    notas: [],
    camposCriticosVazios,
  }
}
