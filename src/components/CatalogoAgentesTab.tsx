/* Catálogo de agentes e perigos: consulta (somente leitura, por enquanto) ao
   catálogo oficial da plataforma mais os agentes da própria organização.
   Os campos vazios (código eSocial, anexo IV) ficam vazios de propósito:
   só entram depois de conferidos na fonte oficial. */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Search } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  getAgentesCatalogo,
  type AgenteCatalogo,
  type TipoAgente,
} from '@/services/agentesCatalogo'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const TIPOS: TipoAgente[] = [
  'Físico',
  'Químico',
  'Biológico',
  'Ergonômico',
  'Acidente',
  'Psicossocial',
]

export function CatalogoAgentesTab() {
  const [agentes, setAgentes] = useState<AgenteCatalogo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState('todos')

  useEffect(() => {
    getAgentesCatalogo()
      .then(setAgentes)
      .catch((error) =>
        toast.error('Não foi possível carregar o catálogo', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregando(false))
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return agentes.filter((a) => {
      if (tipo !== 'todos' && a.tipo !== tipo) return false
      if (!termo) return true
      return (
        a.nome.toLowerCase().includes(termo) ||
        (a.sinonimos || '').toLowerCase().includes(termo) ||
        (a.cas || '').toLowerCase().includes(termo) ||
        (a.codigo_esocial || '').includes(termo)
      )
    })
  }, [agentes, busca, tipo])

  const limite = (a: AgenteCatalogo) =>
    a.limite_tolerancia_valor != null
      ? `${a.limite_tolerancia_valor} ${a.limite_tolerancia_unidade || ''}`.trim()
      : a.tlv_acgih_valor != null
        ? `${a.tlv_acgih_valor} ${a.tlv_acgih_unidade || ''} (ACGIH)`.trim()
        : '—'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Catálogo de agentes e perigos</h2>
        <p className="text-sm text-muted-foreground">
          Base usada no inventário: cada agente traz o limite de tolerância, o anexo da NR-15, o
          efeito à saúde sugerido e os códigos do eSocial e do Anexo IV quando já conferidos na
          fonte oficial. Agentes marcados como "oficial" são da plataforma; os demais são da sua
          organização.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, sinônimo, CAS ou código eSocial..."
            className="pl-9"
          />
        </div>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {TIPOS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {carregando ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card py-16 text-center text-sm text-muted-foreground">
          Nenhum agente para esse filtro.
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>NR-15</TableHead>
                <TableHead>Limite</TableHead>
                <TableHead>Efeito AIHA</TableHead>
                <TableHead>eSocial</TableHead>
                <TableHead>Aposent. especial</TableHead>
                <TableHead>Origem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="font-medium">{a.nome}</div>
                    {a.cas && <div className="text-xs text-muted-foreground">CAS {a.cas}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.tipo}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {a.anexo_nr15 ? `Anexo ${a.anexo_nr15}` : '—'}
                    {a.grau_insalubridade_nr15 && (
                      <div className="text-xs text-muted-foreground">
                        {a.grau_insalubridade_nr15}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{limite(a)}</TableCell>
                  <TableCell className="text-sm">{a.efeito_saude_aiha ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{a.codigo_esocial || '—'}</TableCell>
                  <TableCell className="text-sm">
                    {a.anos_aposentadoria_especial ? `${a.anos_aposentadoria_especial} anos` : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.organizacao_id ? 'secondary' : 'default'}>
                      {a.organizacao_id ? 'Organização' : 'Oficial'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

export default CatalogoAgentesTab
