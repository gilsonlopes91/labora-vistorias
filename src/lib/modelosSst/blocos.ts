/* Blocos "preenchidos pelo app": para cada bloco dos Modelos Gerais, a função
   que devolve as linhas a partir dos dados carregados (dados.ts). Cada linha
   é um conjunto de valores por campo canônico; a célula do modelo
   ("[FUNCAO_NOME] ([FUNCAO_CBO])") é preenchida por substituição, igual ao
   texto corrido. Bloco "manual" não tem origem no app nesta fase: sai em
   branco e o técnico preenche no editor.

   Regra geral: campo sem dado fica undefined (vira pendência ou traço),
   nunca é inventado. */
import { resolverCelula } from '@/lib/matrizRisco'
import { avaliacoesDaFuncao } from '@/lib/riscoFuncao'
import type { AvaliacaoRisco } from '@/services/avaliacoesRisco'
import type { AgenteCatalogo } from '@/services/agentesCatalogo'
import type { FuncaoSst } from '@/services/funcoesSst'
import type { Ghe } from '@/services/ghes'
import type { Setor } from '@/services/setores'
import type { Medicao } from '@/services/medicoes'
import type { AcaoPlano } from '@/services/acoesPlano'
import type { DadosDocumento } from './dados'
import { fData, fNum, fMoeda, simNao, vazio, type Valores } from './campos'

export interface ResultadoBloco {
  linhas: Valores[]
  /** Sem origem no app nesta fase: o técnico preenche no editor. */
  manual?: boolean
}

type Gerador = (d: DadosDocumento) => ResultadoBloco

// ---------- apoio ----------

const agenteDe = (a: AvaliacaoRisco): AgenteCatalogo | undefined => a.expand?.agente_id
const nomeAgente = (a: AvaliacaoRisco) => agenteDe(a)?.nome || vazio(a.perigo_descricao) || '—'

const rotuloGhe = (g?: Ghe | null) =>
  g ? [vazio(g.codigo), g.nome].filter(Boolean).join(' – ') : undefined

function indices(d: DadosDocumento) {
  const ghePorId = new Map(d.ghes.map((g) => [g.id, g]))
  const setorPorId = new Map(d.setores.map((s) => [s.id, s]))
  const funcaoPorId = new Map(d.funcoes.map((f) => [f.id, f]))
  const setorDaFuncao = (f: FuncaoSst): Setor | undefined =>
    (f.setor_id && setorPorId.get(f.setor_id)) ||
    (f.ghe_id && ghePorId.get(f.ghe_id)?.setor_id
      ? setorPorId.get(ghePorId.get(f.ghe_id)!.setor_id!)
      : undefined)
  const grupoDaAvaliacao = (a: AvaliacaoRisco) =>
    a.ghe_id
      ? rotuloGhe(ghePorId.get(a.ghe_id)) || 'GHE removido'
      : (a.funcao_id && funcaoPorId.get(a.funcao_id)?.nome) || '—'
  const setorDaAvaliacao = (a: AvaliacaoRisco): Setor | undefined => {
    if (a.funcao_id) {
      const f = funcaoPorId.get(a.funcao_id)
      if (f) return setorDaFuncao(f)
    }
    if (a.ghe_id) {
      const g = ghePorId.get(a.ghe_id)
      if (g?.setor_id) return setorPorId.get(g.setor_id)
    }
    return undefined
  }
  const funcoesDoGhe = (g: Ghe) => d.funcoes.filter((f) => f.ghe_id === g.id)
  const funcoesDoSetor = (s: Setor) => d.funcoes.filter((f) => setorDaFuncao(f)?.id === s.id)
  return {
    ghePorId,
    setorPorId,
    funcaoPorId,
    setorDaFuncao,
    grupoDaAvaliacao,
    setorDaAvaliacao,
    funcoesDoGhe,
    funcoesDoSetor,
  }
}

const juntar = (partes: (string | undefined | null | false)[], sep = '; ') =>
  vazio(partes.filter(Boolean).join(sep))

const distintos = (lista: (string | undefined)[]) =>
  Array.from(new Set(lista.filter((x): x is string => !!x && !!x.trim())))

/** "Habitual e permanente" -> ["Habitual", "Permanente"]; "Eventual/ocasional" -> ["Fortuita", "Eventual"]. */
function habitualidade(freq?: string): { hab?: string; perm?: string } {
  if (!freq) return {}
  const f = freq.toLowerCase()
  if (f.startsWith('habitual e permanente')) return { hab: 'Habitual', perm: 'Permanente' }
  if (f.startsWith('habitual e intermitente')) return { hab: 'Habitual', perm: 'Intermitente' }
  if (f.startsWith('eventual')) return { hab: 'Fortuita', perm: 'Eventual' }
  if (f.startsWith('não se aplica')) return { hab: 'Não se aplica', perm: 'Não se aplica' }
  return { hab: freq, perm: freq }
}

const tempoExposicao = (a: AvaliacaoRisco) =>
  a.tempo_exposicao_min_jornada != null ? `${a.tempo_exposicao_min_jornada} min/jornada` : undefined

function medidasImplementadas(a: AvaliacaoRisco) {
  return juntar([
    vazio(a.controle_nivel) && `Controle: ${a.controle_nivel}`,
    vazio(a.controle_descricao),
    vazio(a.epc_lista) && `EPC: ${a.epc_lista}`,
    vazio(a.medidas_administrativas) && `Administrativas: ${a.medidas_administrativas}`,
    vazio(a.epis_utilizados) && `EPI: ${(a.epis_utilizados || '').replace(/\n+/g, ', ')}`,
  ])
}

function pontuacao(d: DadosDocumento, a: AvaliacaoRisco) {
  const p = a.probabilidade_final ?? a.probabilidade_sugerida
  const s = a.severidade_final ?? a.severidade_sugerida
  if (p == null || s == null || !d.matriz) return { p, s }
  const celula = resolverCelula(d.matriz, p, s)
  const dadosCelula = d.matriz.celulas.find((c) => c.p === p && c.s === s)
  const categoria = d.matriz.categorias.find((c) => c.categoria === celula?.categoria)
  return {
    p,
    s,
    categoria: celula?.categoria,
    pontos: dadosCelula?.pontuacao ?? p * s,
    prazo: categoria?.prazo_dias ?? null,
    acao: categoria?.acao,
  }
}

const limiteDoAgente = (ag?: AgenteCatalogo) =>
  ag?.limite_tolerancia_valor != null
    ? `${fNum(ag.limite_tolerancia_valor, 3)} ${ag.limite_tolerancia_unidade || ''}`.trim()
    : ag?.tlv_acgih_valor != null
      ? `${fNum(ag.tlv_acgih_valor, 3)} ${ag.tlv_acgih_unidade || ''} (ACGIH)`.trim()
      : undefined

function limiteENivelAcao(ag?: AgenteCatalogo) {
  const lt = limiteDoAgente(ag)
  if (!lt) return undefined
  if (ag?.limite_tolerancia_valor != null && ehRuido(ag)) return `${lt}; nível de ação 82 dB(A)`
  if (ag?.limite_tolerancia_valor != null && ag.tipo === 'Químico')
    return `${lt}; nível de ação ${fNum(ag.limite_tolerancia_valor / 2, 3)} ${ag.limite_tolerancia_unidade || ''}`.trim()
  return lt
}

const ehRuido = (ag?: AgenteCatalogo) =>
  !!ag && (/ru[ií]do/i.test(ag.nome) || ag.anexo_nr15 === '1' || ag.anexo_nr15 === '2')
const ehCalor = (ag?: AgenteCatalogo) => !!ag && (/calor/i.test(ag.nome) || ag.anexo_nr15 === '3')
const ehVibracao = (ag?: AgenteCatalogo) =>
  !!ag && (/vibra/i.test(ag.nome) || ag.anexo_nr15 === '8')
const ehQuimico = (ag?: AgenteCatalogo) =>
  !!ag && (ag.tipo === 'Químico' || ['11', '12', '13', '13-A'].includes(ag.anexo_nr15 || ''))

function percentualLeo(valor?: number | null, ag?: AgenteCatalogo) {
  if (valor == null || ag?.limite_tolerancia_valor == null || ag.limite_tolerancia_valor === 0)
    return undefined
  return (valor / ag.limite_tolerancia_valor) * 100
}

function julgamento(pct?: number, dose?: number | null): string | undefined {
  const ref = dose ?? pct
  if (ref == null) return undefined
  if (ref > 100) return 'Acima do limite de tolerância'
  if (ref >= 50) return 'Acima do nível de ação'
  return 'Aceitável'
}

const ultimaMedicao = (d: DadosDocumento, a: AvaliacaoRisco): Medicao | undefined =>
  (d.medicoes[a.id] || [])[0]

function resumoMedicao(d: DadosDocumento, a: AvaliacaoRisco) {
  const ms = d.medicoes[a.id] || []
  const ag = agenteDe(a)
  if (ms.length === 0) {
    return a.trilha_probabilidade === 'Quantitativa (medição)'
      ? `Quantitativa (categoria AIHA ${a.categoria_aiha_exposicao ?? '—'}), sem medição lançada`
      : `Qualitativa: ${a.trilha_probabilidade}${a.controle_nivel ? `; controle ${a.controle_nivel.toLowerCase()}` : ''}`
  }
  const m = ms[0]
  const valor =
    m.resultado_valor != null
      ? `${fNum(m.resultado_valor, 3)} ${m.resultado_unidade || ''}`.trim()
      : '—'
  const lt = limiteDoAgente(ag)
  return `Quantitativa: ${valor}${lt ? ` x LT ${lt}` : ''} (${ms.length} medição${ms.length > 1 ? 'ões' : ''}, ${m.metodologia || 'método não informado'})`
}

const hierarquia = (n?: string) =>
  n === 'Eliminação' || n === 'Substituição'
    ? 'eliminação'
    : n === 'Engenharia'
      ? 'coletiva'
      : n === 'Administrativa'
        ? 'administrativa'
        : n === 'EPI'
          ? 'individual'
          : undefined

/** Linhas de EPI de uma avaliação: "nome (CA 1234)" por linha do campo epis_utilizados. */
function episDaAvaliacao(d: DadosDocumento, a: AvaliacaoRisco) {
  const linhas = (a.epis_utilizados || '')
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
  return linhas.map((l) => {
    const m = l.match(/\(CA\s*([\d.]+)\)/i)
    const ca = m ? m[1].replace(/\D/g, '') : undefined
    const cat = ca ? d.epis.find((e) => e.numero_ca.replace(/\D/g, '') === ca) : undefined
    return {
      descricao: l.replace(/\s*\(CA[^)]*\)/i, '').trim() || l,
      ca,
      validade: fData(cat?.validade_ca),
    }
  })
}

const flagsEpi = (a: AvaliacaoRisco) => ({
  EPI_EF: a.epi_eficacia_atenuacao_ok ? 'S' : 'N',
  EPI_MP: a.epi_medida_previa_ok ? 'S' : 'N',
  EPI_PV: a.epi_validade_ca_ok ? 'S' : 'N',
  EPI_CF: a.epi_condicao_funcionamento ? 'S' : 'N',
  EPI_UI: a.epi_uso_ininterrupto ? 'S' : 'N',
  EPI_PT: a.epi_periodicidade_troca_ok ? 'S' : 'N',
  EPI_HG: a.epi_higienizacao_ok ? 'S' : 'N',
})
const epiNeutraliza = (a: AvaliacaoRisco) => {
  const f = flagsEpi(a)
  const faltam = Object.entries(f)
    .filter(([, v]) => v === 'N')
    .map(([k]) => k.replace('EPI_', ''))
  return faltam.length === 0 ? 'Sim' : `Não (${faltam.join(', ')})`
}

// ---------- geradores por entidade ----------

function linhasAmbientes(d: DadosDocumento): Valores[] {
  const ix = indices(d)
  return d.setores.map((s) => {
    const funcs = ix.funcoesDoSetor(s)
    const avals = d.avaliacoes.filter((a) => ix.setorDaAvaliacao(a)?.id === s.id)
    const nr16 = distintos(avals.filter((a) => agenteDe(a)?.anexo_nr16).map(nomeAgente))
    return {
      AMBIENTE_NOME: s.nome,
      AMBIENTE_SETOR: s.nome,
      AMBIENTE_PROCESSO: vazio(s.descricao_processo),
      AMBIENTE_CARACTERISTICAS: juntar([
        vazio(s.local),
        s.area_m2 != null && `${fNum(s.area_m2)} m²`,
        s.pe_direito_m != null && `pé-direito ${fNum(s.pe_direito_m)} m`,
        vazio(s.cobertura) && `cobertura: ${s.cobertura}`,
        vazio(s.piso) && `piso: ${s.piso}`,
        vazio(s.paredes) && `paredes: ${s.paredes}`,
        vazio(s.iluminacao) && `iluminação: ${s.iluminacao}`,
        vazio(s.ventilacao) && `ventilação: ${s.ventilacao}`,
      ]),
      AMBIENTE_EQUIPAMENTOS: vazio(s.maquinas_equipamentos),
      AMBIENTE_NUM_TRAB: String(funcs.reduce((t, f) => t + (f.numero_empregados || 0), 0)),
      AMBIENTE_FONTES: juntar(distintos(avals.map(nomeAgente)), ', '),
      AMBIENTE_FONTE_PERIGO_NR16: nr16.length ? nr16.join(', ') : 'Nenhuma',
      AMBIENTE_AREA_RISCO: undefined,
    }
  })
}

function linhasGhes(d: DadosDocumento): Valores[] {
  const ix = indices(d)
  return d.ghes.map((g) => {
    const funcs = ix.funcoesDoGhe(g)
    const setor = g.setor_id ? ix.setorPorId.get(g.setor_id) : undefined
    return {
      GHE_NOME: rotuloGhe(g),
      GHE_CODIGO: vazio(g.codigo),
      GHE_SETOR_AMBIENTES: setor?.nome,
      AMBIENTE_NOME: setor?.nome,
      GHE_FUNCOES: juntar(
        funcs.map((f) => f.nome),
        ', ',
      ),
      FUNCAO_NOME: juntar(
        funcs.map((f) => f.nome),
        ', ',
      ),
      GHE_NUM_EXPOSTOS:
        g.numero_expostos != null
          ? String(g.numero_expostos)
          : String(funcs.reduce((t, f) => t + (f.numero_empregados || 0), 0)),
      GHE_CRITERIO: vazio(g.criterio_agrupamento),
    }
  })
}

function linhasFuncoes(d: DadosDocumento): Valores[] {
  const ix = indices(d)
  return d.funcoes.map((f) => {
    const g = f.ghe_id ? ix.ghePorId.get(f.ghe_id) : undefined
    const setor = ix.setorDaFuncao(f)
    const avals = avaliacoesDaFuncao(f, d.avaliacoes)
    return {
      FUNCAO_NOME: f.nome,
      FUNCAO_CBO: vazio(f.cbo),
      GHE_NOME: g ? rotuloGhe(g) : 'Sem GHE (risco direto do cargo)',
      FUNCAO_GHE: g ? rotuloGhe(g) : undefined,
      FUNCAO_AMBIENTE: setor?.nome,
      AMBIENTE_NOME: setor?.nome,
      FUNCAO_ATIVIDADES: vazio(f.descricao_atividades),
      FUNCAO_JORNADA: vazio(g?.jornada_trabalho) || vazio(d.empresa.jornada_trabalho),
      FUNCAO_NUM_EXPOSTOS: f.numero_empregados != null ? String(f.numero_empregados) : undefined,
      FUNCAO_AMBIENTES_TEMPO: undefined,
      FUNCAO_FONTES_AGENTES: juntar(
        distintos(avals.map((a) => vazio(a.fonte_geradora) || nomeAgente(a))),
        ', ',
      ),
      FUNCAO_VIA_EXPOSICAO: juntar(distintos(avals.map((a) => vazio(a.via_absorcao))), ', '),
      FUNCAO_PERIODICIDADE_EXPOSICAO: juntar(
        distintos(avals.map((a) => vazio(a.frequencia_exposicao))),
        ', ',
      ),
    }
  })
}

function linhaInventario(d: DadosDocumento, a: AvaliacaoRisco): Valores {
  const ix = indices(d)
  const ag = agenteDe(a)
  const hp = habitualidade(a.frequencia_exposicao)
  const pt = pontuacao(d, a)
  return {
    INV_GRUPO: ix.grupoDaAvaliacao(a),
    AV_GRUPO: ix.grupoDaAvaliacao(a),
    INV_CATEGORIA:
      ag?.tipo ||
      (a.trilha_probabilidade === 'Acidente/mecânico'
        ? 'Acidente'
        : a.trilha_probabilidade === 'Ergonômica (AEP/AET)'
          ? 'Ergonômico'
          : undefined),
    INV_PERIGO: nomeAgente(a),
    AV_PERIGO: nomeAgente(a),
    AGENTE_NOME: nomeAgente(a),
    AGENTE_ANEXO_NR15: ag?.anexo_nr15,
    AGENTE_ANEXO_NR16: ag?.anexo_nr16,
    AGENTE_ITEM_NR16: vazio(ag?.item_nr16),
    AGENTE_CODIGO_ANEXO_IV: vazio(ag?.codigo_anexo_iv),
    AGENTE_CAS: vazio(ag?.cas),
    AGENTE_CODIGO_ESOCIAL: vazio(ag?.codigo_esocial),
    INV_FONTE: juntar([
      vazio(a.fonte_geradora),
      vazio(a.meio_propagacao) && `meio: ${a.meio_propagacao}`,
    ]),
    INV_LESOES: vazio(a.danos_possiveis) || vazio(ag?.danos_saude_tipicos),
    INV_MEDIDAS: medidasImplementadas(a),
    EXPOSICAO_HABITUALIDADE: hp.hab,
    EXPOSICAO_PERMANENCIA: hp.perm,
    EXPOSICAO_TEMPO: tempoExposicao(a),
    EXPOSICAO_FREQUENCIA_DURACAO: juntar([vazio(a.frequencia_exposicao), tempoExposicao(a)]),
    AV_EXPOSICAO: juntar([
      vazio(a.frequencia_exposicao),
      tempoExposicao(a),
      a.numero_expostos != null && `${a.numero_expostos} expostos`,
    ]),
    AV_DADOS: resumoMedicao(d, a),
    AV_P: pt.p != null ? String(pt.p) : undefined,
    AV_S: pt.s != null ? String(pt.s) : undefined,
    AV_NIVEL: pt.categoria ? `${pt.pontos} – ${pt.categoria}` : undefined,
    AV_CLASSIFICACAO: pt.categoria
      ? `${pt.categoria}${pt.prazo != null ? ` (ação em até ${pt.prazo} dias)` : ''}`
      : undefined,
  }
}

function linhasMedicoes(d: DadosDocumento, filtro?: (ag?: AgenteCatalogo) => boolean): Valores[] {
  const ix = indices(d)
  const linhas: Valores[] = []
  for (const a of d.avaliacoes) {
    const ag = agenteDe(a)
    if (filtro && !filtro(ag)) continue
    for (const m of d.medicoes[a.id] || []) {
      const pct = percentualLeo(m.resultado_valor, ag)
      const dose = m.ruido_dose_nr15_pct
      linhas.push({
        MED_AGENTE: juntar([nomeAgente(a), vazio(ag?.cas) && `CAS ${ag!.cas}`], ' – '),
        AGENTE_NOME: nomeAgente(a),
        AGENTE_CAS: vazio(ag?.cas),
        AGENTE_ANEXO_NR15: ag?.anexo_nr15,
        AGENTE_CODIGO_ANEXO_IV: vazio(ag?.codigo_anexo_iv),
        MED_LOCAL: juntar(
          [ix.grupoDaAvaliacao(a), vazio(m.funcao_avaliada), vazio(m.trabalhador_ou_ponto)],
          ' / ',
        ),
        GHE_NOME: ix.grupoDaAvaliacao(a),
        FUNCAO_NOME: vazio(m.funcao_avaliada) || ix.grupoDaAvaliacao(a),
        MED_METODO: vazio(m.metodologia),
        MED_INSTRUMENTO: juntar(
          [
            vazio(m.equipamento),
            vazio(m.numero_serie) && `nº ${m.numero_serie}`,
            vazio(m.certificado_calibracao) && `cert. ${m.certificado_calibracao}`,
            fData(m.calibracao_validade) && `val. ${fData(m.calibracao_validade)}`,
          ],
          ', ',
        ),
        RUIDO_INSTRUMENTO_CONFIG: juntar(
          [vazio(m.equipamento), vazio(m.numero_serie) && `nº ${m.numero_serie}`],
          ', ',
        ),
        MED_DATA: fData(m.data),
        CALOR_DATA_HORARIO: fData(m.data),
        MED_TEMPO: m.tempo_amostragem_min != null ? `${m.tempo_amostragem_min} min` : undefined,
        MED_RESULTADO:
          m.resultado_valor != null
            ? `${fNum(m.resultado_valor, 3)} ${m.resultado_unidade || ''}`.trim()
            : undefined,
        MED_UNIDADE: vazio(m.resultado_unidade),
        QUIM_CONCENTRACAO: fNum(m.resultado_valor, 4),
        RUIDO_NE: fNum(m.resultado_valor),
        RUIDO_NEN: fNum(m.ruido_nen_nho01_dba ?? m.ruido_nen_nr15_dba),
        RUIDO_DOSE: fNum(m.ruido_dose_nr15_pct),
        CALOR_IBUTG_MEDIO: ehCalor(ag) ? fNum(m.resultado_valor, 2) : undefined,
        VIB_AREN: ehVibracao(ag) ? fNum(m.resultado_valor, 3) : undefined,
        VIB_EQUIPAMENTO: vazio(m.trabalhador_ou_ponto),
        VIB_TIPO: ehVibracao(ag)
          ? /corpo inteiro|NHO 09/i.test(`${ag?.nome} ${m.metodologia}`)
            ? 'Corpo inteiro'
            : 'Mãos e braços'
          : undefined,
        EXPOSICAO_TEMPO:
          tempoExposicao(a) || (m.jornada_min != null ? `${m.jornada_min} min` : undefined),
        MED_LIMITE: limiteENivelAcao(ag),
        CALOR_LIMITE: ehCalor(ag) ? limiteDoAgente(ag) : undefined,
        QUIM_FATOR_DESVIO: ag?.fator_desvio != null ? fNum(ag.fator_desvio, 2) : undefined,
        QUIM_GRAU: vazio(ag?.grau_insalubridade_nr15),
        MED_NUM_AMOSTRAS: String((d.medicoes[a.id] || []).length),
        MED_PERCENTUAL: pct != null ? `${fNum(pct, 0)}%` : undefined,
        MED_JULGAMENTO: julgamento(pct, dose),
      })
    }
  }
  return linhas
}

function linhasInstrumentos(d: DadosDocumento): Valores[] {
  const vistos = new Map<string, Valores>()
  for (const a of d.avaliacoes) {
    for (const m of d.medicoes[a.id] || []) {
      if (!vazio(m.equipamento)) continue
      const chave = `${m.equipamento}|${m.numero_serie || ''}`
      const atual = vistos.get(chave)
      const agente = nomeAgente(a)
      if (atual) {
        atual.INSTR_AGENTES = juntar(
          distintos([...(atual.INSTR_AGENTES || '').split(', '), agente]),
          ', ',
        )
        continue
      }
      vistos.set(chave, {
        INSTR_NOME: m.equipamento,
        INSTR_FABRICANTE_MODELO: m.equipamento,
        INSTR_NUMERO_SERIE: vazio(m.numero_serie),
        INSTR_CERTIFICADO: vazio(m.certificado_calibracao),
        INSTR_VALIDADE_CALIBRACAO: fData(m.calibracao_validade),
        INSTR_GRANDEZA: vazio(m.resultado_unidade) || vazio(m.metodologia),
        INSTR_CLASSE: undefined,
        INSTR_AGENTES: agente,
      })
    }
  }
  return Array.from(vistos.values())
}

function linhasEpc(d: DadosDocumento): Valores[] {
  const ix = indices(d)
  return d.avaliacoes
    .filter(
      (a) => vazio(a.epc_lista) || vazio(a.controle_descricao) || vazio(a.medidas_administrativas),
    )
    .map((a) => ({
      EPC_GRUPO: ix.grupoDaAvaliacao(a),
      AMBIENTE_NOME: ix.setorDaAvaliacao(a)?.nome,
      GHE_NOME: ix.grupoDaAvaliacao(a),
      AGENTE_NOME: nomeAgente(a),
      EPC_AGENTE: nomeAgente(a),
      EPC_DESCRICAO: juntar([
        vazio(a.epc_lista),
        vazio(a.controle_descricao),
        vazio(a.medidas_administrativas) && `Administrativa: ${a.medidas_administrativas}`,
      ]),
      EPC_DATA_INSTALACAO: undefined,
      EPC_MANUTENCAO:
        a.epc_plano_manutencao != null
          ? `Plano de manutenção: ${simNao(a.epc_plano_manutencao)}`
          : undefined,
      EPC_EFICAZ: simNao(a.epc_eficaz ?? false),
      EPC_EVIDENCIA: undefined,
    }))
}

function linhasEpi(d: DadosDocumento): Valores[] {
  const ix = indices(d)
  const linhas: Valores[] = []
  for (const a of d.avaliacoes) {
    for (const e of episDaAvaliacao(d, a)) {
      linhas.push({
        EPI_GRUPO: ix.grupoDaAvaliacao(a),
        FUNCAO_NOME: ix.grupoDaAvaliacao(a),
        AGENTE_NOME: nomeAgente(a),
        EPI_TIPO: 'EPI',
        EPI_DESCRICAO: e.descricao,
        EPI_CA: e.ca,
        EPI_VALIDADE: e.validade,
        EPI_FORNECIMENTO: undefined,
        EPI_TREINAMENTO: undefined,
        EPI_HIGIENIZACAO: a.epi_higienizacao_ok ? 'Registro de higienização: sim' : undefined,
        EPI_EFICACIA: epiNeutraliza(a),
        EPI_NEUTRALIZA: epiNeutraliza(a),
        ...flagsEpi(a),
      })
    }
  }
  return linhas
}

/** PGR 20.7: EPC e EPI numa tabela só, com a coluna "Tipo". */
function linhasEpcEpiPgr(d: DadosDocumento): Valores[] {
  const ix = indices(d)
  const linhas: Valores[] = []
  for (const a of d.avaliacoes) {
    if (vazio(a.epc_lista)) {
      linhas.push({
        EPI_GRUPO: ix.grupoDaAvaliacao(a),
        EPI_TIPO: 'EPC',
        EPI_DESCRICAO: a.epc_lista,
        EPI_CA: 'não se aplica',
        EPI_VALIDADE: 'não se aplica',
        EPI_FORNECIMENTO:
          a.epc_plano_manutencao != null
            ? `Plano de manutenção: ${simNao(a.epc_plano_manutencao)}`
            : undefined,
      })
    }
  }
  return [...linhas, ...linhasEpi(d)]
}

function linhasErgonomia(d: DadosDocumento): Valores[] {
  const ix = indices(d)
  return d.avaliacoes
    .filter(
      (a) =>
        agenteDe(a)?.tipo === 'Ergonômico' || a.trilha_probabilidade === 'Ergonômica (AEP/AET)',
    )
    .map((a) => ({
      ERG_GRUPO: ix.grupoDaAvaliacao(a),
      ERG_FATOR: nomeAgente(a),
      ERG_METODO: 'Análise ergonômica preliminar (AEP), NR-17',
      ERG_RESULTADO: juntar([
        vazio(a.resultado_aep_aet) && `AEP: ${a.resultado_aep_aet}`,
        vazio(a.observacoes_aep_aet),
      ]),
      ERG_CLASSIFICACAO: pontuacao(d, a).categoria,
    }))
}

function linhasAcoes(
  d: DadosDocumento,
  filtroAgente?: (ag?: AgenteCatalogo) => boolean,
): Valores[] {
  const ix = indices(d)
  const avalPorId = new Map(d.avaliacoes.map((a) => [a.id, a]))
  let acoes = d.acoes
  if (filtroAgente) {
    const filtradas = acoes.filter((ac) => {
      const a = ac.avaliacao_id ? avalPorId.get(ac.avaliacao_id) : undefined
      return a ? filtroAgente(agenteDe(a)) : false
    })
    if (filtradas.length > 0) acoes = filtradas
  }
  return acoes.map((ac: AcaoPlano, i) => {
    const a = ac.avaliacao_id ? avalPorId.get(ac.avaliacao_id) : undefined
    const ag = a ? agenteDe(a) : undefined
    return {
      NUM_ACAO: String(i + 1),
      DESCRICAO_ACAO: ac.medida,
      RISCO_ORIGEM: a
        ? `${nomeAgente(a)} (${ix.grupoDaAvaliacao(a)})`
        : vazio(ac.origem)
          ? `Origem: ${ac.origem}`
          : undefined,
      AGENTE_GHE_ACAO: a ? `${nomeAgente(a)} / ${ix.grupoDaAvaliacao(a)}` : undefined,
      AGENTE_NOME: a ? nomeAgente(a) : undefined,
      FUNCAO_NOME: a ? ix.grupoDaAvaliacao(a) : undefined,
      JUSTIFICATIVA: vazio(ac.justificativa),
      LOCAL_ACAO: vazio(ac.local) || (a ? ix.setorDaAvaliacao(a)?.nome : undefined),
      METODO_ACAO: vazio(ac.como),
      RESP_ACAO: vazio(ac.responsavel),
      PRAZO_ACAO: fData(ac.prazo),
      CUSTO_ACAO: fMoeda(ac.custo_estimado),
      AFERICAO_ACAO: vazio(ac.forma_afericao_resultado) || vazio(ac.forma_acompanhamento),
      PRIORIDADE_ACAO: vazio(ac.prioridade),
      SITUACAO_ACAO: ac.status,
      HIERARQUIA_ACAO: hierarquia(ac.nivel_hierarquia),
      ANEXO_ACAO: ag?.anexo_nr16,
      ITEM_ACAO: vazio(ag?.item_nr16),
    }
  })
}

function linhasRevisoes(d: DadosDocumento): Valores[] {
  const anteriores: Valores[] = d.revisoes.map((r) => ({
    VERSAO_REV: r.versao != null ? String(r.versao) : undefined,
    DATA_REV: fData(r.data_emissao),
    MOTIVO_REV: vazio(r.motivo_revisao) || 'Emissão inicial',
    ALTERACOES_REV: undefined,
    RESP_REV: undefined,
    ASSINATURA_REV: 'assinado eletronicamente',
  }))
  anteriores.push({
    VERSAO_REV: String(d.versao),
    DATA_REV: fData(d.dataEmissao),
    MOTIVO_REV:
      vazio(d.documento.motivo_revisao) || (d.versao === 1 ? 'Emissão inicial' : 'Revisão'),
    ALTERACOES_REV: undefined,
    RESP_REV: d.autor?.nome as string | undefined,
    ASSINATURA_REV: 'assinatura eletrônica na emissão',
  })
  return anteriores
}

// ---------- conclusões por função ----------

type TipoLaudo = 'insalubridade' | 'periculosidade' | 'ltcat'

function conclusaoTexto(tipo: TipoLaudo, a: AvaliacaoRisco): string | undefined {
  if (tipo === 'insalubridade') {
    const c = a.insalubridade_final || a.insalubridade_sugerida
    if (!c) return undefined
    if (c === 'Não caracteriza') return 'Não caracterizada'
    const m = c.match(/^(\w+)\s*\((\d+%)\)/)
    return m ? `Insalubre, grau ${m[1].toLowerCase()} (${m[2]})` : c
  }
  if (tipo === 'periculosidade') {
    const c = a.periculosidade_final ?? a.periculosidade_sugerida
    if (c === undefined) return undefined
    return c ? 'Caracterizada (adicional de 30%)' : 'Não caracterizada'
  }
  const c = a.ltcat_enquadra_final || a.ltcat_enquadra_sugerido
  if (!c) return undefined
  return c.startsWith('Sim')
    ? `Caracteriza atividade especial (${c.replace('Sim - ', '')})`
    : 'Não caracteriza atividade especial'
}

function enquadramento(tipo: TipoLaudo, ag?: AgenteCatalogo): string | undefined {
  if (!ag) return undefined
  if (tipo === 'insalubridade') return ag.anexo_nr15 ? `NR-15, Anexo ${ag.anexo_nr15}` : undefined
  if (tipo === 'periculosidade')
    return ag.anexo_nr16
      ? `NR-16, Anexo ${ag.anexo_nr16}${ag.item_nr16 ? `, item ${ag.item_nr16}` : ''}`
      : undefined
  return juntar(
    [
      vazio(ag.codigo_anexo_iv) && `Anexo IV do Decreto 3.048/1999, código ${ag.codigo_anexo_iv}`,
      ag.anos_aposentadoria_especial && `${ag.anos_aposentadoria_especial} anos`,
      vazio(ag.codigo_esocial) && `eSocial ${ag.codigo_esocial}`,
    ],
    '; ',
  )
}

function linhasConclusao(d: DadosDocumento, tipo: TipoLaudo): Valores[] {
  const ix = indices(d)
  const linhas: Valores[] = []
  for (const f of d.funcoes) {
    const avals = avaliacoesDaFuncao(f, d.avaliacoes).filter((a) => {
      const ag = agenteDe(a)
      if (!ag) return false
      if (tipo === 'insalubridade') return !!ag.anexo_nr15
      if (tipo === 'periculosidade') return !!ag.anexo_nr16
      return true
    })
    const g = f.ghe_id ? ix.ghePorId.get(f.ghe_id) : undefined
    if (avals.length === 0) {
      linhas.push({
        FUNCAO_NOME: f.nome,
        GHE_NOME: rotuloGhe(g) || 'Sem GHE',
        CONC_AGENTE:
          tipo === 'ltcat'
            ? 'Ausência de agente nocivo (código 09.01.001)'
            : tipo === 'insalubridade'
              ? 'Nenhum agente da NR-15 identificado'
              : 'Ausência de atividade perigosa',
        AGENTE_NOME: '—',
        CONC_FONTE_EXPOSICAO: 'não se aplica',
        CONC_HABITUALIDADE: 'não se aplica',
        CONC_AVALIACAO: 'Qualitativa: inventário sem agente aplicável',
        CONC_EPC_EPI: 'não se aplica',
        CONC_ENQUADRAMENTO:
          tipo === 'ltcat' ? 'Tabela 24 do eSocial, código 09.01.001' : 'não se aplica',
        CONC_CONCLUSAO:
          tipo === 'ltcat' ? 'Não caracteriza atividade especial' : 'Não caracterizada',
        CONC_JUSTIFICATIVA: 'Nenhum agente aplicável a este laudo no inventário da função.',
        EXPOSICAO_HABITUALIDADE: 'não se aplica',
        EXPOSICAO_PERMANENCIA: 'não se aplica',
        EXPOSICAO_TEMPO: 'não se aplica',
        MED_RESULTADO: '—',
        MED_LIMITE: '—',
        EPC_DESCRICAO: '—',
        EPI_DESCRICAO: '—',
        EPI_CA: '—',
        EPI_EFICACIA: '—',
        AGENTE_ANEXO_NR15: '—',
        AGENTE_ITEM_NR15: '—',
      })
      continue
    }
    for (const a of avals) {
      const ag = agenteDe(a)!
      const hp = habitualidade(a.frequencia_exposicao)
      const m = ultimaMedicao(d, a)
      const epis = episDaAvaliacao(d, a)
      const justificativa =
        tipo === 'insalubridade'
          ? a.insalubridade_justificativa
          : tipo === 'periculosidade'
            ? a.periculosidade_justificativa
            : a.ltcat_justificativa
      linhas.push({
        FUNCAO_NOME: f.nome,
        GHE_NOME: rotuloGhe(g) || 'Sem GHE',
        CONC_AGENTE: juntar(
          [ag.nome, vazio(ag.codigo_anexo_iv) && `código ${ag.codigo_anexo_iv}`],
          ' – ',
        ),
        AGENTE_NOME: ag.nome,
        AGENTE_ANEXO_NR15: ag.anexo_nr15,
        AGENTE_ITEM_NR15: undefined,
        CONC_FONTE_EXPOSICAO: juntar([vazio(a.fonte_geradora), vazio(a.frequencia_exposicao)]),
        CONC_HABITUALIDADE: juntar([vazio(a.frequencia_exposicao), tempoExposicao(a)]),
        EXPOSICAO_HABITUALIDADE: hp.hab,
        EXPOSICAO_PERMANENCIA: hp.perm,
        EXPOSICAO_TEMPO: tempoExposicao(a) || 'não informado',
        CONC_AVALIACAO: resumoMedicao(d, a),
        MED_RESULTADO:
          m?.resultado_valor != null
            ? `${fNum(m.resultado_valor, 3)} ${m.resultado_unidade || ''}`.trim()
            : 'sem medição',
        MED_LIMITE: limiteDoAgente(ag) || 'avaliação qualitativa',
        CONC_EPC_EPI: juntar([
          vazio(a.epc_lista) && `EPC: ${a.epc_lista}`,
          epis.length > 0 &&
            `EPI: ${epis.map((e) => `${e.descricao}${e.ca ? ` (CA ${e.ca})` : ''}`).join(', ')}`,
          epis.length > 0 && `requisitos: ${epiNeutraliza(a)}`,
        ]),
        EPC_DESCRICAO: vazio(a.epc_lista) || 'sem EPC',
        EPI_DESCRICAO: epis.length ? epis.map((e) => e.descricao).join(', ') : 'sem EPI',
        EPI_CA: epis.length ? epis.map((e) => e.ca || '—').join(', ') : '—',
        EPI_EFICACIA: epis.length ? epiNeutraliza(a) : 'não se aplica',
        CONC_ENQUADRAMENTO: enquadramento(tipo, ag),
        CONC_CONCLUSAO: conclusaoTexto(tipo, a),
        CONC_JUSTIFICATIVA: vazio(justificativa),
      })
    }
  }
  return linhas
}

function linhasPpp(d: DadosDocumento): Valores[] {
  return d.funcoes.map((f) => {
    const avals = avaliacoesDaFuncao(f, d.avaliacoes).filter((a) => agenteDe(a))
    const enquadradas = avals.filter((a) =>
      (a.ltcat_enquadra_final || a.ltcat_enquadra_sugerido || '').startsWith('Sim'),
    )
    const codigos = distintos(enquadradas.map((a) => vazio(agenteDe(a)?.codigo_esocial)))
    const anos = distintos(
      enquadradas.map((a) =>
        (a.ltcat_enquadra_final || a.ltcat_enquadra_sugerido || '').replace('Sim - ', ''),
      ),
    )
    return {
      FUNCAO_NOME: f.nome,
      PPP_CODIGO_TABELA24:
        enquadradas.length === 0 ? '09.01.001' : codigos.length ? codigos.join(', ') : undefined,
      PPP_GRAU_EXPOSICAO: undefined,
      PPP_TEMPO_FAE:
        enquadradas.length === 0 ? 'não se aplica' : anos.length ? anos.join(', ') : undefined,
      PPP_INICIO_CONDICAO: undefined,
    }
  })
}

const PESO_GRAU: Record<string, number> = { 'Máximo (40%)': 3, 'Médio (20%)': 2, 'Mínimo (10%)': 1 }
function linhasResumoInsalubridade(d: DadosDocumento): Valores[] {
  return d.funcoes.map((f) => {
    const avals = avaliacoesDaFuncao(f, d.avaliacoes).filter((a) => agenteDe(a)?.anexo_nr15)
    let melhor: AvaliacaoRisco | undefined
    let peso = 0
    for (const a of avals) {
      const c = a.insalubridade_final || a.insalubridade_sugerida || ''
      if ((PESO_GRAU[c] || 0) > peso) {
        peso = PESO_GRAU[c]
        melhor = a
      }
    }
    return {
      FUNCAO_NOME: f.nome,
      FUNCAO_NUM_EXPOSTOS: f.numero_empregados != null ? String(f.numero_empregados) : undefined,
      RES_AGENTE_MAIOR_GRAU: melhor ? nomeAgente(melhor) : 'nenhum',
      RES_GRAU_FINAL:
        peso === 3 ? 'Máximo' : peso === 2 ? 'Médio' : peso === 1 ? 'Mínimo' : 'Sem insalubridade',
      RES_PERCENTUAL: peso === 3 ? '40%' : peso === 2 ? '20%' : peso === 1 ? '10%' : '0%',
      PERCENTUAL_GRAU: peso === 3 ? '40%' : peso === 2 ? '20%' : peso === 1 ? '10%' : '0%',
    }
  })
}

const funcaoPerigosa = (d: DadosDocumento, f: FuncaoSst) =>
  avaliacoesDaFuncao(f, d.avaliacoes).some(
    (a) =>
      agenteDe(a)?.anexo_nr16 && (a.periculosidade_final ?? a.periculosidade_sugerida) === true,
  )
const funcaoInsalubre = (d: DadosDocumento, f: FuncaoSst) =>
  avaliacoesDaFuncao(f, d.avaliacoes).some((a) => {
    const c = a.insalubridade_final || a.insalubridade_sugerida
    return !!c && c !== 'Não caracteriza'
  })

function linhasResumoPericulosidade(d: DadosDocumento): Valores[] {
  const perigosas = d.funcoes.filter((f) => funcaoPerigosa(d, f))
  const anexos = distintos(
    d.avaliacoes
      .filter((a) => agenteDe(a)?.anexo_nr16)
      .map((a) => `Anexo ${agenteDe(a)!.anexo_nr16}`),
  )
  return [
    {
      RES_TOTAL_FUNCOES: String(d.funcoes.length),
      RES_CARACTERIZADAS: String(perigosas.length),
      RES_NAO_CARACTERIZADAS: String(d.funcoes.length - perigosas.length),
      RES_TRABALHADORES_ADICIONAL: String(
        perigosas.reduce((t, f) => t + (f.numero_empregados || 0), 0),
      ),
      RES_ANEXOS: anexos.length ? anexos.join(', ') : 'nenhum',
    },
  ]
}

function linhasSimultaneas(d: DadosDocumento): Valores[] {
  return d.funcoes
    .filter((f) => funcaoPerigosa(d, f) && funcaoInsalubre(d, f))
    .map((f) => {
      const avals = avaliacoesDaFuncao(f, d.avaliacoes)
      const per = avals.find(
        (a) => agenteDe(a)?.anexo_nr16 && (a.periculosidade_final ?? a.periculosidade_sugerida),
      )
      const ins = avals.find((a) => {
        const c = a.insalubridade_final || a.insalubridade_sugerida
        return !!c && c !== 'Não caracteriza'
      })
      return {
        FUNCAO_NOME: f.nome,
        SIM_ANEXO_PERIC: per ? `Anexo ${agenteDe(per)!.anexo_nr16}` : undefined,
        SIM_CONCLUSAO_PERIC: 'Caracterizada',
        SIM_AGENTE_INSAL: ins ? nomeAgente(ins) : undefined,
        SIM_GRAU_INSAL: ins ? ins.insalubridade_final || ins.insalubridade_sugerida : undefined,
      }
    })
}

function linhasExposicaoNr16(d: DadosDocumento): Valores[] {
  const ix = indices(d)
  return d.avaliacoes
    .filter((a) => agenteDe(a)?.anexo_nr16)
    .map((a) => {
      const ag = agenteDe(a)!
      const hp = habitualidade(a.frequencia_exposicao)
      return {
        FUNCAO_NOME: ix.grupoDaAvaliacao(a),
        EXP_FONTE: vazio(a.fonte_geradora) || ag.nome,
        EXP_ANEXO: ag.anexo_nr16,
        EXP_LOCAL: ix.setorDaAvaliacao(a)?.nome,
        EXP_TEMPO_INGRESSO:
          a.tempo_exposicao_min_jornada != null ? String(a.tempo_exposicao_min_jornada) : undefined,
        EXP_INGRESSOS: undefined,
        EXP_FORMA: hp.perm,
        EXP_FONTE_INFORMACAO: undefined,
      }
    })
}

function linhasQualitativas(d: DadosDocumento): Valores[] {
  const ix = indices(d)
  return d.avaliacoes
    .filter((a) => agenteDe(a) && (d.medicoes[a.id] || []).length === 0)
    .map((a) => {
      const ag = agenteDe(a)!
      return {
        MED_LOCAL: ix.grupoDaAvaliacao(a),
        MED_AGENTE: juntar(
          [ag.nome, vazio(ag.codigo_anexo_iv) && `código ${ag.codigo_anexo_iv}`],
          ' – ',
        ),
        QUAL_ATIVIDADE_MATERIAL: vazio(a.atividades_relacionadas) || vazio(a.perigo_descricao),
        QUAL_VIA_ABSORCAO: vazio(a.via_absorcao),
        EXPOSICAO_FREQUENCIA_DURACAO: juntar([vazio(a.frequencia_exposicao), tempoExposicao(a)]),
        QUAL_FONTE_LIBERACAO: juntar([vazio(a.fonte_geradora), vazio(a.meio_propagacao)]),
        QUAL_RESULTADO: conclusaoTexto('ltcat', a),
      }
    })
}

/** NR-15 11.7, demais agentes (avaliação qualitativa ou por dosimetria). */
function linhasOutrosAgentesNr15(d: DadosDocumento): Valores[] {
  const ix = indices(d)
  const demais = ['5', '6', '7', '9', '10', '13', '13-A', '14']
  return d.avaliacoes
    .filter((a) => demais.includes(agenteDe(a)?.anexo_nr15 || ''))
    .map((a) => {
      const ag = agenteDe(a)!
      return {
        GHE_NOME: ix.grupoDaAvaliacao(a),
        FUNCAO_NOME: ix.grupoDaAvaliacao(a),
        AGENTE_NOME: ag.nome,
        AGENTE_ANEXO_NR15: ag.anexo_nr15,
        OUTROS_ATIVIDADE_OPERACAO: vazio(a.atividades_relacionadas) || vazio(a.perigo_descricao),
        OUTROS_TEMPO_PERMANENCIA_PROTECAO: juntar([
          vazio(a.frequencia_exposicao),
          tempoExposicao(a),
          vazio(a.epis_utilizados) && `EPI: ${(a.epis_utilizados || '').replace(/\n+/g, ', ')}`,
        ]),
        OUTROS_REGISTRO_INSPECAO: undefined,
        OUTROS_ENQUADRA: (() => {
          const c = a.insalubridade_final || a.insalubridade_sugerida
          return c ? (c === 'Não caracteriza' ? 'Não enquadra' : 'Enquadra') : undefined
        })(),
      }
    })
}

const manual: Gerador = () => ({ linhas: [], manual: true })
const lista =
  (fn: (d: DadosDocumento) => Valores[]): Gerador =>
  (d) => ({ linhas: fn(d) })

/** id do bloco (gerado pelo conversor a partir do título) -> gerador. */
export const GERADORES: Record<string, Gerador> = {
  // PGR
  '12:plano_de_acao': lista((d) => linhasAcoes(d)),
  '17:historico_de_revisoes': lista(linhasRevisoes),
  '20:ambientes_e_processos': lista(linhasAmbientes),
  '20:funcoes_e_grupos_de_exposicao': lista(linhasFuncoes),
  '20:inventario_de_perigos': lista((d) => d.avaliacoes.map((a) => linhaInventario(d, a))),
  '20:avaliacao_de_riscos': lista((d) => d.avaliacoes.map((a) => linhaInventario(d, a))),
  '20:medicoes': lista((d) => linhasMedicoes(d)),
  '20:ergonomia_e_psicossociais': lista(linhasErgonomia),
  '20:epc_e_epi': lista(linhasEpcEpiPgr),
  '20:registro_de_consulta': manual,
  '20:acidentes_e_doencas': manual,
  '20:treinamentos': manual,
  '20:contratadas': manual,
  // LTCAT
  '4:instrumentos_de_medicao': lista(linhasInstrumentos),
  '5:ambientes_e_setores_do_estabelecimento': lista(linhasAmbientes),
  '5:grupos_homogeneos_de_exposicao': lista(linhasGhes),
  '5:descricao_das_funcoes': lista(linhasFuncoes),
  '8:equipamentos_de_protecao_coletiva': lista(linhasEpc),
  '8:equipamentos_de_protecao_individual': lista(linhasEpi),
  '9:medicoes_de_ruido': lista((d) => linhasMedicoes(d, ehRuido)),
  '9:medicoes_de_calor': lista((d) => linhasMedicoes(d, ehCalor)),
  '9:medicoes_de_vibracao': lista((d) => linhasMedicoes(d, ehVibracao)),
  '9:medicoes_de_agentes_quimicos': lista((d) => linhasMedicoes(d, ehQuimico)),
  '9:avaliacoes_qualitativas': lista(linhasQualitativas),
  '10:conclusao_por_funcao': lista((d) => linhasConclusao(d, 'ltcat')),
  '10:resumo_por_funcao_para_ppp_e_esocial': lista(linhasPpp),
  '13:plano_de_acao_de_controle_dos_agentes_nocivos': lista((d) =>
    linhasAcoes(d, (ag) => !!ag && (!!ag.codigo_anexo_iv || !!ag.codigo_esocial)),
  ),
  '14:historico_de_revisoes': lista(linhasRevisoes),
  // Laudo NR-15
  '11:ambientes': lista(linhasAmbientes),
  '11:ghe': lista(linhasGhes),
  '11:funcoes': lista(linhasFuncoes),
  '11:instrumentos': lista(linhasInstrumentos),
  '11:reconhecimento_de_agentes': lista((d) =>
    d.avaliacoes.filter((a) => agenteDe(a)?.anexo_nr15).map((a) => linhaInventario(d, a)),
  ),
  '11:medicoes_e_resultados_ruido_anexos_1_e_2': lista((d) => linhasMedicoes(d, ehRuido)),
  '11:medicoes_e_resultados_calor_anexo_3': lista((d) => linhasMedicoes(d, ehCalor)),
  '11:medicoes_e_resultados_agentes_quimicos_e_poeiras_anexos_11_e': lista((d) =>
    linhasMedicoes(d, ehQuimico),
  ),
  '11:medicoes_e_resultados_vibracao_anexo_8': lista((d) => linhasMedicoes(d, ehVibracao)),
  '11:medicoes_e_resultados_demais_agentes_anexos_5_6_7_9_10_13_13': lista(linhasOutrosAgentesNr15),
  '11:epc_e_medidas_administrativas': lista(linhasEpc),
  '11:epi_e_questionario_de_eficacia': lista(linhasEpi),
  '12:conclusao_por_funcao': lista((d) => linhasConclusao(d, 'insalubridade')),
  '12:resumo_de_adicional_por_funcao': lista(linhasResumoInsalubridade),
  // Laudo NR-16
  '11:ambientes_de_trabalho': lista(linhasAmbientes),
  '11:checklist_documental': manual,
  '11:inventario_de_explosivos_e_inflamaveis': manual,
  '11:instalacoes_eletricas': manual,
  '11:frota_e_deslocamentos': manual,
  '11:condicoes_de_enquadramento_dos_anexos_3_e_6_e_radiacoes': manual,
  '12:funcoes_e_atividades': lista(linhasFuncoes),
  '12:caracterizacao_da_exposicao': lista(linhasExposicaoNr16),
  '13:areas_de_risco': manual,
  '14:conclusao_por_funcao': lista((d) => linhasConclusao(d, 'periculosidade')),
  '14:resumo_quantitativo': lista(linhasResumoPericulosidade),
  '14:funcoes_com_opcao_entre_adicionais': lista(linhasSimultaneas),
  '15:plano_de_acao': lista((d) => linhasAcoes(d, (ag) => !!ag?.anexo_nr16)),
}

/** Chave do gerador: o mesmo id pode existir em dois modelos (ex.: "12:plano_de_acao"
 *  no PGR e no laudo NR-15), por isso a busca tenta primeiro "tipo/id". */
export const GERADORES_POR_TIPO: Record<string, Gerador> = {
  'insalubridade/12:plano_de_acao': lista((d) => linhasAcoes(d, (ag) => !!ag?.anexo_nr15)),
  'pgr/12:plano_de_acao': lista((d) => linhasAcoes(d)),
  'insalubridade/12:conclusao_por_funcao': lista((d) => linhasConclusao(d, 'insalubridade')),
  'periculosidade/14:conclusao_por_funcao': lista((d) => linhasConclusao(d, 'periculosidade')),
  'ltcat/10:conclusao_por_funcao': lista((d) => linhasConclusao(d, 'ltcat')),
}

export function gerarBloco(
  tipo: string,
  idBloco: string,
  d: DadosDocumento,
): ResultadoBloco | null {
  const g = GERADORES_POR_TIPO[`${tipo}/${idBloco}`] || GERADORES[idBloco]
  return g ? g(d) : null
}

/** Blocos conhecidos (para o validador do build). */
export const BLOCOS_IMPLEMENTADOS = Object.keys(GERADORES)

// Reexporta utilidades usadas pelos capítulos gerados a partir da matriz.
export { pontuacao as pontuacaoAvaliacao }
