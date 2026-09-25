/* Textos do relatório de vistoria (item 22): metodologia padrão e o rascunho
   da conclusão, montado com os números da vistoria para o RT ajustar. */
import { formatarDataCalendario } from '@/lib/date'

export const METODOLOGIA_PADRAO =
  'Inspeção visual das instalações, máquinas, equipamentos e da forma como o trabalho é feito, ' +
  'com conferência por amostragem dos documentos apresentados pela empresa. Cada item das ' +
  'Normas Regulamentadoras listadas neste relatório foi classificado como conforme (C), não ' +
  'conforme (N/C) ou não aplicável ao estabelecimento (N/A). As não conformidades foram ' +
  'registradas com a situação encontrada e, quando possível, com fotografia. A estimativa de ' +
  'multa segue a NR-28 (gradação do Anexo I e classificação das infrações do Anexo II), com o ' +
  'número de empregados informado no cadastro da empresa.'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export interface DadosConclusao {
  dataVistoria?: string
  /** Rótulos dos checklists ("NR-12", "NR-12 · Anexo VIII"). */
  checklists: string[]
  conforme: number
  naoConforme: number
  naoAplica: number
  semResposta: number
  multaMin: number
  multaMax: number
  /** Prazos (AAAA-MM-DD) das não conformidades que já têm prazo. */
  prazos: string[]
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

export function rascunhoConclusao(d: DadosConclusao): string {
  const avaliados = d.conforme + d.naoConforme + d.naoAplica
  const origem =
    d.checklists.length === 0
      ? ''
      : d.checklists.length === 1
        ? ` da ${d.checklists[0]}`
        : ` de ${d.checklists.length} checklists (${d.checklists.join(', ')})`
  const quando = d.dataVistoria
    ? `Na vistoria de ${formatarDataCalendario(d.dataVistoria)}, f`
    : 'F'

  const partes: string[] = []
  partes.push(
    `${quando}oram avaliados ${plural(avaliados, 'item', 'itens')}${origem}: ` +
      `${plural(d.conforme, 'conforme', 'conformes')}, ` +
      `${plural(d.naoConforme, 'não conforme', 'não conformes')} e ` +
      `${plural(d.naoAplica, 'não aplicável', 'não aplicáveis')} ao estabelecimento.` +
      (d.semResposta > 0
        ? ` ${plural(d.semResposta, 'item ficou', 'itens ficaram')} sem avaliação.`
        : ''),
  )

  if (d.naoConforme > 0) {
    const prazos = [...d.prazos].filter(Boolean).sort()
    let frase =
      'As não conformidades estão no plano de ação, com a recomendação e o prazo de cada uma.'
    if (prazos.length) frase += ` O primeiro prazo vence em ${formatarDataCalendario(prazos[0])}.`
    partes.push(frase)
    if (d.multaMax > 0) {
      partes.push(
        `Em caso de fiscalização, a estimativa de multa para esses itens, pela NR-28, é de ${moeda.format(d.multaMin)} a ${moeda.format(d.multaMax)}.`,
      )
    }
  } else {
    partes.push('Não foram encontradas não conformidades nos itens avaliados.')
  }

  partes.push(
    'Este relatório retrata as condições observadas na data da vistoria e nos documentos apresentados. ' +
      'Mudanças no processo, nas instalações ou no quadro de pessoal pedem nova avaliação.',
  )
  return partes.join('\n\n')
}
