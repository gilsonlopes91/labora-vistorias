/* Lista de vistorias agendadas/realizadas. */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { ClipboardCheck, Trash2 } from 'lucide-react'

import { useRealtime } from '@/hooks/use-realtime'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  getVistorias,
  deleteVistoria,
  type Vistoria,
  type StatusVistoria,
} from '@/services/vistorias'
import NovaVistoriaDialog from '@/components/NovaVistoriaDialog'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const STATUS_LABEL: Record<StatusVistoria, string> = {
  agendada: 'Agendada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

const STATUS_VARIANT: Record<StatusVistoria, 'secondary' | 'default' | 'outline' | 'destructive'> =
  {
    agendada: 'secondary',
    em_andamento: 'default',
    concluida: 'outline',
    cancelada: 'destructive',
  }

export default function Vistorias() {
  const [vistorias, setVistorias] = useState<Vistoria[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Vistoria | null>(null)
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    try {
      const items = await getVistorias()
      setVistorias(items)
    } catch (error) {
      toast.error('Não foi possível carregar as vistorias', { description: getErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime<Vistoria>('vistorias', () => {
    loadData()
  })

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteVistoria(deleteTarget.id)
      toast.success('Vistoria removida')
      setDeleteTarget(null)
      loadData()
    } catch (error) {
      toast.error('Não foi possível remover', { description: getErrorMessage(error) })
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vistorias</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe as vistorias agendadas e realizadas.
          </p>
        </div>
        <NovaVistoriaDialog onCreated={(id) => navigate(`/vistorias/${id}`)} />
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : vistorias.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
          <ClipboardCheck className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="mb-4 text-sm text-muted-foreground">Nenhuma vistoria agendada ainda.</p>
          <NovaVistoriaDialog onCreated={(id) => navigate(`/vistorias/${id}`)} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border-none bg-card shadow-subtle">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data agendada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vistorias.map((v) => (
                <TableRow
                  key={v.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/vistorias/${v.id}`)}
                >
                  <TableCell className="font-medium">
                    {v.expand?.empresa_id?.nome_fantasia ||
                      v.expand?.empresa_id?.razao_social ||
                      '—'}
                  </TableCell>
                  <TableCell>
                    {v.expand?.tipo_vistoria_id?.nr_referencia ||
                      v.expand?.tipo_vistoria_id?.nome ||
                      '—'}
                  </TableCell>
                  <TableCell>
                    {v.data_agendada
                      ? format(parseISO(v.data_agendada), 'dd/MM/yyyy', { locale: ptBR })
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[v.status || 'agendada']}>
                      {STATUS_LABEL[v.status || 'agendada']}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(v)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover vistoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai remover a vistoria e todas as respostas do checklist preenchidas. Não pode
              ser desfeito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
