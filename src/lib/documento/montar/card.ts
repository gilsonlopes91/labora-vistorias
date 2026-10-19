import type { DadosDocumento } from '@/lib/modelosSst/dados'
import {
  agenteDe,
  conclusaoTexto,
  enquadramento,
  episDaAvaliacao,
  flagsEpi,
  habitualidade,
  juntar,
  nomeAgente,
  pontuacao,
  tempoExposicao,
  ultimaMedicao,
} from '@/lib/modelosSst/blocos'
import { fData, fNum, vazio } from '@/lib/modelosSst/campos'
import type { AgenteCatalogo } from '@/services/agentesCatalogo'
import type { AvaliacaoRisco } from '@/services/avaliacoesRisco'
import type { TipoDocumentoSst } from '@/services/documentosSst'
import type { MatrizRisco } from '@/services/matrizesRisco'
import { categoriaDoRisco, type CategoriaRisco } from '../categorias'
import type { CardRisco, MatrizMiniDados } from '../modelo'
import { nivelDeAcao } from '../niveis'

export function matrizMini(matriz: MatrizRisco, p: number, s: number): MatrizMiniDados {
  const n = Number(matriz.dimensao) as 3 | 5
  const ordem = matriz.categorias.map((c) => c.categoria)
  const intensidade = (categoria?: string) => {
    const i = ordem.indexOf(categoria || '')
    if (i < 0 || ordem.length <= 1) return 1
    return 1 + Math.round((i * 4) / (ordem.length - 1))
  }
  const niveis: number[][] = []
  for (let pp = n; pp >= 1; pp--) {
    niveis.push(
      Array.from({ length: n }, (_, k) =>
        intensidade(matriz.celulas.find((c) => c.p === pp && c.s === k + 1)?.categoria),
      ),
    )
  }
  const celula = matriz.celulas.find((c) => c.p === p && c.s === s)
  return { dimensao: n, niveis, p, s, pontos: celula?.pontuacao ?? p * s }
}

function referencias(ag: AgenteCatalogo | undefined, categoria: CategoriaRisco): string[] {
  const r: string[] = []
  if (categoria === 'ergonomico') r.push('NR-17')
  if (ag?.anexo_nr15) r.push(`NR-15, Anexo ${ag.anexo_nr15}`)
  if (ag?.anexo_nr16)
    r.push(`NR-16, Anexo ${ag.anexo_nr16}${ag.item_nr16 ? `, item ${ag.item_nr16}` : ''}`)
  if (vazio(ag?.codigo_esocial)) r.push(`eSocial ${ag!.codigo_esocial}`)
  if (vazio(ag?.codigo_anexo_iv)) r.push(`Anexo IV, código ${ag!.codigo_anexo_iv}`)
  return r
}

function requisitosEpi(a: AvaliacaoRisco): string {
  const faltam = Object.entries(flagsEpi(a))
    .filter(([, v]) => v === 'N')
    .map(([k]) => k.replace('EPI_', ''))
  return faltam.length === 0
    ? ' · 7 requisitos atendidos'
    : ` · requisitos não atendidos: ${faltam.join(', ')}`
}

function medidas(
  d: DadosDocumento,
  a: AvaliacaoRisco,
  tipo: TipoDocumentoSst,
): CardRisco['medidas'] {
  const out: CardRisco['medidas'] = []
  const epc = vazio(a.epc_lista)
  if (epc) out.push({ tipo: 'EPC', texto: epc.replace(/\n+/g, '; ') })
  const adm = juntar([vazio(a.medidas_administrativas), vazio(a.controle_descricao)])
  if (adm) out.push({ tipo: 'ADM', texto: adm.replace(/\n+/g, '; ') })
  for (const e of episDaAvaliacao(d, a)) {
    const base =
      juntar([e.descricao, e.ca && `CA ${e.ca}`, e.validade && `válido até ${e.validade}`], ', ') ||
      e.descricao
    out.push({ tipo: 'EPI', texto: tipo === 'pgr' ? base : `${base}${requisitosEpi(a)}` })
  }
  const falta = vazio(a.medidas_faltantes)
  if (falta) out.push({ tipo: 'FALTA', texto: falta.replace(/\n+/g, '; ') })
  return out
}

function montarMedicao(
  d: DadosDocumento,
  a: AvaliacaoRisco,
  ag?: AgenteCatalogo,
): CardRisco['medicao'] {
  const m = ultimaMedicao(d, a)
  const limite = ag?.limite_tolerancia_valor
  if (!ag || !m || m.resultado_valor == null || limite == null || limite <= 0) return undefined
  const unidade = vazio(m.resultado_unidade) || vazio(ag.limite_tolerancia_unidade) || ''
  const na = nivelDeAcao(ag)
  const escala = Math.max(m.resultado_valor, limite) * 1.2
  const marcas: { rotulo: string; fracao: number }[] = []
  if (na != null) marcas.push({ rotulo: `NA ${fNum(na, 2)}`, fracao: na / escala })
  marcas.push({ rotulo: `LT ${fNum(limite, 2)}`, fracao: limite / escala })
  const dose = m.ruido_dose_nr15_pct
  return {
    valor: `${fNum(m.resultado_valor, 2)} ${unidade}`.trim(),
    detalhe: dose != null ? `dose de ${fNum(dose, 1)} %` : undefined,
    limiteTexto: `${fNum(limite, 2)} ${unidade}`.trim(),
    fracao: Math.min(1, m.resultado_valor / escala),
    marcas,
  }
}

function avaliadoPor(
  d: DadosDocumento,
  a: AvaliacaoRisco,
  categoria: CategoriaRisco,
): CardRisco['avaliadoPor'] {
  const ms = d.medicoes[a.id] || []
  if (ms.length > 0) {
    const m = ms[0]
    const validade = fData(m.calibracao_validade)
    return {
      titulo: vazio(m.metodologia) || 'Medição quantitativa',
      detalhe: juntar(
        [
          `${ms.length} amostra${ms.length > 1 ? 's' : ''}`,
          fData(m.data),
          juntar([vazio(m.equipamento), vazio(m.numero_serie) && `nº ${m.numero_serie}`], ' '),
          validade && `calibração até ${validade}`,
        ],
        ', ',
      ),
    }
  }
  if (categoria === 'ergonomico') {
    return {
      titulo: 'Análise ergonômica preliminar (AEP)',
      detalhe: vazio(a.observacoes_aep_aet),
    }
  }
  return { titulo: 'Avaliação qualitativa', detalhe: vazio(a.trilha_probabilidade) }
}

function exposicao(a: AvaliacaoRisco): CardRisco['exposicao'] {
  const hp = habitualidade(a.frequencia_exposicao)
  const titulo =
    hp.hab && hp.perm && hp.hab !== hp.perm
      ? `${hp.hab} e ${hp.perm.toLowerCase()}`
      : vazio(a.frequencia_exposicao)
  if (!titulo) return undefined
  return { titulo, detalhe: tempoExposicao(a) }
}

function avaliacaoDoRisco(d: DadosDocumento, a: AvaliacaoRisco): CardRisco['avaliacao'] {
  const pt = pontuacao(d, a)
  const matriz = d.matriz
  if (!matriz || pt.p == null || pt.s == null || pt.categoria == null || pt.pontos == null)
    return undefined
  const cp = matriz.criterios_probabilidade.find((c) => c.nivel === pt.p)
  const cs = matriz.criterios_severidade.find((c) => c.nivel === pt.s)
  const quantitativa = a.trilha_probabilidade === 'Quantitativa (medição)'
  return {
    probabilidade: {
      nivel: pt.p,
      nome: cp?.nome ?? '',
      texto: vazio(quantitativa ? cp?.quantitativo : cp?.qualitativo),
    },
    severidade: { nivel: pt.s, nome: cs?.nome ?? '', texto: vazio(cs?.descricao) },
    pontos: pt.pontos,
    categoria: pt.categoria,
    acao: vazio(pt.acao),
    prazoDias: pt.prazo ?? null,
    matriz: matrizMini(matriz, pt.p, pt.s),
  }
}

const ROTULO_LAUDO: Record<string, string> = {
  insalubridade: 'Conclusão neste laudo',
  periculosidade: 'Conclusão neste laudo',
  ltcat: 'Conclusão neste LTCAT',
}

export function montarCard(
  d: DadosDocumento,
  a: AvaliacaoRisco,
  tipo: TipoDocumentoSst,
): CardRisco {
  const ag = agenteDe(a)
  const categoria = categoriaDoRisco({ tipoAgente: ag?.tipo, trilha: a.trilha_probabilidade })
  const avaliacao = avaliacaoDoRisco(d, a)
  const aetTitulo = vazio(a.aet_situacao)
  const aep = vazio(a.resultado_aep_aet)
  const card: CardRisco = {
    categoria,
    nome: nomeAgente(a),
    referencias: referencias(ag, categoria),
    via: vazio(a.via_absorcao),
    nivel: avaliacao ? { rotulo: avaliacao.categoria, pontos: avaliacao.pontos } : undefined,
    medicao: montarMedicao(d, a, ag),
    exposicao: exposicao(a),
    avaliadoPor: avaliadoPor(d, a, categoria),
    aet:
      categoria === 'ergonomico' && aetTitulo
        ? {
            titulo: aetTitulo,
            detalhe: aep && aep !== 'Não avaliado' ? `resultado da AEP: ${aep}` : undefined,
          }
        : undefined,
    fonte: juntar([
      vazio(a.fonte_geradora),
      vazio(a.meio_propagacao) && `meio: ${a.meio_propagacao}`,
    ]),
    danos: vazio(a.danos_possiveis) || vazio(ag?.danos_saude_tipicos),
    medidas: medidas(d, a, tipo),
    avaliacao,
    leitura: vazio(a.comentario_tecnico),
  }
  if (tipo !== 'pgr') {
    const texto = conclusaoTexto(tipo, a)
    if (texto) {
      const justificativa =
        tipo === 'insalubridade'
          ? a.insalubridade_justificativa
          : tipo === 'periculosidade'
            ? a.periculosidade_justificativa
            : a.ltcat_justificativa
      card.conclusaoLaudo = {
        rotulo: ROTULO_LAUDO[tipo],
        texto,
        enquadramento: enquadramento(tipo, ag),
        justificativa: vazio(justificativa),
      }
    }
  }
  return card
}
