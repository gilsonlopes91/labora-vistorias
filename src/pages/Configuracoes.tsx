/* Configurações da organização — nome, logo (relatórios/marca d'água), dados
 * que saem nos documentos e os responsáveis técnicos que assinam os relatórios
 * de vistoria (com a assinatura digitalizada). */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Building2, FileText, Palette, PenLine, Upload, UserCog, Star, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { coresPadrao, ehOrganizacaoLabora, hexValido } from '@/lib/identidadeVisual'
import { cnpjValido, formatarCnpj } from '@/lib/cnpj'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  getMinhaOrganizacao,
  atualizarNomeOrganizacao,
  atualizarLogoOrganizacao,
  atualizarCoresOrganizacao,
  atualizarDadosDocumentos,
  urlLogoOrganizacao,
  type DadosDocumentos,
  type Organizacao,
} from '@/services/organizacoes'
import {
  getResponsaveisTecnicos,
  criarResponsavelTecnico,
  excluirResponsavelTecnico,
  definirComoPadrao,
  enviarAssinaturaRT,
  removerAssinaturaRT,
  urlAssinaturaRT,
  formatarRegistroRT,
  TIPOS_REGISTRO_RT,
  type ResponsavelTecnico,
  type TipoRegistroRT,
} from '@/services/responsaveisTecnicos'
import LoadingScreen from '@/components/LoadingScreen'
import pb from '@/lib/pocketbase/client'
import { getPapelUsuarioLogado, isGestor } from '@/services/equipe'
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
  const [corPrimaria, setCorPrimaria] = useState(coresPadrao().primaria)
  const [corSecundaria, setCorSecundaria] = useState(coresPadrao().secundaria)
  const [salvandoCores, setSalvandoCores] = useState(false)
  // Dados que saem nos documentos (propostas e relatórios).
  const [dadosDoc, setDadosDoc] = useState<DadosDocumentos>({})
  const [salvandoDados, setSalvandoDados] = useState(false)
  // Assinatura digitalizada dos RTs: arquivos protegidos, abertos com token.
  const [tokenArquivos, setTokenArquivos] = useState('')
  const [enviandoAssinatura, setEnviandoAssinatura] = useState<string | null>(null)

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
      .then((lista) => {
        setResponsaveis(lista)
        if (lista.some((rt) => rt.assinatura)) {
          pb.files
            .getToken()
            .then(setTokenArquivos)
            .catch(() => setTokenArquivos(''))
        }
      })
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
        const padrao = coresPadrao(o.nome)
        setCorPrimaria(hexValido(o.cor_primaria) ? o.cor_primaria!.toUpperCase() : padrao.primaria)
        setCorSecundaria(
          hexValido(o.cor_secundaria) ? o.cor_secundaria!.toUpperCase() : padrao.secundaria,
        )
        setDadosDoc(o.dados_documentos || {})
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
    const arquivo = fileList[0]
    if (arquivo.type !== 'image/png') {
      toast.error('Envie o logo em PNG', {
        description:
          'Use o arquivo PNG com fundo transparente, para o logo ficar bem sobre qualquer cor.',
      })
      return
    }
    const limiteBytes = 3 * 1024 * 1024
    if (arquivo.size > limiteBytes) {
      toast.error('Não foi possível enviar o logo', {
        description: 'Arquivo muito grande. O limite é 3 MB — envie uma imagem menor.',
      })
      return
    }
    setEnviandoLogo(true)
    try {
      const atualizado = await atualizarLogoOrganizacao(org.id, arquivo)
      setOrg(atualizado)
      toast.success('Logo atualizado')
    } catch (error) {
      const msg = getErrorMessage(error)
      const desc = /maximum allowed file size/i.test(msg)
        ? 'Arquivo muito grande. O limite é 3 MB — envie uma imagem menor.'
        : msg
      toast.error('Não foi possível enviar o logo', { description: desc })
    } finally {
      setEnviandoLogo(false)
    }
  }

  const handleSalvarCores = async () => {
    if (!org) return
    if (!hexValido(corPrimaria) || !hexValido(corSecundaria)) {
      toast.error('Cor inválida', { description: 'Use o formato #RRGGBB, por exemplo #6C8845.' })
      return
    }
    setSalvandoCores(true)
    try {
      const atualizado = await atualizarCoresOrganizacao(org.id, {
        cor_primaria: corPrimaria.toUpperCase(),
        cor_secundaria: corSecundaria.toUpperCase(),
      })
      setOrg(atualizado)
      toast.success('Cores salvas', {
        description: 'Os próximos PDFs de proposta e de vistoria já saem com elas.',
      })
    } catch (error) {
      toast.error('Não foi possível salvar as cores', { description: getErrorMessage(error) })
    } finally {
      setSalvandoCores(false)
    }
  }

  const coresMudaram =
    !!org &&
    (corPrimaria.toUpperCase() !==
      (org.cor_primaria || coresPadrao(org.nome).primaria).toUpperCase() ||
      corSecundaria.toUpperCase() !==
        (org.cor_secundaria || coresPadrao(org.nome).secundaria).toUpperCase())

  const campoDoc = (campo: keyof Omit<DadosDocumentos, 'banco'>, valor: string) =>
    setDadosDoc((d) => ({ ...d, [campo]: valor }))
  const campoBanco = (campo: keyof NonNullable<DadosDocumentos['banco']>, valor: string) =>
    setDadosDoc((d) => ({ ...d, banco: { ...(d.banco || {}), [campo]: valor } }))

  const handleSalvarDados = async () => {
    if (!org) return
    if (dadosDoc.cnpj && !cnpjValido(dadosDoc.cnpj)) {
      toast.error('CNPJ inválido', { description: 'Confira os números do CNPJ.' })
      return
    }
    // Campos vazios não vão para o documento.
    const limpar = (o: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(o)
          .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
          .filter(([, v]) => v !== '' && v !== undefined),
      )
    const banco = limpar((dadosDoc.banco || {}) as Record<string, unknown>)
    const dados = {
      ...limpar({ ...dadosDoc, banco: undefined }),
      ...(Object.keys(banco).length ? { banco } : {}),
    } as DadosDocumentos
    setSalvandoDados(true)
    try {
      const atualizado = await atualizarDadosDocumentos(org.id, dados)
      setOrg(atualizado)
      setDadosDoc(atualizado.dados_documentos || {})
      toast.success('Dados salvos', {
        description: 'Os próximos PDFs de proposta e de vistoria já saem com eles.',
      })
    } catch (error) {
      toast.error('Não foi possível salvar os dados', { description: getErrorMessage(error) })
    } finally {
      setSalvandoDados(false)
    }
  }

  const handleAssinatura = async (rtId: string, fileList: FileList | null) => {
    if (!org || !fileList || fileList.length === 0) return
    const arquivo = fileList[0]
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.type)) {
      toast.error('Envie a assinatura em PNG ou JPG', {
        description:
          'O melhor é PNG com fundo transparente: assinatura em papel branco, fotografada ou escaneada.',
      })
      return
    }
    if (arquivo.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande', { description: 'O limite é 2 MB.' })
      return
    }
    setEnviandoAssinatura(rtId)
    try {
      await enviarAssinaturaRT(rtId, arquivo)
      carregarResponsaveis(org.id)
      toast.success('Assinatura salva', {
        description: 'Ela entra no relatório das vistorias assinadas por este responsável.',
      })
    } catch (error) {
      toast.error('Não foi possível salvar a assinatura', { description: getErrorMessage(error) })
    } finally {
      setEnviandoAssinatura(null)
    }
  }

  const handleRemoverAssinatura = async (rtId: string) => {
    if (!org) return
    try {
      await removerAssinaturaRT(rtId)
      carregarResponsaveis(org.id)
    } catch (error) {
      toast.error('Não foi possível remover a assinatura', { description: getErrorMessage(error) })
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
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <LoadingScreen fullScreen={false} mensagem="Carregando configurações..." />
      </div>
    )
  }

  const logoAtual = org ? urlLogoOrganizacao(org) : null
  // Sem logo próprio, os documentos saem sem logo (a Labora usa o dela).
  const logoExibido = logoAtual || (ehOrganizacaoLabora(org?.nome) ? laboraLogoUrl : null)

  // Quem edita o quê: o dono da conta (cliente final) e o gerente editam nome,
  // logo e cores; responsáveis técnicos seguem restritos a quem é gestor.
  const papel = getPapelUsuarioLogado()
  const ehDono = !!org && org.dono_id === pb.authStore.record?.id
  const podeEditarOrg =
    ehDono || papel === 'dono' || papel === 'gerente' || papel === 'admin_plataforma'
  const gestor = isGestor()

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Dados da sua organização usados nos relatórios e nas vistorias.
        </p>
      </div>

      {!podeEditarOrg && (
        <Card className="mb-6">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Estas configurações são alteradas pelo responsável pela conta da sua empresa.
          </CardContent>
        </Card>
      )}

      {podeEditarOrg && (
        <>
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
                <Input
                  id="nome-organizacao"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
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
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4" />
                Identidade visual
              </CardTitle>
              <CardDescription>
                Logo e cores da sua empresa. Valem para todos os documentos gerados: propostas de
                orçamento, relatórios de vistoria e a marca nas fotos. Enquanto não enviar os seus,
                os documentos saem sem logo e com cores neutras.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border p-2"
                  style={{
                    backgroundImage:
                      'linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)',
                    backgroundSize: '12px 12px',
                    backgroundPosition: '0 0,0 6px,6px -6px,-6px 0',
                  }}
                  title="O quadriculado mostra as áreas transparentes do logo"
                >
                  {logoExibido ? (
                    <img
                      src={logoExibido}
                      alt="Logo da organização"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-center text-[10px] text-muted-foreground">Sem logo</span>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/png"
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
                  <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                    Somente PNG, até 3 MB. Use o arquivo com fundo transparente, para o logo ficar
                    bem sobre qualquer cor.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    id: 'cor-primaria',
                    rotulo: 'Cor principal',
                    ajuda: 'Faixas, títulos em destaque e cabeçalho das tabelas',
                    valor: corPrimaria,
                    set: setCorPrimaria,
                  },
                  {
                    id: 'cor-secundaria',
                    rotulo: 'Cor de apoio',
                    ajuda: 'Títulos e textos de destaque',
                    valor: corSecundaria,
                    set: setCorSecundaria,
                  },
                ].map((c) => (
                  <div key={c.id}>
                    <Label htmlFor={c.id} className="mb-1.5 block text-xs">
                      {c.rotulo}
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label={c.rotulo}
                        value={hexValido(c.valor) ? c.valor : '#000000'}
                        onChange={(e) => c.set(e.target.value.toUpperCase())}
                        className="h-10 w-12 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
                      />
                      <Input
                        id={c.id}
                        value={c.valor}
                        onChange={(e) => c.set(e.target.value.trim())}
                        maxLength={7}
                        className="font-mono uppercase"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{c.ajuda}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-xl border">
                <div
                  className="h-2"
                  style={{
                    background: hexValido(corPrimaria) ? corPrimaria : coresPadrao().primaria,
                  }}
                />
                <div className="flex items-center gap-3 p-3">
                  {logoExibido && (
                    <img
                      src={logoExibido}
                      alt=""
                      className="h-8 w-auto max-w-[96px] object-contain"
                    />
                  )}
                  <div className="min-w-0">
                    <div
                      className="truncate text-sm font-bold"
                      style={{
                        color: hexValido(corSecundaria) ? corSecundaria : coresPadrao().secundaria,
                      }}
                    >
                      Proposta comercial
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Prévia de como os documentos saem
                    </div>
                  </div>
                  <span
                    className="ml-auto rounded px-2 py-1 text-xs font-semibold text-white"
                    style={{
                      background: hexValido(corPrimaria) ? corPrimaria : coresPadrao().primaria,
                    }}
                  >
                    VALOR TOTAL
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                {gestor ? (
                  <Link
                    to="/orcamentos/modelos"
                    className="text-sm text-primary underline-offset-2 hover:underline"
                  >
                    Escolher e editar os modelos de proposta
                  </Link>
                ) : (
                  <span />
                )}
                <Button onClick={handleSalvarCores} disabled={salvandoCores || !coresMudaram}>
                  {salvandoCores ? 'Salvando...' : 'Salvar cores'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Dados da empresa nos documentos
              </CardTitle>
              <CardDescription>
                Saem no rodapé do relatório de vistoria e nas propostas (contato, CNPJ e dados para
                pagamento). No modelo de proposta dá para trocar algum deles, se precisar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="doc-razao" className="mb-1.5 block text-xs">
                    Razão social
                  </Label>
                  <Input
                    id="doc-razao"
                    value={dadosDoc.razao_social || ''}
                    onChange={(e) => campoDoc('razao_social', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="doc-cnpj" className="mb-1.5 block text-xs">
                    CNPJ
                  </Label>
                  <Input
                    id="doc-cnpj"
                    value={dadosDoc.cnpj || ''}
                    onChange={(e) => campoDoc('cnpj', formatarCnpj(e.target.value))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="doc-telefone" className="mb-1.5 block text-xs">
                    Telefone
                  </Label>
                  <Input
                    id="doc-telefone"
                    value={dadosDoc.telefone || ''}
                    onChange={(e) => campoDoc('telefone', e.target.value)}
                    placeholder="(86) 99999-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="doc-email" className="mb-1.5 block text-xs">
                    E-mail
                  </Label>
                  <Input
                    id="doc-email"
                    type="email"
                    value={dadosDoc.email || ''}
                    onChange={(e) => campoDoc('email', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="doc-site" className="mb-1.5 block text-xs">
                    Site (opcional)
                  </Label>
                  <Input
                    id="doc-site"
                    value={dadosDoc.site || ''}
                    onChange={(e) => campoDoc('site', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="doc-endereco" className="mb-1.5 block text-xs">
                    Endereço
                  </Label>
                  <Input
                    id="doc-endereco"
                    value={dadosDoc.endereco || ''}
                    onChange={(e) => campoDoc('endereco', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="doc-cidade" className="mb-1.5 block text-xs">
                    Cidade de emissão
                  </Label>
                  <Input
                    id="doc-cidade"
                    value={dadosDoc.cidade_emissao || ''}
                    onChange={(e) => campoDoc('cidade_emissao', e.target.value)}
                    placeholder="Ex.: Teresina - PI"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold text-muted-foreground">
                  Dados para pagamento (saem na proposta)
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="doc-pix" className="mb-1.5 block text-xs">
                      Chave PIX
                    </Label>
                    <Input
                      id="doc-pix"
                      value={dadosDoc.banco?.pix || ''}
                      onChange={(e) => campoBanco('pix', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="doc-banco" className="mb-1.5 block text-xs">
                      Banco
                    </Label>
                    <Input
                      id="doc-banco"
                      value={dadosDoc.banco?.instituicao || ''}
                      onChange={(e) => campoBanco('instituicao', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="doc-favorecido" className="mb-1.5 block text-xs">
                      Favorecido
                    </Label>
                    <Input
                      id="doc-favorecido"
                      value={dadosDoc.banco?.favorecido || ''}
                      onChange={(e) => campoBanco('favorecido', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="doc-agencia" className="mb-1.5 block text-xs">
                      Agência
                    </Label>
                    <Input
                      id="doc-agencia"
                      value={dadosDoc.banco?.agencia || ''}
                      onChange={(e) => campoBanco('agencia', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="doc-conta" className="mb-1.5 block text-xs">
                      Conta
                    </Label>
                    <Input
                      id="doc-conta"
                      value={dadosDoc.banco?.conta || ''}
                      onChange={(e) => campoBanco('conta', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSalvarDados} disabled={salvandoDados}>
                  {salvandoDados ? 'Salvando...' : 'Salvar dados'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {gestor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCog className="h-4 w-4" />
              Responsáveis técnicos
            </CardTitle>
            <CardDescription>
              Quem pode assinar os relatórios de vistoria. O marcado como padrão é sugerido ao
              finalizar uma vistoria; dá para escolher outro ou adicionar um novo na hora. Com a
              assinatura digitalizada, ela entra no PDF acima do nome.
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
                    <div className="flex flex-wrap items-center gap-1">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        id={`assinatura-${rt.id}`}
                        className="hidden"
                        onChange={(e) => {
                          handleAssinatura(rt.id, e.target.files)
                          e.target.value = ''
                        }}
                      />
                      {rt.assinatura && tokenArquivos && (
                        <img
                          src={urlAssinaturaRT(rt, tokenArquivos)}
                          alt={`Assinatura de ${rt.nome}`}
                          className="h-7 max-w-[90px] rounded border bg-white object-contain"
                        />
                      )}
                      <label
                        htmlFor={`assinatura-${rt.id}`}
                        className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs hover:bg-accent"
                      >
                        <PenLine className="h-3.5 w-3.5" />
                        {enviandoAssinatura === rt.id
                          ? 'Enviando...'
                          : rt.assinatura
                            ? 'Trocar assinatura'
                            : 'Enviar assinatura'}
                      </label>
                      {rt.assinatura && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground"
                          onClick={() => handleRemoverAssinatura(rt.id)}
                        >
                          Tirar assinatura
                        </Button>
                      )}
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
      )}
    </div>
  )
}
