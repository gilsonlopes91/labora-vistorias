/* Formulário de campo preenchido dentro da vistoria. O preenchimento só existe
   dentro de uma vistoria (a biblioteca de formulários só mostra o modelo).
   - Salva sozinho enquanto o técnico digita (rascunho), e tem os botões
     "Salvar rascunho" e "Concluir formulário" no fim — concluir exige os
     obrigatórios.
   - Sem internet, tudo (dados, fotos e assinatura) fica guardado neste aparelho
     e sobe sozinho quando a conexão volta (filaOffline.ts e
     sincronizarFormularios.ts).
   - Fotos: "Tirar foto" abre a câmera do celular; "Galeria" escolhe arquivos.
     Toda foto recebe a marca d'água (data/hora, coordenada e logo).
   - Assinatura: desenhada e gravada como anexo.
   - Vistoria concluída ou em revisão: abre só para leitura. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Camera,
  Check,
  CloudOff,
  ImagePlus,
  PenTool,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { isErroTemporario } from '@/lib/errosConexao'
import { aplicarMarcaDagua } from '@/lib/marcaDagua'
import {
  alterarFormularioPendente,
  chaveFormulario,
  lerFormularioPendente,
  salvarFormularioPendente,
  type PendenciaFormulario,
} from '@/lib/filaOffline'
import { enviarFormularioPendente, substituirNomes } from '@/lib/sincronizarFormularios'
import {
  calcularCampo,
  campoVisivel,
  listaArquivos,
  normalizarInstancias,
  obrigatoriosPendentes,
} from '@/lib/formularioCampos'
import ResultadoTecnicoView, { resumoCalculosTecnicos } from '@/components/ResultadoTecnico'
import type { CampoFormulario, ModeloFormulario } from '@/services/formularios'
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
  organizacaoId: string
  /** Vistoria concluída ou aguardando revisão: só leitura. */
  somenteLeitura?: boolean
  /** Fotos com coordenada na marca d'água (opção da vistoria). */
  georreferenciar?: boolean
  logoUrl?: string
  /** Chamado a cada gravação no servidor (rascunho automático, foto, assinatura). */
  onAlterado?: (registro: Formulario) => void
  /** Chamado quando o técnico conclui o formulário. Sem internet o registro
   *  vem null: o formulário ficou guardado no aparelho. */
  onConcluido?: (registro: Formulario | null) => void
  /** Chamado quando a fila do aparelho muda (guardou ou enviou algo). */
  onPendenciaChange?: () => void
}

type EstadoGravacao = 'salvo' | 'pendente' | 'salvando' | 'local' | 'erro'
type StatusForm = 'rascunho' | 'concluido'

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
  organizacaoId,
  somenteLeitura,
  georreferenciar,
  logoUrl,
  onAlterado,
  onConcluido,
  onPendenciaChange,
}: FormularioPreenchivelProps) {
  // Registro já existente abre com os campos que o modelo tinha quando foi
  // preenchido (cópia guardada no registro), mesmo que o modelo tenha mudado.
  const campos: CampoFormulario[] =
    Array.isArray(registroExistente?.campos_snapshot) && registroExistente.campos_snapshot.length
      ? registroExistente.campos_snapshot
      : modelo.campos

  const [dados, setDados] = useState<Record<string, unknown>>(registroExistente?.dados || {})
  const dadosRef = useRef<Record<string, unknown>>(registroExistente?.dados || {})
  // Conta as alterações: se mudar durante um envio, grava de novo depois.
  const versaoRef = useRef(0)
  const [registro, setRegistro] = useState<Formulario | null>(registroExistente || null)
  const registroRef = useRef<Formulario | null>(registroExistente || null)
  const clientUuid = useRef(crypto.randomUUID())

  // O que está guardado neste aparelho (sem internet) e as miniaturas das
  // fotos que ainda não subiram.
  const pendenteRef = useRef<PendenciaFormulario | null>(null)
  const urlsLocais = useRef(new Map<string, string>())
  const [pronto, setPronto] = useState(false)

  const [estado, setEstado] = useState<EstadoGravacao>('salvo')
  const [mensagemErro, setMensagemErro] = useState('')
  const [ultimoSalvo, setUltimoSalvo] = useState<Date | null>(null)
  const [concluindo, setConcluindo] = useState(false)
  const [enviandoArquivo, setEnviandoArquivo] = useState<string | null>(null)
  const [token, setToken] = useState('')

  // Uma operação por vez: evita criar o registro duas vezes e gravar dados
  // fora de ordem.
  const filaRef = useRef<Promise<unknown>>(Promise.resolve())
  const timerRef = useRef<number | null>(null)
  const alteradoRef = useRef(onAlterado)
  alteradoRef.current = onAlterado
  const pendenciaRef = useRef(onPendenciaChange)
  pendenciaRef.current = onPendenciaChange

  const renovarToken = useCallback(() => {
    getTokenArquivos()
      .then(setToken)
      .catch(() => {})
  }, [])

  useEffect(() => {
    renovarToken()
  }, [renovarToken])

  // Abre já com o que ficou guardado neste aparelho, que é mais novo que o servidor.
  useEffect(() => {
    let ativo = true
    const urls = urlsLocais.current
    lerFormularioPendente(vistoriaId, modelo.id)
      .then((p) => {
        if (!ativo || !p) return
        pendenteRef.current = p
        clientUuid.current = p.client_uuid
        dadosRef.current = p.dados
        setDados(p.dados)
        for (const a of p.arquivos) {
          urls.set(`local:${a.id}`, URL.createObjectURL(a.arquivo))
        }
        setEstado('local')
      })
      .catch(() => {})
      .finally(() => {
        if (ativo) setPronto(true)
      })
    return () => {
      ativo = false
      urls.forEach((u) => URL.revokeObjectURL(u))
      urls.clear()
    }
  }, [vistoriaId, modelo.id])

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
    const criado = await createFormulario({
      organizacao_id: organizacaoId,
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

  // Situação do formulário: concluído só enquanto os obrigatórios estiverem preenchidos.
  const statusAtual = (): StatusForm => {
    const base = pendenteRef.current?.status ?? registroRef.current?.status
    return base === 'concluido' && obrigatoriosPendentes(campos, dadosRef.current).length === 0
      ? 'concluido'
      : 'rascunho'
  }

  // ---------- Guardar neste aparelho e enviar ----------

  const guardarLocal = async (status: StatusForm, mutar?: (p: PendenciaFormulario) => void) => {
    const base = pendenteRef.current
    const nova: PendenciaFormulario = {
      chave: chaveFormulario(vistoriaId, modelo.id),
      vistoria_id: vistoriaId,
      modelo_formulario_id: modelo.id,
      organizacao_id: organizacaoId,
      registro_id: registroRef.current?.id || base?.registro_id,
      client_uuid: base?.client_uuid || clientUuid.current,
      dados: resumoCalculosTecnicos(campos, dadosRef.current),
      status,
      arquivos: [...(base?.arquivos || [])],
      anexos_remover: [...(base?.anexos_remover || [])],
      criado_em: base?.criado_em || Date.now(),
      atualizado_em: Date.now(),
    }
    mutar?.(nova)
    await salvarFormularioPendente(nova)
    pendenteRef.current = nova
    pendenciaRef.current?.()
    return nova
  }

  // Envia o que está guardado. Devolve o registro gravado, ou null se não há
  // nada guardado ou não há internet.
  const tentarEnviar = async (): Promise<Formulario | null> => {
    const p = pendenteRef.current
    if (!p || !navigator.onLine) return null
    const versaoAntes = versaoRef.current
    try {
      const { registro: salvo, nomes } = await enviarFormularioPendente(p)
      pendenteRef.current = null
      urlsLocais.current.forEach((u) => URL.revokeObjectURL(u))
      urlsLocais.current.clear()
      const trocados = substituirNomes(dadosRef.current, nomes)
      dadosRef.current = trocados
      setDados(trocados)
      definirRegistro(salvo)
      pendenciaRef.current?.()
      renovarToken()
      // Digitou durante o envio: grava de novo.
      if (versaoRef.current !== versaoAntes) agendarGravacao()
      return salvo
    } catch (error) {
      if (!isErroTemporario(error)) {
        const msg = getErrorMessage(error)
        await alterarFormularioPendente(p.chave, (atual) =>
          atual ? { ...atual, erro: msg } : undefined,
        ).catch(() => {})
        pendenciaRef.current?.()
      }
      throw error
    }
  }

  const gravar = (statusDesejado?: StatusForm) =>
    enfileirar(async (): Promise<{ registro: Formulario | null }> => {
      setEstado('salvando')
      setMensagemErro('')
      try {
        const status = statusDesejado ?? statusAtual()
        const dadosFinal = resumoCalculosTecnicos(campos, dadosRef.current)

        // Com internet e nada guardado no aparelho, grava direto no servidor.
        if (navigator.onLine && !pendenteRef.current) {
          try {
            const reg = await garantirRegistro()
            const salvo = await updateFormulario(reg.id, { dados: dadosFinal, status })
            definirRegistro(salvo)
            setEstado('salvo')
            setUltimoSalvo(new Date())
            return { registro: salvo }
          } catch (error) {
            if (!isErroTemporario(error)) throw error
            // sem conexão de verdade: segue para o aparelho
          }
        }

        await guardarLocal(status)
        if (navigator.onLine) {
          try {
            const enviado = await tentarEnviar()
            if (enviado) {
              setEstado('salvo')
              setUltimoSalvo(new Date())
              return { registro: enviado }
            }
          } catch (error) {
            if (!isErroTemporario(error)) throw error
          }
        }
        setEstado('local')
        return { registro: null }
      } catch (error) {
        setEstado('erro')
        setMensagemErro(getErrorMessage(error))
        throw error
      }
    })

  const gravarRef = useRef(gravar)
  gravarRef.current = gravar

  const agendarGravacao = () => {
    if (somenteLeitura) return
    setEstado('pendente')
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      gravarRef.current().catch(() => {})
    }, 1200)
  }

  // Muda os dados e agenda a gravação automática.
  const atualizarDados = (novos: Record<string, unknown>) => {
    dadosRef.current = novos
    versaoRef.current += 1
    setDados(novos)
    agendarGravacao()
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

  const limparTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const salvarRascunho = async () => {
    limparTimer()
    try {
      const r = await gravar()
      if (r.registro) toast.success('Rascunho salvo')
      else
        toast.info('Rascunho guardado neste aparelho', {
          description: 'Será enviado sozinho quando a internet voltar.',
        })
    } catch (error) {
      toast.error('Não foi possível salvar o formulário', { description: getErrorMessage(error) })
    }
  }

  const concluir = async () => {
    if (pendentes.length > 0) {
      toast.error('Falta preencher para concluir', { description: pendentes.join('; ') })
      return
    }
    limparTimer()
    setConcluindo(true)
    try {
      const r = await gravar('concluido')
      if (r.registro) toast.success('Formulário concluído')
      else
        toast.success('Formulário concluído e guardado neste aparelho', {
          description:
            'Será enviado sozinho quando a internet voltar. A vistoria só pode ser finalizada depois do envio.',
        })
      onConcluido?.(r.registro)
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
        const guardarNoAparelho = async () => {
          const novos = marcadas.map((arquivo) => ({ id: crypto.randomUUID(), arquivo }))
          for (const n of novos) {
            urlsLocais.current.set(`local:${n.id}`, URL.createObjectURL(n.arquivo))
          }
          atualizarDados({
            ...dadosRef.current,
            [campoId]: [
              ...listaArquivos(dadosRef.current[campoId]),
              ...novos.map((n) => `local:${n.id}`),
            ],
          })
          await guardarLocal(statusAtual(), (p) => {
            p.arquivos.push(...novos)
          })
          setEstado('local')
        }

        if (!navigator.onLine || pendenteRef.current) {
          await guardarNoAparelho()
          return
        }
        try {
          const reg = await garantirRegistro()
          const { registro: atualizado, novos } = await adicionarAnexos(reg, marcadas)
          definirRegistro(atualizado)
          atualizarDados({
            ...dadosRef.current,
            [campoId]: [...listaArquivos(dadosRef.current[campoId]), ...novos],
          })
        } catch (error) {
          if (!isErroTemporario(error)) throw error
          await guardarNoAparelho()
        }
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
    const restantes = listaArquivos(dadosRef.current[campoId]).filter((n) => n !== nome)
    try {
      await enfileirar(async () => {
        // Foto que ainda não subiu: só sai da fila do aparelho.
        if (nome.startsWith('local:')) {
          const url = urlsLocais.current.get(nome)
          if (url) URL.revokeObjectURL(url)
          urlsLocais.current.delete(nome)
          atualizarDados({ ...dadosRef.current, [campoId]: restantes })
          await guardarLocal(statusAtual(), (p) => {
            p.arquivos = p.arquivos.filter((a) => `local:${a.id}` !== nome)
          })
          setEstado('local')
          return
        }
        const guardarNoAparelho = async () => {
          atualizarDados({ ...dadosRef.current, [campoId]: restantes })
          await guardarLocal(statusAtual(), (p) => {
            p.anexos_remover.push(nome)
          })
          setEstado('local')
        }
        if (!navigator.onLine || pendenteRef.current) {
          await guardarNoAparelho()
          return
        }
        try {
          const reg = await garantirRegistro()
          definirRegistro(await removerAnexos(reg.id, [nome]))
          atualizarDados({ ...dadosRef.current, [campoId]: restantes })
        } catch (error) {
          if (!isErroTemporario(error)) throw error
          await guardarNoAparelho()
        }
      })
    } catch (error) {
      toast.error('Não foi possível remover a foto', { description: getErrorMessage(error) })
    }
  }

  // Grava a assinatura (ou apaga, com arquivo null), trocando a anterior.
  const definirAssinatura = async (campoId: string, arquivo: File | null) => {
    if (somenteLeitura) return
    setEnviandoArquivo(campoId)
    try {
      await enfileirar(async () => {
        const anteriores = listaArquivos(dadosRef.current[campoId])
        const locais = anteriores.filter((n) => n.startsWith('local:'))
        const remotos = anteriores.filter((n) => !n.startsWith('local:'))

        const guardarNoAparelho = async () => {
          const novo = arquivo ? { id: crypto.randomUUID(), arquivo } : null
          for (const n of locais) {
            const url = urlsLocais.current.get(n)
            if (url) URL.revokeObjectURL(url)
            urlsLocais.current.delete(n)
          }
          if (novo) urlsLocais.current.set(`local:${novo.id}`, URL.createObjectURL(novo.arquivo))
          atualizarDados({ ...dadosRef.current, [campoId]: novo ? `local:${novo.id}` : '' })
          await guardarLocal(statusAtual(), (p) => {
            p.arquivos = p.arquivos.filter((a) => !locais.includes(`local:${a.id}`))
            if (novo) p.arquivos.push(novo)
            p.anexos_remover.push(...remotos)
          })
          setEstado('local')
        }

        if (!navigator.onLine || pendenteRef.current) {
          await guardarNoAparelho()
          return
        }
        try {
          let atual = await garantirRegistro()
          let nome = ''
          if (arquivo) {
            const enviado = await adicionarAnexos(atual, [arquivo])
            atual = enviado.registro
            nome = enviado.novos[0] || ''
          }
          if (remotos.length) atual = await removerAnexos(atual.id, remotos)
          definirRegistro(atual)
          atualizarDados({ ...dadosRef.current, [campoId]: nome })
        } catch (error) {
          if (!isErroTemporario(error)) throw error
          await guardarNoAparelho()
        }
      })
      renovarToken()
    } catch (error) {
      toast.error('Não foi possível salvar a assinatura', { description: getErrorMessage(error) })
    } finally {
      setEnviandoArquivo(null)
    }
  }

  const urlArquivo = (nome: string) => {
    if (nome.startsWith('local:')) return urlsLocais.current.get(nome) || ''
    return registro && token ? urlAnexo(registro, nome, token) : ''
  }

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
                      <div className="flex h-24 w-24 items-center justify-center rounded-lg border bg-muted text-[10px] text-muted-foreground">
                        Foto enviada
                      </div>
                    )}
                    {nome.startsWith('local:') && (
                      <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-amber-100 px-1 text-[9px] font-medium text-amber-900">
                        <CloudOff className="h-2.5 w-2.5" />
                        no aparelho
                      </span>
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
                    Salvando foto...
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
                {salva.startsWith('local:') && (
                  <p className="flex items-center gap-1 text-xs text-amber-800">
                    <CloudOff className="h-3 w-3" />
                    Guardada neste aparelho, ainda não enviada.
                  </p>
                )}
                {!somenteLeitura && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => definirAssinatura(campo.id, null)}
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
                onConfirmar={(arquivo) => definirAssinatura(campo.id, arquivo)}
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
        : estado === 'local'
          ? 'Guardado neste aparelho. Será enviado quando a internet voltar.'
          : estado === 'erro'
            ? `Não foi possível salvar${mensagemErro ? `: ${mensagemErro}` : '.'}`
            : ultimoSalvo
              ? `Salvo às ${ultimoSalvo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : registro
                ? registro.status === 'concluido'
                  ? 'Formulário concluído'
                  : 'Rascunho salvo'
                : 'Ainda não salvo'

  if (!pronto) {
    return <p className="text-xs text-muted-foreground">Carregando formulário...</p>
  }

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
              'mr-auto flex items-center gap-1 text-xs ' +
              (estado === 'erro'
                ? 'text-destructive'
                : estado === 'local'
                  ? 'text-amber-800'
                  : 'text-muted-foreground')
            }
          >
            {estado === 'local' && <CloudOff className="h-3 w-3" />}
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
