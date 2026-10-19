import { StyleSheet, Text, View } from '@react-pdf/renderer'
import type { TipoDocumentoSst } from '@/services/documentosSst'
import { CATEGORIAS } from '../categorias'
import { COR } from '../tema'
import type { FichaFuncao } from '../modelo'
import { CardRiscoPdf } from './CardRisco'

const s = StyleSheet.create({
  rotulo: { fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 },
  nome: { fontSize: 15, fontWeight: 700, color: COR.preto, marginTop: 2 },
  sub: { fontSize: 8.5, color: COR.mudo, marginTop: 2, marginBottom: 8 },
  cab: { backgroundColor: COR.cinza, borderRadius: 10, padding: 10, marginBottom: 8 },
  cabLinha: { flexDirection: 'row' },
  cabItem: { flex: 1 },
  k: {
    fontSize: 6.8,
    letterSpacing: 1.1,
    color: COR.mudo,
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  v: { fontSize: 10.5, fontWeight: 600, color: COR.preto, marginTop: 1 },
  ativ: {
    marginTop: 7,
    paddingTop: 6,
    borderTopWidth: 0.7,
    borderTopColor: COR.bordaForte,
    borderTopStyle: 'dashed',
    fontSize: 9,
  },
  lista: { marginBottom: 6 },
  itemLista: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    borderBottomWidth: 0.6,
    borderBottomColor: COR.borda,
    borderBottomStyle: 'dashed',
  },
  bolinha: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legenda: { fontSize: 7, color: COR.mudo, marginTop: 4, marginBottom: 8 },
  vazio: { fontSize: 9.5, color: COR.mudo, fontStyle: 'italic', marginVertical: 12 },
})

export function FichaFuncaoPdf({
  f,
  tipo,
  cor,
}: {
  f: FichaFuncao
  tipo: TipoDocumentoSst
  cor: string
}) {
  return (
    <View break>
      <View wrap={false}>
        <Text style={[s.rotulo, { color: cor }]}>Inventário por função</Text>
        <Text style={s.nome}>{f.nome}</Text>
        <Text style={s.sub}>
          {[f.ghe, f.ambiente, f.levantamento].filter(Boolean).join('  ·  ')}
        </Text>
        <View style={s.cab}>
          <View style={s.cabLinha}>
            {f.cbo ? (
              <View style={s.cabItem}>
                <Text style={s.k}>CBO</Text>
                <Text style={s.v}>{f.cbo}</Text>
              </View>
            ) : null}
            {f.expostos ? (
              <View style={s.cabItem}>
                <Text style={s.k}>Expostos</Text>
                <Text style={s.v}>{f.expostos}</Text>
              </View>
            ) : null}
            {f.jornada ? (
              <View style={s.cabItem}>
                <Text style={s.k}>Jornada</Text>
                <Text style={s.v}>{f.jornada}</Text>
              </View>
            ) : null}
            <View style={s.cabItem}>
              <Text style={s.k}>Riscos identificados</Text>
              <Text style={s.v}>
                {f.riscos.length}
                {f.comMedicao > 0 ? ` · ${f.comMedicao} com medição` : ''}
              </Text>
            </View>
          </View>
          {f.atividades ? (
            <Text style={s.ativ}>
              <Text style={{ fontWeight: 700 }}>Atividades: </Text>
              {f.atividades}
            </Text>
          ) : null}
        </View>

        {f.riscos.length === 0 ? (
          <Text style={s.vazio}>Nenhum risco identificado nesta função.</Text>
        ) : (
          <View style={s.lista}>
            <Text style={s.k}>Riscos desta função</Text>
            {f.riscos.map((r, i) => (
              <View key={i} style={s.itemLista}>
                <View style={[s.bolinha, { backgroundColor: CATEGORIAS[r.categoria].cor }]} />
                <Text style={{ flex: 1 }}>{r.nome}</Text>
                <Text style={{ width: 70, color: COR.mudo }}>{CATEGORIAS[r.categoria].rotulo}</Text>
                {r.nivel ? (
                  <Text style={{ width: 70, textAlign: 'right', fontWeight: 600 }}>
                    {r.nivel.rotulo}
                  </Text>
                ) : null}
              </View>
            ))}
            <Text style={s.legenda}>
              Cores do mapa de riscos (NR-5, Anexo IV). O nível vem da matriz do capítulo 11.
            </Text>
          </View>
        )}
      </View>
      {f.riscos.map((r, i) => (
        <CardRiscoPdf key={i} c={r} tipo={tipo} />
      ))}
    </View>
  )
}
