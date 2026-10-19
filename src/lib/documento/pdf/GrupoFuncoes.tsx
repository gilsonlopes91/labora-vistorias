import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { COR } from '../tema'
import type { GrupoFuncoes } from '../modelo'

const s = StyleSheet.create({
  titulo: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: 700,
    marginTop: 8,
  },
  detalhe: { fontSize: 8, color: COR.mudo, marginTop: 1, marginBottom: 4 },
  funcao: {
    flexDirection: 'row',
    borderTopWidth: 0.7,
    borderTopColor: COR.borda,
    paddingVertical: 8,
  },
  lateral: { width: 150, paddingRight: 12 },
  nome: { fontSize: 11, fontWeight: 700, color: COR.preto },
  meta: { fontSize: 8, color: COR.mudo, marginTop: 2 },
  rotuloMeta: { fontWeight: 600, color: COR.texto },
  texto: { flex: 1 },
})

export function GrupoFuncoesPdf({ g, cor }: { g: GrupoFuncoes; cor: string }) {
  const [primeira, ...demais] = g.funcoes
  const linha = (f: GrupoFuncoes['funcoes'][number], i: number) => (
    <View key={i} style={s.funcao} wrap={false}>
      <View style={s.lateral}>
        <Text style={s.nome}>{f.nome}</Text>
        {f.cbo ? (
          <Text style={s.meta}>
            <Text style={s.rotuloMeta}>CBO </Text>
            {f.cbo}
          </Text>
        ) : null}
        {f.expostos ? (
          <Text style={s.meta}>
            <Text style={s.rotuloMeta}>Expostos </Text>
            {f.expostos}
          </Text>
        ) : null}
        {f.jornada ? (
          <Text style={s.meta}>
            <Text style={s.rotuloMeta}>Jornada </Text>
            {f.jornada}
          </Text>
        ) : null}
        {f.ambiente ? (
          <Text style={s.meta}>
            <Text style={s.rotuloMeta}>Ambiente </Text>
            {f.ambiente}
          </Text>
        ) : null}
      </View>
      {f.atividades ? <Text style={s.texto}>{f.atividades}</Text> : <View style={s.texto} />}
    </View>
  )
  return (
    <View>
      {/* o título do grupo anda sempre junto com a primeira função, para não ficar sozinho no fim da página */}
      <View wrap={false}>
        <Text style={[s.titulo, { color: cor }]}>{g.titulo}</Text>
        {g.detalhe ? <Text style={s.detalhe}>{g.detalhe}</Text> : null}
        {primeira ? linha(primeira, 0) : null}
      </View>
      {demais.map((f, i) => linha(f, i + 1))}
    </View>
  )
}
