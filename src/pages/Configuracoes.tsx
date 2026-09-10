/* Configurações da organização — nome e logo usados nos relatórios e na
 * marca d'água das fotos de vistoria. Cada organização tem o seu. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Building2, Upload } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  getMinhaOrganizacao,
  atualizarNomeOrganizacao,
  atualizarLogoOrganizacao,
  urlLogoOrganizacao,
  type Organizacao,
} from '@/services/organizacoes'
import laboraLogoUrl from '@/assets/projeto-labora-engenharia-e-sst-07-83499.png'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Configuracoes() {
  const [org, setOrg] = useState<Organizacao | null>(null)
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(true)
  const [salvandoNome, setSalvandoNome] = useState(false)
  const [enviandoLogo, setEnviandoLogo] = useState(false)

  useEffect(() => {
    getMinhaOrganizacao()
      .then((o) => {
        setOrg(o)
        setNome(o.nome)
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

  if (loading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
  }

  const logoAtual = org ? urlLogoOrganizacao(org) : null

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Nome e logo da sua organização — aparecem nos relatórios e na marca d'água das fotos de
          vistoria.
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

      <Card>
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
    </div>
  )
}
