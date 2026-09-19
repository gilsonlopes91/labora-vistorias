/* Editor de textos do site — admin/staff-console editam os textos do login
   (coleção conteudo_site, chave/valor). Leitura pública para o Login. */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useAuth } from '@/hooks/use-auth'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

interface Conteudo {
  id: string
  chave: string
  valor: string
}

const LABELS: Record<string, string> = {
  login_badge: 'Rótulo (caixa alta)',
  login_titulo_1: 'Título — parte 1',
  login_titulo_destaque: 'Título — parte destacada (verde)',
  login_subtitulo: 'Subtítulo',
}

const ORDEM = ['login_badge', 'login_titulo_1', 'login_titulo_destaque', 'login_subtitulo']

export default function EditorConteudo() {
  const { user } = useAuth()
  const [itens, setItens] = useState<Conteudo[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const lista = await pb.collection('conteudo_site').getFullList({ sort: 'chave' })
      setItens(lista as unknown as Conteudo[])
    } catch (error) {
      toast.error('Não foi possível carregar os textos', { description: getErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const salvar = async () => {
    setSalvando(true)
    try {
      for (const item of itens) {
        await pb.collection('conteudo_site').update(item.id, { valor: item.valor })
      }
      toast.success('Textos do site atualizados!')
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  const podeEditar =
    user?.papel === 'admin_plataforma' || (user?.papel === 'staff_labora' && user?.acesso_console)

  if (!podeEditar) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área é exclusiva da administração da plataforma.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/">Voltar para o início</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Textos do site</h1>
        <p className="text-sm text-muted-foreground">
          Edite o que está escrito na tela de login. As mudanças valem para todos na hora.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-4">
          {ORDEM.map((chave) => {
            const item = itens.find((i) => i.chave === chave)
            if (!item) return null
            const longo = chave === 'login_subtitulo'
            return (
              <Card key={item.id} className="rounded-2xl border-none p-4 shadow-subtle">
                <Label
                  htmlFor={chave}
                  className="text-xs uppercase tracking-wide text-muted-foreground"
                >
                  {LABELS[chave] || chave}
                </Label>
                {longo ? (
                  <Textarea
                    id={chave}
                    value={item.valor}
                    rows={3}
                    className="mt-2"
                    onChange={(e) =>
                      setItens((prev) =>
                        prev.map((i) => (i.id === item.id ? { ...i, valor: e.target.value } : i)),
                      )
                    }
                  />
                ) : (
                  <Input
                    id={chave}
                    value={item.valor}
                    className="mt-2"
                    onChange={(e) =>
                      setItens((prev) =>
                        prev.map((i) => (i.id === item.id ? { ...i, valor: e.target.value } : i)),
                      )
                    }
                  />
                )}
              </Card>
            )
          })}

          <Button onClick={salvar} disabled={salvando} className="rounded-full">
            <Save className="mr-2 h-4 w-4" />
            {salvando ? 'Salvando...' : 'Salvar textos'}
          </Button>
        </div>
      )}
    </div>
  )
}
