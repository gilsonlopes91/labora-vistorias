import { StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ElRender, Run } from '@/lib/modelosSst/renderizar'
import { COR, FONTE } from '../tema'

const s = StyleSheet.create({
  titulo2: {
    fontSize: FONTE.titulo2,
    fontWeight: 700,
    color: COR.preto,
    marginTop: 10,
    marginBottom: 4,
  },
  titulo3: {
    fontSize: 10.5,
    fontWeight: 700,
    color: COR.verdeEscuro,
    marginTop: 8,
    marginBottom: 3,
  },
  paragrafo: { marginBottom: 6, textAlign: 'left' },
  item: { flexDirection: 'row', marginBottom: 3, paddingLeft: 6 },
  marcador: { width: 10 },
  tabela: { marginTop: 4, marginBottom: 8, borderWidth: 0.6, borderColor: COR.borda },
  linha: { flexDirection: 'row', borderBottomWidth: 0.6, borderBottomColor: COR.borda },
  cabecalho: { backgroundColor: COR.preto },
  celula: { flex: 1, paddingVertical: 4, paddingHorizontal: 5 },
  nota: { fontSize: FONTE.pequeno, color: COR.mudo, fontStyle: 'italic', marginBottom: 6 },
})

function Runs({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((r, i) => (
        <Text
          key={i}
          style={{ fontWeight: r.negrito ? 700 : 400, fontStyle: r.italico ? 'italic' : 'normal' }}
        >
          {r.texto}
        </Text>
      ))}
    </>
  )
}

export function Tabela({ el }: { el: Extract<ElRender, { tipo: 'tabela' }> }) {
  if (el.excluido) return null
  const colunas = Math.max(el.cabecalho.length, ...el.linhas.map((l) => l.length), 1)
  const tamanho = colunas > 7 ? 6.5 : colunas > 5 ? 7.5 : 8.5
  // Largura de cada coluna proporcional ao texto mais longo dela, entre um mínimo e um teto.
  const pesos = Array.from({ length: colunas }, (_, k) => {
    const maior = Math.max(
      (el.cabecalho[k] || '').length,
      ...el.linhas.map((l) => (l[k] || '').length),
      1,
    )
    return Math.min(Math.max(maior, 4), 34)
  })
  if (el.linhas.length === 0) {
    const aviso = el.manual
      ? 'Bloco a ser preenchido pelo responsável técnico.'
      : 'Não há registros para este bloco neste levantamento.'
    return (
      <View wrap={false}>
        {el.titulo ? <Text style={s.titulo3}>{el.titulo}</Text> : null}
        <Text style={s.nota}>{aviso}</Text>
      </View>
    )
  }
  return (
    <View>
      {el.titulo ? (
        <Text style={s.titulo3} minPresenceAhead={60}>
          {el.titulo}
        </Text>
      ) : null}
      <View style={s.tabela}>
        {el.cabecalho.length > 0 ? (
          <View style={[s.linha, s.cabecalho]} wrap={false}>
            {el.cabecalho.map((c, i) => (
              <Text
                key={i}
                style={[
                  s.celula,
                  { flex: pesos[i] ?? 4, fontSize: tamanho, color: COR.branco, fontWeight: 600 },
                ]}
              >
                {c}
              </Text>
            ))}
          </View>
        ) : null}
        {el.linhas.map((l, i) => (
          <View
            key={i}
            style={[s.linha, i % 2 === 1 ? { backgroundColor: '#F7F8F5' } : {}]}
            wrap={false}
          >
            {Array.from({ length: colunas }, (_, k) => (
              <Text key={k} style={[s.celula, { flex: pesos[k], fontSize: tamanho }]}>
                {l[k] ?? ''}
              </Text>
            ))}
          </View>
        ))}
      </View>
      {el.observacao ? <Text style={s.nota}>Observação: {el.observacao}</Text> : null}
    </View>
  )
}

export function Elemento({ el }: { el: ElRender }) {
  switch (el.tipo) {
    case 'titulo':
      return (
        <Text style={el.nivel === 3 ? s.titulo3 : s.titulo2} minPresenceAhead={50}>
          {el.texto}
        </Text>
      )
    case 'paragrafo':
      return (
        <Text style={s.paragrafo}>
          <Runs runs={el.runs} />
        </Text>
      )
    case 'lista':
      return (
        <View style={{ marginBottom: 4 }}>
          {el.itens.map((it, i) => (
            <View key={i} style={s.item} wrap={false}>
              <Text style={s.marcador}>•</Text>
              <Text style={{ flex: 1 }}>
                <Runs runs={it} />
              </Text>
            </View>
          ))}
        </View>
      )
    case 'tabela':
      return <Tabela el={el} />
  }
}
