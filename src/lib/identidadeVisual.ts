/* Identidade visual da organização (logo PNG e duas cores), aplicada em todos
   os documentos gerados: proposta comercial, relatório de vistoria e o que vier
   depois. Configurada em Configurações > Identidade visual.
   Quem ainda não enviou logo e cores recebe um padrão neutro (sem logo, cores
   cinza-azuladas), para o documento do cliente não parecer da Labora. Só a
   própria Labora usa o logo e o verde da Labora como padrão. */
import {
  getMinhaOrganizacao,
  urlLogoOrganizacao,
  type DadosDocumentos,
} from '@/services/organizacoes'
import type { ModeloProposta } from '@/services/modelosProposta'

export const COR_PRIMARIA_LABORA = '#6C8845'
export const COR_SECUNDARIA_LABORA = '#202720'
export const COR_PRIMARIA_NEUTRA = '#475569'
export const COR_SECUNDARIA_NEUTRA = '#1E293B'

/** A organização da própria Labora (usa o logo e as cores da Labora como padrão). */
export const ehOrganizacaoLabora = (nome?: string) => /\blabora\b/i.test(nome || '')

/** Cores usadas quando a organização ainda não escolheu as suas. */
export const coresPadrao = (nomeOrganizacao?: string) =>
  ehOrganizacaoLabora(nomeOrganizacao)
    ? { primaria: COR_PRIMARIA_LABORA, secundaria: COR_SECUNDARIA_LABORA }
    : { primaria: COR_PRIMARIA_NEUTRA, secundaria: COR_SECUNDARIA_NEUTRA }

export interface IdentidadeVisual {
  nome: string
  corPrimaria: string
  corSecundaria: string
  logoUrl: string | null
  dados?: DadosDocumentos
}

export type RGB = [number, number, number]

export const hexValido = (hex?: string) => !!hex && /^#[0-9a-fA-F]{6}$/.test(hex.trim())

export const hexParaRgb = (hex: string | undefined, padrao: RGB): RGB => {
  if (!hexValido(hex)) return padrao
  const n = parseInt(hex!.trim().slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Mistura a cor com branco (fator 0 = cor pura, 1 = branco). */
export const clarear = (cor: RGB, fator = 0.88): RGB =>
  cor.map((c) => Math.round(c + (255 - c) * fator)) as RGB

export async function carregarIdentidade(): Promise<IdentidadeVisual> {
  try {
    const org = await getMinhaOrganizacao()
    const padrao = coresPadrao(org.nome)
    return {
      nome: org.nome,
      corPrimaria: hexValido(org.cor_primaria) ? org.cor_primaria! : padrao.primaria,
      corSecundaria: hexValido(org.cor_secundaria) ? org.cor_secundaria! : padrao.secundaria,
      logoUrl: urlLogoOrganizacao(org),
      dados: org.dados_documentos || undefined,
    }
  } catch {
    return {
      nome: '',
      corPrimaria: COR_PRIMARIA_NEUTRA,
      corSecundaria: COR_SECUNDARIA_NEUTRA,
      logoUrl: null,
    }
  }
}

/**
 * Modelo de proposta com a identidade da organização aplicada: cores da
 * organização e logo da organização (o logo próprio do modelo é ignorado).
 * Só não aplica quando o modelo foi configurado para usar identidade própria.
 */
export function aplicarIdentidadeNoModelo(
  modelo: ModeloProposta,
  identidade: IdentidadeVisual,
): ModeloProposta {
  if (modelo.usar_identidade_org === false) return modelo
  return {
    ...modelo,
    cor_primaria: identidade.corPrimaria,
    cor_secundaria: identidade.corSecundaria,
    logo: '',
  }
}
