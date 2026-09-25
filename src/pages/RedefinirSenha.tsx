/* Criar senha nova a partir do link do e-mail ({SITE_URL}/reset-password?token=...). */
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { LaboraLogoFull } from '@/components/LaboraLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

const MIN_SENHA = 8

export default function RedefinirSenha() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [linkInvalido, setLinkInvalido] = useState(!token)

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (senha.length < MIN_SENHA) {
      toast.error(`A senha precisa ter pelo menos ${MIN_SENHA} caracteres`)
      return
    }
    if (senha !== confirmacao) {
      toast.error('As duas senhas não são iguais')
      return
    }
    setSalvando(true)
    try {
      await pb.collection('users').confirmPasswordReset(token, senha, confirmacao)
      toast.success('Senha nova criada', { description: 'Entre com o seu e-mail e a senha nova.' })
      navigate('/login', { replace: true })
    } catch (error) {
      const status = (error as { status?: number })?.status
      if (status === 400) setLinkInvalido(true)
      else toast.error('Não foi possível salvar a senha', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
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
            {linkInvalido ? (
              <div className="space-y-4 text-center">
                <h1 className="text-xl font-bold">Link vencido ou já usado</h1>
                <p className="text-sm text-muted-foreground">
                  O link para criar senha nova vale por pouco tempo e só pode ser usado uma vez.
                  Peça outro.
                </p>
                <Button asChild className="rounded-full">
                  <Link to="/esqueci-senha">Pedir um link novo</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={salvar} className="space-y-4">
                <div>
                  <h1 className="text-xl font-bold">Criar senha nova</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use pelo menos {MIN_SENHA} caracteres.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha-nova">Senha nova</Label>
                  <Input
                    id="senha-nova"
                    type="password"
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha-confirmacao">Repita a senha nova</Label>
                  <Input
                    id="senha-confirmacao"
                    type="password"
                    autoComplete="new-password"
                    value={confirmacao}
                    onChange={(e) => setConfirmacao(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full rounded-full text-base font-semibold"
                  disabled={salvando}
                >
                  {salvando ? 'Salvando...' : 'Salvar senha nova'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
