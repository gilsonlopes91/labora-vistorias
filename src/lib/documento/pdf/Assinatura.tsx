import { Image, Link, StyleSheet, Text, View } from '@react-pdf/renderer'
import { COR } from '../tema'
import type { Assinatura } from '../modelo'

const s = StyleSheet.create({
  caixa: {
    marginTop: 24,
    borderTopWidth: 0.8,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  titulo: { fontSize: 10.5, fontWeight: 700, color: COR.preto, marginBottom: 6 },
  linha: { fontSize: 8.5, marginBottom: 2 },
  qr: { width: 64, height: 64, marginLeft: 16 },
})

export function AssinaturaPdf({ a, cor }: { a: Assinatura; cor: string }) {
  return (
    <View style={[s.caixa, { borderTopColor: cor }]} wrap={false}>
      <View style={{ flex: 1 }}>
        <Text style={s.titulo}>Assinatura eletrônica</Text>
        <Text style={s.linha}>
          {a.nome}
          {a.registro ? ` · ${a.registro}` : ''}
        </Text>
        <Text style={s.linha}>Identidade confirmada por senha em {a.confirmadaEm}.</Text>
        <Text style={s.linha}>
          Verificar autenticidade:{' '}
          <Link src={a.link} style={{ color: '#3C5AC8' }}>
            {a.link}
          </Link>
        </Text>
      </View>
      {a.qrDataUrl ? <Image src={a.qrDataUrl} style={s.qr} /> : null}
    </View>
  )
}
