/* Página pública de verificação de assinatura eletrônica (etapa 3 do plano
   de perfis/assinatura). Sem login — qualquer um com o link do carimbo do
   PDF confere aqui os dados de emissão e, opcionalmente, se o arquivo que
   recebeu é exatamente o que foi assinado (hash calculado no navegador). */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, FileText, ShieldCheck, XCircle } from 'lucide-react'

import { hashSha256 } from '@/lib/gerarPdfPgr'
import { getVerificacaoDocumento, type VerificacaoDocumento } from '@/services/documentosSst'
import { Card, CardContent } from '@/components/ui/card'

const formatarDataHora = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR')
}

export default function VerificarDocumento() {
  const { chave = '' } = useParams()
  const [dados, setDados] = useState<VerificacaoDocumento | null>(null)
  const [erro, setErro] = useState('')
  const [conferindo, setConferindo] = useState(false)
  const [resultado, setResultado] = useState<'confere' | 'nao_confere' | null>(null)

  useEffect(() => {
    getVerificacaoDocumento(chave)
      .then(setDados)
      .catch(() => setErro('Documento não localizado. Confira o link recebido.'))
  }, [chave])

  const conferirArquivo = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !dados) return
    setConferindo(true)
    setResultado(null)
    try {
      const hash = await hashSha256(fileList[0])
      setResultado(hash === dados.pdf_hash_sha256 ? 'confere' : 'nao_confere')
    } finally {
      setConferindo(false)
    }
  }

  if (erro) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="max-w-md">
          <CardContent className="space-y-2 p-6 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="font-medium">{erro}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!dados) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Verificando...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <ShieldCheck className="h-5 w-5" />
          Documento com assinatura eletrônica válida
        </div>

        <Card>
          <CardContent className="space-y-3 p-6 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Documento</p>
              <p className="font-medium">{dados.titulo}</p>
              <p className="text-muted-foreground">
                {dados.tipo} · versão {dados.versao}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Emitido por</p>
              <p className="font-medium">{dados.profissional || '—'}</p>
              {dados.registro && <p className="text-muted-foreground">{dados.registro}</p>}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Organização</p>
              <p className="font-medium">{dados.organizacao || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Data de emissão
              </p>
              <p className="font-medium">{formatarDataHora(dados.data_emissao) || '—'}</p>
              <p className="text-xs text-muted-foreground">
                Identidade confirmada por senha em{' '}
                {formatarDataHora(dados.assinatura_confirmada_em) || '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm font-medium">Conferir se o PDF que você recebeu é este mesmo</p>
            <p className="text-xs text-muted-foreground">
              Envie o arquivo PDF: comparamos com o que foi assinado, sem enviar o arquivo para
              lugar nenhum — a conferência é feita aqui no seu navegador.
            </p>
            <div>
              <input
                type="file"
                accept="application/pdf"
                id="arquivo-conferir"
                className="hidden"
                onChange={(e) => conferirArquivo(e.target.files)}
              />
              <label
                htmlFor="arquivo-conferir"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent"
              >
                {conferindo ? 'Conferindo...' : 'Escolher o PDF'}
              </label>
            </div>
            {resultado === 'confere' && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Confere — é exatamente o arquivo assinado.
              </div>
            )}
            {resultado === 'nao_confere' && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                <XCircle className="h-4 w-4" />
                Não confere — este arquivo é diferente do que foi assinado.
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Verificação da assinatura eletrônica — Labora Vistorias.
        </p>
      </div>
    </div>
  )
}
