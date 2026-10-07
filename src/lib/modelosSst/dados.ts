/* Carrega, de uma vez, tudo o que os Modelos Gerais precisam para preencher
   um documento: organização que emite, empresa, responsáveis técnicos,
   estrutura (setores, GHE, funções), inventário de riscos com medições,
   catálogo de EPIs, plano de ação, matriz de risco e a cadeia de versões do
   documento. Quem preenche os campos (campos.ts) e os blocos (blocos.ts)
   trabalha só em cima deste objeto, sem ir ao servidor. */
import pb from '@/lib/pocketbase/client'
import { carregarIdentidade, type IdentidadeVisual } from '@/lib/identidadeVisual'
import { getEmpresa, type Empresa } from '@/services/empresas'
import { getResponsaveisTecnicos, type ResponsavelTecnico } from '@/services/responsaveisTecnicos'
import { getSetores, type Setor } from '@/services/setores'
import { getGhes, type Ghe } from '@/services/ghes'
import { getFuncoesSst, type FuncaoSst } from '@/services/funcoesSst'
import { getAvaliacoesRiscoDaEmpresa, type AvaliacaoRisco } from '@/services/avaliacoesRisco'
import { getMedicoesPorAvaliacao, type Medicao } from '@/services/medicoes'
import { getEpisCatalogo, type EpiCatalogo } from '@/services/episCatalogo'
import { getAcoesPlano, getAcoesDosPlanos, type AcaoPlano } from '@/services/acoesPlano'
import { getPlanosAcao, type PlanoAcao } from '@/services/planosAcao'
import { getMatrizOficial, type MatrizRisco } from '@/services/matrizesRisco'
import type { DocumentoSst, TipoDocumentoSst } from '@/services/documentosSst'

export interface DadosDocumento {
  tipo: TipoDocumentoSst
  documento: Partial<DocumentoSst>
  /** Versão que o documento terá ao ser emitido. */
  versao: number
  dataEmissao: Date
  organizacao: IdentidadeVisual
  empresa: Empresa
  autor: ResponsavelTecnico | null
  coordenador: ResponsavelTecnico | null
  setores: Setor[]
  ghes: Ghe[]
  funcoes: FuncaoSst[]
  avaliacoes: AvaliacaoRisco[]
  /** Medições por avaliação de risco (só das avaliações com agente). */
  medicoes: Record<string, Medicao[]>
  epis: EpiCatalogo[]
  acoes: AcaoPlano[]
  planos: PlanoAcao[]
  matriz: MatrizRisco | null
  /** Versões já emitidas deste mesmo documento (cadeia de revisões), da mais antiga à mais nova. */
  revisoes: DocumentoSst[]
  /** Último documento emitido de cada tipo para esta empresa (para as referências cruzadas). */
  emitidos: Partial<Record<TipoDocumentoSst, DocumentoSst>>
}

async function cadeiaDeRevisoes(doc: Partial<DocumentoSst>): Promise<DocumentoSst[]> {
  const lista: DocumentoSst[] = []
  let anteriorId = doc.documento_anterior_id
  let guarda = 0
  while (anteriorId && guarda < 50) {
    guarda++
    try {
      const ant = await pb.collection('documentos_sst').getOne<DocumentoSst>(anteriorId)
      lista.unshift(ant)
      anteriorId = ant.documento_anterior_id
    } catch {
      break
    }
  }
  return lista
}

export async function carregarDadosDocumento(
  empresaId: string,
  documento: Partial<DocumentoSst>,
  tipo: TipoDocumentoSst,
): Promise<DadosDocumento> {
  const empresa = await getEmpresa(empresaId)
  const [organizacao, rts, setores, ghes, funcoes, planos, epis] = await Promise.all([
    carregarIdentidade(),
    getResponsaveisTecnicos(empresa.organizacao_id).catch(() => [] as ResponsavelTecnico[]),
    getSetores(empresaId),
    getGhes(empresaId),
    getFuncoesSst(empresaId),
    getPlanosAcao(empresaId),
    getEpisCatalogo(empresaId).catch(() => [] as EpiCatalogo[]),
  ])
  const avaliacoes = await getAvaliacoesRiscoDaEmpresa(
    ghes.map((g) => g.id),
    funcoes.map((f) => f.id),
  )
  const comAgente = avaliacoes.filter((a) => a.agente_id)
  const listasMedicoes = await Promise.all(
    comAgente.map((a) => getMedicoesPorAvaliacao(a.id).catch(() => [] as Medicao[])),
  )
  const medicoes: Record<string, Medicao[]> = {}
  comAgente.forEach((a, i) => (medicoes[a.id] = listasMedicoes[i]))

  const planosIds =
    documento.planos_acao_ids && documento.planos_acao_ids.length > 0
      ? documento.planos_acao_ids
      : null
  const acoes = planosIds
    ? await getAcoesDosPlanos(empresaId, planosIds)
    : await getAcoesPlano(empresaId)

  const dimensao = (Number(empresa.pgr_matriz_padrao_dimensao) || 5) as 3 | 5
  const metodologia = empresa.pgr_matriz_padrao_metodologia || 'AIHA'
  const matriz = await getMatrizOficial(dimensao, metodologia).catch(() => null)

  const revisoes = await cadeiaDeRevisoes(documento)
  const emitidos: Partial<Record<TipoDocumentoSst, DocumentoSst>> = {}
  try {
    const todos = await pb.collection('documentos_sst').getFullList<DocumentoSst>({
      filter: pb.filter('empresa_id = {:e} && status = "emitido"', { e: empresaId }),
      sort: '-data_emissao',
    })
    for (const d of todos) if (!emitidos[d.tipo]) emitidos[d.tipo] = d
  } catch {
    // sem permissão de listar: as referências cruzadas ficam em branco
  }

  const autor = rts.find((r) => r.id === documento.autor_rt_id) || null
  const coordenador = rts.find((r) => r.id === documento.coordenador_rt_id) || null

  return {
    tipo,
    documento,
    versao: (documento.versao || 0) + 1,
    dataEmissao: new Date(),
    organizacao,
    empresa,
    autor,
    coordenador,
    setores,
    ghes,
    funcoes,
    avaliacoes,
    medicoes,
    epis,
    acoes,
    planos,
    matriz,
    revisoes,
    emitidos,
  }
}
