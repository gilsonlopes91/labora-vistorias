import pb from '@/lib/pocketbase/client'

export type Papel = 'dono' | 'gerente' | 'executor'

export interface MembroEquipe {
  id: string
  name: string
  email: string
  papel: Papel
}

export const getPapelUsuarioLogado = (): Papel => {
  const papel = pb.authStore.record?.get('papel')
  return (papel as Papel) || 'dono' // usuários antigos sem papel = dono
}

export const isGestor = () => getPapelUsuarioLogado() !== 'executor'

export const getEquipe = async (): Promise<MembroEquipe[]> => {
  const org = await pb.collection('organizacoes').getFirstListItem('')
  const donoId = org.dono_id
  const membrosIds: string[] = org.membros || []
  const ids = [donoId, ...membrosIds]
  const usuarios = await pb.collection('users').getFullList({
    filter: pb.filter('id ?= {:ids}', { ids }),
    sort: '-papel,name',
  })
  return usuarios.map((u) => ({
    id: u.id,
    name: u.name || u.email,
    email: u.email,
    papel: (u.papel as Papel) || 'dono',
  }))
}

export interface ConviteInput {
  email: string
  nome: string
  senha: string
  papel: 'gerente' | 'executor'
}

export const convidarMembro = (data: ConviteInput) =>
  pb.send('/backend/v1/equipe/convidar', {
    method: 'POST',
    body: JSON.stringify(data),
  })
