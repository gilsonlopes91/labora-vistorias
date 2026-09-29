import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import type { AgenteCatalogo } from '@/services/agentesCatalogo'
import type { FuncaoSst } from '@/services/funcoesSst'

export interface EpiCatalogo extends RecordModel {
  id: string
  organizacao_id: string
  /** Vazio = catálogo global da organização (vale para todas as empresas dela). */
  empresa_id?: string
  numero_ca: string
  validade_ca?: string
  fabricante?: string
  especificacoes?: string
  agentes_protegidos_ids?: string[]
  funcoes_ids?: string[]
  ativo?: boolean
  expand?: { agentes_protegidos_ids?: AgenteCatalogo[]; funcoes_ids?: FuncaoSst[] }
  created: string
  updated: string
}

export type EpiCatalogoInput = Partial<Omit<EpiCatalogo, 'id' | 'created' | 'updated'>> & {
  organizacao_id: string
  numero_ca: string
}

/** Catálogo de EPIs da organização — globais (empresa_id vazio) + os exclusivos da empresa informada. */
export const getEpisCatalogo = (empresaId?: string) =>
  pb.collection('epis_catalogo').getFullList<EpiCatalogo>({
    filter: empresaId
      ? `ativo = true && (empresa_id = "" || empresa_id = "${empresaId}")`
      : 'ativo = true',
    sort: 'numero_ca',
    expand: 'agentes_protegidos_ids,funcoes_ids',
  })

export const createEpiCatalogo = (data: EpiCatalogoInput) =>
  pb.collection('epis_catalogo').create<EpiCatalogo>({ ativo: true, ...data })

export const updateEpiCatalogo = (id: string, data: Partial<EpiCatalogoInput>) =>
  pb.collection('epis_catalogo').update<EpiCatalogo>(id, data)

export const deleteEpiCatalogo = (id: string) => pb.collection('epis_catalogo').delete(id)

export interface ConsultaCaResultado {
  encontrado: boolean
  motivo?: string
  numero_ca?: string
  situacao?: string
  validade_ca?: string
  fabricante?: string
  descricao?: string
  url_consulta?: string
}

/** Consulta pública do CA em consultaca.com (via hook — evita bloqueio de CORS no navegador). Best-effort: pode não achar todos os campos. */
export const consultarCa = (numero: string) =>
  pb.send<ConsultaCaResultado>(`/backend/v1/epis/consultar-ca/${numero.replace(/\D/g, '')}`, {
    method: 'GET',
  })

/** dd/mm/aaaa (como o site mostra) -> aaaa-mm-dd (como o campo date do PocketBase espera). */
export function dataBrParaIso(dataBr: string): string {
  const m = dataBr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return ''
  const [, dd, mm, aaaa] = m
  return `${aaaa}-${mm}-${dd}`
}
