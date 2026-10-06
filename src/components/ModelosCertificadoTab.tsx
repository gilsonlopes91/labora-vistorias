/* Modelos de certificado da organização: criar, editar, duplicar e excluir.
 * Cada modelo tem nome, selo, texto da frente, carga horária sugerida, campo extra
 * opcional e conteúdo programático. O formulário de geração é o mesmo para todos. */
import { useState } from 'react'
import { Copy, Eye, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { abrirPdfEmNovaAba } from '@/lib/certificados/arquivos'
import type { DadosLote } from '@/lib/certificados/modelos'
import {
  carregarMarca,
  gerarCertificadoPdf,
  nomeArquivoCertificado,
} from '@/lib/certificados/pdfCertificado'
import { isAdmin } from '@/services/equipe'
import {
  atualizarModeloCertificado,
  criarModeloCertificado,
  duplicarModeloCertificado,
  ehModeloBase,
  excluirModeloCertificado,
  type ModeloCertificado,
} from '@/services/modelosCertificado'

interface Props {
  modelos: ModeloCertificado[]
  /** Chamado depois de criar, editar, duplicar ou excluir, para recarregar a lista. */
  onMudou: () => void
}

interface Rascunho {
  id: string | null
  nome: string
  selo: string
  texto: string
  carga_horaria: string
  campo_extra_rotulo: string
  campo_extra_exemplo: string
  conteudo: string
  rascunho: boolean
}

const TEXTO_NOVO =
  'Certificamos que {NOME}, portador do CPF {CPF}, concluiu com aproveitamento satisfatório o curso de NOME DO CURSO, promovido nas dependências da empresa {EMPRESA} no dia {DATA}, com carga horária de {CARGA}.'

const MODELO_VAZIO: Rascunho = {
  id: null,
  nome: '',
  selo: '',
  texto: TEXTO_NOVO,
  carga_horaria: '',
  campo_extra_rotulo: '',
  campo_extra_exemplo: '',
  conteudo: '',
  rascunho: false,
}

const doModelo = (m: ModeloCertificado): Rascunho => ({
  id: m.id,
  nome: m.nome,
  selo: m.selo || '',
  texto: m.texto,
  carga_horaria: m.carga_horaria || '',
  campo_extra_rotulo: m.campo_extra_rotulo || '',
  campo_extra_exemplo: m.campo_extra_exemplo || '',
  conteudo: m.conteudo,
  rascunho: Boolean(m.rascunho),
})

function hojeISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ModelosCertificadoTab({ modelos, onMudou }: Props) {
  const [editando, setEditando] = useState<Rascunho | null>(null)
  const [excluindo, setExcluindo] = useState<ModeloCertificado | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const admin = isAdmin()

  const podeEditar = (m: ModeloCertificado) => !ehModeloBase(m) || admin

  const duplicar = async (m: ModeloCertificado) => {
    setOcupado(m.id)
    try {
      await duplicarModeloCertificado(m)
      toast.success('Cópia criada. Edite para ajustar o conteúdo.')
      onMudou()
    } catch (e) {
      toast.error(`Não foi possível duplicar: ${(e as Error).message}`)
    } finally {
      setOcupado(null)
    }
  }

  const excluir = async () => {
    if (!excluindo) return
    const alvo = excluindo
    setOcupado(alvo.id)
    try {
      await excluirModeloCertificado(alvo.id)
      toast.success('Modelo excluído.')
      setExcluindo(null)
      onMudou()
    } catch (e) {
      toast.error(`Não foi possível excluir: ${(e as Error).message}`)
    } finally {
      setOcupado(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Crie modelos para qualquer curso, de NR ou não. O modelo guarda o texto, o selo e o
          conteúdo programático; os dados do treinamento (empresa, data, carga horária, instrutores
          e colaboradores) continuam sendo preenchidos na hora de gerar.
        </p>
        <Button type="button" onClick={() => setEditando({ ...MODELO_VAZIO })}>
          <Plus className="mr-2 h-4 w-4" />
          Novo modelo
        </Button>
      </div>

      <div className="space-y-2">
        {modelos.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{m.nome}</span>
                  {m.selo && <Badge variant="secondary">{m.selo}</Badge>}
                  {ehModeloBase(m) ? (
                    <Badge variant="outline">Padrão da plataforma</Badge>
                  ) : (
                    <Badge>Da sua organização</Badge>
                  )}
                  {m.rascunho && (
                    <Badge variant="outline" className="border-amber-400 text-amber-700">
                      Rascunho
                    </Badge>
                  )}
                </div>
                <p className="line-clamp-1 text-xs text-muted-foreground">{m.texto}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {podeEditar(m) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditando(doModelo(m))}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Editar
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={ocupado === m.id}
                  onClick={() => duplicar(m)}
                >
                  {ocupado === m.id ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Copy className="mr-2 h-3.5 w-3.5" />
                  )}
                  Duplicar
                </Button>
                {podeEditar(m) && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setExcluindo(m)}
                    aria-label={`Excluir ${m.nome}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {modelos.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhum modelo ainda. Crie o primeiro em &quot;Novo modelo&quot;.
          </p>
        )}
      </div>

      {editando && (
        <EditorModelo
          inicial={editando}
          onFechar={() => setEditando(null)}
          onSalvo={() => {
            setEditando(null)
            onMudou()
          }}
        />
      )}

      <AlertDialog open={Boolean(excluindo)} onOpenChange={(o) => !o && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{excluindo?.nome}&quot; será removido. Certificados já gerados não são afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EditorModelo({
  inicial,
  onFechar,
  onSalvo,
}: {
  inicial: Rascunho
  onFechar: () => void
  onSalvo: () => void
}) {
  const [f, setF] = useState<Rascunho>(inicial)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [gerandoPrevia, setGerandoPrevia] = useState(false)

  const campo = <K extends keyof Rascunho>(chave: K, valor: Rascunho[K]) =>
    setF((a) => ({ ...a, [chave]: valor }))

  const validar = (): string => {
    if (!f.nome.trim()) return 'Dê um nome ao modelo.'
    if (!f.texto.trim()) return 'O texto do certificado está vazio.'
    if (!f.texto.includes('{NOME}')) return 'O texto precisa ter {NOME} para sair o nome do aluno.'
    if (f.texto.includes('{EXTRA}') && !f.campo_extra_rotulo.trim())
      return 'O texto usa {EXTRA}: informe o nome do campo extra (ex.: Máquina / equipamento).'
    if (!f.conteudo.trim()) return 'Escreva o conteúdo programático.'
    return ''
  }

  const salvar = async () => {
    const problema = validar()
    setErro(problema)
    if (problema) return
    setSalvando(true)
    try {
      const dados = {
        nome: f.nome.trim(),
        selo: f.selo.trim(),
        texto: f.texto.trim(),
        carga_horaria: f.carga_horaria.trim(),
        campo_extra_rotulo: f.campo_extra_rotulo.trim(),
        campo_extra_exemplo: f.campo_extra_exemplo.trim(),
        conteudo: f.conteudo.trim(),
        rascunho: f.rascunho,
      }
      if (f.id) await atualizarModeloCertificado(f.id, dados)
      else await criarModeloCertificado({ ...dados, ordem: 0 })
      toast.success('Modelo salvo.')
      onSalvo()
    } catch (e) {
      toast.error(`Não foi possível salvar: ${(e as Error).message}`)
    } finally {
      setSalvando(false)
    }
  }

  const previa = async () => {
    const problema = validar()
    setErro(problema)
    if (problema) return
    setGerandoPrevia(true)
    try {
      const lote: DadosLote = {
        nomeModelo: f.nome.trim(),
        selo: f.selo.trim(),
        campoExtraRotulo: f.campo_extra_rotulo.trim(),
        empresa: 'Empresa Exemplo Ltda',
        endereco: '',
        data: hojeISO(),
        cargaHoraria: f.carga_horaria.trim() || '04',
        extra: f.campo_extra_exemplo.replace(/^Ex\.:\s*/i, '').trim() || 'exemplo',
        texto: f.texto,
        conteudo: f.conteudo,
        instrutores: [
          {
            nome: 'Nome do Instrutor',
            qualificacao1: 'Qualificação do instrutor',
            qualificacao2: '',
          },
        ],
      }
      const colab = { nome: 'Nome do Colaborador', cpf: '000.000.000-00' }
      const blob = gerarCertificadoPdf(lote, colab, await carregarMarca())
      abrirPdfEmNovaAba(blob, nomeArquivoCertificado(lote, colab))
    } catch (e) {
      toast.error(`Erro ao gerar a prévia: ${(e as Error).message}`)
    } finally {
      setGerandoPrevia(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{f.id ? 'Editar modelo' : 'Novo modelo de certificado'}</DialogTitle>
          <DialogDescription>
            O que for escrito aqui vira o ponto de partida na hora de gerar. Na geração ainda dá
            para ajustar o texto sem mexer no modelo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="mod-nome">Nome do modelo</Label>
            <Input
              id="mod-nome"
              value={f.nome}
              onChange={(e) => campo('nome', e.target.value)}
              placeholder="Ex.: NR 35 – Trabalho em altura"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mod-selo">Selo (opcional)</Label>
            <Input
              id="mod-selo"
              value={f.selo}
              onChange={(e) => campo('selo', e.target.value)}
              placeholder="Ex.: NR 35"
              maxLength={40}
            />
            <p className="text-xs text-muted-foreground">
              Aparece abaixo do título &quot;CERTIFICADO&quot;. Deixe em branco para não mostrar.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mod-carga">Carga horária sugerida (opcional)</Label>
            <Input
              id="mod-carga"
              value={f.carga_horaria}
              onChange={(e) => campo('carga_horaria', e.target.value)}
              placeholder="Ex.: 08"
              maxLength={20}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="mod-texto">Texto da frente</Label>
            <Textarea
              id="mod-texto"
              value={f.texto}
              onChange={(e) => campo('texto', e.target.value)}
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Variáveis: {'{NOME}'} {'{CPF}'} {'{EMPRESA}'} {'{ENDERECO}'} {'{DATA}'} {'{CARGA}'}{' '}
              {'{EXTRA}'}. Troque NOME DO CURSO pelo nome do seu curso.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mod-extra-rotulo">Campo extra (opcional)</Label>
            <Input
              id="mod-extra-rotulo"
              value={f.campo_extra_rotulo}
              onChange={(e) => campo('campo_extra_rotulo', e.target.value)}
              placeholder="Ex.: Máquina / equipamento"
              maxLength={120}
            />
            <p className="text-xs text-muted-foreground">
              Cria um campo no formulário e entra no texto onde estiver {'{EXTRA}'}.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mod-extra-exemplo">Exemplo do campo extra</Label>
            <Input
              id="mod-extra-exemplo"
              value={f.campo_extra_exemplo}
              onChange={(e) => campo('campo_extra_exemplo', e.target.value)}
              placeholder="Ex.: serra circular de bancada"
              maxLength={200}
              disabled={!f.campo_extra_rotulo.trim()}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="mod-conteudo">Conteúdo programático (verso)</Label>
            <Textarea
              id="mod-conteudo"
              value={f.conteudo}
              onChange={(e) => campo('conteudo', e.target.value)}
              rows={10}
            />
            <p className="text-xs text-muted-foreground">
              Uma linha por tópico. Linhas como &quot;a) ...&quot; ou &quot;I. ...&quot; saem sem
              marcador; comece a linha com ~ para texto corrido sem marcador.
            </p>
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <Switch
              id="mod-rascunho"
              checked={f.rascunho}
              onCheckedChange={(v) => campo('rascunho', v)}
            />
            <Label htmlFor="mod-rascunho" className="text-sm font-normal">
              Marcar como rascunho (avisa para revisar o conteúdo antes de gerar)
            </Label>
          </div>
        </div>

        {erro && (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={previa} disabled={gerandoPrevia}>
            {gerandoPrevia ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            Pré-visualizar
          </Button>
          <Button type="button" variant="ghost" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="button" onClick={salvar} disabled={salvando}>
            {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar modelo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
