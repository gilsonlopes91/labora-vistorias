import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { COR } from '../tema'
import type { Ambiente } from '../modelo'

const s = StyleSheet.create({
  cartao: {
    borderWidth: 0.8,
    borderColor: COR.borda,
    borderRadius: 10,
    padding: 11,
    marginBottom: 9,
  },
  nome: { fontSize: 12.5, fontWeight: 700, color: COR.preto },
  sub: { fontSize: 8.5, fontWeight: 400, color: COR.mudo },
  rotulo: {
    fontSize: 7,
    letterSpacing: 1.2,
    color: COR.mudo,
    textTransform: 'uppercase',
    fontWeight: 600,
    marginBottom: 1,
  },
  linha: { flexDirection: 'row' },
  coluna: { flex: 1, paddingRight: 12 },
  bloco: { marginTop: 6 },
  metricas: { flexDirection: 'row', marginTop: 6 },
  metrica: {
    flex: 1,
    backgroundColor: COR.cinza,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginRight: 6,
  },
  metricaValor: { fontSize: 10, fontWeight: 600, color: COR.preto },
})

function Campo({ rotulo, texto }: { rotulo: string; texto?: string }) {
  if (!texto) return <View style={s.coluna} />
  return (
    <View style={s.coluna}>
      <Text style={s.rotulo}>{rotulo}</Text>
      <Text>{texto}</Text>
    </View>
  )
}

export function AmbientePdf({ a }: { a: Ambiente }) {
  const temPar1 = a.construcao || a.iluminacaoVentilacao
  const temPar2 = a.equipamentos || a.funcoes
  return (
    <View style={s.cartao} wrap={false}>
      <Text style={s.nome}>
        {a.nome}
        {a.subtitulo ? (
          <Text style={s.sub}>
            {'   '}
            {a.subtitulo}
          </Text>
        ) : null}
      </Text>
      {a.processo ? (
        <View style={s.bloco}>
          <Text style={s.rotulo}>Processo</Text>
          <Text>{a.processo}</Text>
        </View>
      ) : null}
      {a.metricas.length > 0 ? (
        <View style={s.metricas}>
          {a.metricas.map((m) => (
            <View key={m.rotulo} style={s.metrica}>
              <Text style={s.rotulo}>{m.rotulo}</Text>
              <Text style={s.metricaValor}>{m.valor}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {temPar1 ? (
        <View style={[s.linha, s.bloco]}>
          <Campo rotulo="Construção" texto={a.construcao} />
          <Campo rotulo="Iluminação e ventilação" texto={a.iluminacaoVentilacao} />
        </View>
      ) : null}
      {temPar2 ? (
        <View style={[s.linha, s.bloco]}>
          <Campo rotulo="Máquinas e equipamentos" texto={a.equipamentos} />
          <Campo rotulo="Funções que atuam aqui" texto={a.funcoes} />
        </View>
      ) : null}
      {a.fontesPerigo ? (
        <View style={s.bloco}>
          <Text style={s.rotulo}>Fontes de perigo identificadas</Text>
          <Text>{a.fontesPerigo}</Text>
        </View>
      ) : null}
    </View>
  )
}
