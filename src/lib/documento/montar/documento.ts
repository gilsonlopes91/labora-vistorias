import type { DadosDocumento } from '@/lib/modelosSst/dados'
import type { DocumentoRenderizado, ElRender } from '@/lib/modelosSst/renderizar'
import { vazio } from '@/lib/modelosSst/campos'
import { chaveDoBloco, MAPEAMENTO, type Estrutura } from '../mapeamento'
import type { Assinatura, Bloco, Capitulo, Documento, Marca, Par } from '../modelo'
import { casoSentenca, separarNumero } from '../titulos'
import { montarAmbientes, montarGrupos } from './ambientes'
import { montarConclusoes } from './conclusoes'
import { montarFichas } from './ficha'
import { montarPlano, tabelaConsolidada } from './plano'

export interface EntradaDocumento {
  dados: DadosDocumento
  renderizado: DocumentoRenderizado
  marca: Marca
  titulo: string
  assinatura?: Assinatura
}

type Resolvedor = () => Bloco

const SUBTITULO: Record<string, string> = {
  pgr: 'Gerenciamento de Riscos Ocupacionais · NR-1, capítulo 1.5',
  ltcat: 'Condições ambientais de trabalho · Lei 8.213/1991, art. 58',
  insalubridade: 'Atividades e operações insalubres · NR-15',
  periculosidade: 'Atividades e operações perigosas · NR-16',
}

function resolvedores(d: DadosDocumento): Record<Estrutura, Resolvedor> {
  return {
    ambientes: () => ({ tipo: 'ambientes', itens: montarAmbientes(d) }),
    funcoes: () => ({ tipo: 'funcoes', grupos: montarGrupos(d) }),
    inventario: () => ({ tipo: 'inventario', fichas: montarFichas(d, d.tipo) }),
    plano: () => ({ tipo: 'plano', acoes: montarPlano(d) }),
    conclusoes: () => ({ tipo: 'conclusoes', linhas: montarConclusoes(d, d.tipo) }),
  }
}

function transformar(elementos: ElRender[], d: DadosDocumento, emitidos: Set<Estrutura>): Bloco[] {
  const resolver = resolvedores(d)
  const saida: Bloco[] = []
  for (const el of elementos) {
    if (el.tipo !== 'tabela' || !el.blocoId) {
      saida.push(el)
      continue
    }
    const regra = MAPEAMENTO[chaveDoBloco(d.tipo, el.blocoId)]
    if (regra === undefined) {
      saida.push(el)
      continue
    }
    if (el.excluido || regra === 'absorvido') continue
    for (const estrutura of Array.isArray(regra) ? regra : [regra]) {
      if (emitidos.has(estrutura)) continue
      emitidos.add(estrutura)
      saida.push(resolver[estrutura]())
    }
  }
  return saida
}

function identificacao(r: DocumentoRenderizado): Par[] {
  const tabela = r.capa.find((e) => e.tipo === 'tabela')
  if (!tabela || tabela.tipo !== 'tabela') return []
  return tabela.linhas
    .filter((l) => vazio(l[0]) && vazio(l[1]))
    .map((l) => ({ rotulo: l[0].trim(), valor: l[1].trim() }))
}

export function montarDocumento(entrada: EntradaDocumento): Documento {
  const { dados: d, renderizado: r, marca } = entrada
  const emitidos = new Set<Estrutura>()
  const capitulos: Capitulo[] = r.secoes.map((s) => {
    const { numero, titulo } = separarNumero(s.titulo)
    return {
      id: s.id,
      numero,
      titulo: casoSentenca(titulo),
      blocos: transformar(s.elementos, d, emitidos),
    }
  })
  const fichas = d.tipo === 'pgr' ? montarFichas(d, 'pgr') : []
  const anexos: Capitulo[] = fichas.some((f) => f.riscos.length > 0)
    ? [
        {
          id: 'anexo-consolidado',
          numero: '',
          titulo: 'Tabela consolidada do inventário',
          blocos: [tabelaConsolidada(fichas)],
        },
      ]
    : []
  const empresa = d.empresa
  const cnpj = vazio(r.campos.CNPJ)
  return {
    tipo: d.tipo,
    sigla: r.modelo.sigla,
    titulo: entrada.titulo,
    versao: d.versao,
    marca: { ...marca, logoCliente: marca.logoCliente ?? undefined },
    capa: {
      sigla: r.modelo.sigla,
      titulo: r.modelo.titulo,
      subtitulo: SUBTITULO[d.tipo],
      clienteNome: vazio(empresa.nome_fantasia) || empresa.razao_social,
      clienteDetalhe:
        [cnpj && `CNPJ ${cnpj}`, vazio(r.campos.CIDADE)].filter(Boolean).join(' · ') || undefined,
      cartoes: [
        { rotulo: 'Versão', valor: String(d.versao) },
        { rotulo: 'Vigência', valor: r.campos.DATA_INICIO_VALIDADE },
        { rotulo: 'Revisar até', valor: r.campos.DATA_REVISAO_ATE },
        { rotulo: 'Trabalhadores', valor: r.campos.NUM_TRABALHADORES },
      ].filter((c): c is Par => !!vazio(c.valor)),
    },
    identificacao: identificacao(r),
    capitulos,
    anexos,
    assinatura: entrada.assinatura
      ? {
          ...entrada.assinatura,
          responsavelPlano: vazio(r.campos.NOME_RESPONSAVEL_PLANO)
            ? {
                nome: r.campos.NOME_RESPONSAVEL_PLANO!,
                cargo: vazio(r.campos.CARGO_RESPONSAVEL_PLANO),
              }
            : undefined,
        }
      : undefined,
    pendencias: r.pendencias,
    rodapeOrganizacao: [
      marca.razaoSocial || marca.organizacaoNome,
      marca.cnpj && `CNPJ ${marca.cnpj}`,
    ]
      .filter(Boolean)
      .join(' · '),
  }
}
