/* Configurações da organização — nome, logo (relatórios/marca d'água) e os
 * responsáveis técnicos que podem assinar os laudos de vistoria. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Building2, Upload, UserCog, Star, Trash2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  getMinhaOrganizacao,
  atualizarNomeOrganizacao,
  atualizarLogoOrganizacao,
  urlLogoOrganizacao,
  type Organizacao,
} from '@/services/organizacoes'
import {
  getResponsaveisTecnicos,
  criarResponsavelTecnico,
  excluirResponsavelTecnico,
  definirComoPadrao,
  formatarRegistroRT,
  TIPOS_REGISTRO_RT,
  type ResponsavelTecnico,
  type TipoRegistroRT,
} from '@/services/responsaveisTecnicos'
import laboraLogoUrl from '@/assets/projeto-labora-engenharia-e-sst-07-83499.png'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Configuracoes() {
  const [org, setOrg] = useState<Organizacao | null>(null)
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(true)
  const [salvandoNome, setSalvandoNome] = useState(false)
  const [enviandoLogo, setEnviandoLogo] = useState(false)

  const [responsaveis, setResponsaveis] = useState<ResponsavelTecnico[]>([])
  const [carregandoRT, setCarregandoRT] = useState(true)
  const [salvandoRT, setSalvandoRT] = useState(false)
  const [rtNome, setRtNome] = useState('')
  const [rtTipo, setRtTipo] = useState<TipoRegistroRT>('CREA')
  const [rtNumero, setRtNumero] = useState('')
  const [rtUf, setRtUf] = useState('')
  const [rtPadrao, setRtPadrao] = useState(false)

  const carregarResponsaveis = (organizacaoId: string) => {
    setCarregandoRT(true)
    getResponsaveisTecnicos(organizacaoId)
      .then(setResponsaveis)
      .catch((error) =>
        toast.error('Não foi possível carregar os responsáveis técnicos', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregandoRT(false))
  }

  useEffect(() => {
    getMinhaOrganizacao()
      .then((o) => {
        setOrg(o)
        setNome(o.nome)
        carregarResponsaveis(o.id)
      })
      .catch((error) =>
        toast.error('Não foi possível carregar a organização', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setLoading(false))
  }, [])

  const handleSalvarNome = async () => {
    if (!org || nome.trim() === org.nome) return
    setSalvandoNome(true)
    try {
      const atualizado = await atualizarNomeOrganizacao(org.id, nome.trim())
      setOrg(atualizado)
      toast.success('Nome atualizado')
    } catch (error) {
      toast.error('Não foi possível salvar o nome', { description: getErrorMessage(error) })
    } finally {
      setSalvandoNome(false)
    }
  }

  const handleLogoChange = async (fileList: FileList | null) => {
    if (!org || !fileList || fileList.length === 0) return
    setEnviandoLogo(true)
    try {
      const atualizado = await atualizarLogoOrganizacao(org.id, fileList[0])
      setOrg(atualizado)
      toast.success('Logo atualizado')
    } catch (error) {
      toast.error('Não foi possível enviar o logo', { description: getErrorMessage(error) })
    } finally {
      setEnviandoLogo(false)
    }
  }

  const handleAdicionarRT = async () => {
    if (!org || !rtNome.trim() || !rtNumero.trim()) return
    setSalvandoRT(true)
    try {
      const criado = await criarResponsavelTecnico({
        organizacao_id: org.id,
        nome: rtNome.trim(),
        tipo_registro: rtTipo,
        numero_registro: rtNumero.trim(),
        uf: rtUf.trim() || undefined,
        padrao: rtPadrao || responsaveis.length === 0,
      })
      if (criado.padrao) await definirComoPadrao(org.id, criado.id)
      carregarResponsaveis(org.id)
      setRtNome('')
      setRtNumero('')
      setRtUf('')
      setRtPadrao(false)
      toast.success('Responsável técnico adicionado')
    } catch (error) {
      toast.error('Não foi possível adicionar', { description: getErrorMessage(error) })
    } finally {
      setSalvandoRT(false)
    }
  }

  const handleDefinirPadrao = async (id: string) => {
    if (!org) return
    try {
      await definirComoPadrao(org.id, id)
      carregarResponsaveis(org.id)
    } catch (error) {
      toast.error('Não foi possível definir como padrão', { description: getErrorMessage(error) })
    }
  }

  const handleExcluirRT = async (id: string) => {
    if (!org) return
    try {
      await excluirResponsavelTecnico(id)
      carregarResponsaveis(org.id)
    } catch (error) {
      toast.error('Não foi possível remover', { description: getErrorMessage(error) })
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
  }

  const logoAtual = org ? urlLogoOrganizacao(org) : null

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Dados da sua organização usados nos relatórios e nas vistorias.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Organização
          </CardTitle>
          <CardDescription>Nome usado nos documentos gerados pelo sistema.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="nome-organizacao" className="mb-1.5 block text-xs">
              Nome da organização
            </Label>
            <Input id="nome-organizacao" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <Button
            onClick={handleSalvarNome}
            disabled={salvandoNome || !org || nome.trim() === org.nome || nome.trim() === ''}
          >
            {salvandoNome ? 'Salvando...' : 'Salvar'}
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Logo</CardTitle>
          <CardDescription>
            Aparece nos relatórios e como marca no canto das fotos georreferenciadas. Enquanto não
            enviar o seu, o sistema usa o logo padrão da Labora.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/40 p-2">
            <img
              src={logoAtual || laboraLogoUrl}
              alt="Logo da organização"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              id="logo-organizacao"
              className="hidden"
              onChange={(e) => {
                handleLogoChange(e.target.files)
                e.target.value = ''
              }}
            />
            <label
              htmlFor="logo-organizacao"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent"
            >
              <Upload className="h-3.5 w-3.5" />
              {enviandoLogo ? 'Enviando...' : logoAtual ? 'Trocar logo' : 'Enviar logo'}
            </label>
            <p className="mt-1.5 text-xs text-muted-foreground">PNG, JPEG ou WebP, até 3 MB.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCog className="h-4 w-4" />
            Responsáveis técnicos
          </CardTitle>
          <CardDescription>
            Quem pode assinar os laudos de vistoria. O marcado como padrão é sugerido
            automaticamente ao finalizar uma vistoria — dá pra escolher outro ou adicionar um novo
            na hora.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregandoRT ? (
            <p className="py-2 text-sm text-muted-foreground">Carregando...</p>
          ) : responsaveis.length > 0 ? (
            <ul className="mb-4 space-y-2">
              {responsaveis.map((rt) => (
                <li
                  key={rt.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{rt.nome}</span>{' '}
                    <span className="text-muted-foreground">{formatarRegistroRT(rt)}</span>
                    {rt.padrao && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        Padrão
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!rt.padrao && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => handleDefinirPadrao(rt.id)}
                      >
                        <Star className="h-3.5 w-3.5" />
                        Tornar padrão
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleExcluirRT(rt.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm text-muted-foreground">
              Nenhum responsável técnico cadastrado ainda.
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 rounded-md border border-dashed p-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="rt-nome" className="mb-1.5 block text-xs">
                Nome
              </Label>
              <Input
                id="rt-nome"
                value={rtNome}
                onChange={(e) => setRtNome(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Conselho</Label>
              <Select value={rtTipo} onValueChange={(v) => setRtTipo(v as TipoRegistroRT)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_REGISTRO_RT.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <div className="w-16">
                <Label htmlFor="rt-uf" className="mb-1.5 block text-xs">
                  UF
                </Label>
                <Input
                  id="rt-uf"
                  value={rtUf}
                  maxLength={2}
                  onChange={(e) => setRtUf(e.target.value.toUpperCase())}
                  placeholder="PI"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="rt-numero" className="mb-1.5 block text-xs">
                  Número do registro
                </Label>
                <Input
                  id="rt-numero"
                  value={rtNumero}
                  onChange={(e) => setRtNumero(e.target.value)}
                  placeholder="12345"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox
                id="rt-padrao"
                checked={rtPadrao}
                onCheckedChange={(v) => setRtPadrao(v === true)}
              />
              <Label htmlFor="rt-padrao" className="text-xs font-normal text-muted-foreground">
                Definir como padrão da organização
              </Label>
            </div>
            <div className="sm:col-span-2">
              <Button
                onClick={handleAdicionarRT}
                disabled={salvandoRT || !rtNome.trim() || !rtNumero.trim()}
                size="sm"
              >
                {salvandoRT ? 'Adicionando...' : 'Adicionar responsável técnico'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
