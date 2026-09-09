/* Cadastro e listagem de empresas (clientes) da organização logada. */
import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'

import { useRealtime } from '@/hooks/use-realtime'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import {
  getEmpresas,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  type Empresa,
} from '@/services/empresas'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const PORTE_VALUES = ['MEI', 'ME', 'EPP', 'Demais / Não se enquadra'] as const

const empresaSchema = z.object({
  razao_social: z.string().min(1, 'Informe a razão social'),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().optional(),
  porte: z.string().optional(),
  grau_risco: z.string().optional(),
  numero_funcionarios: z.string().optional(),
  endereco: z.string().optional(),
  contato_nome: z.string().optional(),
  contato_telefone: z.string().optional(),
  contato_email: z.union([z.string().email('E-mail inválido'), z.literal('')]).optional(),
})

type EmpresaFormValues = z.infer<typeof empresaSchema>

const emptyValues: EmpresaFormValues = {
  razao_social: '',
  nome_fantasia: '',
  cnpj: '',
  porte: '',
  grau_risco: '',
  numero_funcionarios: '',
  endereco: '',
  contato_nome: '',
  contato_telefone: '',
  contato_email: '',
}

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [organizacaoId, setOrganizacaoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Empresa | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Empresa | null>(null)

  const form = useForm<EmpresaFormValues>({
    resolver: zodResolver(empresaSchema),
    defaultValues: emptyValues,
  })

  const loadData = useCallback(async () => {
    try {
      const org = await getMinhaOrganizacao()
      setOrganizacaoId(org.id)
      const items = await getEmpresas()
      setEmpresas(items)
    } catch (error) {
      toast.error('Não foi possível carregar as empresas', { description: getErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime<Empresa>('empresas', () => {
    loadData()
  })

  const openCreate = () => {
    setEditing(null)
    form.reset(emptyValues)
    setDialogOpen(true)
  }

  const openEdit = (empresa: Empresa) => {
    setEditing(empresa)
    form.reset({
      razao_social: empresa.razao_social ?? '',
      nome_fantasia: empresa.nome_fantasia ?? '',
      cnpj: empresa.cnpj ?? '',
      porte: empresa.porte ?? '',
      grau_risco: empresa.grau_risco != null ? String(empresa.grau_risco) : '',
      numero_funcionarios:
        empresa.numero_funcionarios != null ? String(empresa.numero_funcionarios) : '',
      endereco: empresa.endereco ?? '',
      contato_nome: empresa.contato_nome ?? '',
      contato_telefone: empresa.contato_telefone ?? '',
      contato_email: empresa.contato_email ?? '',
    })
    setDialogOpen(true)
  }

  const onSubmit = async (values: EmpresaFormValues) => {
    if (!organizacaoId) return
    setSubmitting(true)
    const payload = {
      organizacao_id: organizacaoId,
      razao_social: values.razao_social,
      nome_fantasia: values.nome_fantasia || undefined,
      cnpj: values.cnpj || undefined,
      porte: values.porte || undefined,
      grau_risco: values.grau_risco ? Number(values.grau_risco) : undefined,
      numero_funcionarios: values.numero_funcionarios
        ? Number(values.numero_funcionarios)
        : undefined,
      endereco: values.endereco || undefined,
      contato_nome: values.contato_nome || undefined,
      contato_telefone: values.contato_telefone || undefined,
      contato_email: values.contato_email || undefined,
    }
    try {
      if (editing) {
        await updateEmpresa(editing.id, payload)
        toast.success('Empresa atualizada')
      } else {
        await createEmpresa(payload)
        toast.success('Empresa cadastrada')
      }
      setDialogOpen(false)
      loadData()
    } catch (error) {
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteEmpresa(deleteTarget.id)
      toast.success('Empresa removida')
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
          <h1 className="text-2xl font-bold">Empresas</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre as empresas onde suas vistorias de SST serão realizadas.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova empresa
        </Button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : empresas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Building2 className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="mb-4 text-sm text-muted-foreground">Nenhuma empresa cadastrada ainda.</p>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar primeira empresa
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão social</TableHead>
                <TableHead>Nome fantasia</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Porte</TableHead>
                <TableHead>Funcionários</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map((empresa) => (
                <TableRow key={empresa.id}>
                  <TableCell className="font-medium">{empresa.razao_social}</TableCell>
                  <TableCell>{empresa.nome_fantasia || '—'}</TableCell>
                  <TableCell>{empresa.cnpj || '—'}</TableCell>
                  <TableCell>
                    {empresa.porte ? <Badge variant="secondary">{empresa.porte}</Badge> : '—'}
                  </TableCell>
                  <TableCell>{empresa.numero_funcionarios ?? '—'}</TableCell>
                  <TableCell>
                    {empresa.contato_nome || empresa.contato_telefone ? (
                      <div className="text-sm">
                        {empresa.contato_nome && <div>{empresa.contato_nome}</div>}
                        {empresa.contato_telefone && (
                          <div className="text-muted-foreground">{empresa.contato_telefone}</div>
                        )}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(empresa)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(empresa)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar empresa' : 'Nova empresa'}</DialogTitle>
            <DialogDescription>
              Informe os dados da empresa. Apenas a razão social é obrigatória.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="razao_social"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão social *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Aro Sport Centro Automotivo Ltda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nome_fantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome fantasia</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Aro Sport" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="porte"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porte</FormLabel>
                      <Select value={field.value || undefined} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PORTE_VALUES.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="grau_risco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grau de risco</FormLabel>
                      <Select value={field.value || undefined} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['1', '2', '3', '4'].map((v) => (
                            <SelectItem key={v} value={v}>
                              Grau {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numero_funcionarios"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº de funcionários</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="Ex.: 12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, bairro, cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contato_nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contato</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contato_telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(86) 90000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="contato_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail de contato</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contato@empresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar empresa'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai remover "{deleteTarget?.razao_social}" e não pode ser desfeito.
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
