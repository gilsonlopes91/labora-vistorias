/* Caixa de sugestões: o envio vem do botão flutuante (qualquer usuário
   logado); a leitura é só do administrador da plataforma (console). */
import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export type TipoFeedback = 'melhoria' | 'bug' | 'dica' | 'elogio' | 'outro'
export type StatusFeedback = 'novo' | 'lido' | 'resolvido'

export const TIPOS_FEEDBACK: { value: TipoFeedback; label: string }[] = [
  { value: 'melhoria', label: 'Sugestão de melhoria' },
  { value: 'bug', label: 'Problema / bug' },
  { value: 'dica', label: 'Dica' },
  { value: 'elogio', label: 'Elogio' },
  { value: 'outro', label: 'Outro' },
]

export interface Feedback extends RecordModel {
  id: string
  usuario_id: string
  organizacao_id?: string
  usuario_nome?: string
  usuario_email?: string
  tipo: TipoFeedback
  mensagem: string
  pagina?: string
  navegador?: string
  status?: StatusFeedback
  created: string
}

export const enviarFeedback = (dados: { tipo: TipoFeedback; mensagem: string; pagina: string }) => {
  const u = pb.authStore.record as {
    id?: string
    name?: string
    email?: string
    organizacao_id?: string
  } | null
  if (!u?.id) throw new Error('Entre na sua conta para enviar')
  return pb.collection('feedbacks').create<Feedback>({
    usuario_id: u.id,
    organizacao_id: u.organizacao_id || undefined,
    usuario_nome: u.name || '',
    usuario_email: u.email || '',
    tipo: dados.tipo,
    mensagem: dados.mensagem,
    pagina: dados.pagina,
    navegador: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 290) : '',
  })
}

export const getFeedbacks = () =>
  pb.collection('feedbacks').getFullList<Feedback>({ sort: '-created' })

export const atualizarStatusFeedback = (id: string, status: StatusFeedback) =>
  pb.collection('feedbacks').update<Feedback>(id, { status })

export const apagarFeedback = (id: string) => pb.collection('feedbacks').delete(id)
