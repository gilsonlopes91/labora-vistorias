import { StyleSheet, Text, View } from '@react-pdf/renderer'
import type { TipoDocumentoSst } from '@/services/documentosSst'
import { CATEGORIAS } from '../categorias'
import { COR } from '../tema'
import type { CardRisco } from '../modelo'
import { alturaEstimada, CABE_NA_PAGINA } from './altura'
import { Etiqueta } from './Etiqueta'
import { MatrizMini } from './MatrizMini'
import { ReguaLimite } from './ReguaLimite'

const s = StyleSheet.create({
  card: {
    borderWidth: 0.8,
    borderColor: COR.borda,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  cab: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  bolinha: { width: 20, height: 20, borderRadius: 10, marginRight: 9 },
  titulo: { fontSize: 12.5, fontWeight: 700, color: COR.preto },
  meta: { fontSize: 7.5, color: COR.mudo, marginTop: 1 },
  selo: {
    marginLeft: 'auto',
    borderWidth: 0.8,
    borderColor: COR.bordaForte,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 9,
    backgroundColor: COR.cinza,
  },
  seloTexto: { fontSize: 8.5, fontWeight: 700, color: COR.preto },
  quadros: { flexDirection: 'row', marginBottom: 6 },
  quadro: {
    flex: 1,
    backgroundColor: COR.cinza,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 9,
    marginRight: 6,
  },
  rotulo: {
    fontSize: 6.8,
    letterSpacing: 1.1,
    color: COR.mudo,
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  valor: { fontSize: 10.5, fontWeight: 700, color: COR.preto, marginTop: 2 },
  detalhe: { fontSize: 7.5, color: COR.mudo, marginTop: 1 },
  par: { flexDirection: 'row' },
  coluna: { flex: 1, paddingRight: 12 },
  rotuloVerde: {
    fontSize: 7,
    letterSpacing: 1.1,
    color: COR.verdeEscuro,
    textTransform: 'uppercase',
    fontWeight: 700,
    marginBottom: 2,
  },
  medidas: { flexDirection: 'row', flexWrap: 'wrap' },
  analise: {
    flexDirection: 'row',
    backgroundColor: COR.cinza,
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  pontos: { fontSize: 9.5, fontWeight: 700, color: COR.preto, marginTop: 3 },
  leitura: {
    flexDirection: 'row',
    marginTop: 6,
    paddingTop: 5,
    borderTopWidth: 0.7,
    borderTopColor: COR.borda,
    borderTopStyle: 'dashed',
  },
})

function Quadro({
  rotulo,
  titulo,
  detalhe,
  flex = 1,
}: {
  rotulo: string
  titulo: string
  detalhe?: string
  flex?: number
}) {
  return (
    <View style={[s.quadro, { flex }]}>
      <Text style={s.rotulo}>{rotulo}</Text>
      <Text style={s.valor}>{titulo}</Text>
      {detalhe ? <Text style={s.detalhe}>{detalhe}</Text> : null}
    </View>
  )
}

export function CardRiscoPdf({ c, tipo }: { c: CardRisco; tipo: TipoDocumentoSst }) {
  const cat = CATEGORIAS[c.categoria]
  const metaPartes = [
    cat.rotulo,
    ...c.referencias,
    c.expostos && `expostos: ${c.expostos}`,
    c.via && `via: ${c.via}`,
  ].filter(Boolean)
  const grande = alturaEstimada(c) > CABE_NA_PAGINA
  return (
    <View style={s.card} wrap={grande}>
      <View style={s.cab} wrap={false}>
        <View style={[s.bolinha, { backgroundColor: cat.cor }]} />
        <View style={{ flex: 1 }}>
          <Text style={s.titulo}>{c.nome}</Text>
          <Text style={s.meta}>{metaPartes.join('  ·  ')}</Text>
        </View>
        {c.nivel ? (
          <View style={s.selo}>
            <Text style={s.seloTexto}>
              {c.nivel.rotulo} · {c.nivel.pontos} pontos
            </Text>
          </View>
        ) : null}
      </View>

      {c.medicao || c.exposicao || c.avaliadoPor || c.aet ? (
        <View style={s.quadros} wrap={false}>
          {c.medicao ? (
            <View style={[s.quadro, { flex: 1.5 }]}>
              <Text style={s.rotulo}>Resultado e limite</Text>
              <Text style={s.valor}>{c.medicao.valor}</Text>
              {c.medicao.detalhe ? <Text style={s.detalhe}>{c.medicao.detalhe}</Text> : null}
              <ReguaLimite fracao={c.medicao.fracao} marcas={c.medicao.marcas} cor={COR.verde} />
            </View>
          ) : null}
          {c.exposicao ? (
            <Quadro rotulo="Exposição" titulo={c.exposicao.titulo} detalhe={c.exposicao.detalhe} />
          ) : null}
          {c.avaliadoPor ? (
            <Quadro
              rotulo="Como foi avaliado"
              titulo={c.avaliadoPor.titulo}
              detalhe={c.avaliadoPor.detalhe}
            />
          ) : null}
          {c.aet ? (
            <Quadro
              rotulo="Análise ergonômica do trabalho"
              titulo={c.aet.titulo}
              detalhe={c.aet.detalhe}
            />
          ) : null}
        </View>
      ) : null}

      {c.fonte || c.danos ? (
        <View style={s.par}>
          {c.fonte ? (
            <View style={s.coluna}>
              <Text style={s.rotuloVerde}>Fonte e circunstância</Text>
              <Text>{c.fonte}</Text>
            </View>
          ) : (
            <View style={s.coluna} />
          )}
          {c.danos ? (
            <View style={s.coluna}>
              <Text style={s.rotuloVerde}>Possíveis danos à saúde</Text>
              <Text>{c.danos}</Text>
            </View>
          ) : (
            <View style={s.coluna} />
          )}
        </View>
      ) : null}

      {c.medidas.length > 0 ? (
        <View style={{ marginTop: 7 }}>
          <Text style={s.rotuloVerde}>Medidas de prevenção existentes</Text>
          <View style={s.medidas}>
            {c.medidas.map((m, i) => (
              <Etiqueta key={i} tipo={m.tipo} texto={m.texto} />
            ))}
          </View>
        </View>
      ) : null}

      {c.avaliacao ? (
        <View style={s.analise} wrap={false}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={s.rotuloVerde}>Avaliação do risco (critérios do capítulo 11)</Text>
            <Text>
              <Text style={{ fontWeight: 700 }}>
                Probabilidade {c.avaliacao.probabilidade.nivel}
                {c.avaliacao.probabilidade.nome
                  ? `, ${c.avaliacao.probabilidade.nome.toLowerCase()}`
                  : ''}
                :{' '}
              </Text>
              {c.avaliacao.probabilidade.texto ?? ''}
            </Text>
            <Text>
              <Text style={{ fontWeight: 700 }}>
                Severidade {c.avaliacao.severidade.nivel}
                {c.avaliacao.severidade.nome
                  ? `, ${c.avaliacao.severidade.nome.toLowerCase()}`
                  : ''}
                :{' '}
              </Text>
              {c.avaliacao.severidade.texto ?? ''}
            </Text>
            <Text style={s.pontos}>
              {c.avaliacao.probabilidade.nivel} × {c.avaliacao.severidade.nivel} ={' '}
              {c.avaliacao.pontos} pontos · {c.avaliacao.categoria}
              {c.avaliacao.acao ? ` · ${c.avaliacao.acao.toLowerCase()}` : ''}
            </Text>
          </View>
          <MatrizMini m={c.avaliacao.matriz} />
        </View>
      ) : null}

      {c.conclusaoLaudo && tipo !== 'pgr' ? (
        <View style={s.leitura} wrap={false}>
          <Text style={[s.rotulo, { width: 90 }]}>{c.conclusaoLaudo.rotulo}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: 700, color: COR.preto }}>{c.conclusaoLaudo.texto}</Text>
            {c.conclusaoLaudo.enquadramento ? (
              <Text style={s.detalhe}>{c.conclusaoLaudo.enquadramento}</Text>
            ) : null}
            {c.conclusaoLaudo.justificativa ? (
              <Text style={s.detalhe}>{c.conclusaoLaudo.justificativa}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {c.leitura ? (
        <View style={s.leitura} wrap={false}>
          <Text style={[s.rotulo, { width: 90 }]}>Leitura</Text>
          <Text style={{ flex: 1 }}>{c.leitura}</Text>
        </View>
      ) : null}
    </View>
  )
}
