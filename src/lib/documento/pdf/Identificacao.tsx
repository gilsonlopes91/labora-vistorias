import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { COR } from '../tema'
import type { Par } from '../modelo'

const s = StyleSheet.create({
  caixa: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 0.7,
    borderColor: COR.borda,
    borderRadius: 10,
    padding: 10,
  },
  item: { width: '50%', paddingRight: 10, paddingVertical: 4 },
  rotulo: {
    fontSize: 7,
    letterSpacing: 1.2,
    color: COR.mudo,
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  valor: { fontSize: 9.5, color: COR.preto, fontWeight: 500, marginTop: 1 },
})

export function Identificacao({ itens }: { itens: Par[] }) {
  return (
    <View style={s.caixa}>
      {itens.map((p) => (
        <View key={p.rotulo} style={s.item} wrap={false}>
          <Text style={s.rotulo}>{p.rotulo}</Text>
          <Text style={s.valor}>{p.valor}</Text>
        </View>
      ))}
    </View>
  )
}
