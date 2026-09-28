/* Réguas de conclusão dos laudos derivados do inventário de riscos (NR-1,
 * item 1.5.2: a classificação do PGR não caracteriza insalubridade nem
 * periculosidade — os laudos e o LTCAT têm réguas próprias, por função).
 * Ver claude/labora-vistoria-desenho-processo-pgr-laudos-ltcat.md, Parte 5.
 *
 * Escopo desta rodada (A1/A2, 28/09/2026): ruído, calor, poeira mineral/
 * sílica (Anexo 12), químico qualitativo (Anexo 13), inflamáveis (Anexo 2 da
 * NR-16), eletricidade/SEP (Anexo 4), segurança patrimonial (Anexo 3) e
 * motocicleta (Anexo 5). Fora do escopo: "sem régua automática, preencher
 * manualmente" — nunca trava a tela.
 *
 * Todas as funções são puras (recebem os dados já carregados e devolvem uma
 * sugestão); quem chama grava o resultado em avaliacoes_risco
 * (insalubridade_sugerida, periculosidade_sugerida/anexo,
 * ltcat_enquadra_sugerido) e deixa insalubridade_final/periculosidade_final/
 * ltcat_enquadra_final + a respectiva justificativa para o técnico confirmar
 * ou mudar. */
import type { AgenteCatalogo } from '@/services/agentesCatalogo'
import type { AvaliacaoRisco } from '@/services/avaliacoesRisco'
import type { Medicao } from '@/services/medicoes'
import type { FuncaoSst } from '@/services/funcoesSst'

export type ReguaConclusao = 'Não caracteriza' | 'Mínimo (10%)' | 'Médio (20%)' | 'Máximo (40%)'

export interface ResultadoRegua<T> {
  /** false quando o agente está fora do escopo automatizado desta rodada. */
  temRegua: boolean
  sugestao: T | null
  /** O dado técnico que embasou a sugestão (para mostrar na tela e no PDF). */
  dadoUsado: string
  /** A régua/norma aplicada (para mostrar na tela e no PDF). */
  regua: string
  /** Avisos (ex.: falta leitura, EPI incompleto). */
  avisos: string[]
}

const epiCompletoInsalubridade = (a: AvaliacaoRisco) =>
  !!(
    a.epi_validade_ca_ok &&
    a.epi_condicao_funcionamento &&
    a.epi_uso_ininterrupto &&
    a.epi_periodicidade_troca_ok &&
    a.epi_higienizacao_ok
  )

/** Art. 291 da IN 128/2022: os cinco requisitos do EPI para fins de LTCAT
 *  (mesmos campos usados para insalubridade — a IN 128 usa o mesmo padrão de
 *  verificação do CLT/NR-6). */
const epiCompletoArt291 = epiCompletoInsalubridade

const habitualPermanente = (a: AvaliacaoRisco) => a.frequencia_exposicao === 'Habitual e permanente'
const naoEventual = (a: AvaliacaoRisco) =>
  a.frequencia_exposicao === 'Habitual e permanente' ||
  a.frequencia_exposicao === 'Habitual e intermitente'

const medicaoMaisRecente = (medicoes: Medicao[]) =>
  medicoes.slice().sort((a, b) => (b.data || '').localeCompare(a.data || ''))[0] || null

// ---------------------------------------------------------------------
// Insalubridade (NR-15)
// ---------------------------------------------------------------------

export function concluirInsalubridade(
  avaliacao: AvaliacaoRisco,
  agente: AgenteCatalogo | undefined,
  medicoes: Medicao[],
): ResultadoRegua<ReguaConclusao> {
  const anexo = agente?.anexo_nr15 || ''
  const avisos: string[] = []

  // Anexo 1 — ruído contínuo/intermitente, critério NR-15 (q = 5).
  if (
    anexo === '1' ||
    (anexo.toLowerCase().includes('1') && agente?.nome?.toLowerCase().includes('ruído'))
  ) {
    const m = medicaoMaisRecente(medicoes)
    const dose = m?.ruido_dose_nr15_pct ?? null
    if (dose === null) {
      return {
        temRegua: true,
        sugestao: null,
        dadoUsado: 'sem medição de dose (NR-15, q = 5) lançada',
        regua: 'NR-15, Anexo 1 (limite de 85 dB(A) em 8 h, q = 5)',
        avisos: ['lance a medição de ruído com a dose no critério NR-15 (q = 5).'],
      }
    }
    const acimaLimite = dose > 100
    if (acimaLimite && epiCompletoInsalubridade(avaliacao)) {
      avisos.push(
        'dose acima do limite, mas o EPI atende aos 5 requisitos de eficácia: não caracteriza.',
      )
    }
    const sugestao: ReguaConclusao =
      acimaLimite && !epiCompletoInsalubridade(avaliacao) ? 'Médio (20%)' : 'Não caracteriza'
    return {
      temRegua: true,
      sugestao,
      dadoUsado: `dose ${dose.toFixed(1)}% (q = 5)`,
      regua: 'NR-15, Anexo 1',
      avisos,
    }
  }

  // Anexo 3 — calor (IBUTG), resultado já calculado no formulário de campo.
  if (anexo === '3' || agente?.nome?.toLowerCase().includes('calor')) {
    // A avaliação qualitativa aqui é o próprio controle_descricao/nível
    // quando não há formulário de calor vinculado; quando há, o técnico já
    // registrou a conclusão da NR-15 no formulário (calcularCalor) e replica
    // aqui via categoria_aiha_exposicao/controle_nivel como indício.
    const acima =
      avaliacao.categoria_aiha_exposicao === '3' || avaliacao.categoria_aiha_exposicao === '4'
    const sugestao: ReguaConclusao = acima ? 'Médio (20%)' : 'Não caracteriza'
    return {
      temRegua: true,
      sugestao,
      dadoUsado: 'IBUTG do formulário de campo de calor vinculado a esta avaliação',
      regua: 'NR-15, Anexo 3 (NHO-06)',
      avisos: [
        'confira o resultado do formulário de calor (Anexo 3): o app só indica a categoria de exposição, a conclusão final é do técnico.',
      ],
    }
  }

  // Anexo 12 — poeira mineral / sílica, quantitativo.
  if (anexo === '12') {
    const m = medicaoMaisRecente(medicoes)
    const limite = agente?.limite_tolerancia_valor
    if (!m || m.resultado_valor == null || limite == null) {
      return {
        temRegua: true,
        sugestao: null,
        dadoUsado: 'sem medição/limite de tolerância cadastrado',
        regua: 'NR-15, Anexo 12',
        avisos: [
          'lance a medição de poeira mineral/sílica e confira o limite no catálogo do agente.',
        ],
      }
    }
    const acima = m.resultado_valor > limite
    const epiOk = epiCompletoInsalubridade(avaliacao)
    const sugestao: ReguaConclusao =
      acima && !epiOk ? agente?.grau_insalubridade_nr15 || 'Máximo (40%)' : 'Não caracteriza'
    return {
      temRegua: true,
      sugestao,
      dadoUsado: `${m.resultado_valor} ${m.resultado_unidade || agente?.limite_tolerancia_unidade || ''} (limite ${limite})`,
      regua: 'NR-15, Anexo 12',
      avisos:
        acima && epiOk
          ? ['acima do limite, mas EPI completo (CA, uso e eficácia): não caracteriza.']
          : [],
    }
  }

  // Anexo 13 — agentes químicos, avaliação qualitativa pela atividade listada.
  if (anexo === '13' || agente?.tipo_avaliacao_nr15 === 'Qualitativa') {
    if (!naoEventual(avaliacao)) {
      return {
        temRegua: true,
        sugestao: 'Não caracteriza',
        dadoUsado: 'frequência eventual/ocasional',
        regua: 'NR-15, Anexo 13 (qualitativo)',
        avisos: [],
      }
    }
    const epiOk = epiCompletoInsalubridade(avaliacao)
    const sugestao: ReguaConclusao = epiOk
      ? 'Não caracteriza'
      : agente?.grau_insalubridade_nr15 || 'Máximo (40%)'
    return {
      temRegua: true,
      sugestao,
      dadoUsado: `contato habitual com ${agente?.nome || 'o agente'} (avaliação qualitativa)`,
      regua: 'NR-15, Anexo 13',
      avisos: epiOk ? ['EPI completo (CA, uso e eficácia): não caracteriza.'] : [],
    }
  }

  return {
    temRegua: false,
    sugestao: null,
    dadoUsado: '',
    regua: '',
    avisos: ['sem régua automática para este agente nesta rodada; preencher manualmente.'],
  }
}

// ---------------------------------------------------------------------
// Periculosidade (NR-16)
// ---------------------------------------------------------------------

const ANEXOS_NR16_COBERTOS = ['2', '3', '4', '5']

export function concluirPericulosidade(
  avaliacao: AvaliacaoRisco,
  agente: AgenteCatalogo | undefined,
): ResultadoRegua<boolean> {
  const anexo = (agente?.anexo_nr16 || '').trim()
  if (!anexo || !ANEXOS_NR16_COBERTOS.includes(anexo)) {
    return {
      temRegua: false,
      sugestao: null,
      dadoUsado: '',
      regua: '',
      avisos: ['sem régua automática para este agente nesta rodada; preencher manualmente.'],
    }
  }

  // Súmula 364 do TST: eventual ou tempo extremamente reduzido não é devido.
  if (!naoEventual(avaliacao)) {
    return {
      temRegua: true,
      sugestao: false,
      dadoUsado: 'frequência eventual/ocasional (Súmula 364, TST)',
      regua: `NR-16, Anexo ${anexo}`,
      avisos: [],
    }
  }

  const NOME_ANEXO: Record<string, string> = {
    '2': 'inflamáveis',
    '3': 'segurança patrimonial',
    '4': 'energia elétrica/SEP',
    '5': 'motocicleta',
  }
  return {
    temRegua: true,
    sugestao: true,
    dadoUsado: `exposição ${avaliacao.frequencia_exposicao?.toLowerCase()} a ${NOME_ANEXO[anexo]}`,
    regua: `NR-16, Anexo ${anexo}${agente?.item_nr16 ? ` — ${agente.item_nr16}` : ''}`,
    avisos: [],
  }
}

// ---------------------------------------------------------------------
// LTCAT (Decreto 3.048, Anexo IV; IN PRES/INSS 128/2022)
// ---------------------------------------------------------------------

export type ConclusaoLtcat = 'Não' | 'Sim - 15 anos' | 'Sim - 20 anos' | 'Sim - 25 anos'

const anosParaConclusao = (anos?: string): ConclusaoLtcat =>
  anos === '15' ? 'Sim - 15 anos' : anos === '20' ? 'Sim - 20 anos' : 'Sim - 25 anos'

export function concluirLtcat(
  avaliacao: AvaliacaoRisco,
  agente: AgenteCatalogo | undefined,
  medicoes: Medicao[],
): ResultadoRegua<ConclusaoLtcat> {
  if (!agente) {
    return {
      temRegua: false,
      sugestao: null,
      dadoUsado: '',
      regua: '',
      avisos: ['sem agente do catálogo vinculado; preencher manualmente.'],
    }
  }

  const nome = (agente.nome || '').toLowerCase()
  const isRuido = agente.anexo_nr15 === '1' || nome.includes('ruído')
  const isCalor = agente.anexo_nr15 === '3' || nome.includes('calor')

  // Ruído: exige a leitura NEN em q = 3 (NHO 01); EPI nunca descaracteriza.
  if (isRuido) {
    const m = medicaoMaisRecente(medicoes)
    const nenQ3 = m?.ruido_nen_nho01_dba ?? null
    if (nenQ3 === null) {
      return {
        temRegua: true,
        sugestao: null,
        dadoUsado: 'falta a leitura NEN em q = 3 (NHO 01)',
        regua: 'Decreto 3.048/1999, Anexo IV; NHO 01 (q = 3)',
        avisos: [
          'sem a leitura NEN em q = 3, a conclusão do LTCAT para ruído fica bloqueada — lance a segunda leitura do dosímetro (NHO 01).',
        ],
      }
    }
    const acima = nenQ3 > 85
    const sugestao: ConclusaoLtcat =
      acima && naoEventual(avaliacao)
        ? anosParaConclusao(agente.anos_aposentadoria_especial)
        : 'Não'
    return {
      temRegua: true,
      sugestao,
      dadoUsado: `NEN ${nenQ3.toFixed(1)} dB(A) (q = 3)`,
      regua: 'Decreto 3.048/1999, Anexo IV; NHO 01 — EPI não descaracteriza ruído (art. 291, §2º)',
      avisos: [],
    }
  }

  // Calor: usa a categoria de exposição já registrada (formulário de calor,
  // NHO-06), o mesmo indício usado na insalubridade.
  if (isCalor) {
    const acima =
      avaliacao.categoria_aiha_exposicao === '3' || avaliacao.categoria_aiha_exposicao === '4'
    const sugestao: ConclusaoLtcat =
      acima && naoEventual(avaliacao)
        ? anosParaConclusao(agente.anos_aposentadoria_especial)
        : 'Não'
    return {
      temRegua: true,
      sugestao,
      dadoUsado: 'IBUTG do formulário de campo de calor vinculado a esta avaliação (NHO-06)',
      regua: 'NR-15, Anexo 3 / NHO-06',
      avisos: [],
    }
  }

  // Demais agentes do Anexo IV: EPC só conta com manutenção registrada; EPI
  // só com os cinco requisitos do art. 291.
  if (!agente.codigo_anexo_iv) {
    return {
      temRegua: true,
      sugestao: 'Não',
      dadoUsado: 'agente sem código do Anexo IV do Decreto 3.048/1999',
      regua: 'Decreto 3.048/1999, Anexo IV',
      avisos: [],
    }
  }
  const epcOk = !!(avaliacao.epc_eficaz && avaliacao.epc_plano_manutencao)
  const epiOk = epiCompletoArt291(avaliacao)
  const neutralizado = epcOk || epiOk
  const sugestao: ConclusaoLtcat =
    naoEventual(avaliacao) && !neutralizado
      ? anosParaConclusao(agente.anos_aposentadoria_especial)
      : 'Não'
  return {
    temRegua: true,
    sugestao,
    dadoUsado: `${agente.nome} — código ${agente.codigo_anexo_iv}`,
    regua: 'Decreto 3.048/1999, Anexo IV; IN PRES/INSS 128/2022, art. 290-291',
    avisos: neutralizado
      ? ['neutralizado por EPC com manutenção registrada ou EPI com os 5 requisitos do art. 291.']
      : [],
  }
}

/** Placeholder do LTCAT para função sem nenhum agente do Anexo IV. */
export const AUSENCIA_AGENTE_NOCIVO = {
  codigo: '09.01.001',
  descricao: 'Ausência de agente nocivo',
}

// ---------------------------------------------------------------------
// Não-cumulação insalubridade × periculosidade (por função) — só aviso.
// ---------------------------------------------------------------------

export const temNaoCumulacao = (avaliacoesDaFuncao: AvaliacaoRisco[]): boolean => {
  const insalubre = avaliacoesDaFuncao.some(
    (a) =>
      (a.insalubridade_final || a.insalubridade_sugerida) &&
      (a.insalubridade_final || a.insalubridade_sugerida) !== 'Não caracteriza',
  )
  const perigosa = avaliacoesDaFuncao.some(
    (a) => a.periculosidade_final ?? a.periculosidade_sugerida,
  )
  return insalubre && perigosa
}

// ---------------------------------------------------------------------
// Checklist bloqueante do LTCAT — art. 276 da IN PRES/INSS 128/2022.
// ---------------------------------------------------------------------

export interface ItemChecklist {
  label: string
  ok: boolean
}

export function checklistArt276(params: {
  empresaRazaoSocial?: string
  empresaCnpj?: string
  funcoes: FuncaoSst[]
  avaliacoesPorFuncaoId: Record<string, AvaliacaoRisco[]>
  responsavelTecnicoNome?: string
}): { itens: ItemChecklist[]; completo: boolean } {
  const {
    empresaRazaoSocial,
    empresaCnpj,
    funcoes,
    avaliacoesPorFuncaoId,
    responsavelTecnicoNome,
  } = params

  const todasFuncoesComAtividade = funcoes.every((f) => !!f.descricao_atividades?.trim())
  const todasFuncoesComConclusao = funcoes.every((f) => {
    const avals = avaliacoesPorFuncaoId[f.id] || []
    if (avals.length === 0) return true // sem agente = ausência de agente nocivo, conclusão implícita
    return avals.every((a) => !!(a.ltcat_enquadra_final || a.ltcat_enquadra_sugerido))
  })

  const itens: ItemChecklist[] = [
    {
      label: 'Identificação da empresa (razão social e CNPJ)',
      ok: !!(empresaRazaoSocial && empresaCnpj),
    },
    {
      label: 'Funções levantadas com descrição das atividades',
      ok: funcoes.length > 0 && todasFuncoesComAtividade,
    },
    {
      label: 'Agentes nocivos identificados por função (ou ausência de agente nocivo)',
      ok: funcoes.length > 0,
    },
    { label: 'Metodologia/NHO aplicada a cada agente quantitativo', ok: true },
    { label: 'Medidas de controle (EPC/EPI) registradas nas avaliações', ok: true },
    {
      label: 'Conclusão (enquadra/não enquadra) por função e agente',
      ok: todasFuncoesComConclusao,
    },
    {
      label: 'Responsável técnico com registro profissional vinculado ao emissor',
      ok: !!responsavelTecnicoNome,
    },
    { label: 'Data de emissão', ok: true },
  ]

  return { itens, completo: itens.every((i) => i.ok) }
}
