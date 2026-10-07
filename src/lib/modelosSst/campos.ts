/* Campos do documento (fora dos blocos repetidos): um resolver por campo
   canônico do dicionário (src/modelos-sst/dicionario.json). Campo de origem
   "manual" vem de documento.campos_manuais. Campo sem valor devolve
   undefined e vira pendência — nunca um valor inventado. */
import dicionarioJson from '@/modelos-sst/dicionario.json'
import type { CampoDicionario } from '@/modelos-sst/tipos'
import { formatarRegistroRT } from '@/services/responsaveisTecnicos'
import { TIPO_DOCUMENTO_LABEL } from '@/services/documentosSst'
import type { DadosDocumento } from './dados'

export const DICIONARIO = dicionarioJson as Record<string, CampoDicionario>

export type Valores = Record<string, string | undefined>

// ---------- formatação ----------
export const fData = (iso?: string | Date | null): string | undefined => {
  if (!iso) return undefined
  const d = typeof iso === 'string' ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso) : iso
  if (Number.isNaN(d.getTime())) return undefined
  return d.toLocaleDateString('pt-BR')
}
export const fMesAno = (d: Date) =>
  d.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
export const fNum = (n?: number | null, casas = 1): string | undefined =>
  n == null || Number.isNaN(n)
    ? undefined
    : n.toLocaleString('pt-BR', { maximumFractionDigits: casas })
export const fMoeda = (n?: number | null): string | undefined =>
  n == null ? undefined : `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
export const simNao = (v?: boolean | null): string | undefined =>
  v == null ? undefined : v ? 'Sim' : 'Não'
export const vazio = (s?: string | null) => (s && s.trim() ? s.trim() : undefined)

const somarMeses = (d: Date, meses: number) => {
  const r = new Date(d)
  r.setMonth(r.getMonth() + meses)
  return r
}

/** Período de revisão em meses: 36 se a organização tem certificação em SGSST
 *  (alternativa 17.alt1 do PGR na opção 2), senão 24 (NR-1, item 1.5.4.4.6). */
export function mesesRevisao(dados: DadosDocumento): number {
  const alt = dados.documento.alternativas || {}
  return alt['17.alt1'] === 'op2' ? 36 : 24
}

const refDocumento = (d?: { versao?: number; data_emissao?: string } | null, tipo?: string) =>
  d
    ? `${tipo || 'documento'} versão ${d.versao ?? '—'}, emitido em ${fData(d.data_emissao) ?? '—'}`
    : undefined

/** Resolve todos os campos de nível de documento. */
export function resolverCamposDocumento(dados: DadosDocumento): Valores {
  const { empresa, organizacao, documento, autor, coordenador } = dados
  const org = organizacao.dados || {}
  const manuais = documento.campos_manuais || {}
  const totalFuncoes = dados.funcoes.reduce((s, f) => s + (f.numero_empregados || 0), 0)
  const anterior = dados.revisoes[dados.revisoes.length - 1]
  const ltcat = dados.emitidos.ltcat
  const pgr = dados.emitidos.pgr
  const insal = dados.emitidos.insalubridade
  const peric = dados.emitidos.periculosidade

  const v: Valores = {
    // organização que emite
    NOME_EMPRESA_SST: vazio(org.razao_social) || vazio(organizacao.nome),
    ENDERECO_EMPRESA_SST: vazio(org.endereco),
    CNPJ_EMPRESA_SST: vazio(org.cnpj),
    EMAIL_EMPRESA_SST: vazio(org.email),
    TELEFONE_EMPRESA_SST: vazio(org.telefone),
    // empresa cliente
    RAZAO_SOCIAL: vazio(empresa.razao_social),
    NOME_FANTASIA: vazio(empresa.nome_fantasia) || vazio(empresa.razao_social),
    CNPJ: vazio(empresa.cnpj),
    ENDERECO_COMPLETO: vazio(empresa.endereco),
    TELEFONE: vazio(empresa.contato_telefone),
    CNAE_PRINCIPAL: vazio(empresa.cnae),
    DESCRICAO_CNAE: vazio(empresa.cnae_descricao),
    GRAU_RISCO_NR4: empresa.grau_risco != null ? String(empresa.grau_risco) : undefined,
    NOME_ESTABELECIMENTO:
      vazio(empresa.nome_estabelecimento) ||
      vazio(empresa.nome_fantasia) ||
      vazio(empresa.razao_social),
    NUM_TRABALHADORES:
      empresa.numero_funcionarios != null ? String(empresa.numero_funcionarios) : undefined,
    ENQUADRAMENTO_PORTE: vazio(empresa.porte),
    CIDADE: vazio(documento.cidade_emissao) || vazio(empresa.cidade) || vazio(org.cidade_emissao),
    DESCRICAO_PROCESSO_PRODUTIVO: vazio(empresa.descricao_processo_produtivo),
    JORNADA_TRABALHO: vazio(empresa.jornada_trabalho),
    HORARIO_TRABALHO: vazio(empresa.horario_trabalho),
    TURNOS_TRABALHO: vazio(empresa.turnos_trabalho),
    GESTAO_SST: vazio(empresa.gestao_sst),
    NOME_REPRESENTANTE_EMPRESA: vazio(empresa.representante_legal_nome),
    CARGO_REPRESENTANTE_EMPRESA: vazio(empresa.representante_legal_cargo),
    NOME_ACOMPANHANTE_EMPRESA:
      vazio(manuais.NOME_ACOMPANHANTE_EMPRESA) || vazio(empresa.pgr_participantes),
    CONVENCAO_COLETIVA_SIM_NAO: simNao(empresa.convencao_coletiva_insalubridade ?? false),
    CONVENCAO_COLETIVA_CLAUSULA: empresa.convencao_coletiva_insalubridade
      ? vazio(empresa.convencao_coletiva_clausula)
      : 'não se aplica',
    AREA_CONSTRUIDA_PAVIMENTOS: vazio(empresa.area_construida_pavimentos),
    NUMERO_CNO: vazio(empresa.numero_cno) || 'não se aplica',
    CANAL_COMUNICACAO: vazio(empresa.canal_comunicacao),
    NOME_RESPONSAVEL_PLANO: vazio(empresa.responsavel_plano_nome),
    CARGO_RESPONSAVEL_PLANO: vazio(empresa.responsavel_plano_cargo),
    PERIODICIDADE_ACOMPANHAMENTO: vazio(empresa.periodicidade_acompanhamento),
    FORMA_ACESSO_DOCUMENTO: vazio(empresa.forma_acesso_documento),
    LOCAL_GUARDA: vazio(empresa.local_guarda),
    AVCB_OU_CLCB: vazio(empresa.avcb_clcb),
    // responsáveis técnicos
    NOME_AUTOR: autor?.nome,
    REGISTRO_AUTOR: autor ? formatarRegistroRT(autor) : undefined,
    NOME_COORDENADOR: coordenador?.nome || 'não se aplica',
    REGISTRO_COORDENADOR: coordenador ? formatarRegistroRT(coordenador) : 'não se aplica',
    CONSELHO_ART: autor
      ? `${autor.tipo_registro}${autor.uf ? '-' + autor.uf.toUpperCase() : ''}`
      : undefined,
    NUMERO_ART: vazio(documento.numero_art),
    // documento
    VERSAO_DOCUMENTO: String(dados.versao),
    DATA_EMISSAO: fData(dados.dataEmissao),
    DATA_INICIO_VALIDADE: fData(dados.dataEmissao),
    DATA_REVISAO_ATE: fData(somarMeses(dados.dataEmissao, mesesRevisao(dados))),
    DATA_LEVANTAMENTO:
      fData(documento.data_levantamento) || fData(empresa.pgr_data_inicio_levantamento),
    PERIODO_INICIO:
      fData(documento.data_levantamento) || fData(empresa.pgr_data_inicio_levantamento),
    PERIODO_FIM: fData(dados.dataEmissao),
    PERIODICIDADE_REVISAO: mesesRevisao(dados) === 36 ? '3 anos' : '2 anos',
    TIPO_EMISSAO: anterior
      ? `Revisão do laudo de ${fData(anterior.data_emissao) ?? '—'}`
      : 'Emissão inicial',
    DATA_LAUDO_ANTERIOR: fData(anterior?.data_emissao),
    NUM_GHE: String(dados.ghes.length),
    NUM_TRABALHADORES_AVALIADOS:
      totalFuncoes > 0
        ? String(totalFuncoes)
        : empresa.numero_funcionarios != null
          ? String(empresa.numero_funcionarios)
          : undefined,
    // referências cruzadas
    REFERENCIA_LTCAT: refDocumento(ltcat, TIPO_DOCUMENTO_LABEL.ltcat),
    DATA_LTCAT: fData(ltcat?.data_emissao),
    DATA_PGR: fData(pgr?.data_emissao),
    REFERENCIA_LAUDO_INSALUBRIDADE: refDocumento(insal, TIPO_DOCUMENTO_LABEL.insalubridade),
    REFERENCIA_LAUDO_PERICULOSIDADE: refDocumento(peric, TIPO_DOCUMENTO_LABEL.periculosidade),
  }

  // Campos manuais: o que o técnico digitou no painel entra por cima.
  for (const [campo, valor] of Object.entries(manuais)) {
    if (vazio(valor)) v[campo] = valor.trim()
  }
  return v
}

/** Campos que bloqueiam a emissão quando vazios. */
export const CAMPOS_CRITICOS = [
  'RAZAO_SOCIAL',
  'CNPJ',
  'NOME_AUTOR',
  'REGISTRO_AUTOR',
  'DATA_LEVANTAMENTO',
  'CIDADE',
  'NOME_EMPRESA_SST',
]

/** Campos de nível de documento que são manuais (preenchidos no painel). */
export function camposManuaisDoModelo(camposUsados: string[]): string[] {
  return camposUsados.filter((c) => DICIONARIO[c]?.origem === 'manual')
}
