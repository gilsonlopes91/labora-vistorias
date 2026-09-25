/* Cadastro e listagem de empresas (clientes) da organização logada e aba de orçamentos vinculada. */
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Building2, Search, Mail, MapPin, Phone, Users } from 'lucide-react'

import { useRealtime } from '@/hooks/use-realtime'
import { getErrorMessage, extractFieldErrors } from '@/lib/pocketbase/errors'
import { buscarCep, buscarDadosCnpj, cnpjValido, formatarCnpj } from '@/lib/cnpj'
import { buscarCnae, classeDoCnae, digitosCnae, formatarCnae } from '@/lib/cnaeNr04'
import { useAuth } from '@/hooks/use-auth'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import {
  getEmpresas,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  montarEndereco,
  temEnderecoEmPartes,
  type Empresa,
} from '@/services/empresas'
import { getFormularios, type Formulario } from '@/services/registrosFormulario'
import { OrcamentosTab } from '@/components/OrcamentosTab'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent } from '@/components/ui/tabs'
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
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const PORTE_VALUES = ['MEI', 'ME', 'EPP', 'Demais / Não se enquadra'] as const

// CNPJ numérico ou alfanumérico (ver lib/cnpj).
const formatCnpj = formatarCnpj

function formatTelefone(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

const empresaSchema = z.object({
  razao_social: z.string().min(1, 'Informe a razão social'),
  nome_fantasia: z.string().optional(),
  cnpj: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || !val.trim()) return true
      return cnpjValido(val)
    }, 'CNPJ inválido: confira os números (ex.: 00.000.000/0000-00)'),
  porte: z.string().optional(),
  grau_risco: z.string().optional(),
  numero_funcionarios: z.string().optional(),
  endereco: z.string().optional(),
  cnae: z.string().optional(),
  cnae_descricao: z.string().optional(),
  cep: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{5}-?\d{3}$/.test(v.trim()), 'CEP com 8 números'),
  logradouro: z.string().optional(),
  numero_endereco: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z
    .string()
    .optional()
    .refine((v) => !v || /^[A-Za-z]{2}$/.test(v.trim()), 'UF com 2 letras'),
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
  cnae: '',
  cnae_descricao: '',
  cep: '',
  logradouro: '',
  numero_endereco: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  contato_nome: '',
  contato_telefone: '',
  contato_email: '',
}

export default function Empresas() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()

  const abaParam = searchParams.get('aba')
  const abaAtiva = abaParam === 'orcamentos' ? 'orcamentos' : 'empresas'

  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [formularios, setFormularios] = useState<Formulario[]>([])
  const [organizacaoId, setOrganizacaoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Empresa | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Empresa | null>(null)
  const [busca, setBusca] = useState('')
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  // Texto digitado no campo de CNAE (código ou palavras da atividade).
  const [textoCnae, setTextoCnae] = useState('')

  const empresasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return empresas
    return empresas.filter((e) =>
      [e.razao_social, e.nome_fantasia, e.cnpj, e.contato_email, e.endereco]
        .filter(Boolean)
        .some((campo) => String(campo).toLowerCase().includes(termo)),
    )
  }, [empresas, busca])

  const formatarDesde = (iso?: string) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleDateString('pt-BR')
    } catch {
      return ''
    }
  }

  const handleTrocaAba = (novaAba: string) => {
    if (novaAba === 'orcamentos') {
      setSearchParams({ aba: 'orcamentos' })
    } else {
      setSearchParams({})
    }
  }

  const form = useForm<EmpresaFormValues>({
    resolver: zodResolver(empresaSchema),
    defaultValues: emptyValues,
  })

  const loadData = useCallback(async () => {
    try {
      const org = await getMinhaOrganizacao()
      setOrganizacaoId(org.id)
      const [items, forms] = await Promise.all([getEmpresas(), getFormularios()])
      setEmpresas(items)
      setFormularios(forms)
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
    setTextoCnae('')
    setDialogOpen(true)
  }

  // CNAE escolhido: grava a subclasse/classe e puxa o grau de risco da NR-04.
  const escolherCnae = (codigo: string, descricao?: string) => {
    const classe = classeDoCnae(codigo)
    form.setValue('cnae', digitosCnae(codigo))
    form.setValue('cnae_descricao', descricao || classe?.descricao || '')
    setTextoCnae(formatarCnae(codigo))
    if (classe) form.setValue('grau_risco', String(classe.gr))
  }

  const aoDigitarCnae = (texto: string) => {
    setTextoCnae(texto)
    const d = digitosCnae(texto)
    const classe = /^[\d.\-/\s]+$/.test(texto.trim()) && d.length >= 5 ? classeDoCnae(d) : undefined
    if (classe) {
      form.setValue('cnae', d)
      form.setValue('cnae_descricao', classe.descricao)
      form.setValue('grau_risco', String(classe.gr))
    } else {
      form.setValue('cnae', '')
      form.setValue('cnae_descricao', '')
    }
  }

  const preencherPeloCep = async () => {
    setBuscandoCep(true)
    try {
      const d = await buscarCep(form.getValues('cep') || '')
      form.setValue('cep', d.cep)
      if (d.logradouro) form.setValue('logradouro', d.logradouro)
      if (d.bairro) form.setValue('bairro', d.bairro)
      if (d.cidade) form.setValue('cidade', d.cidade)
      if (d.uf) form.setValue('uf', d.uf)
      form.clearErrors('cep')
    } catch (error) {
      form.setError('cep', { message: getErrorMessage(error) })
    } finally {
      setBuscandoCep(false)
    }
  }

  // Preenche o cadastro com os dados públicos do CNPJ (Receita). Só completa
  // os campos vazios, para não apagar o que já foi digitado.
  const preencherPeloCnpj = async () => {
    const cnpj = form.getValues('cnpj') || ''
    if (!cnpjValido(cnpj)) {
      form.setError('cnpj', { message: 'Digite um CNPJ válido para buscar' })
      return
    }
    setBuscandoCnpj(true)
    try {
      const d = await buscarDadosCnpj(cnpj)
      const vazio = (campo: keyof EmpresaFormValues) => !String(form.getValues(campo) || '').trim()
      if (d.razao_social && vazio('razao_social')) form.setValue('razao_social', d.razao_social)
      if (d.nome_fantasia && vazio('nome_fantasia')) form.setValue('nome_fantasia', d.nome_fantasia)
      if (d.endereco && vazio('endereco')) form.setValue('endereco', d.endereco)
      if (d.telefone && vazio('contato_telefone'))
        form.setValue('contato_telefone', formatTelefone(d.telefone))
      if (d.porte && vazio('porte')) form.setValue('porte', d.porte)
      // Endereço em partes: só se ainda não tem nenhuma parte digitada.
      if (!temEnderecoEmPartes(form.getValues())) {
        form.setValue('cep', d.cep)
        form.setValue('logradouro', d.logradouro)
        form.setValue('numero_endereco', d.numero)
        form.setValue('complemento', d.complemento)
        form.setValue('bairro', d.bairro)
        form.setValue('cidade', d.cidade)
        form.setValue('uf', d.uf)
      }
      let grTexto = ''
      if (d.cnae_codigo && vazio('cnae')) {
        const classe = classeDoCnae(d.cnae_codigo)
        form.setValue('cnae', d.cnae_codigo)
        form.setValue('cnae_descricao', d.cnae_descricao || classe?.descricao || '')
        setTextoCnae(formatarCnae(d.cnae_codigo))
        if (classe && vazio('grau_risco')) {
          form.setValue('grau_risco', String(classe.gr))
          grTexto = `Grau de risco ${classe.gr} pela NR-04`
        }
      }
      toast.success('Dados da Receita preenchidos', {
        description: [
          d.situacao ? `Situação: ${d.situacao}` : '',
          d.cnae ? `Atividade principal: ${d.cnae}` : '',
          grTexto,
          'Confira e complete o nº de empregados.',
        ]
          .filter(Boolean)
          .join('. '),
      })
    } catch (error) {
      toast.error('Não foi possível buscar o CNPJ', { description: getErrorMessage(error) })
    } finally {
      setBuscandoCnpj(false)
    }
  }

  const openEdit = (empresa: Empresa) => {
    setEditing(empresa)
    form.reset({
      razao_social: empresa.razao_social ?? '',
      nome_fantasia: empresa.nome_fantasia ?? '',
      cnpj: empresa.cnpj ? formatCnpj(empresa.cnpj) : '',
      porte: empresa.porte ?? '',
      grau_risco: empresa.grau_risco != null ? String(empresa.grau_risco) : '',
      numero_funcionarios:
        empresa.numero_funcionarios != null ? String(empresa.numero_funcionarios) : '',
      endereco: empresa.endereco ?? '',
      cnae: empresa.cnae ?? '',
      cnae_descricao: empresa.cnae_descricao ?? '',
      cep: empresa.cep ?? '',
      logradouro: empresa.logradouro ?? '',
      numero_endereco: empresa.numero_endereco ?? '',
      complemento: empresa.complemento ?? '',
      bairro: empresa.bairro ?? '',
      cidade: empresa.cidade ?? '',
      uf: empresa.uf ?? '',
      contato_nome: empresa.contato_nome ?? '',
      contato_telefone: empresa.contato_telefone ? formatTelefone(empresa.contato_telefone) : '',
      contato_email: empresa.contato_email ?? '',
    })
    setTextoCnae(empresa.cnae ? formatarCnae(empresa.cnae) : '')
    setDialogOpen(true)
  }

  const onSubmit = async (values: EmpresaFormValues) => {
    let orgId = organizacaoId
    if (!orgId) {
      try {
        const org = await getMinhaOrganizacao()
        orgId = org.id
        setOrganizacaoId(org.id)
      } catch (err) {
        toast.error('Não foi possível salvar', {
          description: 'Organização não identificada. Tente recarregar a página.',
        })
        return
      }
    }

    setSubmitting(true)
    const payload = {
      organizacao_id: orgId,
      razao_social: values.razao_social.trim(),
      nome_fantasia: values.nome_fantasia?.trim() || undefined,
      cnpj: values.cnpj?.trim() || undefined,
      porte: values.porte || undefined,
      grau_risco: values.grau_risco ? Number(values.grau_risco) : undefined,
      numero_funcionarios: values.numero_funcionarios
        ? Number(values.numero_funcionarios)
        : undefined,
      // Com o endereço em partes, a linha completa é montada a partir delas;
      // cadastro antigo, só com a linha, continua como estava.
      endereco: temEnderecoEmPartes(values)
        ? montarEndereco(values)
        : values.endereco?.trim() || undefined,
      cnae: values.cnae || '',
      cnae_descricao: values.cnae ? values.cnae_descricao || '' : '',
      cep: values.cep?.trim() || '',
      logradouro: values.logradouro?.trim() || '',
      numero_endereco: values.numero_endereco?.trim() || '',
      complemento: values.complemento?.trim() || '',
      bairro: values.bairro?.trim() || '',
      cidade: values.cidade?.trim() || '',
      uf: values.uf?.trim().toUpperCase() || '',
      contato_nome: values.contato_nome?.trim() || undefined,
      contato_telefone: values.contato_telefone?.trim() || undefined,
      contato_email: values.contato_email?.trim() || undefined,
    }
    try {
      if (editing) {
        await updateEmpresa(editing.id, payload)
        toast.success('Empresa atualizada com sucesso')
      } else {
        await createEmpresa(payload)
        toast.success('Empresa cadastrada com sucesso')
      }
      setDialogOpen(false)
      loadData()
    } catch (error) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, msg]) => {
          if (field in emptyValues) {
            form.setError(field as keyof EmpresaFormValues, { message: msg })
          }
        })
      }
      toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  // Link "Editar" da página da empresa: /empresas?editar=<id> abre o cadastro.
  const editarParam = searchParams.get('editar')
  useEffect(() => {
    if (!editarParam || !empresas.length) return
    const alvo = empresas.find((e) => e.id === editarParam)
    if (alvo) openEdit(alvo)
    setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editarParam, empresas])

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Empresas e Gestão Comercial</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre as empresas clientes das vistorias e controle os orçamentos e propostas
          comerciais.
        </p>
      </div>

      <Tabs value={abaAtiva} onValueChange={handleTrocaAba} className="space-y-6">
        <TabsContent value="empresas" className="space-y-6 mt-0 focus-visible:outline-none">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Empresas clientes</h2>
              <p className="text-sm text-muted-foreground">
                Clique em uma empresa para ver as vistorias, os orçamentos e os números dela.
              </p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nova empresa
            </Button>
          </div>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, documento, e-mail..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Carregando...</div>
              ) : empresasFiltradas.length === 0 ? (
                <div className="py-12 text-center">
                  <Building2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
                  <p className="mb-4 text-sm text-muted-foreground">
                    {busca
                      ? 'Nenhuma empresa encontrada com esse filtro.'
                      : 'Nenhuma empresa cadastrada ainda.'}
                  </p>
                  {!busca && (
                    <Button onClick={openCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Cadastrar primeira empresa
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {empresasFiltradas.map((empresa) => {
                    const totalFormularios = formularios.filter(
                      (f) => f.empresa_id === empresa.id,
                    ).length
                    return (
                      <Card key={empresa.id} className="transition-shadow hover:shadow-md">
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <Link to={`/empresas/${empresa.id}`} className="min-w-0 flex-1">
                              <p className="font-semibold leading-snug hover:text-primary">
                                {empresa.razao_social}
                              </p>
                              {empresa.nome_fantasia && (
                                <p className="text-xs text-muted-foreground">
                                  {empresa.nome_fantasia}
                                </p>
                              )}
                            </Link>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => openEdit(empresa)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(empresa)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          <Link to={`/empresas/${empresa.id}`} className="block space-y-1">
                            {empresa.cnpj && (
                              <p className="text-xs text-muted-foreground">
                                CPF/CNPJ: {empresa.cnpj}
                              </p>
                            )}
                            {empresa.contato_nome && (
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {empresa.contato_nome}
                              </p>
                            )}
                            {empresa.contato_telefone && (
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {empresa.contato_telefone}
                              </p>
                            )}
                            {empresa.contato_email && (
                              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <Mail className="h-3 w-3 shrink-0" />
                                {empresa.contato_email}
                              </p>
                            )}
                            {empresa.endereco && (
                              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {empresa.endereco}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {empresa.porte && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {empresa.porte}
                                </Badge>
                              )}
                              {empresa.grau_risco != null && empresa.grau_risco > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                  title={
                                    empresa.cnae
                                      ? `CNAE ${formatarCnae(empresa.cnae)}${empresa.cnae_descricao ? ` · ${empresa.cnae_descricao}` : ''}`
                                      : undefined
                                  }
                                >
                                  Grau de risco {empresa.grau_risco}
                                </Badge>
                              )}
                              {empresa.numero_funcionarios != null && (
                                <Badge variant="outline" className="text-[10px]">
                                  {empresa.numero_funcionarios} empregados
                                </Badge>
                              )}
                              {totalFormularios > 0 && (
                                <Badge variant="outline" className="text-[10px]">
                                  {totalFormularios} formulário{totalFormularios > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>

                            <p className="pt-1 text-xs text-muted-foreground/70">
                              Desde {formatarDesde(empresa.created)}
                            </p>
                          </Link>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orcamentos" className="mt-0 focus-visible:outline-none">
          <OrcamentosTab />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
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
                      <Input placeholder="Ex.: Empresa Exemplo Ltda" {...field} />
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
                      <Input placeholder="Ex.: Empresa Exemplo" {...field} />
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
                        <Input
                          placeholder="00.000.000/0000-00"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(formatCnpj(e.target.value))}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto px-0 text-xs"
                        onClick={preencherPeloCnpj}
                        disabled={buscandoCnpj}
                      >
                        <Search className="mr-1 h-3 w-3" />
                        {buscandoCnpj ? 'Buscando...' : 'Buscar dados na Receita'}
                      </Button>
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
              <div className="space-y-1.5">
                <FormLabel>CNAE principal</FormLabel>
                <Input
                  value={textoCnae}
                  onChange={(e) => aoDigitarCnae(e.target.value)}
                  placeholder="Código (41.20-4) ou atividade (construção de edifícios)"
                />
                {(() => {
                  const cnae = form.watch('cnae')
                  const classe = classeDoCnae(cnae)
                  if (classe) {
                    const gr = form.watch('grau_risco')
                    return (
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        <p>
                          {form.watch('cnae_descricao') || classe.descricao} · classe{' '}
                          {classe.codigo} · grau de risco {classe.gr} pela NR-04
                        </p>
                        {gr && gr !== String(classe.gr) && (
                          <p className="text-amber-700">
                            O grau escolhido abaixo ({gr}) é diferente do que a NR-04 indica para
                            esse CNAE ({classe.gr}).
                          </p>
                        )}
                      </div>
                    )
                  }
                  const sugestoes = textoCnae.trim().length >= 3 ? buscarCnae(textoCnae, 6) : []
                  if (!sugestoes.length) {
                    return textoCnae.trim().length >= 3 ? (
                      <p className="text-xs text-muted-foreground">
                        Nenhuma atividade encontrada. Tente outra palavra ou o código.
                      </p>
                    ) : null
                  }
                  return (
                    <div className="max-h-44 overflow-y-auto rounded-md border">
                      {sugestoes.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => escolherCnae(c.id, c.descricao)}
                          className="block w-full border-b px-3 py-1.5 text-left text-xs last:border-b-0 hover:bg-accent"
                        >
                          <span className="font-mono">{c.codigo}</span> {c.descricao}{' '}
                          <span className="text-muted-foreground">· GR {c.gr}</span>
                        </button>
                      ))}
                    </div>
                  )
                })()}
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
                      <FormLabel>Nº de trabalhadores</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Ex.: 12 (empregados + terceirizados no estabelecimento)"
                          {...field}
                        />
                      </FormControl>{' '}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-3 rounded-md border p-3">
                <p className="text-sm font-medium">Endereço</p>
                {editing?.endereco && !temEnderecoEmPartes(editing) && (
                  <p className="text-xs text-muted-foreground">
                    Cadastrado numa linha só: {editing.endereco}. Preencha os campos abaixo (o CEP
                    ajuda) para separar; se deixar em branco, fica como está.
                  </p>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel className="text-xs">CEP</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="00000-000"
                            inputMode="numeric"
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const d = e.target.value.replace(/\D/g, '').slice(0, 8)
                              field.onChange(d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d)
                            }}
                            onBlur={() => {
                              field.onBlur()
                              const d = (field.value || '').replace(/\D/g, '')
                              if (d.length === 8 && !form.getValues('logradouro'))
                                preencherPeloCep()
                            }}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto px-0 text-xs"
                          onClick={preencherPeloCep}
                          disabled={buscandoCep}
                        >
                          <Search className="mr-1 h-3 w-3" />
                          {buscandoCep ? 'Buscando...' : 'Buscar CEP'}
                        </Button>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="logradouro"
                    render={({ field }) => (
                      <FormItem className="col-span-3 sm:col-span-2">
                        <FormLabel className="text-xs">Rua / avenida</FormLabel>
                        <FormControl>
                          <Input placeholder="Av. Industrial" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="numero_endereco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Número</FormLabel>
                        <FormControl>
                          <Input placeholder="910" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="complemento"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-xs">Complemento</FormLabel>
                        <FormControl>
                          <Input placeholder="Galpão 2" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-6 gap-3">
                  <FormField
                    control={form.control}
                    name="bairro"
                    render={({ field }) => (
                      <FormItem className="col-span-6 sm:col-span-2">
                        <FormLabel className="text-xs">Bairro</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem className="col-span-4 sm:col-span-3">
                        <FormLabel className="text-xs">Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="uf"
                    render={({ field }) => (
                      <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel className="text-xs">UF</FormLabel>
                        <FormControl>
                          <Input
                            maxLength={2}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
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
                        <Input
                          placeholder="(86) 90000-0000"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(formatTelefone(e.target.value))}
                        />
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
