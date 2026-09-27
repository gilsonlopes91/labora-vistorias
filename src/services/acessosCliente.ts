/* Acesso do cliente final (empresa vistoriada) ao portal — migration 0158.
 * Uma pessoa (fora da organização) vê só a empresa em que tem acesso ativo. */
import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export interface AcessoCliente extends RecordModel {
  id: string
  usuario_id: string
  empresa_id: string
  organizacao_id: string
  ativo: boolean
  created: string
  updated: string
  expand?: { usuario_id?: { id: string; name: string; email: string } }
}

/** Acessos concedidos para uma empresa (lista na ficha da empresa). */
export const getAcessosCliente = (empresaId: string) =>
  pb.collection('acessos_cliente').getFullList<AcessoCliente>({
    filter: `empresa_id = "${empresaId}"`,
    sort: '-created',
    expand: 'usuario_id',
  })

/** Convida (ou reativa) o acesso de um e-mail a uma empresa. */
export const convidarCliente = (data: { email: string; nome: string; empresa_id: string }) =>
  pb.send<{ ok: boolean; id: string; acessoId: string; reativado: boolean }>(
    '/backend/v1/cliente/convidar',
    { method: 'POST', body: JSON.stringify(data) },
  )

/** Revoga o acesso (a conta continua existindo, só perde o acesso a essa empresa). */
export const revogarCliente = (acessoId: string) =>
  pb.send<{ ok: boolean }>('/backend/v1/cliente/revogar', {
    method: 'POST',
    body: JSON.stringify({ acesso_id: acessoId }),
  })

/** Manda o e-mail de criar/trocar senha — mesmo fluxo do convite de equipe. */
export const enviarLinkDeAcessoCliente = (email: string) =>
  pb.collection('users').requestPasswordReset(email)
