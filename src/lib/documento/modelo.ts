import type { CategoriaRisco } from './categorias'
import type { ElRender, Pendencia } from '@/lib/modelosSst/renderizar'
import type { TipoDocumentoSst } from '@/services/documentosSst'

export interface Marca {
  organizacaoNome: string
  razaoSocial?: string
  cnpj?: string
  /** data URL do logo de quem emite; ausente = nome em texto */
  logoOrganizacao?: string | null
  /** data URL do logo do cliente; ausente = sem logo */
  logoCliente?: string | null
  corPrimaria: string
  corSecundaria: string
}

export interface Par {
  rotulo: string
  valor: string
}

export interface Capa {
  sigla: string
  titulo: string
  subtitulo?: string
  clienteNome: string
  clienteDetalhe?: string
  cartoes: Par[]
}

export interface Assinatura {
  nome: string
  registro?: string
  confirmadaEm: string
  link: string
  /** QR code do link, como data URL */
  qrDataUrl?: string
  responsavelPlano?: { nome: string; cargo?: string }
}

export interface Ambiente {
  nome: string
  subtitulo?: string
  processo?: string
  metricas: Par[]
  construcao?: string
  iluminacaoVentilacao?: string
  equipamentos?: string
  funcoes?: string
  fontesPerigo?: string
}

export interface FuncaoItem {
  nome: string
  cbo?: string
  expostos?: string
  jornada?: string
  ambiente?: string
  atividades?: string
}

export interface GrupoFuncoes {
  titulo: string
  detalhe?: string
  funcoes: FuncaoItem[]
}

export interface MatrizMiniDados {
  dimensao: 3 | 5
  /** linhas de cima (P maior) para baixo (P = 1); colunas S = 1..n. Valor de 1 a 5, para o tom de cinza. */
  niveis: number[][]
  p: number
  s: number
  pontos: number
}

export interface CardRisco {
  categoria: CategoriaRisco
  nome: string
  referencias: string[]
  expostos?: string
  via?: string
  nivel?: { rotulo: string; pontos: number }
  medicao?: {
    valor: string
    detalhe?: string
    limiteTexto: string
    fracao: number
    marcas: { rotulo: string; fracao: number }[]
  }
  exposicao?: { titulo: string; detalhe?: string }
  avaliadoPor?: { titulo: string; detalhe?: string }
  /** só risco ergonômico */
  aet?: { titulo: string; detalhe?: string }
  fonte?: string
  danos?: string
  medidas: { tipo: 'EPC' | 'ADM' | 'EPI' | 'FALTA'; texto: string }[]
  avaliacao?: {
    probabilidade: { nivel: number; nome: string; texto?: string }
    severidade: { nivel: number; nome: string; texto?: string }
    pontos: number
    categoria: string
    acao?: string
    prazoDias: number | null
    matriz: MatrizMiniDados
  }
  leitura?: string
  /** só laudos */
  conclusaoLaudo?: { rotulo: string; texto: string; enquadramento?: string; justificativa?: string }
}

export interface FichaFuncao {
  nome: string
  cbo?: string
  ghe?: string
  ambiente?: string
  levantamento?: string
  expostos?: string
  jornada?: string
  atividades?: string
  comMedicao: number
  riscos: CardRisco[]
}

export interface AcaoLinha {
  numero: string
  medida: string
  detalhe?: string
  risco?: string
  funcao?: string
  nivel?: string
  responsavel?: string
  prazo?: string
  prazoRotulo?: string
  situacao: string
}

export interface ConclusaoFuncao {
  funcao: string
  ghe?: string
  agente: string
  enquadramento?: string
  conclusao: string
  justificativa?: string
}

export type Bloco =
  | ElRender
  | { tipo: 'ambientes'; itens: Ambiente[] }
  | { tipo: 'funcoes'; grupos: GrupoFuncoes[] }
  | { tipo: 'inventario'; fichas: FichaFuncao[] }
  | { tipo: 'plano'; acoes: AcaoLinha[] }
  | { tipo: 'conclusoes'; linhas: ConclusaoFuncao[] }

export interface Capitulo {
  id: string
  numero: string
  titulo: string
  blocos: Bloco[]
}

export interface Documento {
  tipo: TipoDocumentoSst
  sigla: string
  titulo: string
  versao: number
  marca: Marca
  capa: Capa
  identificacao: Par[]
  capitulos: Capitulo[]
  anexos: Capitulo[]
  assinatura?: Assinatura
  pendencias: Pendencia[]
  /** "Razão social · CNPJ" de quem emite, para o rodapé */
  rodapeOrganizacao: string
}
