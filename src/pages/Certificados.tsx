/* Certificados em massa — gera um certificado de treinamento em PDF (frente e
 * conteúdo programático) para cada colaborador da lista. Nada é gravado no
 * servidor: os PDFs são montados no navegador e baixados. */
import { useRef, useState } from 'react'
import { Award, Eye, FileDown, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  baixarBlob,
  montarZip,
  sanitizarNomeArquivo,
  type ArquivoGerado,
} from '@/lib/certificados/arquivos'
import {
  MODELOS_NR,
  ORDEM_NR,
  formatarCpf,
  interpretarLista,
  validarLote,
  type Colaborador,
  type DadosLote,
  type Instrutor,
  type NrId,
} from '@/lib/certificados/modelos'
import {
  carregarMarca,
  gerarCertificadoPdf,
  nomeArquivoCertificado,
} from '@/lib/certificados/pdfCertificado'

interface LinhaColaborador extends Colaborador {
  id: number
}

const INSTRUTOR_VAZIO: Instrutor = { nome: '', qualificacao1: '', qualificacao2: '' }

function hojeLocalISO(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export default function Certificados() {
  const [nr, setNr] = useState<NrId>('01')
  const [empresa, setEmpresa] = useState('')
  const [endereco, setEndereco] = useState('')
  const [data, setData] = useState(hojeLocalISO())
  const [carga, setCarga] = useState(MODELOS_NR['01'].cargaHoraria)
  const [extra, setExtra] = useState('')
  const [texto, setTexto] = useState(MODELOS_NR['01'].texto)
  const [conteudo, setConteudo] = useState(MODELOS_NR['01'].conteudo)
  const [instrutores, setInstrutores] = useState<Instrutor[]>([
    { ...INSTRUTOR_VAZIO },
    { ...INSTRUTOR_VAZIO },
  ])
  const [linhas, setLinhas] = useState<LinhaColaborador[]>([])
  const [lista, setLista] = useState('')
  const [erros, setErros] = useState<string[]>([])
  const [ocupado, setOcupado] = useState<'previa' | 'gerar' | null>(null)
  const [progresso, setProgresso] = useState<{ atual: number; total: number } | null>(null)
  const proximoId = useRef(1)

  const modelo = MODELOS_NR[nr]

  const trocarNr = (novo: NrId) => {
    const m = MODELOS_NR[novo]
    setNr(novo)
    setTexto(m.texto)
    setConteudo(m.conteudo)
    setCarga(m.cargaHoraria)
    setExtra('')
    setErros([])
  }

  const montarLote = (): DadosLote => ({
    nr,
    empresa,
    endereco,
    data,
    cargaHoraria: carga,
    extra,
    texto,
    conteudo,
    instrutores,
  })

  const atualizarInstrutor = (indice: number, campo: keyof Instrutor, valor: string) =>
    setInstrutores((atual) => atual.map((i, k) => (k === indice ? { ...i, [campo]: valor } : i)))

  const novaLinha = (c: Colaborador): LinhaColaborador => ({ ...c, id: proximoId.current++ })

  const adicionarLista = () => {
    const novos = interpretarLista(lista)
    if (!novos.length) {
      toast.error('Cole uma pessoa por linha: nome e CPF separados por tab, ";" ou vírgula.')
      return
    }
    setLinhas((atual) => [...atual, ...novos.map(novaLinha)])
    setLista('')
    setErros([])
    toast.success(`${novos.length} colaborador(es) adicionado(s).`)
  }

  const atualizarLinha = (id: number, campo: keyof Colaborador, valor: string) =>
    setLinhas((atual) => atual.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)))

  const previa = async () => {
    const primeiro = linhas[0]
    const exemplo: Colaborador = {
      nome: primeiro?.nome?.trim() || 'Nome do Colaborador',
      cpf: primeiro?.cpf?.trim() || '000.000.000-00',
    }
    const lote = montarLote()
    // A prévia só exige os dados do treinamento e do instrutor; não bloqueia se a lista estiver vazia
    const faltas = validarLote(lote, [{ nome: 'x', cpf: '529.982.247-25' }])
    if (faltas.length) {
      setErros(faltas)
      toast.error('Preencha os campos obrigatórios antes de pré-visualizar.')
      return
    }
    setErros([])
    setOcupado('previa')
    try {
      const blob = gerarCertificadoPdf(lote, exemplo, await carregarMarca())
      const url = URL.createObjectURL(blob)
      const aba = window.open(url, '_blank')
      if (!aba || aba.closed || typeof aba.closed === 'undefined') {
        // O navegador bloqueou a nova aba: baixa o arquivo
        baixarBlob(blob, nomeArquivoCertificado(nr, exemplo))
      }
      setTimeout(() => URL.revokeObjectURL(url), 120000)
    } catch (e) {
      toast.error(`Erro ao gerar a prévia: ${(e as Error).message}`)
    } finally {
      setOcupado(null)
    }
  }

  const gerar = async () => {
    const lote = montarLote()
    const colaboradores = linhas.map(({ nome, cpf }) => ({ nome, cpf: formatarCpf(cpf) }))
    const faltas = validarLote(lote, colaboradores)
    if (faltas.length) {
      setErros(faltas)
      return
    }
    setErros([])
    setOcupado('gerar')
    try {
      const marca = await carregarMarca()
      const arquivos: ArquivoGerado[] = []
      for (let i = 0; i < colaboradores.length; i++) {
        setProgresso({ atual: i + 1, total: colaboradores.length })
        arquivos.push({
          nome: nomeArquivoCertificado(nr, colaboradores[i]),
          blob: gerarCertificadoPdf(lote, colaboradores[i], marca),
        })
        // devolve o controle ao navegador para o contador aparecer
        await new Promise((r) => setTimeout(r, 0))
      }
      if (arquivos.length === 1) {
        baixarBlob(arquivos[0].blob, arquivos[0].nome)
      } else {
        const base = sanitizarNomeArquivo(`Certificados_NR${nr}_${empresa}`)
        baixarBlob(await montarZip(arquivos), `${base}.zip`)
      }
      toast.success(`${arquivos.length} certificado(s) gerado(s).`)
    } catch (e) {
      toast.error(`Erro ao gerar os certificados: ${(e as Error).message}`)
    } finally {
      setOcupado(null)
      setProgresso(null)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-4 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Certificados em massa</h1>
        <p className="text-sm text-muted-foreground">
          Gere um certificado em PDF (frente e conteúdo programático) para cada colaborador do
          treinamento.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">1. Treinamento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Norma Regulamentadora</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={nr} onValueChange={(v) => trocarNr(v as NrId)}>
                <SelectTrigger className="w-full md:w-[420px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDEM_NR.map((id) => (
                    <SelectItem key={id} value={id}>
                      {MODELOS_NR[id].rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {modelo.rascunho && (
                <Badge variant="outline" className="border-amber-400 text-amber-700">
                  Rascunho: revisar o conteúdo
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="cert-empresa">Empresa (onde o curso foi realizado)</Label>
            <Input
              id="cert-empresa"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Nome da empresa"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="cert-endereco">Endereço da empresa (opcional)</Label>
            <Input
              id="cert-endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Ex.: Rua das Flores, 123, Centro - Teresina/PI"
            />
            <p className="text-xs text-muted-foreground">
              Se preenchido, será inserido no certificado: &quot;no endereço: {endereco || '...'}
              &quot; logo após o nome da empresa.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cert-data">Data do curso</Label>
            <Input
              id="cert-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cert-carga">Carga horária (horas)</Label>
            <Input
              id="cert-carga"
              value={carga}
              onChange={(e) => setCarga(e.target.value)}
              placeholder="Ex.: 04"
            />
          </div>
          {modelo.campoExtra && (
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="cert-extra">{modelo.campoExtra.rotulo}</Label>
              <Input
                id="cert-extra"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder={modelo.campoExtra.exemplo}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">2. Instrutores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {instrutores.map((ins, i) => (
            <div key={i} className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>{i === 0 ? 'Instrutor 1' : 'Instrutor 2 (opcional)'}</Label>
                <Input
                  value={ins.nome}
                  onChange={(e) => atualizarInstrutor(i, 'nome', e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Qualificação (linha 1)</Label>
                <Input
                  value={ins.qualificacao1}
                  onChange={(e) => atualizarInstrutor(i, 'qualificacao1', e.target.value)}
                  placeholder="Ex.: Engenheiro de Segurança do Trabalho"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Qualificação (linha 2)</Label>
                <Input
                  value={ins.qualificacao2}
                  onChange={(e) => atualizarInstrutor(i, 'qualificacao2', e.target.value)}
                  placeholder="Ex.: CREA-PI nº ..."
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">3. Colaboradores ({linhas.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cert-lista">Colar lista (uma pessoa por linha: nome e CPF)</Label>
            <Textarea
              id="cert-lista"
              value={lista}
              onChange={(e) => setLista(e.target.value)}
              rows={4}
              placeholder={'Maria da Silva;123.456.789-09\nJoão Souza;98765432100'}
            />
            <p className="text-xs text-muted-foreground">
              Serve copiar duas colunas do Excel (nome e CPF) e colar aqui.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={adicionarLista}
              disabled={!lista.trim()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar à lista
            </Button>
          </div>

          {linhas.length > 0 && (
            <div className="space-y-2">
              {linhas.map((l, i) => (
                <div
                  key={l.id}
                  className="grid grid-cols-[2rem_1fr_11rem_2.25rem] items-center gap-2"
                >
                  <span className="text-xs text-muted-foreground">{i + 1}</span>
                  <Input
                    value={l.nome}
                    onChange={(e) => atualizarLinha(l.id, 'nome', e.target.value)}
                    aria-label={`Nome do colaborador ${i + 1}`}
                  />
                  <Input
                    value={l.cpf}
                    onChange={(e) => atualizarLinha(l.id, 'cpf', e.target.value)}
                    onBlur={(e) => atualizarLinha(l.id, 'cpf', formatarCpf(e.target.value))}
                    aria-label={`CPF do colaborador ${i + 1}`}
                    placeholder="000.000.000-00"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() => setLinhas((atual) => atual.filter((x) => x.id !== l.id))}
                    aria-label={`Remover colaborador ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLinhas((atual) => [...atual, novaLinha({ nome: '', cpf: '' })])}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar linha
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setLinhas([])}>
                  Limpar lista
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">4. Texto do certificado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="cert-texto">Texto da frente</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTexto(modelo.texto)}
              >
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                Restaurar padrão
              </Button>
            </div>
            <Textarea
              id="cert-texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Variáveis: {'{NOME}'} {'{CPF}'} {'{EMPRESA}'} {'{ENDERECO}'} {'{DATA}'} {'{CARGA}'}
              {modelo.campoExtra ? ' {EXTRA}' : ''}. Elas são trocadas pelos dados de cada
              colaborador.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="cert-conteudo">Conteúdo programático (verso)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConteudo(modelo.conteudo)}
              >
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                Restaurar padrão
              </Button>
            </div>
            <Textarea
              id="cert-conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={10}
            />
            <p className="text-xs text-muted-foreground">
              Uma linha por tópico. Linhas como &quot;a) ...&quot; ou &quot;I. ...&quot; saem sem
              marcador; comece a linha com ~ para texto corrido sem marcador.
            </p>
          </div>
        </CardContent>
      </Card>

      {erros.length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <p className="mb-1 font-medium">Antes de gerar, corrija:</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {erros.map((e, i) => (
              <li key={`${i}-${e}`}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pb-6">
        <Button
          type="button"
          variant="outline"
          onClick={previa}
          disabled={ocupado !== null}
          className="h-10"
        >
          {ocupado === 'previa' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          Pré-visualizar {linhas.length ? 'o 1º colaborador' : '(com dados de exemplo)'}
        </Button>
        <Button type="button" onClick={gerar} disabled={ocupado !== null} className="h-10">
          {ocupado === 'gerar' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : linhas.length > 1 ? (
            <FileDown className="mr-2 h-4 w-4" />
          ) : (
            <Award className="mr-2 h-4 w-4" />
          )}
          {linhas.length > 1 ? `Gerar ${linhas.length} certificados (ZIP)` : 'Gerar certificado'}
        </Button>
        {progresso && (
          <span className="text-sm text-muted-foreground">
            Gerando {progresso.atual} de {progresso.total}...
          </span>
        )}
      </div>
    </div>
  )
}
