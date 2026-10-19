export type Estrutura = 'ambientes' | 'funcoes' | 'inventario' | 'plano' | 'conclusoes'

/** Bloco do Modelo Geral -> estrutura(s) do documento. "absorvido" some, porque a estrutura que o recebe já traz os dados.
 *  Uma lista gera mais de uma estrutura no mesmo ponto. */
export const MAPEAMENTO: Record<string, Estrutura | Estrutura[] | 'absorvido'> = {
  // PGR
  'pgr/20:ambientes_e_processos': 'ambientes',
  'pgr/20:funcoes_e_grupos_de_exposicao': 'funcoes',
  'pgr/20:inventario_de_perigos': 'inventario',
  'pgr/20:avaliacao_de_riscos': 'absorvido',
  'pgr/20:ergonomia_e_psicossociais': 'absorvido',
  'pgr/20:epc_e_epi': 'absorvido',
  'pgr/12:plano_de_acao': 'plano',
  // LTCAT: o modelo não tem bloco de inventário por risco; as fichas entram no capítulo 10,
  // junto da lista de conclusões (a conclusão de função sem agente nocivo não pode sumir).
  'ltcat/5:ambientes_e_setores_do_estabelecimento': 'ambientes',
  'ltcat/5:grupos_homogeneos_de_exposicao': 'funcoes',
  'ltcat/5:descricao_das_funcoes': 'absorvido',
  'ltcat/10:conclusao_por_funcao': ['inventario', 'conclusoes'],
  'ltcat/13:plano_de_acao_de_controle_dos_agentes_nocivos': 'plano',
  // Laudo de insalubridade (NR-15)
  'insalubridade/11:ambientes': 'ambientes',
  'insalubridade/11:ghe': 'funcoes',
  'insalubridade/11:funcoes': 'absorvido',
  'insalubridade/11:reconhecimento_de_agentes': 'inventario',
  'insalubridade/12:conclusao_por_funcao': 'conclusoes',
  'insalubridade/12:plano_de_acao': 'plano',
  // Laudo de periculosidade (NR-16)
  'periculosidade/11:ambientes_de_trabalho': 'ambientes',
  'periculosidade/12:funcoes_e_atividades': 'funcoes',
  'periculosidade/12:caracterizacao_da_exposicao': 'inventario',
  'periculosidade/14:conclusao_por_funcao': 'conclusoes',
  'periculosidade/15:plano_de_acao': 'plano',
}

export const chaveDoBloco = (tipo: string, blocoId: string) => `${tipo}/${blocoId}`
