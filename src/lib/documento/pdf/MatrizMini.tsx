import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { COR } from '../tema'
import type { MatrizMiniDados } from '../modelo'

const TONS = ['#F2F2F0', '#E3E5DE', '#CDD1C6', '#B0B5A7', '#8E9484']
const s = StyleSheet.create({
  linha: { flexDirection: 'row' },
  eixo: { width: 9, fontSize: 6, color: COR.mudo, textAlign: 'center' },
})

export function MatrizMini({ m }: { m: MatrizMiniDados }) {
  const tamanho = m.dimensao === 3 ? 18 : 13
  return (
    <View>
      {m.niveis.map((linha, i) => {
        const p = m.dimensao - i
        return (
          <View key={i} style={s.linha}>
            <Text style={s.eixo}>{p}</Text>
            {linha.map((nivel, k) => {
              const marcada = p === m.p && k + 1 === m.s
              return (
                <View
                  key={k}
                  style={{
                    width: tamanho,
                    height: tamanho,
                    margin: 0.75,
                    borderRadius: 1.5,
                    backgroundColor: marcada
                      ? COR.verdeEscuro
                      : TONS[Math.min(4, Math.max(0, nivel - 1))],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {marcada ? (
                    <Text style={{ fontSize: 6.5, color: COR.branco, fontWeight: 700 }}>
                      {m.pontos}
                    </Text>
                  ) : null}
                </View>
              )
            })}
          </View>
        )
      })}
      <View style={s.linha}>
        <Text style={s.eixo}> </Text>
        {Array.from({ length: m.dimensao }, (_, k) => (
          <Text
            key={k}
            style={{ width: tamanho + 1.5, fontSize: 6, color: COR.mudo, textAlign: 'center' }}
          >
            {k + 1}
          </Text>
        ))}
      </View>
    </View>
  )
}
