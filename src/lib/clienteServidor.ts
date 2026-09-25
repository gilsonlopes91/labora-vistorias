/* Ajustes do cliente do PocketBase que ficam fora de src/lib/pocketbase/,
   porque a plataforma Skip restaura aqueles arquivos para o modelo original.
   Este módulo é importado primeiro em main.tsx e:
   1. passa todas as requisições pelo fetch com cópia local (modo offline);
   2. traduz para português as mensagens de erro que vêm do servidor. */
import { ClientResponseError, type SendOptions } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import { definirUsuarioCache, fetchComCache } from '@/lib/cacheOffline'

definirUsuarioCache(pb.authStore.record?.id || '')
pb.authStore.onChange((_token, record) => definirUsuarioCache(record?.id || ''))

// Mensagens gerais do PocketBase (campo "message" da resposta).
const MENSAGENS: Record<string, string> = {
  'Failed to authenticate.': 'E-mail ou senha incorretos.',
  'The request requires valid record authorization token.': 'Sua sessão expirou. Entre de novo.',
  'The request requires valid record authorization token to be set.':
    'Sua sessão expirou. Entre de novo.',
  'The authorized record is not allowed to perform this action.':
    'Seu acesso não permite fazer isso.',
  'Only superusers can perform this action.': 'Seu acesso não permite fazer isso.',
  "The requested resource wasn't found.": 'Registro não encontrado.',
  'Something went wrong while processing your request.':
    'Não foi possível concluir. Confira os dados e tente de novo.',
  'Failed to create record.': 'Não foi possível salvar. Confira os campos destacados.',
  'Failed to update record.': 'Não foi possível salvar. Confira os campos destacados.',
  'Failed to delete record. Make sure that the record is not part of a required relation reference.':
    'Não dá para excluir: este registro está sendo usado em outro lugar.',
  'Failed to delete record.': 'Não foi possível excluir.',
  'Too Many Requests.': 'Muitas tentativas seguidas. Espere um pouco e tente de novo.',
  'Invalid or expired token.': 'O link expirou ou já foi usado. Peça um novo.',
  'Invalid or expired password reset token.': 'O link expirou ou já foi usado. Peça um novo.',
  'Invalid or expired verification token.': 'O link expirou ou já foi usado. Peça um novo.',
  'Missing or invalid identity.': 'Informe o e-mail.',
}

// Mensagens por campo, pelo código de validação.
function mensagemDoCampo(codigo: string, original: string, params?: Record<string, unknown>) {
  const p = params || {}
  switch (codigo) {
    case 'validation_required':
      return 'Campo obrigatório.'
    case 'validation_is_email':
    case 'validation_invalid_email':
      return 'E-mail inválido.'
    case 'validation_not_unique':
    case 'validation_invalid_email_or_username':
      return 'Já existe um cadastro com esse valor.'
    case 'validation_values_mismatch':
      return 'Os valores não conferem.'
    case 'validation_invalid_old_password':
      return 'A senha atual não confere.'
    case 'validation_min_text_constraint':
    case 'validation_length_too_short':
      return p.min ? `Use pelo menos ${p.min} caracteres.` : 'Texto curto demais.'
    case 'validation_max_text_constraint':
    case 'validation_length_too_long':
      return p.max ? `Use no máximo ${p.max} caracteres.` : 'Texto longo demais.'
    case 'validation_length_out_of_range':
      return 'Tamanho fora do permitido.'
    case 'validation_min_number_constraint':
    case 'validation_min_greater_equal_than_required':
      return p.min !== undefined ? `O valor mínimo é ${p.min}.` : 'Valor abaixo do mínimo.'
    case 'validation_max_number_constraint':
    case 'validation_max_less_equal_than_required':
      return p.max !== undefined ? `O valor máximo é ${p.max}.` : 'Valor acima do máximo.'
    case 'validation_invalid_value':
    case 'validation_in_invalid':
      return 'Valor inválido.'
    case 'validation_invalid_date':
      return 'Data inválida.'
    case 'validation_invalid_url':
    case 'validation_is_url':
      return 'Endereço inválido.'
    case 'validation_missing_rel_records':
    case 'validation_invalid_relation':
      return 'O registro escolhido não existe mais.'
    case 'validation_invalid_mime_type':
      return 'Tipo de arquivo não aceito.'
    case 'validation_file_size_limit':
      return 'Arquivo grande demais.'
    case 'validation_too_many_values':
      return 'Muitos itens selecionados.'
    case 'validation_invalid_format':
    case 'validation_match_invalid':
      return 'Formato inválido.'
    default:
      return MENSAGENS[original] || original
  }
}

function traduzir(erro: ClientResponseError) {
  if (erro.isAbort) return
  if (erro.status === 0) {
    erro.message = 'Sem conexão com o servidor. Confira a internet e tente de novo.'
    return
  }
  const resposta = erro.response as { message?: string; data?: Record<string, unknown> }
  const geral = MENSAGENS[erro.message]
  if (geral) erro.message = geral
  if (resposta && typeof resposta.message === 'string' && MENSAGENS[resposta.message]) {
    resposta.message = MENSAGENS[resposta.message]
  }
  const dados = resposta?.data
  if (dados && typeof dados === 'object') {
    for (const detalhe of Object.values(dados)) {
      if (!detalhe || typeof detalhe !== 'object') continue
      const d = detalhe as { code?: string; message?: string; params?: Record<string, unknown> }
      if (typeof d.message === 'string') {
        d.message = mensagemDoCampo(String(d.code || ''), d.message, d.params)
      }
    }
  }
}

const sendOriginal = pb.send.bind(pb)
pb.send = (async (path: string, options: SendOptions = {}) => {
  try {
    return await sendOriginal(path, { fetch: fetchComCache, ...options })
  } catch (erro) {
    if (erro instanceof ClientResponseError) traduzir(erro)
    throw erro
  }
}) as typeof pb.send

export default pb
