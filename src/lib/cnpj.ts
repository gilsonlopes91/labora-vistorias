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
  cnae: string
  situacao: string
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
  return {
    razao_social: s('razao_social'),
    nome_fantasia: tituloCaso(s('nome_fantasia')),
    endereco,
    telefone: s('ddd_telefone_1'),
    porte: portePadrao(s('porte'), d.opcao_pelo_mei === true),
    cnae: [s('cnae_fiscal'), tituloCaso(s('cnae_fiscal_descricao'))].filter(Boolean).join(' - '),
    situacao: s('descricao_situacao_cadastral'),
  }
}
