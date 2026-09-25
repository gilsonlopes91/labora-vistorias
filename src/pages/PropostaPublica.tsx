/* Página que o cliente abre pelo link da proposta (item 38), sem login.
   Mostra o resumo, o PDF e os contatos de quem enviou. */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Download, FileText, Mail, MessageCircle, Phone } from 'lucide-react'

import { formatarDataCalendario } from '@/lib/date'
import {
  baixarPdfPropostaPublica,
  getPropostaPublica,
  type PropostaPublica as Proposta,
} from '@/services/orcamentos'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const somarDias = (dataISO: string, dias: number) => {
  const [a, m, d] = dataISO.split('-').map(Number)
  const dt = new Date(Date.UTC(a, m - 1, d + dias))
  return dt.toISOString().slice(0, 10)
}

const hojeISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function PropostaPublica() {
  const { token = '' } = useParams()
  const [proposta, setProposta] = useState<Proposta | null>(null)
  const [erro, setErro] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [nomeArquivo, setNomeArquivo] = useState('proposta.pdf')

  useEffect(() => {
    let urlCriada = ''
    getPropostaPublica(token)
      .then((p) => {
        setProposta(p)
        document.title = `Proposta ${p.numero || ''}${p.organizacao.nome ? ` · ${p.organizacao.nome}` : ''}`
        setNomeArquivo(`proposta-${(p.numero || 's-n').replace(/\//g, '-')}.pdf`)
        return baixarPdfPropostaPublica(token)
      })
      .then((blob) => {
        urlCriada = URL.createObjectURL(blob)
        setPdfUrl(urlCriada)
      })
      .catch(() => setErro('Esta proposta não está mais disponível por este link.'))
    return () => {
      if (urlCriada) URL.revokeObjectURL(urlCriada)
    }
  }, [token])

  if (erro) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="max-w-md">
          <CardContent className="space-y-2 p-6 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="font-medium">{erro}</p>
            <p className="text-sm text-muted-foreground">
              Peça um link novo a quem enviou a proposta.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!proposta) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Abrindo a proposta...
      </div>
    )
  }

  const org = proposta.organizacao
  const validaAte =
    proposta.data_proposta && proposta.validade_dias
      ? somarDias(proposta.data_proposta, proposta.validade_dias)
      : ''
  const vencida = !!validaAte && validaAte < hojeISO()
  const foneDigitos = (org.telefone || '').replace(/\D/g, '')
  const whatsapp = foneDigitos.length === 10 || foneDigitos.length === 11 ? `55${foneDigitos}` : ''
  const textoWhatsApp = encodeURIComponent(
    `Olá! Recebi a proposta ${proposta.numero || ''} (${proposta.titulo}) e gostaria de conversar.`,
  )

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <p className="text-sm font-semibold text-muted-foreground">{org.nome}</p>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Proposta comercial {proposta.numero}
                {proposta.versao ? ` · ${proposta.versao}` : ''}
              </p>
              <h1 className="mt-1 text-xl font-bold leading-snug">{proposta.titulo}</h1>
              {proposta.cliente && (
                <p className="text-sm text-muted-foreground">Para {proposta.cliente}</p>
              )}
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 border-t pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Valor total</p>
                <p className="text-2xl font-bold tabular-nums">
                  {brl.format(proposta.valor_total || 0)}
                </p>
                {proposta.valor_entrada > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Entrada de {brl.format(proposta.valor_entrada)}
                  </p>
                )}
              </div>
              <div className="text-right text-sm">
                {proposta.data_proposta && (
                  <p className="text-muted-foreground">
                    Emitida em {formatarDataCalendario(proposta.data_proposta)}
                  </p>
                )}
                {validaAte && (
                  <p className={vencida ? 'font-medium text-destructive' : 'text-muted-foreground'}>
                    {vencida ? 'Validade vencida em ' : 'Válida até '}
                    {formatarDataCalendario(validaAte)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild disabled={!pdfUrl}>
                <a href={pdfUrl || undefined} download={nomeArquivo}>
                  <Download className="mr-2 h-4 w-4" />
                  {pdfUrl ? 'Baixar a proposta (PDF)' : 'Preparando o PDF...'}
                </a>
              </Button>
              {whatsapp && (
                <Button asChild variant="outline">
                  <a
                    href={`https://wa.me/${whatsapp}?text=${textoWhatsApp}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Falar pelo WhatsApp
                  </a>
                </Button>
              )}
              {org.telefone && !whatsapp && (
                <Button asChild variant="outline">
                  <a href={`tel:${foneDigitos}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    {org.telefone}
                  </a>
                </Button>
              )}
              {org.email && (
                <Button asChild variant="outline">
                  <a
                    href={`mailto:${org.email}?subject=${encodeURIComponent(`Proposta ${proposta.numero || ''}`)}`}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    E-mail
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {pdfUrl && (
          <Card className="hidden overflow-hidden md:block">
            <iframe title="Proposta em PDF" src={pdfUrl} className="h-[80vh] w-full border-0" />
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Proposta enviada pelo Labora Vistorias.
        </p>
      </div>
    </div>
  )
}
