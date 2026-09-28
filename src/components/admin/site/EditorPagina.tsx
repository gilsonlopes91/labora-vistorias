/* Moldura do editor de uma página do site: carrega o registro, guarda
   rascunho, publica (com histórico) e alterna entre editar e prévia.
   O que a prévia mostra é o mesmo componente que o site público usa. */
import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { toast } from 'sonner'
import { Eye, History, Pencil, RotateCcw, Save, Send } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { mesclar, type ChaveSite } from '@/lib/siteConteudo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Registro {
  id: string
  rascunho: unknown
  publicado: unknown
  publicado_em: string
  publicado_por: string
}

interface Versao {
  id: string
  conteudo: unknown
  usuario_nome: string
  created: string
}

interface Props<T> {
  chave: ChaveSite
  padrao: T
  Formulario: ComponentType<{ valor: T; onChange: (v: T) => void }>
  Previa: ComponentType<{ valor: T }>
}

const quando = (s?: string) => (s ? new Date(s).toLocaleString('pt-BR') : '—')

export default function EditorPagina<T>({ chave, padrao, Formulario, Previa }: Props<T>) {
  const [registro, setRegistro] = useState<Registro | null>(null)
  const [rascunho, setRascunho] = useState<T>(padrao)
  const [carregando, setCarregando] = useState(true)
  const [sujo, setSujo] = useState(false)
  const [modo, setModo] = useState<'editar' | 'previa'>('editar')
  const [salvando, setSalvando] = useState(false)
  const [confirmarPublicar, setConfirmarPublicar] = useState(false)
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const [versoes, setVersoes] = useState<Versao[]>([])

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const reg = await pb
        .collection('site_paginas')
        .getFirstListItem<Registro>(pb.filter('chave = {:c}', { c: chave }))
      setRegistro(reg)
      setRascunho(mesclar(padrao, reg.rascunho ?? reg.publicado))
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
        setRegistro(null)
        setRascunho(padrao)
      } else {
        toast.error('Não foi possível carregar a página', { description: getErrorMessage(error) })
      }
    } finally {
      setSujo(false)
      setCarregando(false)
    }
  }, [chave, padrao])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Avisa antes de fechar a aba com alterações não salvas.
  useEffect(() => {
    if (!sujo) return
    const aviso = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', aviso)
    return () => window.removeEventListener('beforeunload', aviso)
  }, [sujo])

  const publicadoMesclado = useMemo(
    () => mesclar(padrao, registro?.publicado),
    [padrao, registro?.publicado],
  )
  const igualAoPublicado = JSON.stringify(rascunho) === JSON.stringify(publicadoMesclado)

  const alterar = (v: T) => {
    setRascunho(v)
    setSujo(true)
  }

  const gravarRascunho = async (): Promise<Registro> => {
    const salvo = registro
      ? await pb.collection('site_paginas').update<Registro>(registro.id, { rascunho })
      : await pb.collection('site_paginas').create<Registro>({ chave, rascunho })
    setRegistro(salvo)
    setSujo(false)
    return salvo
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      await gravarRascunho()
      toast.success('Rascunho salvo. O site ainda não mudou.')
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  const publicar = async () => {
    setSalvando(true)
    try {
      await gravarRascunho()
      await pb.send('/backend/v1/admin/conteudo-pagina/publicar', {
        method: 'POST',
        body: JSON.stringify({ chave }),
      })
      // O navegador guarda a última versão publicada; limpa para o próximo acesso.
      try {
        localStorage.removeItem(`labora:site:${chave}`)
      } catch {
        // sem armazenamento local
      }
      toast.success('Publicado. O site já mostra esta versão.')
      setConfirmarPublicar(false)
      await carregar()
    } catch (error) {
      toast.error('Não foi possível publicar', { description: getErrorMessage(error) })
    } finally {
      setSalvando(false)
    }
  }

  const abrirHistorico = async () => {
    setHistoricoAberto(true)
    try {
      const lista = await pb.collection('site_versoes').getList<Versao>(1, 30, {
        filter: pb.filter('chave = {:c}', { c: chave }),
        sort: '-created',
      })
      setVersoes(lista.items)
    } catch (error) {
      toast.error('Não foi possível carregar o histórico', { description: getErrorMessage(error) })
    }
  }

  const restaurar = (v: Versao) => {
    setRascunho(mesclar(padrao, v.conteudo))
    setSujo(true)
    setHistoricoAberto(false)
    setModo('editar')
    toast.success('Versão carregada no rascunho. Confira e publique se estiver certo.')
  }

  const voltarAoOriginal = () => {
    setRascunho(padrao)
    setSujo(true)
    toast.success('Textos originais carregados no rascunho. Publique para valer no site.')
  }

  if (carregando) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  const situacao = sujo ? (
    <Badge variant="outline" className="border-amber-500 text-amber-700">
      Alterações não salvas
    </Badge>
  ) : igualAoPublicado ? (
    <Badge variant="outline" className="border-emerald-500 text-emerald-700">
      Igual ao que está no site
    </Badge>
  ) : (
    <Badge variant="outline" className="border-amber-500 text-amber-700">
      Rascunho salvo, ainda não publicado
    </Badge>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border p-3">
        <div className="mr-auto flex flex-wrap items-center gap-2">
          {situacao}
          <span className="text-xs text-muted-foreground">
            {registro?.publicado_em
              ? `Publicado em ${quando(registro.publicado_em)} por ${registro.publicado_por || '—'}`
              : 'Nada publicado ainda: o site usa os textos originais.'}
          </span>
        </div>
        <div className="flex rounded-full border p-0.5">
          <Button
            type="button"
            size="sm"
            variant={modo === 'editar' ? 'default' : 'ghost'}
            className="h-8 rounded-full"
            onClick={() => setModo('editar')}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Editar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={modo === 'previa' ? 'default' : 'ghost'}
            className="h-8 rounded-full"
            onClick={() => setModo('previa')}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Prévia
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="rounded-full"
          onClick={abrirHistorico}
        >
          <History className="mr-1.5 h-4 w-4" />
          Histórico
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="rounded-full"
          onClick={voltarAoOriginal}
        >
          <RotateCcw className="mr-1.5 h-4 w-4" />
          Textos originais
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={!sujo || salvando}
          onClick={salvar}
        >
          <Save className="mr-1.5 h-4 w-4" />
          Salvar rascunho
        </Button>
        <Button
          type="button"
          size="sm"
          className="rounded-full"
          disabled={salvando || (!sujo && igualAoPublicado)}
          onClick={() => setConfirmarPublicar(true)}
        >
          <Send className="mr-1.5 h-4 w-4" />
          Publicar
        </Button>
      </div>

      {modo === 'editar' ? (
        <Formulario valor={rascunho} onChange={alterar} />
      ) : (
        <div className="pointer-events-none select-none overflow-hidden rounded-2xl border bg-background">
          <Previa valor={rascunho} />
        </div>
      )}

      <Dialog open={confirmarPublicar} onOpenChange={setConfirmarPublicar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publicar agora?</DialogTitle>
            <DialogDescription>
              O site público passa a mostrar esta versão na hora. A versão publicada fica guardada
              no histórico e dá para voltar a ela depois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarPublicar(false)}>
              Cancelar
            </Button>
            <Button onClick={publicar} disabled={salvando}>
              {salvando ? 'Publicando...' : 'Publicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historicoAberto} onOpenChange={setHistoricoAberto}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de publicações</DialogTitle>
            <DialogDescription>
              As 30 últimas versões publicadas. Restaurar carrega a versão no rascunho; nada muda no
              site até você publicar.
            </DialogDescription>
          </DialogHeader>
          {versoes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma publicação ainda.
            </p>
          ) : (
            <div className="divide-y">
              {versoes.map((v, i) => (
                <div key={v.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {quando(v.created)}
                      {i === 0 && (
                        <Badge variant="secondary" className="ml-2">
                          No ar
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{v.usuario_nome || '—'}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => restaurar(v)}
                  >
                    Restaurar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
