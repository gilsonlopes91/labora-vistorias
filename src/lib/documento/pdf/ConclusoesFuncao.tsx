import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { COR } from '../tema'
import type { ConclusaoFuncao } from '../modelo'

const s = StyleSheet.create({
  item: {
    borderWidth: 0.8,
    borderColor: COR.borda,
    borderRadius: 10,
    padding: 10,
    marginBottom: 7,
  },
  funcao: { fontSize: 11, fontWeight: 700, color: COR.preto },
  meta: { fontSize: 8, color: COR.mudo, marginTop: 1 },
  conclusao: { fontSize: 10, fontWeight: 700, color: COR.preto, marginTop: 6 },
  detalhe: { fontSize: 8.5, marginTop: 2 },
})

export function ConclusoesFuncaoPdf({ linhas }: { linhas: ConclusaoFuncao[] }) {
  return (
    <View>
      {linhas.map((l, i) => (
        <View key={i} style={s.item} wrap={false}>
          <Text style={s.funcao}>{l.funcao}</Text>
          <Text style={s.meta}>{[l.ghe, l.agente].filter(Boolean).join('  ·  ')}</Text>
          <Text style={s.conclusao}>{l.conclusao}</Text>
          {l.enquadramento ? <Text style={s.detalhe}>{l.enquadramento}</Text> : null}
          {l.justificativa ? <Text style={s.detalhe}>{l.justificativa}</Text> : null}
        </View>
      ))}
    </View>
  )
}
