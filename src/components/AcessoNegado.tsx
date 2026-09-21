import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AcessoNegadoProps {
  titulo?: string
  mensagem?: string
  voltarPara?: string
  rotuloVoltar?: string
}

export default function AcessoNegado({
  titulo = 'Acesso negado',
  mensagem = 'Seu perfil de acesso (executor/cliente) não possui permissão para visualizar esta página ou recurso. Entre em contato com um gestor ou administrador da sua organização caso precise de acesso.',
  voltarPara = '/painel',
  rotuloVoltar = 'Voltar ao início',
}: AcessoNegadoProps) {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{titulo}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{mensagem}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="rounded-full">
          <Link to={voltarPara}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {rotuloVoltar}
          </Link>
        </Button>
      </div>
    </div>
  )
}
