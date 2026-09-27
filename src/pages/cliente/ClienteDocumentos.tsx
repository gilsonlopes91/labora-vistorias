/* Documentos do portal do cliente: vistorias concluídas (relatório assinado)
 * e documentos SST emitidos (PGR, LTCAT, laudos) — nunca rascunhos. */
import { useEffect, useState } from 'react'
import { FileText, ShieldCheck } from 'lucide-react'

import { formatBrazilianDate } from '@/lib/date'
import { rotuloCurtoNorma } from '@/lib/normas'
import { useEmpresaCliente } from '@/components/LayoutCliente'
import { getVistorias, urlPdfVistoria, type Vistoria } from '@/services/vistorias'
import {
  getDocumentosEmitidos,
  getTokenArquivos,
  pdfUrlDocumentoSst,
  type DocumentoSst,
} from '@/services/documentosSst'
import LoadingScreen from '@/components/LoadingScreen'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const TIPO_LABEL: Record<string, string> = {
  pgr: 'PGR',
  ltcat: 'LTCAT',
  insalubridade: 'Laudo de insalubridade',
  periculosidade: 'Laudo de periculosidade',
}

export default function ClienteDocumentos() {
  const { empresa } = useEmpresaCliente()
  const [vistorias, setVistorias] = useState<Vistoria[]>([])
  const [documentos, setDocumentos] = useState<DocumentoSst[]>([])
  const [token, setToken] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    setCarregando(true)
    Promise.all([getVistorias(), getDocumentosEmitidos(empresa.id), getTokenArquivos()])
      .then(([v, d, tok]) => {
        setVistorias(v.filter((x) => x.empresa_id === empresa.id && x.status === 'concluida'))
        setDocumentos(d)
        setToken(tok)
      })
      .finally(() => setCarregando(false))
  }, [empresa.id])

  if (carregando) return <LoadingScreen fullScreen={false} mensagem="Carregando..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Documentos</h1>
        <p className="text-sm text-muted-foreground">
          Relatórios de vistoria e documentos SST já emitidos, com assinatura eletrônica.
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          Vistorias concluídas ({vistorias.length})
        </h2>
        {vistorias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma vistoria concluída ainda.</p>
        ) : (
          <div className="space-y-2">
            {vistorias.map((v) => {
              const nome = v.expand?.tipo_vistoria_id
                ? rotuloCurtoNorma(v.expand.tipo_vistoria_id)
                : 'Vistoria'
              const url = urlPdfVistoria(v, token)
              return (
                <Card key={v.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.data_realizada ? formatBrazilianDate(v.data_realizada) : ''}
                        {v.responsavel_tecnico_nome && <> · {v.responsavel_tecnico_nome}</>}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {v.link_publico_chave && (
                        <Button size="sm" variant="ghost" asChild>
                          <a
                            href={`/verificar/${v.link_publico_chave}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                            Verificar
                          </a>
                        </Button>
                      )}
                      {url && (
                        <Button size="sm" asChild>
                          <a href={url} target="_blank" rel="noreferrer">
                            <FileText className="mr-1.5 h-3.5 w-3.5" />
                            Abrir PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          Documentos SST emitidos ({documentos.length})
        </h2>
        {documentos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum documento emitido ainda.</p>
        ) : (
          <div className="space-y-2">
            {documentos.map((d) => {
              const url = pdfUrlDocumentoSst(d, token)
              return (
                <Card key={d.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{d.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {TIPO_LABEL[d.tipo] || d.tipo} · versão {d.versao} ·{' '}
                        {d.data_emissao ? formatBrazilianDate(d.data_emissao) : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {d.link_publico_chave && (
                        <Button size="sm" variant="ghost" asChild>
                          <a
                            href={`/verificar/${d.link_publico_chave}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                            Verificar
                          </a>
                        </Button>
                      )}
                      {url && (
                        <Button size="sm" asChild>
                          <a href={url} target="_blank" rel="noreferrer">
                            <FileText className="mr-1.5 h-3.5 w-3.5" />
                            Abrir PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
