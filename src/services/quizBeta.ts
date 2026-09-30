/* Questionário de seleção do beta — rotas públicas (sem login) e a leitura
   do admin. O gabarito nunca chega ao navegador. */
import pb from '@/lib/pocketbase/client'

export interface AlternativaQuiz {
  id: string
  texto: string
}

export interface QuestaoQuiz {
  ordem: number
  tema: string
  enunciado: string
  alternativas: AlternativaQuiz[]
}

export interface EnvioQuiz {
  nome: string
  email: string
  telefone: string
  aceite_lgpd: boolean
  respostas: Record<string, string>
  site?: string
  saidas?: number
  segundos_fora?: number
}

export interface RespostaQuizAdmin {
  id: string
  nome: string
  email: string
  telefone: string
  nota: number
  acertos: Record<string, boolean>
  convidado: boolean
  email_enviado: boolean
  saidas: number
  segundos_fora: number
  created: string
}

export interface ResumoQuizAdmin {
  total: number
  questoes: { chave: string; ordem: number; tema: string; enunciado: string }[]
  acertos_por_questao: Record<string, number>
  respostas: RespostaQuizAdmin[]
}

export async function listarPerguntasQuiz(): Promise<QuestaoQuiz[]> {
  const data = await pb.send<{ questoes?: QuestaoQuiz[] }>(
    '/backend/v1/public/beta-quiz/perguntas',
    { method: 'GET' },
  )
  return data.questoes || []
}

export async function enviarQuiz(dados: EnvioQuiz): Promise<{ ok: boolean }> {
  return pb.send('/backend/v1/public/beta-quiz/enviar', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export async function obterResumoQuizAdmin(): Promise<ResumoQuizAdmin> {
  return pb.send('/backend/v1/admin/beta-quiz', { method: 'GET' })
}

export async function marcarConvidadoQuiz(id: string, convidado: boolean) {
  return pb.collection('beta_quiz_respostas').update(id, { convidado })
}

export async function apagarRespostaQuiz(id: string) {
  return pb.collection('beta_quiz_respostas').delete(id)
}
