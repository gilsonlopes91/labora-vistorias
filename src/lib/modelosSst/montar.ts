/* Monta as seções editáveis de um documento a partir do Modelo Geral:
   resolve as alternativas [MANTER APENAS UMA] e os condicionais
   [SE HOUVER ...] (por regra automática ou pela escolha do técnico) e
   devolve HTML com os campos [NOME] ainda como texto — eles são
   substituídos só na hora de renderizar (renderizar.ts), para o documento
   refletir sempre os dados atuais. Os blocos "preenchidos pelo app" viram um
   marcador <p data-bloco="id">[[BLOCO:id]]</p>. */
import type {
  ElAlternativa,
  Elemento,
  ModeloDocumento,
  SecaoModelo,
  Segmento,
} from '@/modelos-sst/tipos'
import type { SecaoDocumento } from '@/services/documentosSst'
import type { DadosDocumento } from './dados'

/** Escolhas do técnico: alternativa -> id da opção; condicional -> 'sim' | 'nao'. */
export type Escolhas = Record<string, string>

export interface OpcaoPainel {
  id: string
  rotulo: string
}
export interface AlternativaPainel {
  id: string
  secao: string
  opcoes: OpcaoPainel[]
  escolhida: string
  automatica: boolean
}
export interface CondicaoPainel {
  id: string
  secao: string
  condicao: string
  ativa: boolean
  automatica: boolean
}

// ---------- texto ----------

const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Negrito e itálico do markdown -> <strong>/<em>. */
function inlineMd(s: string): string {
  return escapar(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s.,;:)]|$)/g, '$1<em>$2</em>')
}

export function textoDosSegmentos(
  segs: Segmento[] | undefined,
  escolhas: Escolhas,
  notas?: string[],
): string {
  if (!segs) return ''
  let html = ''
  for (const s of segs) {
    if (s.t === 'texto') html += inlineMd(s.texto)
    else if (s.t === 'nota') notas?.push(s.texto)
    else if (s.t === 'alternativa') {
      const op = s.opcoes.find((o) => o.id === escolhas[s.id]) || s.opcoes[0]
      html += inlineMd(op.texto)
    } else if (s.t === 'condicional') {
      if (escolhas[s.id] !== 'sim') continue
      html +=
        s.texto !== undefined ? inlineMd(s.texto) : textoDosSegmentos(s.segmentos, escolhas, notas)
    }
  }
  return html.replace(/\s{2,}/g, ' ').trim()
}

/** Um parágrafo todo condicional e desligado some. */
function paragrafoVazio(segs: Segmento[], escolhas: Escolhas) {
  return segs.every(
    (s) =>
      (s.t === 'condicional' && escolhas[s.id] !== 'sim') ||
      (s.t === 'texto' && !s.texto.trim()) ||
      s.t === 'nota',
  )
}

function rotuloOpcao(op: ElAlternativa['opcoes'][number]): string {
  const base = op.rotulo || op.texto || textoDosSegmentos(op.segmentos, {})
  const limpo = base.replace(/<[^>]+>/g, '').replace(/\[[A-Z0-9_]+\]/g, '…')
  return limpo.length > 90 ? `${limpo.slice(0, 88)}…` : limpo
}

// ---------- regras automáticas ----------

const temAgente = (
  d: DadosDocumento,
  teste: (a: DadosDocumento['avaliacoes'][number]) => boolean,
) => d.avaliacoes.some(teste)

/** Escolhas que o app consegue decidir pelos dados. O técnico pode trocar. */
export function escolhasAutomaticas(modelo: ModeloDocumento, d: DadosDocumento): Escolhas {
  const e: Escolhas = {}
  const gestao = d.empresa.gestao_sst
  const porte = d.empresa.porte || ''
  const metodologia = d.empresa.pgr_matriz_padrao_metodologia || 'AIHA'
  const anexo16 = (a: DadosDocumento['avaliacoes'][number]) => a.expand?.agente_id?.anexo_nr16 || ''
  const temAcidente = temAgente(
    d,
    (a) =>
      a.expand?.agente_id?.tipo === 'Acidente' || a.trilha_probabilidade === 'Acidente/mecânico',
  )
  const temExterno = temAgente(d, (a) => !!a.perigo_externo)
  const temRadiacao = temAgente(d, (a) =>
    /radia[cç][aã]o ionizante/i.test(a.expand?.agente_id?.nome || ''),
  )
  const temAnexoIV = temAgente(d, (a) => !!a.expand?.agente_id?.codigo_anexo_iv)
  const temErgoAlto = temAgente(d, (a) => a.resultado_aep_aet === 'Alto')
  const simultaneas = d.funcoes.some((f) => {
    const avals = d.avaliacoes.filter(
      (a) => a.funcao_id === f.id || (!!f.ghe_id && a.ghe_id === f.ghe_id),
    )
    const per = avals.some(
      (a) => anexo16(a) && (a.periculosidade_final ?? a.periculosidade_sugerida) === true,
    )
    const ins = avals.some((a) => {
      const c = a.insalubridade_final || a.insalubridade_sugerida
      return !!c && c !== 'Não caracteriza'
    })
    return per && ins
  })

  if (modelo.tipo === 'pgr') {
    e['3.alt1'] =
      gestao === 'SESMT'
        ? 'SESMT'
        : gestao === 'CIPA'
          ? 'CIPA'
          : gestao === 'Designado de CIPA'
            ? 'DESIGNADO'
            : 'MEI ou dispensado'
    e['16.alt1'] = porte === 'MEI' ? 'MEI' : 'PGR COMPLETO'
    e['cond_dispensada'] = 'nao'
    e['6.alt1'] = temErgoAlto ? 'op3' : 'op2'
    e['13.alt1'] = d.emitidos.ltcat ? 'op1' : temAnexoIV ? 'op3' : 'op2'
    e['13.alt2'] = d.emitidos.insalubridade ? 'op1' : d.emitidos.periculosidade ? 'op2' : 'op3'
    e['17.alt1'] = 'op1'
    e['18.alt1'] = 'op2'
    e['9.cond1'] = temAcidente ? 'sim' : 'nao'
    e['20.cond1'] = temExterno ? 'sim' : 'nao'
    e['8.cond1'] = 'sim'
    e['11.matriz'] = metodologia === 'LABORA' ? 'labora' : 'outra'
  }
  if (modelo.tipo === 'ltcat') {
    e['3.alt1'] = 'op1'
    e['cond_trabalhadores_em_atividade_externa_em_obras_em_clientes_ou_c'] = temExterno
      ? 'sim'
      : 'nao'
    e['cond_radiacao_ionizante'] = temRadiacao ? 'sim' : 'nao'
    e['cond_empresa_me_epp_ou_mei'] = ['MEI', 'ME', 'EPP'].includes(porte) ? 'sim' : 'nao'
  }
  if (modelo.tipo === 'insalubridade') {
    e['2.alt1'] = 'op1'
    e['14.alt1'] = gestao && gestao !== 'Dispensado' ? 'op1' : 'op2'
  }
  if (modelo.tipo === 'periculosidade') {
    e['1.alt1'] = d.emitidos.pgr ? 'op1' : 'op2'
    e['cond_pgr'] = d.emitidos.pgr ? 'sim' : 'nao'
    const temInflamavel = temAgente(d, (a) => ['1', '2'].includes(anexo16(a)))
    e['cond_explosivos_ou_inflamaveis'] = temInflamavel ? 'sim' : 'nao'
    e['cond_funcoes_de_seguranca_patrimonial_agentes_de_transito_ou_font'] =
      temAgente(d, (a) => ['3', '6'].includes(anexo16(a))) || temRadiacao ? 'sim' : 'nao'
    e['14.cond1'] = simultaneas ? 'sim' : 'nao'
    e['16.alt1'] =
      gestao === 'CIPA' || gestao === 'SESMT'
        ? 'op1'
        : gestao === 'Designado de CIPA'
          ? 'op2'
          : 'op3'
  }
  return e
}

/** Junta regra automática + escolhas gravadas no documento; negação "cond_nao_x" segue "cond_x". */
export function resolverEscolhas(
  modelo: ModeloDocumento,
  d: DadosDocumento,
  gravadas?: Escolhas,
): Escolhas {
  const e: Escolhas = { ...escolhasAutomaticas(modelo, d), ...(gravadas || {}) }
  for (const id of todosOsIdsCondicionais(modelo)) {
    if (id.startsWith('cond_nao_')) {
      const base = `cond_${id.slice('cond_nao_'.length)}`
      e[id] = e[base] === 'sim' ? 'nao' : 'sim'
    } else if (!(id in e)) {
      e[id] = 'nao'
    }
  }
  return e
}

function* segmentosDe(el: Elemento): Generator<Segmento> {
  if (el.tipo === 'paragrafo') yield* el.segmentos
  else if (el.tipo === 'lista') for (const it of el.itens) yield* it
  else if (el.tipo === 'tabela') for (const r of el.linhas) for (const c of r) yield* c
  else if (el.tipo === 'alternativa') {
    if (el.prefixo) yield* el.prefixo.segmentos
    for (const op of el.opcoes) if (op.segmentos) yield* op.segmentos
  }
}
function* condicionaisDe(segs: Iterable<Segmento>): Generator<{ id: string; condicao: string }> {
  for (const s of segs) {
    if (s.t === 'condicional') {
      yield { id: s.id, condicao: s.condicao }
      if (s.segmentos) yield* condicionaisDe(s.segmentos)
    }
  }
}

export function todosOsIdsCondicionais(modelo: ModeloDocumento): string[] {
  const ids = new Set<string>()
  const todas = [{ numero: 'capa', elementos: modelo.capa } as SecaoModelo, ...modelo.secoes]
  for (const s of todas)
    for (const el of s.elementos) {
      for (const c of condicionaisDe(segmentosDe(el))) ids.add(c.id)
      if (el.tipo === 'bloco' && el.condicaoId) ids.add(el.condicaoId)
    }
  return Array.from(ids)
}

// ---------- painel ----------

export function listarAlternativas(
  modelo: ModeloDocumento,
  escolhas: Escolhas,
  automaticas: Escolhas,
): AlternativaPainel[] {
  const lista: AlternativaPainel[] = []
  const todas = [
    { numero: 'capa', titulo: 'Capa', elementos: modelo.capa } as SecaoModelo,
    ...modelo.secoes,
  ]
  for (const s of todas) {
    for (const el of s.elementos) {
      if (el.tipo === 'alternativa') {
        lista.push({
          id: el.id,
          secao: `${s.numero} – ${s.titulo}`,
          opcoes: el.opcoes.map((o) => ({ id: o.id, rotulo: rotuloOpcao(o) })),
          escolhida: escolhas[el.id] || el.opcoes[0].id,
          automatica: el.id in automaticas,
        })
      }
      for (const seg of segmentosDe(el)) {
        if (seg.t === 'alternativa') {
          lista.push({
            id: seg.id,
            secao: `${s.numero} – ${s.titulo}`,
            opcoes: seg.opcoes.map((o) => ({
              id: o.id,
              rotulo: o.texto.replace(/\[[A-Z0-9_]+\]/g, '…'),
            })),
            escolhida: escolhas[seg.id] || seg.opcoes[0].id,
            automatica: seg.id in automaticas,
          })
        }
      }
    }
  }
  if (modelo.tipo === 'pgr') {
    lista.push({
      id: '11.matriz',
      secao: '11 – Critérios de avaliação',
      opcoes: [
        { id: 'labora', rotulo: 'Texto do modelo Labora (matriz Labora 5x5)' },
        { id: 'outra', rotulo: 'Tabelas da matriz escolhida no planejamento, com aviso no texto' },
      ],
      escolhida: escolhas['11.matriz'] || 'labora',
      automatica: true,
    })
  }
  return lista
}

export function listarCondicoes(
  modelo: ModeloDocumento,
  escolhas: Escolhas,
  automaticas: Escolhas,
): CondicaoPainel[] {
  const vistas = new Map<string, CondicaoPainel>()
  const todas = [
    { numero: 'capa', titulo: 'Capa', elementos: modelo.capa } as SecaoModelo,
    ...modelo.secoes,
  ]
  for (const s of todas) {
    for (const el of s.elementos) {
      const add = (id: string, condicao: string) => {
        if (vistas.has(id) || id.startsWith('cond_nao_')) return
        vistas.set(id, {
          id,
          secao: `${s.numero} – ${s.titulo}`,
          condicao:
            condicao.replace(/^SE (HOUVER|NÃO HOUVE|NÃO HOUVER)\s*:?\s*/i, '').trim() ||
            `Trecho condicional da seção ${s.numero}`,
          ativa: escolhas[id] === 'sim',
          automatica: id in automaticas,
        })
      }
      for (const c of condicionaisDe(segmentosDe(el))) add(c.id, c.condicao)
      if (el.tipo === 'bloco' && el.condicaoId) add(el.condicaoId, el.condicao || '')
    }
  }
  return Array.from(vistas.values())
}

// ---------- HTML das seções ----------

const marcadorBloco = (id: string, titulo: string) =>
  `<p data-bloco="${id}" data-titulo="${escapar(titulo)}">[[BLOCO:${id}]]</p>`

function elementoHtml(el: Elemento, escolhas: Escolhas, notas: string[]): string {
  switch (el.tipo) {
    case 'subtitulo':
      return `<h3>${escapar(el.numero ? `${el.numero} – ${el.texto}` : el.texto)}</h3>`
    case 'paragrafo': {
      if (paragrafoVazio(el.segmentos, escolhas)) {
        for (const s of el.segmentos) if (s.t === 'nota') notas.push(s.texto)
        return ''
      }
      const t = textoDosSegmentos(el.segmentos, escolhas, notas)
      return t ? `<p>${t}</p>` : ''
    }
    case 'lista': {
      const itens = el.itens
        .filter((it) => !paragrafoVazio(it, escolhas))
        .map((it) => `<li>${textoDosSegmentos(it, escolhas, notas)}</li>`)
      return itens.length ? `<ul>${itens.join('')}</ul>` : ''
    }
    case 'tabela': {
      if (el.blocoMatriz) return marcadorBloco(el.blocoMatriz, 'Matriz de risco')
      const cab = el.cabecalho.map((c) => `<th>${inlineMd(c)}</th>`).join('')
      const linhas = el.linhas
        .map(
          (r) =>
            `<tr>${r.map((c) => `<td>${textoDosSegmentos(c, escolhas, notas)}</td>`).join('')}</tr>`,
        )
        .join('')
      return `<table><thead><tr>${cab}</tr></thead><tbody>${linhas}</tbody></table>`
    }
    case 'bloco': {
      if (el.condicaoId && escolhas[el.condicaoId] !== 'sim') return ''
      return marcadorBloco(el.id, el.titulo)
    }
    case 'alternativa': {
      const op = el.opcoes.find((o) => o.id === escolhas[el.id]) || el.opcoes[0]
      const prefixo = el.prefixo ? textoDosSegmentos(el.prefixo.segmentos, escolhas, notas) : ''
      const corpo =
        op.texto !== undefined
          ? inlineMd(op.texto)
          : textoDosSegmentos(op.segmentos, escolhas, notas)
      return `<p>${[prefixo, corpo].filter(Boolean).join(' ')}</p>`
    }
    case 'titulo_documento':
      return ''
  }
}

/** Seções editáveis do documento, na ordem do modelo. */
export function montarSecoesHtml(
  modelo: ModeloDocumento,
  escolhas: Escolhas,
): { secoes: SecaoDocumento[]; notas: string[] } {
  const notas: string[] = []
  const matrizOutra = modelo.tipo === 'pgr' && escolhas['11.matriz'] === 'outra'
  const secoes = modelo.secoes.map((s, i) => {
    let html = s.elementos.map((el) => elementoHtml(el, escolhas, notas)).join('\n')
    if (modelo.tipo === 'pgr' && s.numero === '11' && matrizOutra) {
      html =
        `<p><strong>Matriz adotada nesta empresa:</strong> [NOME_MATRIZ] ([METODOLOGIA_MATRIZ]). As tabelas deste capítulo reproduzem os critérios dessa matriz e prevalecem sobre as faixas e os prazos citados no texto, que foi escrito para a matriz Labora 5x5. Revise o texto antes de emitir.</p>\n` +
        html
    }
    return {
      id: `sec-${s.numero}`,
      titulo: `${s.numero} – ${s.titulo}`,
      ativo: true,
      ordem: i,
      texto: html,
    }
  })
  return { secoes, notas }
}

/** Campos canônicos citados no modelo (texto, capa, blocos), para o painel de pendências. */
export function camposDoModelo(modelo: ModeloDocumento): string[] {
  const campos = new Set<string>()
  const re = /\[([A-Z][A-Z0-9_]+)\]/g
  const varrer = (texto: string) => {
    for (const m of texto.matchAll(re)) campos.add(m[1])
  }
  const varrerSegs = (segs: Segmento[] | undefined) => {
    for (const s of segs || []) {
      if (s.t === 'texto') varrer(s.texto)
      else if (s.t === 'alternativa') s.opcoes.forEach((o) => varrer(o.texto))
      else if (s.t === 'condicional') {
        if (s.texto) varrer(s.texto)
        varrerSegs(s.segmentos)
      }
    }
  }
  const todas = [
    { numero: 'capa', titulo: '', elementos: modelo.capa } as SecaoModelo,
    ...modelo.secoes,
  ]
  for (const s of todas)
    for (const el of s.elementos) {
      for (const seg of segmentosDe(el)) varrerSegs([seg])
      if (el.tipo === 'bloco') el.modeloLinha.forEach(varrer)
      if (el.tipo === 'alternativa') el.opcoes.forEach((o) => o.texto && varrer(o.texto))
    }
  return Array.from(campos)
}
