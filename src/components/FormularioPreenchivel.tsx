/* Formulário de campo preenchido dentro da vistoria. O preenchimento só existe
   dentro de uma vistoria (a biblioteca de formulários só mostra o modelo).
   - Salva sozinho enquanto o técnico digita (rascunho), e tem os botões
     "Salvar rascunho" e "Concluir" no fim — concluir exige os obrigatórios.
   - Fotos: "Tirar foto" abre a câmera do celular; "Galeria" escolhe arquivos.
     Toda foto recebe a marca d'água (data/hora, coordenada e logo) e sobe na
     hora, para não se perder.
   - Assinatura: desenhada e gravada como anexo.
   - Vistoria concluída ou em revisão: abre só para leitura. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Camera, Check, ImagePlus, PenTool, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { aplicarMarcaDagua } from '@/lib/marcaDagua'
import {
  calcularCampo,
  campoVisivel,
  listaArquivos,
  normalizarInstancias,
  obrigatoriosPendentes,
} from '@/lib/formularioCampos'
import ResultadoTecnicoView, { resumoCalculosTecnicos } from '@/components/ResultadoTecnico'
import type { CampoFormulario, ModeloFormulario } from '@/services/formularios'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import { getTokenArquivos } from '@/services/respostasVistoria'
import {
  adicionarAnexos,
  createFormulario,
  removerAnexos,
  updateFormulario,
  urlAnexo,
  type Formulario,
} from '@/services/registrosFormulario'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FormularioPreenchivelProps {
  modelo: ModeloFormulario
  registroExistente?: Formulario | null
  vistoriaId: string
  /** Vistoria concluída ou aguardando revisão: só leitura. */
  somenteLeitura?: boolean
  /** Fotos com coordenada na marca d'água (opção da vistoria). */
  georreferenciar?: boolean
  logoUrl?: string
  /** Chamado a cada gravação (rascunho automático, foto, assinatura). */
  onAlterado?: (registro: Formulario) => void
  /** Chamado quando o técnico conclui o formulário. */
  onConcluido?: (registro: Formulario) => void
}

type EstadoGravacao = 'salvo' | 'pendente' | 'salvando' | 'erro'

function obterLocalizacao(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 10000 },
    )
  })
}

export default function FormularioPreenchivel({
  modelo,
  registroExistente,
  vistoriaId,
  somenteLeitura,
  georreferenciar,
  logoUrl,
  onAlterado,
  onConcluido,
}: FormularioPreenchivelProps) {
  // Registro já existente abre com os campos que o modelo tinha quando foi
  // preenchido (cópia guardada no registro), mesmo que o modelo tenha mudado.
  const campos: CampoFormulario[] =
    Array.isArray(registroExistente?.campos_snapshot) && registroExistente.campos_snapshot.length
      ? registroExistente.campos_snapshot
      : modelo.campos

  const [dados, setDados] = useState<Record<string, unknown>>(registroExistente?.dados || {})
  const dadosRef = useRef<Record<string, unknown>>(registroExistente?.dados || {})
  const [registro, setRegistro] = useState<Formulario | null>(registroExistente || null)
  const registroRef = useRef<Formulario | null>(registroExistente || null)
  const clientUuid = useRef(crypto.randomUUID())

  const [estado, setEstado] = useState<EstadoGravacao>('salvo')
  const [ultimoSalvo, setUltimoSalvo] = useState<Date | null>(null)
  const [concluindo, setConcluindo] = useState(false)
  const [enviandoArquivo, setEnviandoArquivo] = useState<string | null>(null)
  const [token, setToken] = useState('')

  // Uma operação por vez no servidor: evita criar o registro duas vezes e
  // gravar dados fora de ordem.
  const filaRef = useRef<Promise<unknown>>(Promise.resolve())
  const timerRef = useRef<number | null>(null)
  const alteradoRef = useRef(onAlterado)
  alteradoRef.current = onAlterado

  const renovarToken = useCallback(() => {
    getTokenArquivos()
      .then(setToken)
      .catch(() => {})
  }, [])

  useEffect(() => {
    renovarToken()
  }, [renovarToken])

  const enfileirar = <T,>(fn: () => Promise<T>): Promise<T> => {
    const p = filaRef.current.then(fn)
    filaRef.current = p.catch(() => {})
    return p
  }

  const definirRegistro = (r: Formulario) => {
    registroRef.current = r
    setRegistro(r)
    alteradoRef.current?.(r)
  }

  const garantirRegistro = async (): Promise<Formulario> => {
    if (registroRef.current) return registroRef.current
    const org = await getMinhaOrganizacao()
    const criado = await createFormulario({
      organizacao_id: org.id,
      modelo_formulario_id: modelo.id,
      vistoria_id: vistoriaId,
      dados: resumoCalculosTecnicos(campos, dadosRef.current),
      status: 'rascunho',
      data_campo: new Date().toISOString(),
      client_uuid: clientUuid.current,
    })
    definirRegistro(criado)
    return criado
  }

  const gravar = (statusDesejado?: 'rascunho' | 'concluido') =>
    enfileirar(async () => {
      setEstado('salvando')
      try {
        const reg = await garantirRegistro()
        const pendentes = obrigatoriosPendentes(campos, dadosRef.current)
        // Formulário concluído que perdeu um obrigatório volta a rascunho.
        const status =
          statusDesejado ??
          (reg.status === 'concluido' && pendentes.length === 0 ? 'concluido' : 'rascunho')
        const salvo = await updateFormulario(reg.id, {
          dados: resumoCalculosTecnicos(campos, dadosRef.current),
          status,
        })
        definirRegistro(salvo)
        setEstado('salvo')
        setUltimoSalvo(new Date())
        return salvo
      } catch (error) {
        setEstado('erro')
        throw error
      }
    })

  const gravarRef = useRef(gravar)
  gravarRef.current = gravar

  // Muda os dados e agenda a gravação automática.
  const atualizarDados = (novos: Record<string, unknown>) => {
    dadosRef.current = novos
    setDados(novos)
    if (somenteLeitura) return
    setEstado('pendente')
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      gravarRef.current().catch(() => {})
    }, 1200)
  }

  // Saiu da tela com alteração esperando: grava antes.
  useEffect(
    () => () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        gravarRef.current().catch(() => {})
      }
    },
    [],
  )

  const setValor = (campoId: string, valor: unknown) =>
    atualizarDados({ ...dadosRef.current, [campoId]: valor })

  const setValorRepetivel = (
    campoId: string,
    indice: number,
    subcampoId: string,
    valor: unknown,
  ) => {
    const lista = [...normalizarInstancias(dadosRef.current[campoId])]
    lista[indice] = { ...(lista[indice] || {}), [subcampoId]: valor }
    setValor(campoId, lista)
  }

  const pendentes = useMemo(() => obrigatoriosPendentes(campos, dados), [campos, dados])

  const salvarRascunho = async () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    try {
      await gravar()
      toast.success('Rascunho salvo')
    } catch (error) {
      toast.error('Não foi possível salvar o formulário', { description: getErrorMessage(error) })
    }
  }

  const concluir = async () => {
    if (pendentes.length > 0) {
      toast.error('Falta preencher para concluir', { description: pendentes.join('; ') })
      return
    }
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setConcluindo(true)
    try {
      const salvo = await gravar('concluido')
      toast.success('Formulário concluído')
      onConcluido?.(salvo)
    } catch (error) {
      toast.error('Não foi possível concluir o formulário', {
        description: getErrorMessage(error),
      })
    } finally {
      setConcluindo(false)
    }
  }

  // ---------- Fotos e assinatura (anexos) ----------

  const adicionarFotos = async (campoId: string, arquivos: File[]) => {
    if (!arquivos.length || somenteLeitura) return
    setEnviandoArquivo(campoId)
    try {
      let localizacao: { lat: number; lon: number } | undefined
      if (georreferenciar) {
        try {
          localizacao = await obterLocalizacao()
        } catch {
          toast.warning('Não foi possível obter a localização — a foto vai sem coordenada.')
        }
      }
      const agora = new Date()
      const marcadas = await Promise.all(
        arquivos.map((f) => aplicarMarcaDagua(f, { dataHora: agora, localizacao, logoUrl })),
      )
      await enfileirar(async () => {
        const reg = await garantirRegistro()
        const { registro: atualizado, novos } = await adicionarAnexos(reg, marcadas)
        definirRegistro(atualizado)
        setValor(campoId, [...listaArquivos(dadosRef.current[campoId]), ...novos])
      })
      renovarToken()
    } catch (error) {
      toast.error('Não foi possível salvar a foto', { description: getErrorMessage(error) })
    } finally {
      setEnviandoArquivo(null)
    }
  }

  const removerFoto = async (campoId: string, nome: string) => {
    if (somenteLeitura) return
    try {
      await enfileirar(async () => {
        const reg = await garantirRegistro()
        definirRegistro(await removerAnexos(reg.id, [nome]))
        setValor(
          campoId,
          listaArquivos(dadosRef.current[campoId]).filter((n) => n !== nome),
        )
      })
    } catch (error) {
      toast.error('Não foi possível remover a foto', { description: getErrorMessage(error) })
    }
  }

  const salvarAssinatura = async (campoId: string, arquivo: File) => {
    setEnviandoArquivo(campoId)
    try {
      await enfileirar(async () => {
        const reg = await garantirRegistro()
        const anterior = listaArquivos(dadosRef.current[campoId])
        const { registro: atualizado, novos } = await adicionarAnexos(reg, [arquivo])
        definirRegistro(anterior.length ? await removerAnexos(atualizado.id, anterior) : atualizado)
        setValor(campoId, novos[0] || '')
      })
      renovarToken()
    } catch (error) {
      toast.error('Não foi possível salvar a assinatura', { description: getErrorMessage(error) })
    } finally {
      setEnviandoArquivo(null)
    }
  }

  const apagarAssinatura = async (campoId: string) => {
    const anterior = listaArquivos(dadosRef.current[campoId])
    try {
      await enfileirar(async () => {
        if (anterior.length && registroRef.current) {
          definirRegistro(await removerAnexos(registroRef.current.id, anterior))
        }
        setValor(campoId, '')
      })
    } catch (error) {
      toast.error('Não foi possível apagar a assinatura', { description: getErrorMessage(error) })
    }
  }

  const urlArquivo = (nome: string) => (registro && token ? urlAnexo(registro, nome, token) : '')

  // ---------- Campos ----------

  const rotulo = (campo: CampoFormulario) => (
    <Label>
      {campo.nome}
      {campo.unidade && campo.tipo === 'numero' ? ` (${campo.unidade})` : ''}
      {campo.obrigatorio && <span className="text-destructive"> *</span>}
    </Label>
  )

  const renderCampo = (campo: CampoFormulario) => {
    if (!campoVisivel(campo, dados)) return null
    const valor = dados[campo.id]

    switch (campo.tipo) {
      case 'secao':
        return (
          <div key={campo.id} className="border-b pb-1 pt-4 first:pt-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {campo.nome}
            </p>
          </div>
        )
      case 'texto':
        return (
          <div key={campo.id} className="space-y-1.5">
            {rotulo(campo)}
            <Input
              value={String(valor ?? '')}
              onChange={(e) => setValor(campo.id, e.target.value)}
            />
          </div>
        )
      case 'texto_longo':
        return (
          <div key={campo.id} className="space-y-1.5">
            {rotulo(campo)}
            <Textarea
              rows={3}
              value={String(valor ?? '')}
              onChange={(e) => setValor(campo.id, e.target.value)}
            />
          </div>
        )
      case 'numero':
        return (
          <div key={campo.id} className="space-y-1.5">
            {rotulo(campo)}
            <Input
              type="number"
              inputMode="decimal"
              value={String(valor ?? '')}
              onChange={(e) => setValor(campo.id, e.target.value)}
            />
          </div>
        )
      case 'sim_nao':
      case 'selecao':
        return (
          <div key={campo.id} className="space-y-1.5">
            {rotulo(campo)}
            <Select
              value={valor === undefined || valor === '' ? undefined : String(valor)}
              onValueChange={(v) => setValor(campo.id, v)}
              disabled={somenteLeitura}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {(campo.tipo === 'sim_nao' ? ['Sim', 'Não'] : campo.opcoes || []).map((opcao) => (
                  <SelectItem key={opcao} value={opcao}>
                    {opcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 'multipla': {
        const selecionadas = Array.isArray(valor)
          ? (valor as string[])
          : typeof valor === 'string' && valor
            ? (() => {
                try {
                  const p = JSON.parse(valor)
                  return Array.isArray(p) ? (p as string[]) : [valor]
                } catch {
                  return [valor]
                }
              })()
            : []
        return (
          <div key={campo.id} className="space-y-1.5">
            {rotulo(campo)}
            <div className="space-y-1">
              {(campo.opcoes || []).map((opcao) => (
                <label
                  key={opcao}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={selecionadas.includes(opcao)}
                    onChange={(e) =>
                      setValor(
                        campo.id,
                        e.target.checked
                          ? [...selecionadas, opcao]
                          : selecionadas.filter((o) => o !== opcao),
                      )
                    }
                  />
                  {opcao}
                </label>
              ))}
            </div>
          </div>
        )
      }
      case 'data':
      case 'hora':
        return (
          <div key={campo.id} className="space-y-1.5">
            {rotulo(campo)}
            <Input
              type={campo.tipo === 'data' ? 'date' : 'time'}
              value={String(valor ?? '')}
              onChange={(e) => setValor(campo.id, e.target.value)}
            />
          </div>
        )
      case 'foto': {
        const fotos = listaArquivos(valor)
        const enviando = enviandoArquivo === campo.id
        return (
          <div key={campo.id} className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              {rotulo(campo)}
            </div>
            {fotos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {fotos.map((nome) => (
                  <div key={nome} className="relative">
                    {urlArquivo(nome) ? (
                      <a href={urlArquivo(nome)} target="_blank" rel="noreferrer">
                        <img
                          src={urlArquivo(nome)}
                          alt="Foto do formulário"
                          className="h-24 w-24 rounded-lg border object-cover"
                        />
                      </a>
                    ) : (
                      <div className="h-24 w-24 rounded-lg border bg-muted" />
                    )}
                    {!somenteLeitura && (
                      <button
                        type="button"
                        onClick={() => removerFoto(campo.id, nome)}
                        className="absolute -right-2 -top-2 rounded-full border bg-background p-1 shadow"
                        aria-label="Remover foto"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!somenteLeitura && (
              <div className="flex flex-wrap gap-2">
                {/* capture abre direto a câmera traseira no celular */}
                <label className={buttonVariants({ size: 'sm' }) + ' cursor-pointer gap-1.5'}>
                  <Camera className="h-3.5 w-3.5" />
                  Tirar foto
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    disabled={enviando}
                    onChange={(e) => {
                      adicionarFotos(campo.id, Array.from(e.target.files || []))
                      e.target.value = ''
                    }}
                  />
                </label>
                <label
                  className={
                    buttonVariants({ size: 'sm', variant: 'outline' }) + ' cursor-pointer gap-1.5'
                  }
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  Galeria
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    disabled={enviando}
                    onChange={(e) => {
                      adicionarFotos(campo.id, Array.from(e.target.files || []))
                      e.target.value = ''
                    }}
                  />
                </label>
                {enviando && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Enviando foto...
                  </span>
                )}
              </div>
            )}
            {somenteLeitura && fotos.length === 0 && (
              <p className="text-xs text-muted-foreground">Sem foto.</p>
            )}
          </div>
        )
      }
      case 'assinatura': {
        const salva = listaArquivos(valor)[0]
        return (
          <div key={campo.id} className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <PenTool className="h-3.5 w-3.5" />
              {rotulo(campo)}
            </div>
            {salva ? (
              <div className="space-y-1.5">
                {urlArquivo(salva) ? (
                  <img
                    src={urlArquivo(salva)}
                    alt="Assinatura"
                    className="h-28 rounded-xl border bg-white object-contain"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">Assinatura gravada.</p>
                )}
                {!somenteLeitura && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => apagarAssinatura(campo.id)}
                  >
                    Refazer assinatura
                  </Button>
                )}
              </div>
            ) : somenteLeitura ? (
              <p className="text-xs text-muted-foreground">Sem assinatura.</p>
            ) : (
              <AssinaturaCanvas
                enviando={enviandoArquivo === campo.id}
                onConfirmar={(arquivo) => salvarAssinatura(campo.id, arquivo)}
              />
            )}
          </div>
        )
      }
      case 'calculo':
        return (
          <div key={campo.id} className="space-y-1.5">
            <Label>{campo.nome} (automático)</Label>
            <div className="rounded-xl bg-muted px-3 py-2 text-lg font-semibold">
              {calcularCampo(campo, dados) || '—'}
            </div>
          </div>
        )
      case 'calculo_tecnico':
        return <ResultadoTecnicoView key={campo.id} campo={campo} dados={dados} />
      case 'repetivel': {
        const instancias = normalizarInstancias(valor)
        return (
          <div key={campo.id} className="space-y-2">
            <div className="flex items-center justify-between">
              {rotulo(campo)}
              {!somenteLeitura && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setValor(campo.id, [...instancias, {}])}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Adicionar
                </Button>
              )}
            </div>
            {instancias.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {somenteLeitura
                  ? 'Nenhum registro.'
                  : 'Nenhum registro — toque em "Adicionar" para criar o primeiro.'}
              </p>
            )}
            {instancias.map((item, indice) => (
              <Card key={indice} className="rounded-xl border bg-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="secondary">
                    {campo.nome} {indice + 1}
                  </Badge>
                  {!somenteLeitura && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() =>
                        setValor(
                          campo.id,
                          instancias.filter((_, i) => i !== indice),
                        )
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {(campo.subcampos || []).map((sub) => {
                    const valorSub = item[sub.id]
                    return (
                      <div key={sub.id} className="space-y-1">
                        <Label className="text-xs">
                          {sub.nome}
                          {sub.unidade ? ` (${sub.unidade})` : ''}
                        </Label>
                        {sub.tipo === 'sim_nao' || sub.tipo === 'selecao' ? (
                          <Select
                            value={valorSub === undefined ? undefined : String(valorSub)}
                            onValueChange={(v) => setValorRepetivel(campo.id, indice, sub.id, v)}
                            disabled={somenteLeitura}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              {(sub.tipo === 'sim_nao' ? ['Sim', 'Não'] : sub.opcoes || []).map(
                                (opcao) => (
                                  <SelectItem key={opcao} value={opcao}>
                                    {opcao}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={sub.tipo === 'numero' ? 'number' : 'text'}
                            inputMode={sub.tipo === 'numero' ? 'decimal' : undefined}
                            value={String(valorSub ?? '')}
                            onChange={(e) =>
                              setValorRepetivel(campo.id, indice, sub.id, e.target.value)
                            }
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        )
      }
      default:
        return null
    }
  }

  const textoEstado =
    estado === 'salvando'
      ? 'Salvando...'
      : estado === 'pendente'
        ? 'Alterações ainda não salvas'
        : estado === 'erro'
          ? 'Não foi possível salvar. Verifique a internet e toque em "Salvar rascunho".'
          : ultimoSalvo
            ? `Salvo às ${ultimoSalvo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
            : registro
              ? registro.status === 'concluido'
                ? 'Formulário concluído'
                : 'Rascunho salvo'
              : 'Ainda não salvo'

  return (
    <div className="space-y-3">
      {somenteLeitura ? (
        <p className="text-xs text-muted-foreground">
          Somente leitura: a vistoria está concluída ou em revisão. Para corrigir, reabra a
          vistoria.
        </p>
      ) : (
        pendentes.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Falta preencher para concluir: {pendentes.join('; ')}.
          </p>
        )
      )}
      <fieldset disabled={somenteLeitura} className="min-w-0">
        <Card className="space-y-4 rounded-2xl border-none bg-card p-5 shadow-subtle">
          {campos.map(renderCampo)}
        </Card>
      </fieldset>
      {!somenteLeitura && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span
            className={
              'mr-auto text-xs ' +
              (estado === 'erro' ? 'text-destructive' : 'text-muted-foreground')
            }
          >
            {textoEstado}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={salvarRascunho}
            disabled={estado === 'salvando' || concluindo}
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar rascunho
          </Button>
          <Button
            type="button"
            onClick={concluir}
            disabled={concluindo || !!enviandoArquivo}
            className="rounded-full"
          >
            <Check className="mr-2 h-4 w-4" />
            {concluindo ? 'Concluindo...' : 'Concluir formulário'}
          </Button>
        </div>
      )}
    </div>
  )
}

// Canvas de assinatura: desenha com o dedo ou o mouse e grava ao confirmar.
function AssinaturaCanvas({
  enviando,
  onConfirmar,
}: {
  enviando: boolean
  onConfirmar: (arquivo: File) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const desenhando = useRef(false)
  const [temTraco, setTemTraco] = useState(false)

  const ponto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const iniciar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const p = ponto(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    desenhando.current = true
  }

  const mover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!desenhando.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const p = ponto(e)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    setTemTraco(true)
  }

  const limpar = () => {
    const canvas = canvasRef.current
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    setTemTraco(false)
  }

  const confirmar = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) onConfirmar(new File([blob], `assinatura-${Date.now()}.png`, { type: 'image/png' }))
    }, 'image/png')
  }

  return (
    <div className="space-y-1.5">
      <canvas
        ref={canvasRef}
        width={500}
        height={160}
        className="w-full touch-none rounded-xl border bg-white"
        onPointerDown={iniciar}
        onPointerMove={mover}
        onPointerUp={() => (desenhando.current = false)}
        onPointerLeave={() => (desenhando.current = false)}
      />
      <div className="flex items-center gap-2">
        <p className="mr-auto text-xs text-muted-foreground">Assine com o dedo ou o mouse</p>
        {temTraco && (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={limpar}
            >
              Limpar
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs"
              disabled={enviando}
              onClick={confirmar}
            >
              {enviando ? 'Gravando...' : 'Gravar assinatura'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
