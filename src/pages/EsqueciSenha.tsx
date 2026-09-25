/* Esqueci minha senha: pede o e-mail e manda o link para criar uma senha nova
   (template "passwordReset" do Skip Cloud, que aponta para /reset-password). */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { MailCheck } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { LaboraLogoFull } from '@/components/LaboraLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    const valor = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
      toast.error('Informe um e-mail válido')
      return
    }
    setEnviando(true)
    try {
      await pb.collection('users').requestPasswordReset(valor)
      setEnviado(true)
    } catch (error) {
      toast.error('Não foi possível enviar o link', { description: getErrorMessage(error) })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <header className="mx-auto flex max-w-md items-center justify-center">
        <Link to="/" aria-label="Labora Vistorias — início">
          <LaboraLogoFull size="md" />
        </Link>
      </header>
      <main className="mx-auto mt-10 max-w-md">
        <Card className="rounded-3xl border-none shadow-elevation">
          <CardContent className="p-6 lg:p-8">
            {enviado ? (
              <div className="space-y-4 text-center">
                <MailCheck className="mx-auto h-10 w-10 text-primary" />
                <h1 className="text-xl font-bold">Confira seu e-mail</h1>
                <p className="text-sm text-muted-foreground">
                  Se houver uma conta com o e-mail <strong>{email.trim()}</strong>, mandamos um link
                  para criar uma senha nova. Ele vale por pouco tempo. Olhe também a caixa de spam.
                </p>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/login">Voltar para o login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={enviar} className="space-y-4">
                <div>
                  <h1 className="text-xl font-bold">Esqueci minha senha</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Informe o e-mail da sua conta. Mandamos um link para você criar uma senha nova.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email-recuperacao">E-mail</Label>
                  <Input
                    id="email-recuperacao"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@empresa.com"
                    className="h-11 rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full rounded-full text-base font-semibold"
                  disabled={enviando}
                >
                  {enviando ? 'Enviando...' : 'Enviar link'}
                </Button>
                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    ← Voltar para o login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
