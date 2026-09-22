import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

/** Desenho do PDF. Cada layout tem capa, tipografia e tabela próprias. */
export type LayoutProposta = 'classico' | 'moderno' | 'minimalista'

export const LAYOUT_LABEL: Record<LayoutProposta, string> = {
  classico: 'Clássico',
  moderno: 'Moderno',
  minimalista: 'Minimalista',
}

export const LAYOUT_DESCRICAO: Record<LayoutProposta, string> = {
  classico:
    'Capa com faixa na cor da marca, tipografia sóbria e tabela de valores com bordas. É o formato mais parecido com uma proposta impressa tradicional.',
  moderno:
    'Capa colorida ocupando a página inteira, títulos de seção em blocos na cor da marca e tabela zebrada. Chama mais atenção na primeira página.',
  minimalista:
    'Sem capa, muito espaço em branco e tabela sem linhas. O documento começa direto no objeto da proposta, em duas ou três páginas.',
}

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
  padrao?: boolean
  ativo?: boolean
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

export const enviarArquivoModelo = (
  id: string,
  campo: 'logo' | 'imagem_capa',
  arquivo: File | null,
) => {
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
  campo: 'logo' | 'imagem_capa',
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
