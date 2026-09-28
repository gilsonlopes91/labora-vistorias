/* Editor de textos do site — admin/staff-console.
   - Home e Rodapé: blocos com imagens, rascunho, prévia, publicar e histórico
     (tabelas site_paginas / site_imagens / site_versoes).
   - Login: os quatro textos da tela de entrada (coleção conteudo_site, chave/
     valor). Aqui a edição vale na hora, sem rascunho. */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useAuth } from '@/hooks/use-auth'
import AdminNav from '@/components/admin/AdminNav'
import EditorPagina from '@/components/admin/site/EditorPagina'
import FormHome from '@/components/admin/site/FormHome'
import FormRodape from '@/components/admin/site/FormRodape'
import HomeView from '@/components/site/HomeView'
import RodapePublico from '@/components/site/RodapePublico'
import {
  HOME_PADRAO,
  RODAPE_PADRAO,
  type HomeConteudo,
  type RodapeConteudo,
} from '@/lib/siteConteudo'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

function PreviaHome({ valor }: { valor: HomeConteudo }) {
  return <HomeView conteudo={valor} />
}

function PreviaRodape({ valor }: { valor: RodapeConteudo }) {
  return <RodapePublico conteudo={valor} />
}

function EditorLogin() {
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
      toast.success('Textos da tela de login atualizados!')
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-muted-foreground">
        Os quatro textos da tela de login. Aqui a mudança vale para todos na hora, sem rascunho.
      </p>
      {ORDEM.map((chave) => {
        const item = itens.find((i) => i.chave === chave)
        if (!item) return null
        const longo = chave === 'login_subtitulo'
        const atualizar = (valor: string) =>
          setItens((prev) => prev.map((i) => (i.id === item.id ? { ...i, valor } : i)))
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
                onChange={(e) => atualizar(e.target.value)}
              />
            ) : (
              <Input
                id={chave}
                value={item.valor}
                className="mt-2"
                onChange={(e) => atualizar(e.target.value)}
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
  )
}

export default function EditorConteudo() {
  const { user } = useAuth()

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
          <Link to="/painel">Voltar para o início</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <AdminNav />
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Textos do site</h1>
        <p className="text-sm text-muted-foreground">
          Edite a página inicial e o rodapé com rascunho e prévia. Nada muda no site até você
          publicar.
        </p>
      </div>

      <Tabs defaultValue="home">
        <TabsList className="mb-5 rounded-full">
          <TabsTrigger value="home" className="rounded-full">
            Página inicial
          </TabsTrigger>
          <TabsTrigger value="rodape" className="rounded-full">
            Rodapé
          </TabsTrigger>
          <TabsTrigger value="login" className="rounded-full">
            Tela de login
          </TabsTrigger>
        </TabsList>

        {/* forceMount: trocar de aba não descarta o que ainda não foi salvo */}
        <TabsContent value="home" forceMount className="data-[state=inactive]:hidden">
          <EditorPagina<HomeConteudo>
            chave="home"
            padrao={HOME_PADRAO}
            Formulario={FormHome}
            Previa={PreviaHome}
          />
        </TabsContent>
        <TabsContent value="rodape" forceMount className="data-[state=inactive]:hidden">
          <EditorPagina<RodapeConteudo>
            chave="rodape"
            padrao={RODAPE_PADRAO}
            Formulario={FormRodape}
            Previa={PreviaRodape}
          />
        </TabsContent>
        <TabsContent value="login">
          <EditorLogin />
        </TabsContent>
      </Tabs>
    </div>
  )
}
