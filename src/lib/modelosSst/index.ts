/* Ponto de entrada do motor dos Modelos Gerais Labora. */
import pgr from '@/modelos-sst/gerados/pgr.json'
import ltcat from '@/modelos-sst/gerados/ltcat.json'
import insalubridade from '@/modelos-sst/gerados/insalubridade.json'
import periculosidade from '@/modelos-sst/gerados/periculosidade.json'
import type { ModeloDocumento, TipoModelo } from '@/modelos-sst/tipos'

const MODELOS: Record<TipoModelo, ModeloDocumento> = {
  pgr: pgr as unknown as ModeloDocumento,
  ltcat: ltcat as unknown as ModeloDocumento,
  insalubridade: insalubridade as unknown as ModeloDocumento,
  periculosidade: periculosidade as unknown as ModeloDocumento,
}

export const carregarModelo = (tipo: TipoModelo): ModeloDocumento => MODELOS[tipo]

export * from './dados'
export * from './campos'
export * from './montar'
export * from './renderizar'
export { gerarBloco, BLOCOS_IMPLEMENTADOS } from './blocos'
