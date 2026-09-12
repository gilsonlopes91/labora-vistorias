/* Tela de login/cadastro — estilo hero: tipografia grande com palavras destacadas,
   rótulo de seção em caixa alta e card flutuante. Paleta Labora preservada. */
import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CalendarClock, ClipboardCheck, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { LaboraLogoFull } from '@/components/LaboraLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha'),
})

const signupSchema = z.object({
  name: z.string().min(1, 'Informe seu nome'),
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
})

export default function Login() {
  const { isAuthenticated, loading, signIn, signUp } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  if (!loading && isAuthenticated) {
    const from = (location.state as { from?: string })?.from || '/'
    return <Navigate to={from} replace />
  }

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    setSubmitting(true)
    const { error } = await signIn(values.email, values.password)
    setSubmitting(false)
    if (error) {
      toast.error('Não foi possível entrar', { description: getErrorMessage(error) })
      return
    }
    navigate('/', { replace: true })
  }

  const onSignup = async (values: z.infer<typeof signupSchema>) => {
    setSubmitting(true)
    const { error } = await signUp(values.email, values.password, values.name)
    setSubmitting(false)
    if (error) {
      toast.error('Não foi possível criar a conta', { description: getErrorMessage(error) })
      return
    }
    toast.success('Conta criada com sucesso!')
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8 lg:px-12">
      <header className="mx-auto flex max-w-7xl items-center justify-between">
        <LaboraLogoFull />
        <a
          href="#acesso"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-subtle transition-opacity hover:opacity-90"
        >
          Começar agora
        </a>
      </header>

      <main className="mx-auto grid max-w-7xl items-center gap-12 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        {/* Hero — tipografia grande com destaques na cor primária */}
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Gestão de vistorias e inspeções de SST
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground lg:text-6xl">
            Sua operação de segurança do trabalho{' '}
            <span className="text-primary">organizada no automático</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            O que vai fazer, onde, quem vai fazer e quando — agenda que se renova sozinha, vistoria
            guiada com foto e GPS, e o relatório com multa NR-28 pronto antes de você sair do
            cliente.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
            <div>
              <div className="text-3xl font-extrabold text-primary lg:text-4xl">6</div>
              <div className="mt-1 text-xs text-muted-foreground">normas NR no catálogo</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-primary lg:text-4xl">NR-28</div>
              <div className="mt-1 text-xs text-muted-foreground">multa calculada automática</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-primary lg:text-4xl">100%</div>
              <div className="mt-1 text-xs text-muted-foreground">relatório pronto no app</div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" /> Rotinas recorrentes
            </span>
            <span className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" /> Vistoria com foto + GPS
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Equipe com papéis
            </span>
          </div>
        </div>

        {/* Card de acesso */}
        <div id="acesso">
          <Card className="w-full rounded-3xl border-none shadow-elevation">
            <CardContent className="p-6 lg:p-8">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-full">
                  <TabsTrigger value="login" className="rounded-full">
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-full">
                    Criar conta
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-6">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="voce@empresa.com"
                                className="h-11 rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                className="h-11 rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="h-11 w-full rounded-full text-base font-semibold"
                        disabled={submitting}
                      >
                        {submitting ? 'Entrando...' : 'Entrar'}
                      </Button>

                      <div className="rounded-2xl border border-border/60 bg-muted/50 p-3 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">
                          Credenciais para teste rápido:
                        </p>
                        <p className="mt-1">
                          E-mail:{' '}
                          <code className="font-mono text-foreground">admin@labora.com</code>
                        </p>
                        <p>
                          Senha: <code className="font-mono text-foreground">labora123</code>
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 h-7 w-full rounded-full text-xs"
                          onClick={() => {
                            loginForm.setValue('email', 'admin@labora.com')
                            loginForm.setValue('password', 'labora123')
                          }}
                        >
                          Preencher credenciais de teste
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="signup" className="mt-6">
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                      <FormField
                        control={signupForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Seu nome"
                                className="h-11 rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="voce@empresa.com"
                                className="h-11 rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Mínimo 8 caracteres"
                                className="h-11 rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="h-11 w-full rounded-full text-base font-semibold"
                        disabled={submitting}
                      >
                        {submitting ? 'Criando conta...' : 'Criar conta grátis'}
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        Grátis, sem cartão de crédito.
                      </p>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
