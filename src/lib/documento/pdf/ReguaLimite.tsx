import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { COR } from '../tema'

const s = StyleSheet.create({
  trilho: {
    height: 6,
    backgroundColor: COR.borda,
    borderRadius: 3,
    marginTop: 8,
    position: 'relative',
  },
  marca: { position: 'absolute', top: -4, width: 1.5, height: 14, backgroundColor: COR.preto },
  rotulo: { position: 'absolute', top: 12, fontSize: 6.5, color: COR.mudo },
})

export function ReguaLimite({
  fracao,
  marcas,
  cor,
}: {
  fracao: number
  marcas: { rotulo: string; fracao: number }[]
  cor: string
}) {
  const ordenadas = [...marcas].sort((a, b) => a.fracao - b.fracao)
  return (
    <View style={{ paddingBottom: 12 }}>
      <View style={s.trilho}>
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: cor,
            width: `${Math.round(fracao * 100)}%`,
          }}
        />
        {ordenadas.map((m, i) => {
          const pct = Math.round(m.fracao * 100)
          // A primeira etiqueta termina na marca e a última começa nela, para duas marcas próximas não se sobreporem.
          const aEsquerda = ordenadas.length > 1 && i < ordenadas.length - 1
          return (
            <View key={m.rotulo}>
              <View style={[s.marca, { left: `${pct}%` }]} />
              <Text
                style={[s.rotulo, aEsquerda ? { right: `${100 - pct}%` } : { left: `${pct}%` }]}
              >
                {m.rotulo}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
