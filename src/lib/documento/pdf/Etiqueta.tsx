import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { COR } from '../tema'

const s = StyleSheet.create({
  caixa: {
    borderWidth: 0.7,
    borderColor: COR.borda,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 6,
    marginTop: 4,
    flexDirection: 'row',
  },
  tipo: {
    fontSize: 6.5,
    fontWeight: 600,
    letterSpacing: 0.8,
    color: COR.verdeEscuro,
    marginRight: 5,
    paddingTop: 1,
  },
  texto: { fontSize: 8, flexShrink: 1 },
})

export function Etiqueta({ tipo, texto }: { tipo: string; texto: string }) {
  const falta = tipo === 'FALTA'
  return (
    <View style={[s.caixa, falta ? { borderColor: COR.alerta } : {}]} wrap={false}>
      <Text style={[s.tipo, falta ? { color: COR.alerta } : {}]}>{tipo}</Text>
      <Text style={[s.texto, falta ? { color: COR.alerta, fontWeight: 600 } : {}]}>{texto}</Text>
    </View>
  )
}
