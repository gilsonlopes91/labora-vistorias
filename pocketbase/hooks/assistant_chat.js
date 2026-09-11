// Rota de chat com o Assistente Labora (agente hospedado 'labora-assistente').
// O frontend chama pb.send('/backend/v1/assistant/chat', ...) — ver src/lib/skipAi.ts
// para o parser de streaming (parseAgentChatStream / streamAgentChat).
routerAdd(
  'POST',
  '/backend/v1/assistant/chat',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('auth required')
      const message = (body.message || '').trim()
      if (!message) return e.badRequestError('message is required')

      const result = $ai.agent('labora-assistente').chat({
        user_id: userId,
        conversation_id: body.conversation_id || null,
        message,
      })

      return e.json(200, {
        conversation_id: result.conversation_id,
        message_id: result.message_id,
        content: result.content,
        citations: result.citations,
      })
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        return e.json(503, { error: 'IA temporariamente indisponível' })
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Falha na requisição ao assistente' : err.message,
        })
      }
      if (err instanceof SkipAiError) {
        const status = err.status || 502
        return e.json(status, {
          error: status >= 500 ? 'IA temporariamente indisponível' : err.message,
        })
      }
      throw err
    }
  },
  $apis.requireAuth(),
)
