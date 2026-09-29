/* Visão Geral da Documentação SST: resumo agregado da organização inteira
   (todas as empresas), no espírito do painel que o site anterior mostrava
   como página inicial da seção "Documentos" — empresas ativas, funcionários,
   riscos cadastrados, EPIs e documentos emitidos. Contagens vêm direto do
   PocketBase (getList com perPage=1, só para pegar totalItems) em vez de
   somar listas completas no cliente. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Building2, FileText, HardHat, ShieldAlert, Users2 } from 'lucide-react'

import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { getEmpresas } from '@/services/empresas'

import { Card, CardContent } from '@/components/ui/card'

interface ResumoGeral {
  carregando: boolean
  empresasAtivas: number
  funcionarios: number
  riscos: number
  epis: number
  documentos: number
}

const RESUMO_VAZIO: ResumoGeral = {
  carregando: true,
  empresasAtivas: 0,
  funcionarios: 0,
  riscos: 0,
  epis: 0,
  documentos: 0,
}

export function VisaoGeralDocumentacaoTab() {
  const { user } = useAuth()
  const organizacaoId = (user?.organizacao_id as string) || ''
  const [resumo, setResumo] = useState<ResumoGeral>(RESUMO_VAZIO)

  useEffect(() => {
    if (!organizacaoId) return
    let cancelado = false
    setResumo((v) => ({ ...v, carregando: true }))
    Promise.all([
      getEmpresas(),
      pb.collection('avaliacoes_risco').getList(1, 1, {
        filter: `organizacao_id = "${organizacaoId}"`,
      }),
      pb.collection('epis_catalogo').getList(1, 1, {
        filter: `organizacao_id = "${organizacaoId}"`,
      }),
      pb.collection('documentos_sst').getList(1, 1, {
        filter: `organizacao_id = "${organizacaoId}" && status = "emitido"`,
      }),
    ])
      .then(([empresas, riscos, epis, documentos]) => {
        if (cancelado) return
        setResumo({
          carregando: false,
          empresasAtivas: empresas.length,
          funcionarios: empresas.reduce((soma, e) => soma + (e.numero_funcionarios || 0), 0),
          riscos: riscos.totalItems,
          epis: epis.totalItems,
          documentos: documentos.totalItems,
        })
      })
      .catch((error) =>
        toast.error('Não foi possível carregar a visão geral', {
          description: getErrorMessage(error),
        }),
      )
    return () => {
      cancelado = true
    }
  }, [organizacaoId])

  const cartoes = [
    { titulo: 'Empresas Ativas', valor: resumo.empresasAtivas, icone: Building2 },
    { titulo: 'Funcionários', valor: resumo.funcionarios, icone: Users2 },
    { titulo: 'Riscos Cadastrados', valor: resumo.riscos, icone: ShieldAlert },
    { titulo: 'EPIs', valor: resumo.epis, icone: HardHat },
    { titulo: 'Documentos Gerados', valor: resumo.documentos, icone: FileText },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Visão Geral</h2>
        <p className="text-sm text-muted-foreground">
          Resumo geral dos dados de Saúde e Segurança do Trabalho.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cartoes.map((c) => (
          <Card key={c.titulo}>
            <CardContent className="flex flex-col gap-2 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{c.titulo}</p>
                <c.icone className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{resumo.carregando ? '—' : c.valor}</p>
              <p className="text-xs text-muted-foreground">Total cadastrado</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Use o menu lateral para acessar Levantamento, Catálogo de agentes, Catálogo de EPIs e Como
        funciona.
      </p>
    </div>
  )
}

export default VisaoGeralDocumentacaoTab
