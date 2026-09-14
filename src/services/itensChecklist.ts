import pb from '@/lib/pocketbase/client'

export interface ItemChecklist {
  id: string
  tipo_vistoria_id: string
  ordem?: number
  secao?: string
  item_ref: string
  codigo: string
  grau?: number
  tipo?: 'S' | 'M'
  descricao: string
  observacao?: string
  created: string
  updated: string
}

export const getItensChecklist = (tipoVistoriaId: string) =>
  pb.collection('itens_checklist').getFullList<ItemChecklist>({
    filter: pb.filter('tipo_vistoria_id = {:id}', { id: tipoVistoriaId }),
    sort: 'ordem',
  })

export interface ItemChecklistInput {
  secao?: string
  item_ref: string
  codigo: string
  grau?: number
  tipo?: 'S' | 'M'
  descricao: string
  observacao?: string
  ordem?: number
}

export const createItemChecklist = (tipoVistoriaId: string, data: ItemChecklistInput) =>
  pb.collection('itens_checklist').create<ItemChecklist>({
    tipo_vistoria_id: tipoVistoriaId,
    ...data,
  })

export const updateItemChecklist = (id: string, data: Partial<ItemChecklistInput>) =>
  pb.collection('itens_checklist').update<ItemChecklist>(id, data)

export const deleteItemChecklist = (id: string) => pb.collection('itens_checklist').delete(id)

// Importação em massa (ex.: a partir de um CSV) — usada na tela de Auditoria
// NRs para popular o checklist de um tipo_vistoria sem precisar criar item a
// item pela UI. A 'ordem' de cada item continua a partir do maior valor já
// existente no tipo de vistoria, para não embaralhar itens já cadastrados.
export async function createItensChecklistBulk(
  tipoVistoriaId: string,
  itens: ItemChecklistInput[],
): Promise<{ criados: number; erros: { linha: number; mensagem: string }[] }> {
  const existentes = await getItensChecklist(tipoVistoriaId)
  let proximaOrdem = existentes.reduce((max, it) => Math.max(max, it.ordem ?? 0), -1) + 1

  let criados = 0
  const erros: { linha: number; mensagem: string }[] = []

  for (let i = 0; i < itens.length; i++) {
    const it = itens[i]
    try {
      await createItemChecklist(tipoVistoriaId, { ...it, ordem: it.ordem ?? proximaOrdem })
      proximaOrdem++
      criados++
    } catch (error) {
      erros.push({
        linha: i + 2, // +1 pelo cabeçalho, +1 pela indexação 1-based
        mensagem: error instanceof Error ? error.message : 'Erro desconhecido ao criar item.',
      })
    }
  }

  return { criados, erros }
}
