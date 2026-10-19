import { Image, Line, Page, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import { COR } from '../tema'
import type { Documento } from '../modelo'

const s = StyleSheet.create({
  pagina: {
    backgroundColor: '#EFEFEF',
    fontFamily: 'Poppins',
    alignItems: 'center',
    paddingTop: 90,
  },
  sigla: { fontSize: 88, fontWeight: 700, color: COR.preto, letterSpacing: -3, lineHeight: 1.15 },
  titulo: { fontSize: 16, color: COR.verdeEscuro, fontWeight: 500, marginTop: 6 },
  subtitulo: { fontSize: 9.5, color: COR.mudo, marginTop: 4 },
  logoCliente: { width: 150, height: 70, objectFit: 'contain', marginTop: 40 },
  cliente: { marginTop: 70, fontSize: 15, fontWeight: 700, color: COR.preto, textAlign: 'center' },
  detalhe: { fontSize: 9.5, color: COR.mudo, fontWeight: 500, marginTop: 4, textAlign: 'center' },
  cartoes: { flexDirection: 'row', marginTop: 34 },
  cartao: {
    backgroundColor: COR.branco,
    borderWidth: 0.7,
    borderColor: COR.borda,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  cartaoRotulo: { fontSize: 7, letterSpacing: 1.5, color: COR.mudo, textTransform: 'uppercase' },
  cartaoValor: { fontSize: 12, fontWeight: 700, color: COR.preto, marginTop: 2 },
  base: { position: 'absolute', bottom: 54, left: 0, right: 0, alignItems: 'center' },
  logoOrg: { height: 44, objectFit: 'contain' },
  nomeOrg: { fontSize: 20, fontWeight: 700, color: COR.preto, letterSpacing: 2 },
})

/** Leque de linhas que sai de um ponto de fuga, como a capa da identidade visual. */
function Leque({ cor }: { cor: string }) {
  const fuga = { x: 470, y: 560 }
  const linhas: { x2: number; y2: number }[] = []
  for (let i = 0; i <= 12; i++) linhas.push({ x2: -90 + i * 56, y2: 842 })
  for (let i = 0; i <= 8; i++) linhas.push({ x2: 595, y2: 580 + i * 33 })
  return (
    <View fixed style={{ position: 'absolute', top: 0, left: 0, width: 595, height: 842 }}>
      <Svg width={595} height={842} viewBox="0 0 595 842">
        {linhas.map((l, i) => (
          <Line
            key={i}
            x1={fuga.x}
            y1={fuga.y}
            x2={l.x2}
            y2={l.y2}
            stroke={cor}
            strokeWidth={0.8}
            strokeOpacity={0.7}
          />
        ))}
      </Svg>
    </View>
  )
}

export function Capa({ doc }: { doc: Documento }) {
  const { capa, marca } = doc
  return (
    <Page size="A4" style={s.pagina}>
      <Leque cor={marca.corPrimaria} />
      <Text style={s.sigla}>{capa.sigla}</Text>
      <Text style={[s.titulo, { color: marca.corPrimaria }]}>{capa.titulo}</Text>
      {capa.subtitulo ? <Text style={s.subtitulo}>{capa.subtitulo}</Text> : null}
      {marca.logoCliente ? <Image src={marca.logoCliente} style={s.logoCliente} /> : null}
      <Text style={[s.cliente, marca.logoCliente ? {} : { marginTop: 110 }]}>
        {capa.clienteNome}
      </Text>
      {capa.clienteDetalhe ? <Text style={s.detalhe}>{capa.clienteDetalhe}</Text> : null}
      <View style={s.cartoes}>
        {capa.cartoes.map((c) => (
          <View key={c.rotulo} style={s.cartao}>
            <Text style={s.cartaoRotulo}>{c.rotulo}</Text>
            <Text style={s.cartaoValor}>{c.valor}</Text>
          </View>
        ))}
      </View>
      <View style={s.base}>
        {marca.logoOrganizacao ? (
          <Image src={marca.logoOrganizacao} style={s.logoOrg} />
        ) : (
          <Text style={s.nomeOrg}>{marca.organizacaoNome.toUpperCase()}</Text>
        )}
      </View>
    </Page>
  )
}
