/* Envio dos formulários de campo guardados no aparelho (ver filaOffline.ts).
   Pode ser refeito sem duplicar nada:
   - se o registro já foi criado numa tentativa anterior, é reaproveitado
     (pelo client_uuid);
   - cada foto sai da fila assim que sobe, e o nome provisório dela nos dados
     já é trocado pelo nome gravado no servidor;
   - a pendência só é apagada no fim, e só se ninguém mexeu nela durante o envio. */
import {
  alterarFormularioPendente,
  removerFormularioPendente,
  type PendenciaFormulario,
} from '@/lib/filaOffline'
import {
  adicionarAnexos,
  buscarFormularioPorUuid,
  createFormulario,
  getFormulario,
  removerAnexos,
  updateFormulario,
  type Formulario,
} from '@/services/registrosFormulario'

const ehLocal = (valor: unknown): valor is string =>
  typeof valor === 'string' && valor.startsWith('local:')

/** Troca os nomes provisórios ("local:<id>") pelos nomes gravados no servidor. */
export function substituirNomes(
  dados: Record<string, unknown>,
  mapa: Record<string, string>,
): Record<string, unknown> {
  const troca = (v: unknown) => (typeof v === 'string' && mapa[v] !== undefined ? mapa[v] : v)
  const saida: Record<string, unknown> = { ...dados }
  for (const [chave, valor] of Object.entries(saida)) {
    if (Array.isArray(valor)) saida[chave] = valor.map(troca)
    else saida[chave] = troca(valor)
  }
  return saida
}

/** Dados sem os nomes provisórios (para gravar no servidor antes das fotos subirem). */
function semNomesLocais(dados: Record<string, unknown>): Record<string, unknown> {
  const saida: Record<string, unknown> = { ...dados }
  for (const [chave, valor] of Object.entries(saida)) {
    if (Array.isArray(valor)) saida[chave] = valor.filter((v) => !ehLocal(v))
    else if (ehLocal(valor)) saida[chave] = ''
  }
  return saida
}

export async function enviarFormularioPendente(
  inicial: PendenciaFormulario,
): Promise<{ registro: Formulario; nomes: Record<string, string> }> {
  let p = inicial

  // 1. Registro no servidor: o que já existia, o criado numa tentativa que
  //    caiu no meio, ou um novo.
  let registro: Formulario | null = null
  if (p.registro_id) registro = await getFormulario(p.registro_id)
  else registro = await buscarFormularioPorUuid(p.client_uuid)
  if (!registro) {
    registro = await createFormulario({
      organizacao_id: p.organizacao_id,
      modelo_formulario_id: p.modelo_formulario_id,
      vistoria_id: p.vistoria_id,
      dados: semNomesLocais(p.dados),
      status: 'rascunho',
      data_campo: new Date(p.criado_em).toISOString(),
      client_uuid: p.client_uuid,
    })
  }
  const registroId = registro.id
  if (p.registro_id !== registroId) {
    p = { ...p, registro_id: registroId }
    await alterarFormularioPendente(p.chave, (atual) =>
      atual ? { ...atual, registro_id: registroId } : undefined,
    )
  }

  // 2. Anexos que foram removidos sem internet.
  if (p.anexos_remover.length) {
    registro = await removerAnexos(registroId, p.anexos_remover)
    const removidos = new Set(p.anexos_remover)
    p = { ...p, anexos_remover: [] }
    await alterarFormularioPendente(p.chave, (atual) =>
      atual
        ? { ...atual, anexos_remover: atual.anexos_remover.filter((n) => !removidos.has(n)) }
        : undefined,
    )
  }

  // 3. Fotos e assinaturas, uma por vez.
  const nomes: Record<string, string> = {}
  for (const anexo of [...p.arquivos]) {
    const enviado = await adicionarAnexos(registro, [anexo.arquivo])
    registro = enviado.registro
    const nome = enviado.novos[0]
    if (!nome) throw new Error('Não foi possível confirmar o envio de uma foto.')
    const provisorio = `local:${anexo.id}`
    nomes[provisorio] = nome
    p = {
      ...p,
      arquivos: p.arquivos.filter((a) => a.id !== anexo.id),
      dados: substituirNomes(p.dados, { [provisorio]: nome }),
    }
    await alterarFormularioPendente(p.chave, (atual) =>
      atual
        ? {
            ...atual,
            arquivos: atual.arquivos.filter((a) => a.id !== anexo.id),
            dados: substituirNomes(atual.dados, { [provisorio]: nome }),
          }
        : undefined,
    )
  }

  // 4. Dados e situação finais.
  const final = await updateFormulario(registroId, { dados: p.dados, status: p.status })
  await removerFormularioPendente(p.chave, inicial.atualizado_em)
  return { registro: final, nomes }
}
