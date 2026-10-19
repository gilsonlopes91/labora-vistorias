import { Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import { COR, FONTE, PAGINA } from '../tema'
import type { Documento } from '../modelo'

const s = StyleSheet.create({
  pagina: {
    paddingTop: PAGINA.margemTopo,
    paddingBottom: PAGINA.margemBase,
    paddingHorizontal: PAGINA.margemH,
    fontFamily: 'Poppins',
    fontSize: FONTE.corpo,
    color: COR.texto,
  },
  faixa: { position: 'absolute', top: 0, left: 0, right: 0, height: 5 },
  cabecalho: {
    position: 'absolute',
    top: 16,
    left: PAGINA.margemH,
    right: PAGINA.margemH,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.7,
    borderBottomColor: COR.borda,
    paddingBottom: 6,
    fontSize: 7.5,
    color: COR.mudo,
  },
  marca: { fontSize: 11, fontWeight: 700, color: COR.preto, letterSpacing: 1 },
  logo: { height: 20, objectFit: 'contain' },
  rodape: {
    position: 'absolute',
    bottom: 16,
    left: PAGINA.margemH,
    right: PAGINA.margemH,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.7,
    borderTopColor: COR.borda,
    paddingTop: 5,
    fontSize: 7,
    color: COR.mudo,
  },
  qr: { width: 30, height: 30 },
})

export function Pagina({
  doc,
  rotuloCapitulo,
  marcador,
  children,
}: {
  doc: Documento
  rotuloCapitulo: string
  /** título no painel de marcadores do leitor de PDF */
  marcador?: string
  children: ReactNode
}) {
  const { marca } = doc
  return (
    <Page size="A4" style={s.pagina} bookmark={marcador}>
      <View fixed style={[s.faixa, { backgroundColor: marca.corPrimaria }]} />
      <View fixed style={s.cabecalho}>
        {marca.logoOrganizacao ? (
          <Image src={marca.logoOrganizacao} style={s.logo} />
        ) : (
          <Text style={s.marca}>{marca.organizacaoNome.toUpperCase()}</Text>
        )}
        <Text>
          {doc.sigla} · {doc.capa.clienteNome} · versão {doc.versao}
        </Text>
        <Text>{rotuloCapitulo}</Text>
      </View>
      {/* Sem lineHeight herdado: no react-pdf ele se multiplica a cada nível de View e Text aninhado. */}
      {children}
      <View fixed style={s.rodape}>
        <Text>{doc.rodapeOrganizacao}</Text>
        <Text
          render={({ pageNumber, totalPages }) =>
            `${doc.assinatura ? 'Assinado eletronicamente · ' : ''}página ${pageNumber} de ${totalPages}`
          }
        />
        {doc.assinatura?.qrDataUrl ? (
          <Image
            src={doc.assinatura.qrDataUrl}
            style={[s.qr, { position: 'absolute', right: 0, bottom: 0 }]}
          />
        ) : null}
      </View>
    </Page>
  )
}
