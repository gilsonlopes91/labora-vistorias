/* Redefinição obrigatória de senha — usuário com trocar_senha=true cai aqui
   após o login. Usa a API padrão do PocketBase (oldPassword + password +
   passwordConfirm) e limpa o flag trocar_senha. */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { LaboraLogoFull } from '@/components/LaboraLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const schema = z
  .object({
    senhaAntiga: z.string().min(1, 'Informe a senha atual (a temporária que você recebeu)'),
    senha: z.string().min(8, 'A nova senha deve ter no mínimo 8 caracteres'),
    confirmacao: z.string().min(8, 'Confirme a nova senha'),
  })
  .refine((d) => d.senha === d.confirmacao, {
    message: 'As senhas não conferem',
    path: ['confirmacao'],
  })

export default function TrocarSenha() {
  const { user, signOut } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { senhaAntiga: '', senha: '', confirmacao: '' },
  })

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!user) return
    setSubmitting(true)
    try {
      await pb.collection('users').update(user.id, {
        oldPassword: values.senhaAntiga,
        password: values.senha,
        passwordConfirm: values.confirmacao,
        trocar_senha: false,
      })
      toast.success('Senha alterada com sucesso!')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error('Não foi possível alterar a senha', {
        description: getErrorMessage(error),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md rounded-3xl border-none shadow-elevation">
        <CardContent className="p-8">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <LaboraLogoFull />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold">Defina sua nova senha</h1>
            <p className="text-sm text-muted-foreground">
              Por segurança, você precisa criar uma nova senha antes de continuar.
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="senhaAntiga"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha atual (temporária)</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="A senha que você recebeu"
                        className="h-11 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova senha</FormLabel>
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
              <FormField
                control={form.control}
                name="confirmacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nova senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Repita a nova senha"
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
                className="h-11 w-full rounded-full font-semibold"
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Salvar nova senha'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  signOut()
                  navigate('/login', { replace: true })
                }}
              >
                Sair
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
