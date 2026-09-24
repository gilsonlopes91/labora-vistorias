/* Identidade visual da organização (logo PNG e duas cores), aplicada em todos
   os documentos gerados: proposta comercial, laudo de vistoria e o que vier
   depois. Configurada em Configurações > Identidade visual. */
import { getMinhaOrganizacao, urlLogoOrganizacao } from '@/services/organizacoes'
import type { ModeloProposta } from '@/services/modelosProposta'

export const COR_PRIMARIA_LABORA = '#6C8845'
export const COR_SECUNDARIA_LABORA = '#202720'

export interface IdentidadeVisual {
  nome: string
  corPrimaria: string
  corSecundaria: string
  logoUrl: string | null
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
    return {
      nome: org.nome,
      corPrimaria: hexValido(org.cor_primaria) ? org.cor_primaria! : COR_PRIMARIA_LABORA,
      corSecundaria: hexValido(org.cor_secundaria) ? org.cor_secundaria! : COR_SECUNDARIA_LABORA,
      logoUrl: urlLogoOrganizacao(org),
    }
  } catch {
    return {
      nome: '',
      corPrimaria: COR_PRIMARIA_LABORA,
      corSecundaria: COR_SECUNDARIA_LABORA,
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
