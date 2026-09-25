/* CNPJ: máscara, dígitos verificadores e busca dos dados públicos na Receita
   (via BrasilAPI). Aceita o CNPJ alfanumérico (letras nas 12 primeiras
   posições), em uso desde julho de 2026: o valor de cada caractere é o código
   ASCII menos 48, com os mesmos pesos do cálculo antigo. */

/** Só letras e números, em maiúsculas, até 14 posições. */
export const limparCnpj = (valor: string) =>
  (valor || '')
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .slice(0, 14)

export function formatarCnpj(valor: string): string {
  const c = limparCnpj(valor)
  if (c.length <= 2) return c
  if (c.length <= 5) return `${c.slice(0, 2)}.${c.slice(2)}`
  if (c.length <= 8) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5)}`
  if (c.length <= 12) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8)}`
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12, 14)}`
}

function digitoVerificador(base: string): number {
  const pesos =
    base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let soma = 0
  for (let i = 0; i < base.length; i++) soma += (base.charCodeAt(i) - 48) * pesos[i]
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

/** Confere tamanho, formato e os dois dígitos verificadores. */
export function cnpjValido(valor: string): boolean {
  const c = limparCnpj(valor)
  if (!/^[0-9A-Z]{12}\d{2}$/.test(c)) return false
  if (/^(\d)\1{13}$/.test(c)) return false
  const d1 = digitoVerificador(c.slice(0, 12))
  const d2 = digitoVerificador(c.slice(0, 12) + d1)
  return c.slice(12) === `${d1}${d2}`
}

export interface DadosCnpj {
  razao_social: string
  nome_fantasia: string
  endereco: string
  telefone: string
  porte: string
  /** CNAE principal em texto ("4120400 - Construção de Edifícios"), para aviso. */
  cnae: string
  /** CNAE principal só com os dígitos da subclasse (7 dígitos). */
  cnae_codigo: string
  cnae_descricao: string
  situacao: string
  // Endereço em partes
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

/** Porte do cadastro da Receita no formato usado no app. */
function portePadrao(porte: string, mei: boolean): string {
  if (mei) return 'MEI'
  const p = (porte || '').toUpperCase()
  if (p.includes('MICRO')) return 'ME'
  if (p.includes('PEQUENO')) return 'EPP'
  return p ? 'Demais / Não se enquadra' : ''
}

const tituloCaso = (s: string) =>
  (s || '')
    .toLowerCase()
    .replace(/(^|\s|\/|-)(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase())
    .replace(/\b(De|Da|Do|Das|Dos|E)\b/g, (m) => m.toLowerCase())

/** Busca razão social, endereço etc. na base pública do CNPJ (BrasilAPI). */
export async function buscarDadosCnpj(valor: string): Promise<DadosCnpj> {
  const c = limparCnpj(valor)
  const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${c}`)
  if (resposta.status === 404) throw new Error('CNPJ não encontrado na base da Receita.')
  if (!resposta.ok) throw new Error('A consulta à Receita não respondeu agora. Tente de novo.')
  const d = (await resposta.json()) as Record<string, unknown>
  const s = (k: string) => (d[k] == null ? '' : String(d[k]).trim())
  const rua = [s('descricao_tipo_de_logradouro'), s('logradouro')].filter(Boolean).join(' ')
  const endereco = [
    [tituloCaso(rua), s('numero')].filter(Boolean).join(', '),
    tituloCaso(s('complemento')),
    tituloCaso(s('bairro')),
    [tituloCaso(s('municipio')), s('uf')].filter(Boolean).join(' - '),
    s('cep') ? `CEP ${s('cep').replace(/^(\d{5})(\d{3})$/, '$1-$2')}` : '',
  ]
    .filter(Boolean)
    .join(', ')
  const cnaeDigitos = s('cnae_fiscal').replace(/\D/g, '').padStart(7, '0')
  const cepDigitos = s('cep').replace(/\D/g, '')
  return {
    razao_social: s('razao_social'),
    nome_fantasia: tituloCaso(s('nome_fantasia')),
    endereco,
    telefone: s('ddd_telefone_1'),
    porte: portePadrao(s('porte'), d.opcao_pelo_mei === true),
    cnae: [s('cnae_fiscal'), tituloCaso(s('cnae_fiscal_descricao'))].filter(Boolean).join(' - '),
    cnae_codigo: s('cnae_fiscal') ? cnaeDigitos : '',
    cnae_descricao: s('cnae_fiscal_descricao'),
    situacao: s('descricao_situacao_cadastral'),
    cep: cepDigitos.length === 8 ? `${cepDigitos.slice(0, 5)}-${cepDigitos.slice(5)}` : '',
    logradouro: tituloCaso(rua),
    numero: s('numero'),
    complemento: tituloCaso(s('complemento')),
    bairro: tituloCaso(s('bairro')),
    cidade: tituloCaso(s('municipio')),
    uf: s('uf').toUpperCase(),
  }
}

export interface DadosCep {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

/** Endereço pelo CEP (BrasilAPI; se ela não responder, ViaCEP). */
export async function buscarCep(valor: string): Promise<DadosCep> {
  const cep = (valor || '').replace(/\D/g, '')
  if (cep.length !== 8) throw new Error('O CEP tem 8 números.')
  const formatado = `${cep.slice(0, 5)}-${cep.slice(5)}`
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`)
    if (r.ok) {
      const d = (await r.json()) as Record<string, string>
      return {
        cep: formatado,
        logradouro: d.street || '',
        bairro: d.neighborhood || '',
        cidade: d.city || '',
        uf: (d.state || '').toUpperCase(),
      }
    }
    if (r.status === 404) throw new Error('CEP não encontrado.')
  } catch (e) {
    if (e instanceof Error && e.message === 'CEP não encontrado.') throw e
  }
  const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
  if (!r.ok) throw new Error('A busca de CEP não respondeu agora. Preencha à mão.')
  const d = (await r.json()) as Record<string, string | boolean>
  if (d.erro) throw new Error('CEP não encontrado.')
  return {
    cep: formatado,
    logradouro: String(d.logradouro || ''),
    bairro: String(d.bairro || ''),
    cidade: String(d.localidade || ''),
    uf: String(d.uf || '').toUpperCase(),
  }
}
