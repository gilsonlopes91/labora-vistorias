import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

/** Desenho do PDF. Cada layout tem capa, tipografia e tabela próprias. */
export type LayoutProposta = 'classico' | 'moderno' | 'minimalista' | 'labora'

export const LAYOUT_LABEL: Record<LayoutProposta, string> = {
  classico: 'Clássico',
  moderno: 'Moderno',
  minimalista: 'Minimalista',
  labora: 'Labora completo',
}

export const LAYOUT_DESCRICAO: Record<LayoutProposta, string> = {
  classico:
    'Capa com faixa na cor da marca, tipografia sóbria e tabela de valores com bordas. É o formato mais parecido com uma proposta impressa tradicional.',
  moderno:
    'Capa colorida ocupando a página inteira, títulos de seção em blocos na cor da marca e tabela zebrada. Chama mais atenção na primeira página.',
  minimalista:
    'Sem capa, muito espaço em branco e tabela sem linhas. O documento começa direto no objeto da proposta, em duas ou três páginas. É o mais curto dos quatro.',
  labora:
    'Documento completo de cinco páginas, no desenho da proposta original da Labora: capa com logo e foto, página institucional com metodologia, valores e portfólio, escopo com normas e exclusões, página de investimento com dados bancários, e fechamento com responsabilidade técnica e termo de aceite.',
}

/** Bloco institucional usado só pelo layout "labora". */
export interface DadosInstitucionais {
  tagline?: string
  subtitulo?: string
  lema?: string
  telefone?: string
  email?: string
  cnpj?: string
  razao_social?: string
  cidade_emissao?: string
  banco?: {
    instituicao?: string
    agencia?: string
    conta?: string
    pix?: string
    favorecido?: string
  }
  etapas?: { num: string; titulo: string; desc: string }[]
  valores?: { titulo: string; desc: string }[]
  servicos?: string[]
}

export type CampoImagemModelo =
  | 'logo'
  | 'imagem_capa'
  | 'imagem_institucional'
  | 'imagem_servicos'
  | 'imagem_valores'
  | 'imagem_encerramento'

/** Seções que podem entrar ou sair do PDF, na ordem em que aparecem. */
export const SECOES_PROPOSTA = [
  { chave: 'capa', rotulo: 'Capa', ajuda: 'Página de abertura com logo, cliente e número' },
  {
    chave: 'apresentacao',
    rotulo: 'Apresentação da empresa',
    ajuda: 'Texto institucional antes do escopo',
  },
  { chave: 'objeto', rotulo: 'Objeto da proposta', ajuda: 'Título e descrição do serviço' },
  {
    chave: 'normas_referencia',
    rotulo: 'Normas de referência',
    ajuda: 'Lista de normas e leis aplicáveis',
  },
  { chave: 'itens_inclusos', rotulo: 'Itens inclusos', ajuda: 'O que está contemplado no preço' },
  {
    chave: 'itens_exclusos',
    rotulo: 'Itens não inclusos',
    ajuda: 'Exclusões, para evitar discussão depois',
  },
  {
    chave: 'tabela_valores',
    rotulo: 'Tabela de valores',
    ajuda: 'Itens, quantidades e valor total',
  },
  {
    chave: 'condicoes_pagamento',
    rotulo: 'Condições de pagamento',
    ajuda: 'Entrada, parcelas e forma de pagamento',
  },
  { chave: 'prazo_entrega', rotulo: 'Prazo de entrega', ajuda: 'Prazo de execução do serviço' },
  { chave: 'validade', rotulo: 'Validade da proposta', ajuda: 'Data limite para aceite' },
  {
    chave: 'responsavel_tecnico',
    rotulo: 'Responsável técnico',
    ajuda: 'Nome e registro no conselho',
  },
  { chave: 'encerramento', rotulo: 'Texto de encerramento', ajuda: 'Parágrafo final da proposta' },
  { chave: 'assinatura', rotulo: 'Campo de assinatura', ajuda: 'Linhas de aceite do cliente' },
] as const

export type ChaveSecao = (typeof SECOES_PROPOSTA)[number]['chave']

export type SecoesProposta = Partial<Record<ChaveSecao, boolean>>

export interface ModeloProposta extends RecordModel {
  id: string
  organizacao_id: string
  nome: string
  layout: LayoutProposta
  cor_primaria?: string
  cor_secundaria?: string
  logo?: string
  imagem_capa?: string
  secoes?: SecoesProposta
  texto_apresentacao?: string
  texto_encerramento?: string
  /** Escopo que vem preenchido no orçamento novo. Editável por proposta. */
  itens_inclusos_padrao?: string[]
  itens_exclusos_padrao?: string[]
  imagem_institucional?: string
  imagem_servicos?: string
  imagem_valores?: string
  imagem_encerramento?: string
  dados_institucionais?: DadosInstitucionais
  padrao?: boolean
  ativo?: boolean
  /** true (padrão): usa logo e cores de Configurações > Identidade visual. */
  usar_identidade_org?: boolean
  created: string
  updated: string
}

export const COR_PRIMARIA_PADRAO = '#6C8845'
export const COR_SECUNDARIA_PADRAO = '#202720'

export const getModelosProposta = () =>
  pb.collection('modelos_proposta').getFullList<ModeloProposta>({ sort: '-padrao,nome' })

export const getModeloProposta = (id: string) =>
  pb.collection('modelos_proposta').getOne<ModeloProposta>(id)

export const updateModeloProposta = (
  id: string,
  dados: Partial<Omit<ModeloProposta, 'logo' | 'imagem_capa'>>,
) => pb.collection('modelos_proposta').update<ModeloProposta>(id, dados)

/** Cópia de um modelo (sem as imagens), para criar uma variação. */
export const duplicarModeloProposta = (modelo: ModeloProposta) =>
  pb.collection('modelos_proposta').create<ModeloProposta>({
    organizacao_id: modelo.organizacao_id,
    nome: `${modelo.nome} (cópia)`,
    layout: modelo.layout,
    cor_primaria: modelo.cor_primaria,
    cor_secundaria: modelo.cor_secundaria,
    secoes: modelo.secoes,
    texto_apresentacao: modelo.texto_apresentacao,
    texto_encerramento: modelo.texto_encerramento,
    itens_inclusos_padrao: modelo.itens_inclusos_padrao,
    itens_exclusos_padrao: modelo.itens_exclusos_padrao,
    dados_institucionais: modelo.dados_institucionais,
    usar_identidade_org: modelo.usar_identidade_org !== false,
    padrao: false,
    ativo: true,
  })

export const enviarArquivoModelo = (id: string, campo: CampoImagemModelo, arquivo: File | null) => {
  if (arquivo === null) {
    return pb.collection('modelos_proposta').update<ModeloProposta>(id, { [campo]: null })
  }
  const fd = new FormData()
  fd.append(campo, arquivo)
  return pb.collection('modelos_proposta').update<ModeloProposta>(id, fd)
}

/** Só um modelo por organização fica marcado como padrão. */
export const definirModeloPadrao = async (id: string) => {
  const todos = await getModelosProposta()
  for (const modelo of todos) {
    const deveSerPadrao = modelo.id === id
    if (!!modelo.padrao !== deveSerPadrao) {
      await pb.collection('modelos_proposta').update(modelo.id, { padrao: deveSerPadrao })
    }
  }
}

export const urlArquivoModelo = (
  modelo: ModeloProposta,
  campo: CampoImagemModelo,
): string | null => {
  const nome = modelo[campo]
  return nome ? pb.files.getURL(modelo, nome) : null
}

/** Uma seção sem valor gravado conta como ligada. */
export const secaoAtiva = (modelo: ModeloProposta | null, chave: ChaveSecao): boolean => {
  if (!modelo?.secoes) return true
  const valor = modelo.secoes[chave]
  return valor === undefined ? true : !!valor
}
