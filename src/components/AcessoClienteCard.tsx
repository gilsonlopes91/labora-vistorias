/* Cartão "Acesso do cliente" na ficha da empresa: quem da empresa vistoriada
 * pode entrar no portal (/cliente) para ver o que está concluído/emitido,
 * atualizar o plano de ação e aceitar propostas. Só para gestores. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { KeyRound, Mail, Plus, UserX } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { isGestor } from '@/services/equipe'
import {
  convidarCliente,
  enviarLinkDeAcessoCliente,
  getAcessosCliente,
  revogarCliente,
  type AcessoCliente,
} from '@/services/acessosCliente'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AcessoClienteCard({ empresaId }: { empresaId: string }) {
  const [acessos, setAcessos] = useState<AcessoCliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [convidando, setConvidando] = useState(false)

  const carregar = () => {
    setCarregando(true)
    getAcessosCliente(empresaId)
      .then(setAcessos)
      .catch(() => setAcessos([]))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  if (!isGestor()) return null

  const handleConvidar = async () => {
    if (!nome.trim() || !email.trim()) {
      toast.error('Preencha o nome e o e-mail')
      return
    }
    setConvidando(true)
    try {
      const r = await convidarCliente({
        nome: nome.trim(),
        email: email.trim(),
        empresa_id: empresaId,
      })
      if (!r.reativado) {
        try {
          await enviarLinkDeAcessoCliente(email.trim())
        } catch {
          // conta criada; a pessoa também pode pedir "esqueci minha senha" depois
        }
      }
      toast.success(
        r.reativado ? 'Acesso reativado' : 'Acesso concedido — e-mail de acesso enviado',
      )
      setDialogAberto(false)
      setNome('')
      setEmail('')
      carregar()
    } catch (error) {
      toast.error('Não foi possível dar acesso', { description: getErrorMessage(error) })
    } finally {
      setConvidando(false)
    }
  }

  const handleRevogar = async (acesso: AcessoCliente) => {
    try {
      await revogarCliente(acesso.id)
      toast.success('Acesso revogado')
      carregar()
    } catch (error) {
      toast.error('Não foi possível revogar o acesso', { description: getErrorMessage(error) })
    }
  }

  const handleReenviar = async (acesso: AcessoCliente) => {
    const email = acesso.expand?.usuario_id?.email
    if (!email) return
    try {
      await enviarLinkDeAcessoCliente(email)
      toast.success('Link de acesso reenviado')
    } catch (error) {
      toast.error('Não foi possível reenviar o link', { description: getErrorMessage(error) })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Acesso do cliente</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setDialogAberto(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Convidar
        </Button>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Quem tiver acesso entra no portal do cliente e vê as vistorias concluídas e documentos
          emitidos desta empresa, atualiza o plano de ação e aceita propostas — grátis, sem limite.
        </p>
        {carregando ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : acessos.length === 0 ? (
          <p className="text-xs text-muted-foreground">Ninguém tem acesso ao portal ainda.</p>
        ) : (
          <div className="space-y-2">
            {acessos.map((acesso) => (
              <div
                key={acesso.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {acesso.expand?.usuario_id?.name || acesso.expand?.usuario_id?.email || '—'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {acesso.expand?.usuario_id?.email}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={acesso.ativo ? 'default' : 'secondary'}>
                    {acesso.ativo ? 'Ativo' : 'Revogado'}
                  </Badge>
                  {acesso.ativo && (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => handleReenviar(acesso)}>
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleRevogar(acesso)}>
                        <UserX className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar acesso ao portal do cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cliente-nome">Nome</Label>
              <Input id="cliente-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cliente-email">E-mail</Label>
              <Input
                id="cliente-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              A pessoa recebe um e-mail para criar a senha. Se já tiver acesso a outra empresa com o
              mesmo e-mail, entra com a mesma conta.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConvidar} disabled={convidando}>
              {convidando ? 'Enviando...' : 'Dar acesso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
