import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export type MetodologiaMedicao =
  | 'NHO 01 (ruído)'
  | 'NHO 02 (vapores orgânicos)'
  | 'NHO 03 (gravimetria)'
  | 'NHO 04 (fibras)'
  | 'NHO 06 (calor)'
  | 'NHO 08 (coleta de particulado)'
  | 'NHO 09 (vibração corpo inteiro)'
  | 'NHO 10 (vibração mãos e braços)'
  | 'NR-15 (critério trabalhista)'
  | 'Outra'

export interface Medicao extends RecordModel {
  id: string
  organizacao_id: string
  avaliacao_id: string
  formulario_id?: string
  data: string
  trabalhador_ou_ponto?: string
  funcao_avaliada?: string
  metodologia?: MetodologiaMedicao
  equipamento?: string
  numero_serie?: string
  certificado_calibracao?: string
  calibracao_validade?: string
  calibracao_leitura_inicial?: number
  calibracao_leitura_final?: number
  tempo_amostragem_min?: number
  jornada_min?: number
  resultado_valor?: number
  resultado_unidade?: string
  ruido_dose_nr15_pct?: number
  ruido_nen_nr15_dba?: number
  ruido_nen_nho01_dba?: number
  laudo_laboratorio?: string[]
  observacoes?: string
  created: string
  updated: string
}

export type MedicaoInput = Partial<Omit<Medicao, 'id' | 'created' | 'updated'>> & {
  organizacao_id: string
  avaliacao_id: string
  data: string
}

export const getMedicoesPorAvaliacao = (avaliacaoId: string) =>
  pb.collection('medicoes').getFullList<Medicao>({
    filter: `avaliacao_id = "${avaliacaoId}"`,
    sort: '-data',
  })

export const createMedicao = (data: MedicaoInput) => pb.collection('medicoes').create<Medicao>(data)

export const updateMedicao = (id: string, data: Partial<MedicaoInput>) =>
  pb.collection('medicoes').update<Medicao>(id, data)

export const deleteMedicao = (id: string) => pb.collection('medicoes').delete(id)
