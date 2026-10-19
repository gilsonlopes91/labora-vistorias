export type Estrutura = 'ambientes' | 'funcoes' | 'inventario' | 'plano' | 'conclusoes'

/** Bloco do Modelo Geral -> estrutura do documento. "absorvido" some, porque a estrutura que o recebe já traz os dados. */
export const MAPEAMENTO: Record<string, Estrutura | 'absorvido'> = {
  // PGR
  'pgr/20:ambientes_e_processos': 'ambientes',
  'pgr/20:funcoes_e_grupos_de_exposicao': 'funcoes',
  'pgr/20:inventario_de_perigos': 'inventario',
  'pgr/20:avaliacao_de_riscos': 'absorvido',
  'pgr/20:ergonomia_e_psicossociais': 'absorvido',
  'pgr/20:epc_e_epi': 'absorvido',
  'pgr/12:plano_de_acao': 'plano',
}

export const chaveDoBloco = (tipo: string, blocoId: string) => `${tipo}/${blocoId}`
