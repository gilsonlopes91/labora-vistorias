import { Document, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ElRender } from '@/lib/modelosSst/renderizar'
import { COR, FONTE } from '../tema'
import type { Bloco, Capitulo, Documento } from '../modelo'
import { AmbientePdf } from './Ambiente'
import { AssinaturaPdf } from './Assinatura'
import { Capa } from './Capa'
import { FichaFuncaoPdf } from './FichaFuncao'
import { GrupoFuncoesPdf } from './GrupoFuncoes'
import { Identificacao } from './Identificacao'
import { Pagina } from './Pagina'
import { PlanoAcaoPdf } from './PlanoAcao'
import { Elemento } from './TextoCapitulo'

const s = StyleSheet.create({
  rotulo: { fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 },
  titulo: {
    fontSize: FONTE.titulo1,
    fontWeight: 700,
    color: COR.preto,
    marginTop: 3,
    marginBottom: 14,
    letterSpacing: -0.2,
    lineHeight: 1.3,
  },
})

function BlocoPdf({ bloco, doc }: { bloco: Bloco; doc: Documento }) {
  switch (bloco.tipo) {
    case 'ambientes':
      return (
        <>
          {bloco.itens.map((a, i) => (
            <AmbientePdf key={i} a={a} />
          ))}
        </>
      )
    case 'funcoes':
      return (
        <>
          {bloco.grupos.map((g, i) => (
            <GrupoFuncoesPdf key={i} g={g} cor={doc.marca.corPrimaria} />
          ))}
        </>
      )
    case 'inventario':
      return (
        <>
          {bloco.fichas.map((f, i) => (
            <FichaFuncaoPdf key={i} f={f} tipo={doc.tipo} cor={doc.marca.corPrimaria} />
          ))}
        </>
      )
    case 'plano':
      return <PlanoAcaoPdf acoes={bloco.acoes} responsavel={doc.assinatura?.responsavelPlano} />
    case 'conclusoes':
      return null
    default:
      return <Elemento el={bloco as ElRender} />
  }
}

function CapituloPdf({ cap, doc }: { cap: Capitulo; doc: Documento }) {
  return (
    <Pagina
      doc={doc}
      rotuloCapitulo={cap.numero ? `Capítulo ${cap.numero}` : cap.titulo}
      marcador={`${cap.numero ? cap.numero + ' · ' : ''}${cap.titulo}`}
    >
      <View minPresenceAhead={80}>
        {cap.numero ? (
          <Text style={[s.rotulo, { color: doc.marca.corPrimaria }]}>Capítulo {cap.numero}</Text>
        ) : null}
        <Text style={s.titulo}>{cap.titulo}</Text>
      </View>
      {cap.blocos.map((b, i) => (
        <BlocoPdf key={i} bloco={b} doc={doc} />
      ))}
    </Pagina>
  )
}

export function DocumentoPdf({ doc }: { doc: Documento }) {
  return (
    <Document title={doc.titulo} author={doc.marca.organizacaoNome} creator="Labora">
      <Capa doc={doc} />
      {doc.identificacao.length > 0 ? (
        <Pagina doc={doc} rotuloCapitulo="Identificação">
          <Text style={[s.rotulo, { color: doc.marca.corPrimaria }]}>Identificação</Text>
          <Text style={s.titulo}>{doc.capa.titulo}</Text>
          <Identificacao itens={doc.identificacao} />
        </Pagina>
      ) : null}
      {doc.capitulos.map((c) => (
        <CapituloPdf key={c.id} cap={c} doc={doc} />
      ))}
      {doc.anexos.map((c) => (
        <CapituloPdf key={c.id} cap={c} doc={doc} />
      ))}
      {doc.assinatura ? (
        <Pagina doc={doc} rotuloCapitulo="Responsabilidade técnica">
          <Text style={[s.rotulo, { color: doc.marca.corPrimaria }]}>Responsabilidade técnica</Text>
          <Text style={s.titulo}>Assinatura e verificação</Text>
          <AssinaturaPdf a={doc.assinatura} cor={doc.marca.corPrimaria} />
        </Pagina>
      ) : null}
    </Document>
  )
}
