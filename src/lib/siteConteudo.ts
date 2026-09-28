/* Conteúdo editável do site público. Os textos padrão abaixo são exatamente os
   que estavam escritos no código; o site usa o conteúdo PUBLICADO pelo editor
   (Admin > Textos do site) por cima deles. Sem nada publicado, nada muda. */
import pb from '@/lib/pocketbase/client'

export interface ImagemSite {
  id: string
  arquivo: string
  alt: string
}

export interface RecursoSite {
  icone: string
  titulo: string
  texto: string
}

export interface HomeConteudo {
  abertura: {
    selo: string
    titulo: string
    destaque: string
    texto: string
    botao_principal: string
    botao_secundario: string
    nota: string
    imagem: ImagemSite | null
  }
  antes: { titulo: string; paragrafos: string[]; imagem: ImagemSite | null }
  depois: { titulo: string; paragrafos: string[]; imagem: ImagemSite | null }
  recursos: { titulo: string; itens: RecursoSite[] }
  calculadora: { titulo: string; texto: string; botao: string }
  lista_espera: { titulo: string; texto: string; botao: string }
}

export interface RodapeConteudo {
  nome: string
  descricao: string
  email_contato: string
  assinatura: string
}

export type ChaveSite = 'home' | 'rodape'

export const HOME_PADRAO: HomeConteudo = {
  abertura: {
    selo: 'Labora Vistorias',
    titulo: 'Vistoria de SST do agendamento ao relatório,',
    destaque: 'no celular',
    texto:
      'Checklists das NRs, foto com GPS, multa estimada em cada não conformidade e o relatório em PDF com plano de ação pronto antes de você sair do cliente.',
    botao_principal: 'Entrar na lista de espera',
    botao_secundario: 'Calcular uma multa grátis',
    nota: 'O app está sendo usado por um grupo pequeno de profissionais. Novas contas são abertas aos poucos, pela lista de espera.',
    imagem: null,
  },
  antes: {
    titulo: 'Antes da visita',
    paragrafos: [
      'Cadastre a empresa pelo CNPJ (o grau de risco vem do CNAE), escolha os checklists e marque a data. Visitas que se repetem viram rotina: a próxima entra na agenda assim que a anterior é concluída, com o mesmo responsável e os mesmos checklists.',
      'O app sugere o que levar a partir das normas escolhidas: dosímetro para ruído, medidor de IBUTG para calor, detector de tensão para NR-10.',
    ],
    imagem: null,
  },
  depois: {
    titulo: 'Depois da visita',
    paragrafos: [
      'Ao finalizar, o app monta um rascunho da conclusão com os números da vistoria e você ajusta. O relatório sai com o plano de ação, as fotos, a metodologia e as assinaturas, com o logo e os dados da sua empresa.',
      'Vistoria concluída fica travada. Se precisar mudar algo, ela é reaberta com o motivo registrado no histórico.',
    ],
    imagem: null,
  },
  recursos: {
    titulo: 'O que já vem no app',
    itens: [
      {
        icone: 'checklist',
        titulo: 'Checklists das 36 NRs vigentes',
        texto:
          'Cada anexo separado e o texto de cada item como está na norma. Você também monta checklists próprios.',
      },
      {
        icone: 'calculadora',
        titulo: 'Multa estimada em cada não conformidade',
        texto:
          'Pela tabela da NR-28, com o número de empregados da empresa. Ajuda a mostrar ao cliente o que está em jogo.',
      },
      {
        icone: 'camera',
        titulo: 'Fotos com GPS, mesmo com sinal fraco',
        texto:
          'Se a internet cair no meio da vistoria, as respostas e fotos ficam no aparelho e sobem quando o sinal volta.',
      },
      {
        icone: 'arquivo',
        titulo: 'Relatório em PDF com a sua marca',
        texto:
          'Plano de ação com prazos, conclusão, nº da ART e assinaturas do responsável técnico e da empresa.',
      },
      {
        icone: 'termometro',
        titulo: 'Fichas de campo de calor e ruído',
        texto:
          'IBUTG médio, taxa metabólica, dose e NEN calculados na hora, com a comparação com o nível de ação e o limite.',
      },
      {
        icone: 'agenda',
        titulo: 'Agenda e rotinas',
        texto:
          'Visitas recorrentes entram na agenda sozinhas. Dá para assinar a agenda no Google Agenda ou no Outlook.',
      },
      {
        icone: 'orcamento',
        titulo: 'Orçamentos e propostas',
        texto: 'Proposta em PDF e link para o cliente abrir no celular. Você vê quando ele abriu.',
      },
      {
        icone: 'equipe',
        titulo: 'Equipe com papéis',
        texto:
          'Dono, gerente e técnico. O técnico vê as empresas e edita só as vistorias que são dele.',
      },
    ],
  },
  calculadora: {
    titulo: 'Calculadora de multas da NR-28, grátis e sem cadastro',
    texto:
      'Escolha a norma, o item e o número de empregados e veja o valor mínimo e máximo da multa, com o texto do item e a célula da tabela destacada.',
    botao: 'Abrir a calculadora',
  },
  lista_espera: {
    titulo: 'Quer usar no seu dia a dia?',
    texto: 'Deixe seu nome na lista de espera. Avisamos por e-mail quando abrir uma vaga.',
    botao: 'Entrar na lista de espera',
  },
}

export const RODAPE_PADRAO: RodapeConteudo = {
  nome: 'LABORA vistorias',
  descricao: 'Gestão de vistorias e inspeções de SST',
  email_contato: 'labora@laboravistorias.com.br',
  assinatura: 'Labora Engenharia e SST',
}

/** Junta o conteúdo salvo ao padrão: só valem as chaves que existem no padrão,
 *  e um valor salvo com tipo diferente do padrão é ignorado. Listas salvas
 *  substituem a lista padrão inteira (é assim que se adiciona/remove item). */
export function mesclar<T>(padrao: T, salvo: unknown): T {
  if (salvo === undefined || salvo === null) return padrao
  if (Array.isArray(padrao)) return (Array.isArray(salvo) ? salvo : padrao) as T
  if (padrao !== null && typeof padrao === 'object') {
    if (typeof salvo !== 'object' || Array.isArray(salvo)) return padrao
    const base = padrao as Record<string, unknown>
    const vindo = salvo as Record<string, unknown>
    const saida: Record<string, unknown> = {}
    for (const k of Object.keys(base)) saida[k] = mesclar(base[k], vindo[k])
    return saida as T
  }
  return (typeof salvo === typeof padrao ? salvo : padrao) as T
}

export function urlImagem(img: ImagemSite): string {
  return pb.files.getURL(
    { id: img.id, collectionId: 'site_imagens', collectionName: 'site_imagens' },
    img.arquivo,
  )
}
