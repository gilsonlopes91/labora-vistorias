/* Estrutura SST da empresa: setores, GHEs (Grupos Homogêneos de Exposição) e
   funções — a base sobre a qual o inventário de riscos é montado (cada
   avaliação de risco pertence a um GHE; funções herdam as conclusões do seu
   GHE). Lista simples com diálogos de criação/edição, seguindo o mesmo
   padrão de OrcamentosTab. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Building, Layers, Pencil, Plus, Trash2, Users2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useAuth } from '@/hooks/use-auth'
import {
  createSetor,
  deleteSetor,
  getSetores,
  updateSetor,
  type Setor,
  type SetorInput,
} from '@/services/setores'
import { createGhe, deleteGhe, getGhes, updateGhe, type Ghe, type GheInput } from '@/services/ghes'
import {
  createFuncaoSst,
  deleteFuncaoSst,
  getFuncoesSst,
  updateFuncaoSst,
  type FuncaoSst,
  type FuncaoSstInput,
} from '@/services/funcoesSst'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const LOCAL_OPCOES = ['Próprio (dependências do empregador)', 'Terceiros']

function Secao({
  titulo,
  icone: Icone,
  acao,
  children,
}: {
  titulo: string
  icone: typeof Building
  acao: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icone className="h-4 w-4 text-muted-foreground" />
          {titulo}
        </CardTitle>
        {acao}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function EstruturaSstTab({ empresaId }: { empresaId: string }) {
  const { user } = useAuth()
  const organizacaoId = (user?.organizacao_id as string) || ''

  const [setores, setSetores] = useState<Setor[]>([])
  const [ghes, setGhes] = useState<Ghe[]>([])
  const [funcoes, setFuncoes] = useState<FuncaoSst[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = () =>
    Promise.all([getSetores(empresaId), getGhes(empresaId), getFuncoesSst(empresaId)])
      .then(([s, g, f]) => {
        setSetores(s)
        setGhes(g)
        setFuncoes(f)
      })
      .catch((error) =>
        toast.error('Não foi possível carregar a estrutura SST', {
          description: getErrorMessage(error),
        }),
      )

  useEffect(() => {
    carregar().finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  // ---- Setores ----
  const [setorDialog, setSetorDialog] = useState(false)
  const [setorEdit, setSetorEdit] = useState<Setor | null>(null)
  const [setorExcluir, setSetorExcluir] = useState<Setor | null>(null)
  const [fSetor, setFSetor] = useState<Partial<SetorInput>>({})

  const abrirSetor = (s: Setor | null) => {
    setSetorEdit(s)
    setFSetor(s ? { ...s } : { local: LOCAL_OPCOES[0] })
    setSetorDialog(true)
  }
  const salvarSetor = async () => {
    if (!fSetor.nome?.trim()) return toast.error('Informe o nome do setor')
    try {
      if (setorEdit) await updateSetor(setorEdit.id, fSetor)
      else
        await createSetor({
          ...fSetor,
          organizacao_id: organizacaoId,
          empresa_id: empresaId,
        } as SetorInput)
      toast.success('Setor salvo')
      setSetorDialog(false)
      carregar()
    } catch (error) {
      toast.error('Não foi possível salvar o setor', { description: getErrorMessage(error) })
    }
  }
  const excluirSetor = async () => {
    if (!setorExcluir) return
    try {
      await deleteSetor(setorExcluir.id)
      toast.success('Setor excluído')
      setSetorExcluir(null)
      carregar()
    } catch (error) {
      toast.error('Não foi possível excluir', { description: getErrorMessage(error) })
    }
  }

  // ---- GHEs ----
  const [gheDialog, setGheDialog] = useState(false)
  const [gheEdit, setGheEdit] = useState<Ghe | null>(null)
  const [gheExcluir, setGheExcluir] = useState<Ghe | null>(null)
  const [fGhe, setFGhe] = useState<Partial<GheInput>>({})

  const abrirGhe = (g: Ghe | null) => {
    setGheEdit(g)
    setFGhe(g ? { ...g } : {})
    setGheDialog(true)
  }
  const salvarGhe = async () => {
    if (!fGhe.nome?.trim()) return toast.error('Informe o nome do GHE')
    try {
      if (gheEdit) await updateGhe(gheEdit.id, fGhe)
      else
        await createGhe({
          ...fGhe,
          organizacao_id: organizacaoId,
          empresa_id: empresaId,
        } as GheInput)
      toast.success('GHE salvo')
      setGheDialog(false)
      carregar()
    } catch (error) {
      toast.error('Não foi possível salvar o GHE', { description: getErrorMessage(error) })
    }
  }
  const excluirGhe = async () => {
    if (!gheExcluir) return
    try {
      await deleteGhe(gheExcluir.id)
      toast.success('GHE excluído')
      setGheExcluir(null)
      carregar()
    } catch (error) {
      toast.error('Não foi possível excluir', {
        description: getErrorMessage(error),
      })
    }
  }

  // ---- Funções ----
  const [funcaoDialog, setFuncaoDialog] = useState(false)
  const [funcaoEdit, setFuncaoEdit] = useState<FuncaoSst | null>(null)
  const [funcaoExcluir, setFuncaoExcluir] = useState<FuncaoSst | null>(null)
  const [fFuncao, setFFuncao] = useState<Partial<FuncaoSstInput>>({})

  const abrirFuncao = (f: FuncaoSst | null) => {
    setFuncaoEdit(f)
    setFFuncao(f ? { ...f } : { ghe_id: ghes[0]?.id })
    setFuncaoDialog(true)
  }
  const salvarFuncao = async () => {
    if (!fFuncao.nome?.trim()) return toast.error('Informe o nome da função')
    if (!fFuncao.ghe_id) return toast.error('Selecione o GHE desta função')
    try {
      if (funcaoEdit) await updateFuncaoSst(funcaoEdit.id, fFuncao)
      else
        await createFuncaoSst({
          ...fFuncao,
          organizacao_id: organizacaoId,
          empresa_id: empresaId,
        } as FuncaoSstInput)
      toast.success('Função salva')
      setFuncaoDialog(false)
      carregar()
    } catch (error) {
      toast.error('Não foi possível salvar a função', { description: getErrorMessage(error) })
    }
  }
  const excluirFuncao = async () => {
    if (!funcaoExcluir) return
    try {
      await deleteFuncaoSst(funcaoExcluir.id)
      toast.success('Função excluída')
      setFuncaoExcluir(null)
      carregar()
    } catch (error) {
      toast.error('Não foi possível excluir', { description: getErrorMessage(error) })
    }
  }

  if (carregando) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <Secao
        titulo={`Setores (${setores.length})`}
        icone={Building}
        acao={
          <Button size="sm" variant="outline" onClick={() => abrirSetor(null)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Novo setor
          </Button>
        }
      >
        {setores.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum setor cadastrado. Setores descrevem os ambientes de trabalho (área, piso,
            ventilação) usados no PGR e no LTCAT.
          </p>
        ) : (
          <div className="divide-y">
            {setores.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="font-medium">{s.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {[s.local, s.area_m2 ? `${s.area_m2} m²` : null].filter(Boolean).join(' · ') ||
                      'sem detalhes'}
                  </div>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button variant="ghost" size="icon" onClick={() => abrirSetor(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setSetorExcluir(s)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Secao>

      <Secao
        titulo={`GHEs — Grupos Homogêneos de Exposição (${ghes.length})`}
        icone={Layers}
        acao={
          <Button size="sm" variant="outline" onClick={() => abrirGhe(null)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Novo GHE
          </Button>
        }
      >
        {ghes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum GHE cadastrado. O GHE é a unidade de avaliação de risco: trabalhadores com
            exposição semelhante são agrupados em um GHE e todas as avaliações do inventário
            (agentes, probabilidade, severidade) são feitas por GHE.
          </p>
        ) : (
          <div className="divide-y">
            {ghes.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {g.codigo && (
                      <span className="font-mono text-xs text-muted-foreground">{g.codigo}</span>
                    )}
                    <span className="font-medium">{g.nome}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {[
                      g.expand?.setor_id?.nome,
                      g.numero_expostos ? `${g.numero_expostos} expostos` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'sem setor vinculado'}
                  </div>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button variant="ghost" size="icon" onClick={() => abrirGhe(g)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setGheExcluir(g)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Secao>

      <Secao
        titulo={`Funções (${funcoes.length})`}
        icone={Users2}
        acao={
          <Button
            size="sm"
            variant="outline"
            disabled={ghes.length === 0}
            onClick={() => abrirFuncao(null)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nova função
          </Button>
        }
      >
        {ghes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Cadastre um GHE antes das funções.</p>
        ) : funcoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma função cadastrada.</p>
        ) : (
          <div className="divide-y">
            {funcoes.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="font-medium">{f.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {f.expand?.ghe_id?.nome || 'GHE removido'}
                    {f.cbo && ` · CBO ${f.cbo}`}
                    {f.numero_empregados ? ` · ${f.numero_empregados} empregados` : ''}
                  </div>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button variant="ghost" size="icon" onClick={() => abrirFuncao(f)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setFuncaoExcluir(f)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Secao>

      {/* Diálogo: Setor */}
      <Dialog open={setorDialog} onOpenChange={setSetorDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{setorEdit ? 'Editar setor' : 'Novo setor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input
                className="mt-1.5"
                value={fSetor.nome || ''}
                onChange={(e) => setFSetor((v) => ({ ...v, nome: e.target.value }))}
              />
            </div>
            <div>
              <Label>Local</Label>
              <Select
                value={fSetor.local || LOCAL_OPCOES[0]}
                onValueChange={(v) => setFSetor((s) => ({ ...s, local: v }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCAL_OPCOES.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Área (m²)</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  value={fSetor.area_m2 ?? ''}
                  onChange={(e) =>
                    setFSetor((v) => ({ ...v, area_m2: Number(e.target.value) || undefined }))
                  }
                />
              </div>
              <div>
                <Label>Pé-direito (m)</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  value={fSetor.pe_direito_m ?? ''}
                  onChange={(e) =>
                    setFSetor((v) => ({ ...v, pe_direito_m: Number(e.target.value) || undefined }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Descrição do processo</Label>
              <Textarea
                className="mt-1.5"
                value={fSetor.descricao_processo || ''}
                onChange={(e) => setFSetor((v) => ({ ...v, descricao_processo: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetorDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarSetor}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: GHE */}
      <Dialog open={gheDialog} onOpenChange={setGheDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{gheEdit ? 'Editar GHE' : 'Novo GHE'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Código</Label>
                <Input
                  className="mt-1.5"
                  value={fGhe.codigo || ''}
                  onChange={(e) => setFGhe((v) => ({ ...v, codigo: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <Label>Nome</Label>
                <Input
                  className="mt-1.5"
                  value={fGhe.nome || ''}
                  onChange={(e) => setFGhe((v) => ({ ...v, nome: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Setor</Label>
              <Select
                value={fGhe.setor_id || '__nenhum'}
                onValueChange={(v) =>
                  setFGhe((s) => ({ ...s, setor_id: v === '__nenhum' ? undefined : v }))
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__nenhum">Sem setor vinculado</SelectItem>
                  {setores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nº de expostos</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  value={fGhe.numero_expostos ?? ''}
                  onChange={(e) =>
                    setFGhe((v) => ({
                      ...v,
                      numero_expostos: Number(e.target.value) || undefined,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Turno</Label>
                <Input
                  className="mt-1.5"
                  value={fGhe.turno || ''}
                  onChange={(e) => setFGhe((v) => ({ ...v, turno: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Critério de agrupamento</Label>
              <Textarea
                className="mt-1.5"
                placeholder="Por que estes trabalhadores foram agrupados: mesma função, mesmo posto, mesma exposição..."
                value={fGhe.criterio_agrupamento || ''}
                onChange={(e) => setFGhe((v) => ({ ...v, criterio_agrupamento: e.target.value }))}
              />
            </div>
            <div>
              <Label>Descrição das atividades</Label>
              <Textarea
                className="mt-1.5"
                value={fGhe.descricao_atividades || ''}
                onChange={(e) => setFGhe((v) => ({ ...v, descricao_atividades: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGheDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarGhe}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: Função */}
      <Dialog open={funcaoDialog} onOpenChange={setFuncaoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{funcaoEdit ? 'Editar função' : 'Nova função'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome da função</Label>
              <Input
                className="mt-1.5"
                value={fFuncao.nome || ''}
                onChange={(e) => setFFuncao((v) => ({ ...v, nome: e.target.value }))}
              />
            </div>
            <div>
              <Label>GHE</Label>
              <Select
                value={fFuncao.ghe_id || ''}
                onValueChange={(v) => setFFuncao((s) => ({ ...s, ghe_id: v }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione o GHE" />
                </SelectTrigger>
                <SelectContent>
                  {ghes.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>CBO</Label>
                <Input
                  className="mt-1.5"
                  value={fFuncao.cbo || ''}
                  onChange={(e) => setFFuncao((v) => ({ ...v, cbo: e.target.value }))}
                />
              </div>
              <div>
                <Label>Nº de empregados</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  value={fFuncao.numero_empregados ?? ''}
                  onChange={(e) =>
                    setFFuncao((v) => ({
                      ...v,
                      numero_empregados: Number(e.target.value) || undefined,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Descrição das atividades</Label>
              <Textarea
                className="mt-1.5"
                value={fFuncao.descricao_atividades || ''}
                onChange={(e) =>
                  setFFuncao((v) => ({ ...v, descricao_atividades: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFuncaoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarFuncao}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!setorExcluir} onOpenChange={(o) => !o && setSetorExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir setor</AlertDialogTitle>
            <AlertDialogDescription>
              O setor "{setorExcluir?.nome}" será removido. GHEs vinculados a ele ficam sem setor,
              não são excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluirSetor}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!gheExcluir} onOpenChange={(o) => !o && setGheExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir GHE</AlertDialogTitle>
            <AlertDialogDescription>
              O GHE "{gheExcluir?.nome}", suas funções e avaliações de risco vinculadas serão
              removidos. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluirGhe}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!funcaoExcluir} onOpenChange={(o) => !o && setFuncaoExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir função</AlertDialogTitle>
            <AlertDialogDescription>
              A função "{funcaoExcluir?.nome}" será removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluirFuncao}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default EstruturaSstTab
