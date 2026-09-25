/* Enviar a proposta ao cliente por link (item 38). Ao abrir, o PDF atual é
   gerado e guardado; o link mostra sempre a versão mais recente enviada.
   O cliente abre sem login e baixa o PDF; o app conta quantas vezes abriu. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Copy, Link2Off, Mail, MessageCircle, RefreshCw } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import type { PdfGerado } from '@/lib/propostaPdf'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import {
  desativarLinkProposta,
  publicarLinkProposta,
  urlLinkProposta,
  type Orcamento,
} from '@/services/orcamentos'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  orcamento: Orcamento | null
  onOpenChange: (aberto: boolean) => void
  /** Gera o PDF da proposta sem baixar. */
  gerarPdf: (orcamento: Orcamento) => Promise<PdfGerado | null>
  /** Avisa a lista do que mudou (chave, visualizações, status). */
  onAtualizado: (id: string, campos: Partial<Orcamento>) => void
  /** Chamado na primeira vez que o link sai (copiar, WhatsApp ou e-mail). */
  onEnviado: (orcamento: Orcamento) => void
}

const dataHora = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Número do WhatsApp com DDI: (86) 99999-0000 → 5586999990000. */
const telefoneWhatsApp = (telefone?: string) => {
  const d = (telefone || '').replace(/\D/g, '')
  if (d.length === 10 || d.length === 11) return `55${d}`
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d
  return ''
}

export function EnviarPropostaDialog({
  orcamento,
  onOpenChange,
  gerarPdf,
  onAtualizado,
  onEnviado,
}: Props) {
  const [atual, setAtual] = useState<Orcamento | null>(null)
  const [preparando, setPreparando] = useState(false)
  const [erro, setErro] = useState('')
  const [nomeOrg, setNomeOrg] = useState('')

  const preparar = async (o: Orcamento) => {
    setPreparando(true)
    setErro('')
    try {
      const pdf = await gerarPdf(o)
      if (!pdf) {
        setErro('Não foi possível montar o PDF da proposta.')
        return
      }
      const salvo = await publicarLinkProposta(o, pdf.blob, pdf.nome)
      setAtual({ ...o, ...salvo, expand: o.expand })
      onAtualizado(o.id, {
        link_token: salvo.link_token,
        link_pdf: salvo.link_pdf,
        link_gerado_em: salvo.link_gerado_em,
      })
    } catch (error) {
      setErro(getErrorMessage(error))
    } finally {
      setPreparando(false)
    }
  }

  useEffect(() => {
    if (!orcamento) {
      setAtual(null)
      return
    }
    setAtual(orcamento)
    preparar(orcamento)
    getMinhaOrganizacao()
      .then((org) => setNomeOrg(org.nome || ''))
      .catch(() => setNomeOrg(''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orcamento?.id])

  const token = atual?.link_token || ''
  const link = token ? urlLinkProposta(token) : ''
  const empresa = atual?.expand?.empresa_id
  const contato = (empresa?.contato_nome || '').split(' ')[0]
  const mensagem = atual
    ? [
        `Olá${contato ? `, ${contato}` : ''}!`,
        `Segue a proposta ${atual.numero || ''}${nomeOrg ? ` da ${nomeOrg}` : ''} para ${atual.titulo}.`,
        `Dá para ver e baixar por este link: ${link}`,
        'Qualquer dúvida, estou à disposição.',
      ].join('\n')
    : ''

  const marcarEnviado = () => {
    if (atual && atual.status === 'rascunho') {
      onEnviado(atual)
      setAtual({ ...atual, status: 'enviado' })
    }
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Link copiado')
      marcarEnviado()
    } catch {
      toast.error('Não foi possível copiar', { description: 'Selecione o link e copie.' })
    }
  }

  const fone = telefoneWhatsApp(empresa?.contato_telefone)
  const urlWhatsApp = `https://wa.me/${fone}?text=${encodeURIComponent(mensagem)}`
  const urlEmail = `mailto:${empresa?.contato_email || ''}?subject=${encodeURIComponent(
    `Proposta ${atual?.numero || ''}${nomeOrg ? ` — ${nomeOrg}` : ''}`,
  )}&body=${encodeURIComponent(mensagem)}`

  const desativar = async () => {
    if (!atual) return
    try {
      await desativarLinkProposta(atual.id)
      onAtualizado(atual.id, {
        link_token: '',
        link_pdf: '',
        link_visualizacoes: 0,
        link_primeira_visualizacao: '',
        link_ultima_visualizacao: '',
      })
      toast.success('Link desativado', { description: 'Quem tiver o link antigo não abre mais.' })
      onOpenChange(false)
    } catch (error) {
      toast.error('Não foi possível desativar', { description: getErrorMessage(error) })
    }
  }

  const vezes = atual?.link_visualizacoes || 0

  return (
    <Dialog open={!!orcamento} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar proposta {atual?.numero}</DialogTitle>
          <DialogDescription>
            O cliente abre o link sem precisar de login, vê o resumo e baixa o PDF. Se você mudar a
            proposta, abra esta janela de novo antes de reenviar: o link passa a mostrar a versão
            nova.
          </DialogDescription>
        </DialogHeader>

        {preparando ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Preparando o PDF e o link...
          </p>
        ) : erro ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-destructive">{erro}</p>
            <Button variant="outline" size="sm" onClick={() => atual && preparar(atual)}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Tentar de novo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input readOnly value={link} onFocus={(e) => e.target.select()} className="text-xs" />
              <Button variant="outline" size="icon" onClick={copiar} title="Copiar link">
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild>
                <a href={urlWhatsApp} target="_blank" rel="noreferrer" onClick={marcarEnviado}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Enviar pelo WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={urlEmail} onClick={marcarEnviado}>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar por e-mail
                </a>
              </Button>
            </div>
            {!fone && (
              <p className="text-xs text-muted-foreground">
                A empresa não tem celular no cadastro; o WhatsApp abre para você escolher o contato.
              </p>
            )}

            <div className="rounded-md border p-3 text-sm">
              {vezes > 0 ? (
                <>
                  <p className="font-medium">
                    O cliente abriu o link {vezes === 1 ? '1 vez' : `${vezes} vezes`}.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Primeira em {dataHora(atual?.link_primeira_visualizacao)}
                    {vezes > 1 ? ` · última em ${dataHora(atual?.link_ultima_visualizacao)}` : ''}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">O cliente ainda não abriu o link.</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={desativar}
            disabled={preparando || !token}
            className="text-muted-foreground"
          >
            <Link2Off className="mr-1.5 h-3.5 w-3.5" />
            Desativar link
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EnviarPropostaDialog
