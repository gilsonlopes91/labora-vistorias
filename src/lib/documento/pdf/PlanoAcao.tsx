import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { COR } from '../tema'
import type { AcaoLinha } from '../modelo'

const s = StyleSheet.create({
  intro: { marginBottom: 8 },
  cab: {
    flexDirection: 'row',
    backgroundColor: COR.preto,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  linha: {
    flexDirection: 'row',
    borderBottomWidth: 0.6,
    borderBottomColor: COR.borda,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  th: {
    fontSize: 6.8,
    color: COR.branco,
    fontWeight: 600,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  td: { fontSize: 8.5 },
  sub: { fontSize: 7.5, color: COR.mudo, marginTop: 2 },
  vazio: { fontSize: 9.5, color: COR.mudo, fontStyle: 'italic' },
})

const L = { n: 24, medida: 175, risco: 120, resp: 70, prazo: 62, sit: 64 }

export function PlanoAcaoPdf({
  acoes,
  responsavel,
}: {
  acoes: AcaoLinha[]
  responsavel?: { nome: string; cargo?: string }
}) {
  if (acoes.length === 0) return <Text style={s.vazio}>Nenhuma ação cadastrada neste plano.</Text>
  return (
    <View>
      {responsavel ? (
        <Text style={s.intro}>
          Responsável pelo acompanhamento do cronograma: {responsavel.nome}
          {responsavel.cargo ? `, ${responsavel.cargo}` : ''}.
        </Text>
      ) : null}
      <View style={s.cab} wrap={false}>
        <Text style={[s.th, { width: L.n }]}>Nº</Text>
        <Text style={[s.th, { width: L.medida }]}>Medida</Text>
        <Text style={[s.th, { width: L.risco }]}>Risco e função</Text>
        <Text style={[s.th, { width: L.resp }]}>Responsável</Text>
        <Text style={[s.th, { width: L.prazo }]}>Prazo</Text>
        <Text style={[s.th, { width: L.sit }]}>Situação</Text>
      </View>
      {acoes.map((a, i) => (
        <View
          key={i}
          style={[s.linha, i % 2 === 1 ? { backgroundColor: '#F7F8F5' } : {}]}
          wrap={false}
        >
          <Text style={[s.td, { width: L.n, color: COR.verdeEscuro, fontWeight: 700 }]}>
            {a.numero}
          </Text>
          <View style={{ width: L.medida, paddingRight: 6 }}>
            <Text style={s.td}>{a.medida}</Text>
            {a.detalhe ? <Text style={s.sub}>{a.detalhe}</Text> : null}
          </View>
          <View style={{ width: L.risco, paddingRight: 6 }}>
            {a.risco ? <Text style={s.td}>{a.risco}</Text> : null}
            {a.funcao || a.nivel ? (
              <Text style={s.sub}>
                {[a.funcao, a.nivel && `nível ${a.nivel.toLowerCase()}`]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            ) : null}
          </View>
          <View style={{ width: L.resp, paddingRight: 6 }}>
            {a.responsavel ? <Text style={s.td}>{a.responsavel}</Text> : null}
          </View>
          <View style={{ width: L.prazo, paddingRight: 6 }}>
            {a.prazo ? <Text style={s.td}>{a.prazo}</Text> : null}
            {a.prazoRotulo ? <Text style={s.sub}>{a.prazoRotulo}</Text> : null}
          </View>
          <Text style={[s.td, { width: L.sit }]}>{a.situacao}</Text>
        </View>
      ))}
    </View>
  )
}
