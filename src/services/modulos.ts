// Pacotes (módulos) contratados pela organização — fonte: organizacoes.modulos
// (JSON gravado pelo console admin via /backend/v1/admin/usuario).
// Fallback: tudo liberado (orgs antigas sem o campo, ou erro de leitura).
import pb from '@/lib/pocketbase/client'

export interface Modulos {
  auditoria: boolean
  relatorios: boolean
  formularios: boolean
  ia: boolean
  orcamentos: boolean
}

export const MODULOS_DEFAULT: Modulos = {
  auditoria: true,
  relatorios: true,
  formularios: true,
  ia: true,
  orcamentos: true,
}

export const getModulos = async (): Promise<Modulos> => {
  try {
    const org = await pb.collection('organizacoes').getFirstListItem('')
    const raw = typeof org.modulos === 'string' ? JSON.parse(org.modulos) : org.modulos
    return { ...MODULOS_DEFAULT, ...(raw || {}) }
  } catch (_) {
    return MODULOS_DEFAULT
  }
}
