/* Formulários — catálogo de modelos (4 fixos do catálogo + customizados da
   organização) e lista dos registros preenchidos. Fase 1: catálogo + registros;
   o builder de fichas customizadas e o preenchimento entram nas fases 2 e 3. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import {
  Activity,
  ClipboardList,
  FlaskConical,
  FilePlus2,
  Lock,
  Thermometer,
  Volume2,
  type LucideIcon,
} from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getPapelUsuarioLogado } from '@/services/equipe'
import { getMinhaOrganizacao } from '@/services/organizacoes'
import { getModelosFormulario, type ModeloFormulario } from '@/services/formularios'
import { getFormularios, type Formulario } from '@/services/registrosFormulario'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

const ICONES: Record<string, LucideIcon> = {
  'volume-2': Volume2,
  activity: Activity,
  thermometer: Thermometer,
  'flask-conical': FlaskConical,
  default: ClipboardList,
}

const iconeDe = (modelo: ModeloFormulario) => ICONES[modelo.icone || ''] || ICONES.default

export default function Formularios() {
  const [modelos, setModelos] = useState<ModeloFormulario[]>([])
  const [registros, setRegistros] = useState<Formulario[]>([])
  const [loading, setLoading] = useState(true)
  // Regras PB: só gestor (dono/gerente) cria modelos customizados.
  const podeGerenciar = getPapelUsuarioLogado() !== 'executor'

  useEffect(() => {
    Promise.all([getModelosFormulario(), getFormularios()])
      .then(([ms, rs]) => {
        setModelos(ms)
        setRegistros(rs)
      })
      .catch((error) =>
        toast.error('Não foi possível carregar os formulários', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setLoading(false))
  }, [])

  const fixos = modelos.filter((m) => m.fixo)
  const proprios = modelos.filter((m) => !m.fixo)

  const CardModelo = ({ modelo }: { modelo: ModeloFormulario }) => {
    const Icone = iconeDe(modelo)
    return (
      <Card className="flex flex-col rounded-2xl border-none bg-card p-5 shadow-subtle">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icone className="h-5 w-5" />
        </div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{modelo.nome}</h3>
          {modelo.fixo && (
            <Badge variant="secondary" className="shrink-0 gap-1">
              <Lock className="h-3 w-3" />
              Fixo
            </Badge>
          )}
        </div>
        {modelo.descricao && (
          <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{modelo.descricao}</p>
        )}
        <div className="mt-auto pt-4">
          <Button asChild size="sm" className="w-full rounded-full">
            <Link to={`/formularios/${modelo.id}/preencher`}>Preencher</Link>
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Formulários</h1>
          <p className="text-sm text-muted-foreground">
            Registros de campo além das vistorias — medições, inspeções e verificações.
          </p>
        </div>
        {podeGerenciar && (
          <Button asChild className="shrink-0 rounded-full">
            <Link to="/formularios/novo">
              <FilePlus2 className="mr-2 h-4 w-4" />
              Criar formulário
            </Link>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="modelos">
          <TabsList className="mb-4">
            <TabsTrigger value="modelos">Modelos ({modelos.length})</TabsTrigger>
            <TabsTrigger value="registros">Registros ({registros.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="modelos">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Catálogo — prontos para uso
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fixos.map((m) => (
                <CardModelo key={m.id} modelo={m} />
              ))}
            </div>

            {proprios.length > 0 && (
              <>
                <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Da sua organização
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {proprios.map((m) => (
                    <CardModelo key={m.id} modelo={m} />
                  ))}
                </div>
              </>
            )}

            {modelos.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
                <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Nenhum modelo de formulário ainda.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="registros">
            {registros.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
                <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Nenhum registro preenchido ainda — preencha um modelo na aba Modelos.
                </p>
              </div>
            ) : (
              <Card className="divide-y divide-border/60 overflow-hidden rounded-2xl border-none bg-card p-2 shadow-subtle">
                {registros.map((r) => {
                  const modelo = r.expand?.modelo_formulario_id
                  const Icone = modelo
                    ? iconeDe({ icone: modelo.icone } as ModeloFormulario)
                    : ICONES.default
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-3 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <Icone className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {modelo?.nome || 'Formulário'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {new Date(r.created).toLocaleDateString('pt-BR')} ·{' '}
                          {r.status === 'concluido' ? 'Concluído' : 'Rascunho'}
                        </p>
                      </div>
                      <Badge
                        variant={r.status === 'concluido' ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {r.status === 'concluido' ? 'Concluído' : 'Rascunho'}
                      </Badge>
                    </div>
                  )
                })}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Vistorias NR-28 continuam em{' '}
        <Link to="/vistorias" className="underline">
          Vistorias
        </Link>{' '}
        — formulários são um registro separado.
      </p>
    </div>
  )
}
