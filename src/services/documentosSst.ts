/* Documentos de SST (PGR, LTCAT, laudos) — migration 0148. Um documento é um
 * "rascunho" editável por seções até ser emitido; a partir daí fica travado
 * (o backend bloqueia updates com status = 'emitido') e qualquer alteração
 * exige uma nova revisão, encadeada por documento_anterior_id. */
import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export type TipoDocumentoSst = 'pgr' | 'ltcat' | 'insalubridade' | 'periculosidade'
export type StatusDocumentoSst = 'rascunho' | 'em_revisao' | 'emitido' | 'substituido'

export interface SecaoDocumento {
  id: string
  titulo: string
  ativo: boolean
  ordem: number
  texto: string
}

export interface DocumentoSst extends RecordModel {
  id: string
  organizacao_id: string
  empresa_id: string
  tipo: TipoDocumentoSst
  titulo: string
  versao?: number
  status: StatusDocumentoSst
  motivo_revisao?: string
  matriz_id?: string
  matriz_snapshot?: Record<string, unknown>
  responsaveis_tecnicos_ids?: string[]
  elaboradores?: string
  data_avaliacao_campo?: string
  data_emissao?: string
  vigencia_ate?: string
  proxima_revisao?: string
  secoes?: SecaoDocumento[]
  abrangencia_ghe_ids?: string[]
  /** Planos de ação escolhidos para entrar neste documento (vazio/ausente =
   *  entram todas as ações da empresa, comportamento anterior). */
  planos_acao_ids?: string[]
  pdf?: string
  pdf_hash_sha256?: string
  dados_emissao?: Record<string, unknown>
  emitido_por?: string
  /** Confirmada com a senha do emissor no momento de emitir (migration 0156). */
  assinatura_confirmada_em?: string
  link_publico_chave?: string
  link_publico_ativo?: boolean
  documento_anterior_id?: string
  /** Modelos Gerais (migration 0181): autor e coordenador, escolhas das
   *  alternativas, configuração dos blocos, campos manuais e pendências. */
  autor_rt_id?: string
  coordenador_rt_id?: string
  alternativas?: Record<string, string>
  blocos_config?: Record<string, { incluir?: boolean; observacao?: string }>
  campos_manuais?: Record<string, string>
  pendencias?: { campo: string; motivo: string }[]
  data_levantamento?: string
  cidade_emissao?: string
  numero_art?: string
  modelo_versao?: string
  created: string
  updated: string
}

export type DocumentoSstInput = Partial<Omit<DocumentoSst, 'id' | 'created' | 'updated'>> & {
  organizacao_id: string
  empresa_id: string
  tipo: TipoDocumentoSst
  titulo: string
  status: StatusDocumentoSst
}

/** Rótulos e nomes de exibição dos 4 tipos de documento suportados. */
export const TIPO_DOCUMENTO_LABEL: Record<TipoDocumentoSst, string> = {
  pgr: 'PGR',
  ltcat: 'LTCAT',
  insalubridade: 'Laudo de Insalubridade',
  periculosidade: 'Laudo de Periculosidade',
}

export const TIPO_DOCUMENTO_TITULO_PADRAO: Record<TipoDocumentoSst, string> = {
  pgr: 'PGR',
  ltcat: 'LTCAT',
  insalubridade: 'Laudo de Insalubridade (NR-15)',
  periculosidade: 'Laudo de Periculosidade (NR-16)',
}

const secao = (titulo: string, ordem: number, texto: string): SecaoDocumento => ({
  id: crypto.randomUUID(),
  titulo,
  ativo: true,
  ordem,
  texto,
})

/** Seções padrão de um PGR novo, já com o texto normativo/metodológico
 * básico preenchido (fundamentação legal e metodologia não mudam de
 * empresa para empresa); as partes que dependem dos dados de cada empresa
 * ficam com um texto-guia entre colchetes, para o usuário completar.
 * Inventário e plano de ação entram no PDF direto dos dados atuais, não
 * como seção editável aqui. */
export const secoesPadraoPgr = (): SecaoDocumento[] => [
  secao(
    'Objetivo e campo de aplicação',
    0,
    '<p>Este Programa de Gerenciamento de Riscos (PGR) tem por objetivo antecipar, ' +
      'reconhecer, avaliar e controlar os riscos ocupacionais existentes ou que venham a ' +
      'existir no ambiente de trabalho, em atendimento à Norma Regulamentadora nº 1 (NR-1), ' +
      'item 1.5, aprovada pela Portaria MTP nº 6.730/2020 e alterações posteriores.</p>' +
      '<p>Aplica-se a todos os empregados, prestadores de serviço e demais pessoas que ' +
      'exerçam atividades nas dependências e locais de trabalho da empresa contratante, ' +
      'contemplando todos os riscos ocupacionais: físicos, químicos, biológicos, ' +
      'ergonômicos e de acidentes.</p>',
  ),
  secao(
    'Base legal',
    1,
    '<p>Este documento tem fundamento na Constituição Federal de 1988 (art. 7º, incisos ' +
      'XXII e XXIII), na Consolidação das Leis do Trabalho – CLT (arts. 157, 158 e 166 a ' +
      '169) e nas seguintes Normas Regulamentadoras do Ministério do Trabalho e Emprego:</p>' +
      '<ul><li>NR-1 – Disposições Gerais e Gerenciamento de Riscos Ocupacionais;</li>' +
      '<li>NR-9 – Avaliação e Controle das Exposições Ocupacionais a Agentes Físicos, ' +
      'Químicos e Biológicos;</li>' +
      '<li>NR-15 e NR-16 – Caracterização de insalubridade e periculosidade, quando ' +
      'aplicável;</li>' +
      '<li>NR-17 – Ergonomia;</li>' +
      '<li>Demais Normas Regulamentadoras específicas às atividades desenvolvidas pela ' +
      'empresa.</li></ul>',
  ),
  secao(
    'Metodologia de avaliação de riscos',
    2,
    '<p>A identificação e avaliação dos riscos ocupacionais seguiu as etapas previstas na ' +
      'NR-1: levantamento preliminar de perigos, caracterização das atividades e funções, ' +
      'identificação dos Grupos Homogêneos de Exposição (GHE), classificação dos riscos por ' +
      'probabilidade e severidade em matriz de risco, e definição do plano de ação.</p>' +
      '<p>Foram utilizadas, sempre que aplicável, avaliações quantitativas (medições) e ' +
      'qualitativas (observação e entrevista), em conformidade com a NR-9 e as Normas de ' +
      'Higiene Ocupacional (NHO) da Fundacentro.</p>',
  ),
  secao(
    'Conclusões',
    3,
    '<p>[Preencher com a síntese dos riscos identificados por unidade/setor/função, ' +
      'indicando os riscos classificados como críticos ou que exigem controle imediato, ' +
      'conforme o Inventário de Riscos e a Matriz de Risco vinculados a esta empresa nesta ' +
      'plataforma.]</p>',
  ),
  secao(
    'Recomendações gerais',
    4,
    '<p>Recomenda-se a implementação e o acompanhamento das medidas descritas no Plano de ' +
      'Ação vinculado a este PGR, priorizando a eliminação do risco na fonte, seguida das ' +
      'medidas de proteção coletiva, administrativas/organizacionais e, por último, o uso ' +
      'de Equipamento de Proteção Individual (EPI).</p>' +
      '<p>Este documento deve ser revisado, no mínimo, uma vez a cada dois anos, ou antes ' +
      'desse prazo sempre que houver mudança relevante no processo, no ambiente de ' +
      'trabalho, na ocorrência de acidentes/doenças ocupacionais, ou por determinação da ' +
      'fiscalização do trabalho.</p>',
  ),
]

/** Seções padrão de um LTCAT novo. */
export const secoesPadraoLtcat = (): SecaoDocumento[] => [
  secao(
    'Objetivo e campo de aplicação',
    0,
    '<p>O presente Laudo Técnico das Condições Ambientais de Trabalho (LTCAT) tem por ' +
      'objetivo avaliar as condições ambientais de trabalho da empresa quanto à existência ' +
      'de exposição a agentes nocivos químicos, físicos e biológicos, para fins de ' +
      'caracterização (ou não) de tempo de trabalho especial, nos termos do art. 58 da Lei ' +
      'nº 8.213/1991 e do Anexo IV do Decreto nº 3.048/1999.</p>' +
      '<p>Aplica-se a todos os cargos e funções da empresa, contemplando as informações ' +
      'necessárias ao preenchimento do Perfil Profissiográfico Previdenciário (PPP) e ao ' +
      'eSocial (eventos S-2240).</p>',
  ),
  secao(
    'Base legal',
    1,
    '<p>Fundamentam este laudo: a Lei nº 8.213/1991 (art. 58), o Decreto nº 3.048/1999 ' +
      '(Regulamento da Previdência Social, Anexo IV), a Lei nº 9.528/1997, a Instrução ' +
      'Normativa PRES/INSS nº 128/2022, a Norma Regulamentadora nº 15 (NR-15) e as Normas ' +
      'de Higiene Ocupacional da Fundacentro (NHO-01, NHO-06, NHO-07, NHO-08, NHO-09, ' +
      'NHO-10 e NHO-11), conforme o agente avaliado.</p>',
  ),
  secao(
    'Metodologia de avaliação',
    2,
    '<p>A avaliação ambiental foi realizada por meio de inspeção técnica nos postos de ' +
      'trabalho, entrevista com os trabalhadores e, quando necessário, medições ' +
      'quantitativas dos agentes físicos e químicos, adotando os procedimentos e limites ' +
      'de tolerância previstos nas Normas de Higiene Ocupacional (NHO) da Fundacentro e na ' +
      'NR-15.</p>' +
      '<p>Para os agentes sem avaliação quantitativa obrigatória (por exemplo, agentes ' +
      'biológicos), a caracterização seguiu critério qualitativo, considerando a natureza ' +
      'da atividade e o contato habitual e permanente com a fonte de risco.</p>',
  ),
  secao(
    'Caracterização dos agentes nocivos por GHE/função',
    3,
    '<p>[Preencher com a relação de Grupos Homogêneos de Exposição (GHE)/funções ' +
      'avaliados, o(s) agente(s) nocivo(s) identificado(s) em cada um, a ' +
      'intensidade/concentração medida (quando houver) e o respectivo limite de ' +
      'tolerância, conforme o Inventário de Riscos vinculado a esta empresa nesta ' +
      'plataforma.]</p>',
  ),
  secao(
    'Conclusão quanto à aposentadoria especial',
    4,
    '<p>[Preencher, para cada GHE/função avaliado, se a exposição ao(s) agente(s) ' +
      'nocivo(s) ocorre de forma habitual e permanente, não ocasional nem intermitente, e ' +
      'se ultrapassa os limites de tolerância ou exige avaliação qualitativa positiva — ' +
      'condição que caracteriza (ou não) o direito à contagem de tempo especial, nos ' +
      'termos do Decreto nº 3.048/1999.]</p>',
  ),
  secao(
    'Recomendações e medidas de controle',
    5,
    '<p>Recomenda-se a adoção das medidas de proteção coletiva e, complementarmente, o ' +
      'fornecimento e uso de Equipamento de Proteção Individual (EPI) com Certificado de ' +
      'Aprovação (CA) vigente e eficácia comprovada para o agente avaliado, sem prejuízo ' +
      'da caracterização da exposição para fins previdenciários quando esta decorrer de ' +
      'agentes que, mesmo com uso de EPI eficaz, não afastam o enquadramento como tempo ' +
      'especial (ex.: ruído).</p>' +
      '<p>Este laudo deve ser atualizado sempre que houver alteração relevante no ' +
      'ambiente, no processo de trabalho ou na legislação aplicável.</p>',
  ),
]

/** Seções padrão de um Laudo de Insalubridade (NR-15) novo. */
export const secoesPadraoInsalubridade = (): SecaoDocumento[] => [
  secao(
    'Objetivo e campo de aplicação',
    0,
    '<p>Este Laudo de Insalubridade tem por objetivo caracterizar, tecnicamente, a ' +
      'exposição dos trabalhadores a agentes nocivos à saúde acima dos limites de ' +
      'tolerância, para fins de pagamento do adicional de insalubridade previsto no art. ' +
      '192 da CLT, e de identificar as medidas de eliminação ou neutralização do risco.</p>',
  ),
  secao(
    'Base legal',
    1,
    '<p>Fundamentam este laudo os arts. 189 a 197 da CLT, a Norma Regulamentadora nº 15 ' +
      '(NR-15) e seus Anexos, e as Normas de Higiene Ocupacional da Fundacentro aplicáveis ' +
      'a cada agente avaliado.</p>',
  ),
  secao(
    'Metodologia de avaliação e verificação da eficácia do EPI',
    2,
    '<p>A caracterização da insalubridade seguiu os critérios técnicos e os limites de ' +
      'tolerância definidos nos Anexos da NR-15 para cada agente (ruído, calor, agentes ' +
      'químicos, radiações, entre outros), por meio de avaliação qualitativa e, quando ' +
      'exigido pela norma, quantitativa.</p>' +
      '<p>Nos cargos em que a exposição é controlada por Equipamento de Proteção ' +
      'Individual (EPI), foi avaliada a eficácia do EPI mediante sete critérios: Eficácia ' +
      '(EF), Medida de Proteção Prévia (MP), Prazo de Validade (PV), Condições de ' +
      'Funcionamento (CF), Uso Ininterrupto (UI), Periodicidade de Troca (PT) e ' +
      'Higienização (HG). O EPI só é considerado apto a neutralizar o risco quando atende ' +
      'a todos os critérios.</p>',
  ),
  secao(
    'Caracterização da insalubridade por cargo/função',
    3,
    '<p>[Preencher com os cargos/funções avaliados, o(s) agente(s) nocivo(s), a ' +
      'intensidade/concentração medida (quando houver), o Anexo da NR-15 aplicável e o ' +
      'resultado da verificação de eficácia do EPI, conforme o Inventário de Riscos ' +
      'vinculado a esta empresa nesta plataforma.]</p>',
  ),
  secao(
    'Conclusão e enquadramento',
    4,
    '<p>[Preencher com a conclusão, por cargo/função, quanto à caracterização (ou não) de ' +
      'insalubridade e o respectivo grau — mínimo (10%), médio (20%) ou máximo (40%) do ' +
      'salário mínimo, na forma do art. 192 da CLT.]</p>',
  ),
  secao(
    'Recomendações',
    5,
    '<p>Recomenda-se a adoção de medidas de eliminação do agente insalubre na fonte ou, na ' +
      'sua impossibilidade, a neutralização por meio de EPI eficaz, nos termos do art. 191 ' +
      'da CLT, além do acompanhamento periódico das condições ambientais e da manutenção ' +
      'deste laudo atualizado.</p>',
  ),
]

/** Seções padrão de um Laudo de Periculosidade (NR-16) novo. */
export const secoesPadraoPericulosidade = (): SecaoDocumento[] => [
  secao(
    'Objetivo e campo de aplicação',
    0,
    '<p>Este Laudo de Periculosidade tem por objetivo caracterizar, tecnicamente, o ' +
      'exercício de atividades ou operações perigosas pelos trabalhadores da empresa, para ' +
      'fins de pagamento do adicional de periculosidade previsto no art. 193 da CLT.</p>',
  ),
  secao(
    'Base legal',
    1,
    '<p>Fundamentam este laudo o art. 193 da CLT, a Norma Regulamentadora nº 16 (NR-16) e ' +
      'seus Anexos, a Lei nº 7.369/1985 (periculosidade para eletricitários) e a Lei nº ' +
      '12.740/2012.</p>',
  ),
  secao(
    'Metodologia de avaliação',
    2,
    '<p>A caracterização da periculosidade considerou o contato permanente ou o exercício ' +
      'de atividades em área de risco acentuado com inflamáveis, explosivos, energia ' +
      'elétrica, radiações ionizantes, roubo/violência física (segurança patrimonial) ou ' +
      'motocicleta, conforme os Anexos da NR-16, avaliando o tempo e as condições de ' +
      'exposição de cada cargo/função.</p>',
  ),
  secao(
    'Caracterização da periculosidade por cargo/função',
    3,
    '<p>[Preencher com os cargos/funções avaliados, a atividade/área de risco ' +
      'identificada, o Anexo da NR-16 aplicável e as evidências que fundamentam a ' +
      'caracterização, conforme o Inventário de Riscos vinculado a esta empresa nesta ' +
      'plataforma.]</p>',
  ),
  secao(
    'Conclusão e enquadramento',
    4,
    '<p>[Preencher com a conclusão, por cargo/função, quanto à caracterização (ou não) da ' +
      'periculosidade, indicando o Anexo da NR-16 correspondente. O adicional de ' +
      'periculosidade corresponde a 30% sobre o salário do empregado, sem os acréscimos de ' +
      'gratificações, prêmios ou participação nos lucros, nos termos do art. 193, §1º, da ' +
      'CLT.]</p>',
  ),
  secao(
    'Recomendações',
    5,
    '<p>Recomenda-se a adoção de medidas de controle do risco (isolamento, sinalização, ' +
      'procedimentos de segurança) e a manutenção deste laudo atualizado sempre que houver ' +
      'alteração relevante nas atividades, no leiaute ou na legislação aplicável.</p>',
  ),
]

/** Seções padrão para um documento novo, de acordo com o tipo escolhido. */
export const secoesPadrao = (tipo: TipoDocumentoSst): SecaoDocumento[] => {
  switch (tipo) {
    case 'ltcat':
      return secoesPadraoLtcat()
    case 'insalubridade':
      return secoesPadraoInsalubridade()
    case 'periculosidade':
      return secoesPadraoPericulosidade()
    default:
      return secoesPadraoPgr()
  }
}

export const getDocumentosSst = (empresaId: string, tipo: TipoDocumentoSst) =>
  pb.collection('documentos_sst').getFullList<DocumentoSst>({
    filter: `empresa_id = "${empresaId}" && tipo = "${tipo}"`,
    sort: '-created',
  })

export const getDocumentoSst = (id: string) =>
  pb.collection('documentos_sst').getOne<DocumentoSst>(id)

/** Documentos emitidos de uma empresa, de qualquer tipo — usado no portal do
 *  cliente (só vê o que já foi emitido, nunca rascunho). */
export const getDocumentosEmitidos = (empresaId: string) =>
  pb.collection('documentos_sst').getFullList<DocumentoSst>({
    filter: `empresa_id = "${empresaId}" && status = "emitido"`,
    sort: '-data_emissao',
  })

export const createDocumentoSst = (data: DocumentoSstInput) =>
  pb.collection('documentos_sst').create<DocumentoSst>(data)

export const updateDocumentoSst = (id: string, data: Partial<DocumentoSstInput>) =>
  pb.collection('documentos_sst').update<DocumentoSst>(id, data)

export const deleteDocumentoSst = (id: string) => pb.collection('documentos_sst').delete(id)

/** Cria um novo rascunho a partir de um documento emitido, para poder editar
 * de novo (o documento emitido em si nunca é alterado). */
export const revisarDocumentoSst = (documento: DocumentoSst, motivoRevisao: string) =>
  pb.collection('documentos_sst').create<DocumentoSst>({
    organizacao_id: documento.organizacao_id,
    empresa_id: documento.empresa_id,
    tipo: documento.tipo,
    titulo: documento.titulo,
    status: 'rascunho',
    motivo_revisao: motivoRevisao,
    elaboradores: documento.elaboradores,
    responsaveis_tecnicos_ids: documento.responsaveis_tecnicos_ids,
    secoes: documento.secoes,
    documento_anterior_id: documento.id,
  })

/** Emite o documento: trava a versão, anexa o PDF gerado e, se for revisão
 * de um documento anterior, marca o anterior como substituído. */
export const emitirDocumentoSst = async (
  documento: DocumentoSst,
  dados: {
    matriz_id?: string
    matriz_snapshot?: Record<string, unknown>
    dados_emissao: Record<string, unknown>
    emitido_por: string
    /** Confirmada por reautenticação de senha, no ato de emitir. */
    assinatura_confirmada_em: string
    /** Chave da página pública de verificação (/verificar/<chave>). */
    link_publico_chave: string
  },
  pdfBlob: Blob,
  nomeArquivo: string,
  pdfHashSha256: string,
) => {
  const proximaVersao = (documento.versao || 0) + 1
  const fd = new FormData()
  fd.append('status', 'emitido')
  fd.append('versao', String(proximaVersao))
  if (dados.matriz_id) fd.append('matriz_id', dados.matriz_id)
  if (dados.matriz_snapshot) fd.append('matriz_snapshot', JSON.stringify(dados.matriz_snapshot))
  fd.append('dados_emissao', JSON.stringify(dados.dados_emissao))
  fd.append('data_emissao', new Date().toISOString())
  fd.append('emitido_por', dados.emitido_por)
  fd.append('pdf_hash_sha256', pdfHashSha256)
  fd.append('assinatura_confirmada_em', dados.assinatura_confirmada_em)
  fd.append('link_publico_chave', dados.link_publico_chave)
  fd.append('link_publico_ativo', 'true')
  fd.append('pdf', new File([pdfBlob], nomeArquivo, { type: 'application/pdf' }))
  const emitido = await pb.collection('documentos_sst').update<DocumentoSst>(documento.id, fd)
  if (documento.documento_anterior_id) {
    await pb.collection('documentos_sst').update(documento.documento_anterior_id, {
      status: 'substituido',
    })
  }
  return emitido
}

/** Página pública de verificação (/verificar/:chave) — sem login. */
export interface VerificacaoDocumento {
  tipo: string
  titulo: string
  versao: number
  data_emissao: string
  assinatura_confirmada_em: string
  profissional: string
  registro: string
  organizacao: string
  pdf_hash_sha256: string
}

export const getVerificacaoDocumento = (chave: string) =>
  pb.send<VerificacaoDocumento>(`/backend/v1/verificar/${chave}`, { method: 'GET' })

export const getTokenArquivos = () => pb.files.getToken()

export const pdfUrlDocumentoSst = (documento: DocumentoSst, token?: string) =>
  documento.pdf ? pb.files.getURL(documento, documento.pdf, token ? { token } : undefined) : null
