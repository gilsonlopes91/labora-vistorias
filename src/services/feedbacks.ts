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
  anexo?: string
  status?: StatusFeedback
  created: string
}

export const enviarFeedback = (dados: {
  tipo: TipoFeedback
  mensagem: string
  pagina: string
  anexo?: File | null
}) => {
  const u = pb.authStore.record as {
    id?: string
    name?: string
    email?: string
    organizacao_id?: string
  } | null
  if (!u?.id) throw new Error('Entre na sua conta para enviar')
  const form = new FormData()
  form.append('usuario_id', u.id)
  if (u.organizacao_id) form.append('organizacao_id', u.organizacao_id)
  form.append('usuario_nome', u.name || '')
  form.append('usuario_email', u.email || '')
  form.append('tipo', dados.tipo)
  form.append('mensagem', dados.mensagem)
  form.append('pagina', dados.pagina)
  form.append(
    'navegador',
    typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 290) : '',
  )
  if (dados.anexo) form.append('anexo', dados.anexo)
  return pb.collection('feedbacks').create<Feedback>(form)
}

/** Endereço da imagem anexada (arquivo protegido: precisa de token do admin). */
export const urlAnexoFeedback = async (f: Feedback): Promise<string> => {
  if (!f.anexo) return ''
  const token = await pb.files.getToken()
  return pb.files.getURL(f, f.anexo, { token })
}

export const getFeedbacks = () =>
  pb.collection('feedbacks').getFullList<Feedback>({ sort: '-created' })

export const atualizarStatusFeedback = (id: string, status: StatusFeedback) =>
  pb.collection('feedbacks').update<Feedback>(id, { status })

export const apagarFeedback = (id: string) => pb.collection('feedbacks').delete(id)
