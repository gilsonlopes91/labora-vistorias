/* Modo offline, etapa 2: deixa no aparelho, com antecedência, o que o
   técnico precisa para abrir as próximas vistorias sem internet. Faz as
   mesmas consultas que as telas fazem (lista de vistorias, vistoria, itens
   dos checklists, respostas, formulários, organização), e o fetch com cópia
   local (cacheOffline.ts) guarda cada uma.
   Roda sozinho quando o app abre com internet, no máximo a cada 20 minutos. */
import { getVistorias, getVistoria, type Vistoria } from '@/services/vistorias'
import { getItensChecklist } from '@/services/itensChecklist'
import { getRespostasByVistoria } from '@/services/respostasVistoria'
import { getFormulariosByVistoria } from '@/services/registrosFormulario'
import { getResponsaveisTecnicos } from '@/services/responsaveisTecnicos'
import { getModeloFormulario } from '@/services/formularios'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import { getModulos } from '@/services/modulos'
import { getEmpresas } from '@/services/empresas'

const CHAVE_ULTIMA = 'labora-offline-preparado-em'
const INTERVALO_MS = 20 * 60 * 1000
// Janela das vistorias preparadas: 3 dias para trás e 10 para frente.
const DIAS_ANTES = 3
const DIAS_DEPOIS = 10
const MAXIMO = 20

const ignorar = () => undefined

/** Baixa tudo o que a tela da vistoria usa para abrir. */
export async function prepararVistoria(id: string) {
  const v = await getVistoria(id)
  const checklists = [...(v.tipo_vistoria_id ? [v.tipo_vistoria_id] : []), ...(v.checklists || [])]
  await Promise.all([
    ...checklists.map((c) => getItensChecklist(c).catch(ignorar)),
    getRespostasByVistoria(v.id).catch(ignorar),
    getFormulariosByVistoria(v.id).catch(ignorar),
    ...(v.formularios || []).map((f) => getModeloFormulario(f).catch(ignorar)),
    v.organizacao_id ? getResponsaveisTecnicos(v.organizacao_id).catch(ignorar) : null,
  ])
}

function dentroDaJanela(v: Vistoria) {
  if (v.status === 'concluida' || v.status === 'cancelada') return false
  if (v.status === 'em_andamento') return true
  const d = new Date(String(v.data_agendada || '').replace(' ', 'T'))
  if (isNaN(d.getTime())) return false
  const dia = 24 * 60 * 60 * 1000
  const agora = Date.now()
  return d.getTime() >= agora - DIAS_ANTES * dia && d.getTime() <= agora + DIAS_DEPOIS * dia
}

let emAndamento: Promise<number> | null = null

/** Prepara as próximas vistorias. Devolve quantas ficaram prontas. */
export function prepararParaCampo(forcar = false): Promise<number> {
  if (emAndamento) return emAndamento
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return Promise.resolve(0)
  if (!forcar) {
    try {
      const ultima = Number(localStorage.getItem(CHAVE_ULTIMA) || 0)
      if (Date.now() - ultima < INTERVALO_MS) return Promise.resolve(0)
    } catch {
      // sem localStorage: segue
    }
  }
  emAndamento = (async () => {
    await Promise.all([
      getMinhaOrganizacao().catch(ignorar),
      getModulos().catch(ignorar),
      getEmpresas().catch(ignorar),
    ])
    const todas = await getVistorias()
    const proximas = todas
      .filter(dentroDaJanela)
      .sort((a, b) => String(a.data_agendada).localeCompare(String(b.data_agendada)))
      .slice(0, MAXIMO)
    let prontas = 0
    for (const v of proximas) {
      try {
        await prepararVistoria(v.id)
        prontas++
      } catch {
        // segue com as outras
      }
    }
    try {
      localStorage.setItem(CHAVE_ULTIMA, String(Date.now()))
    } catch {
      // ignora
    }
    return prontas
  })().finally(() => {
    emAndamento = null
  })
  return emAndamento
}
