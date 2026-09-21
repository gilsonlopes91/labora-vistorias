import pb from '@/lib/pocketbase/client'

// Campo de um modelo de formulário — desenho da ficha criado no builder.
// tipo: secao | texto | texto_longo | numero | sim_nao | selecao | multipla |
//       data | hora | foto | assinatura | codigo | repetivel | calculo | url
export interface CampoFormulario {
  id: string
  tipo: string
  nome: string
  unidade?: string
  opcoes?: string[]
  obrigatorio?: boolean
  subcampos?: CampoFormulario[]
  // cálculo automático
  camposOrigem?: string[]
  operacao?: 'soma' | 'media' | 'max' | 'min'
  // lógica condicional: mostrar só quando outro campo tiver o valor
  condicaoCampoId?: string
  condicaoValor?: string
  [key: string]: unknown
}

export interface ModeloFormulario {
  id: string
  organizacao_id?: string
  nome: string
  descricao?: string
  icone?: string
  fixo?: boolean
  campos: CampoFormulario[]
  ativo?: boolean
  created: string
  updated: string
}

export const getModelosFormulario = async (organizacaoId?: string) => {
  let filter = 'ativo = true'
  if (organizacaoId) {
    // Garante retorno apenas dos modelos fixos globais (sem org) e dos modelos da organização solicitada
    filter += ` && (organizacao_id = '' || organizacao_id = '${organizacaoId}')`
  }
  return pb.collection('modelos_formulario').getFullList<ModeloFormulario>({
    filter,
    sort: '-fixo,nome', // fixos primeiro
  })
}

export const getModeloFormulario = (id: string) =>
  pb.collection('modelos_formulario').getOne<ModeloFormulario>(id)

export interface ModeloFormularioInput {
  nome: string
  descricao?: string
  icone?: string
  campos: CampoFormulario[]
}

// Modelo próprio da organização (regra PB: só gestor da org escreve).
export const createModeloFormulario = (organizacaoId: string, data: ModeloFormularioInput) =>
  pb.collection('modelos_formulario').create<ModeloFormulario>({
    organizacao_id: organizacaoId,
    fixo: false,
    ativo: true,
    ...data,
  })

export const updateModeloFormulario = (id: string, data: Partial<ModeloFormularioInput>) =>
  pb.collection('modelos_formulario').update<ModeloFormulario>(id, data)

export const deleteModeloFormulario = (id: string) => pb.collection('modelos_formulario').delete(id)
