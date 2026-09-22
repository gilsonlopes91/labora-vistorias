/* Lista de espera — inscritos pelo "Criar conta" do site (nome + e-mail).
   Só o admin da plataforma lê (RLS da coleção lista_espera). */
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Download, Trash2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Inscrito {
  id: string
  nome: string
  email: string
  created: string
}

export default function ListaEsperaPanel() {
  const [lista, setLista] = useState<Inscrito[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const recs = await pb.collection('lista_espera').getFullList({ sort: '-created' })
      setLista(recs.map((r) => ({ id: r.id, nome: r.nome, email: r.email, created: r.created })))
    } catch (error) {
      toast.error('Não foi possível carregar a lista de espera', {
        description: getErrorMessage(error),
      })
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const exportarCsv = () => {
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`
    const linhas = [
      'nome;email;data',
      ...lista.map((i) =>
        [esc(i.nome), esc(i.email), esc(new Date(i.created).toLocaleString('pt-BR'))].join(';'),
      ),
    ]
    const blob = new Blob(['﻿' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lista-espera-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const remover = async (id: string) => {
    try {
      await pb.collection('lista_espera').delete(id)
      setLista((l) => l.filter((i) => i.id !== id))
    } catch (error) {
      toast.error('Não foi possível remover', { description: getErrorMessage(error) })
    }
  }

  return (
    <div className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="mb-1 text-xl font-bold">Lista de espera</h2>
          <p className="text-sm text-muted-foreground">
            Quem clicou em "Criar conta" no site. {lista.length} inscrito(s).
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={exportarCsv}
          disabled={lista.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {carregando ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : lista.length === 0 ? (
        <Card className="rounded-2xl border-dashed p-8 text-center text-sm text-muted-foreground">
          Ninguém se inscreveu ainda.
        </Card>
      ) : (
        <Card className="overflow-hidden rounded-2xl border-none shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {lista.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{i.nome}</td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${i.email}`} className="hover:underline">
                        {i.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(i.created).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        aria-label={`Remover ${i.email}`}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => remover(i.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
