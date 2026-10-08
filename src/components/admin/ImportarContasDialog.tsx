/* Importar várias contas de uma vez: cola a planilha (nome e e-mail por linha)
   e cada pessoa vira usuário + organização própria, com a senha padrão e troca
   obrigatória no primeiro acesso. A senha fica só no servidor. */
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { criarConta, PLANOS, type PlanoOrg } from '@/services/admin'

interface Linha {
  nome: string
  email: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Aceita colunas separadas por tab (colado do Excel), ponto e vírgula ou vírgula. */
function lerLinhas(texto: string): { validas: Linha[]; invalidas: string[] } {
  const validas: Linha[] = []
  const invalidas: string[] = []
  const vistos = new Set<string>()
  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.trim()
    if (!linha) continue
    const partes = linha.split(/\t|;|,/).map((p) => p.trim().replace(/^"|"$/g, ''))
    const email = (partes.find((p) => EMAIL.test(p)) || '').toLowerCase()
    const nome = partes.find((p) => p && !EMAIL.test(p)) || ''
    if (!email) {
      // cabeçalho ("nome  email") não conta como erro
      if (!/^nome\b/i.test(linha)) invalidas.push(linha)
      continue
    }
    if (vistos.has(email)) continue
    vistos.add(email)
    validas.push({ nome: nome || email.split('@')[0], email })
  }
  return { validas, invalidas }
}

export default function ImportarContasDialog({ onConcluido }: { onConcluido: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [texto, setTexto] = useState('')
  const [plano, setPlano] = useState<PlanoOrg>('individual')
  const [rodando, setRodando] = useState(false)
  const [feitos, setFeitos] = useState(0)
  const [falhas, setFalhas] = useState<{ email: string; motivo: string }[]>([])
  const [resumo, setResumo] = useState('')

  const { validas, invalidas } = useMemo(() => lerLinhas(texto), [texto])

  const importar = async () => {
    setRodando(true)
    setFeitos(0)
    setFalhas([])
    setResumo('')
    let ok = 0
    const erros: { email: string; motivo: string }[] = []
    for (const l of validas) {
      try {
        await criarConta({ nome: l.nome, email: l.email, plano })
        ok++
      } catch (error) {
        erros.push({ email: l.email, motivo: getErrorMessage(error) })
      }
      setFeitos(ok + erros.length)
    }
    setFalhas(erros)
    setResumo(`${ok} conta(s) criada(s)${erros.length ? `, ${erros.length} com problema` : ''}.`)
    if (ok) {
      toast.success(`${ok} conta(s) criada(s)`)
      onConcluido()
    }
    setRodando(false)
  }

  return (
    <>
      <Button variant="outline" className="rounded-full" onClick={() => setAberto(true)}>
        <Users className="mr-2 h-4 w-4" />
        Importar lista
      </Button>
      <Dialog open={aberto} onOpenChange={(v) => !rodando && setAberto(v)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Importar contas em lote</DialogTitle>
            <DialogDescription>
              Cole a planilha com nome e e-mail (uma pessoa por linha). Cada uma ganha a própria
              organização, com a senha padrão, e precisa trocá-la no primeiro acesso. Nenhum e-mail
              é enviado. E-mails que já existem são ignorados com aviso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Lista (nome e e-mail)</Label>
              <Textarea
                rows={8}
                value={texto}
                disabled={rodando}
                onChange={(e) => {
                  setTexto(e.target.value)
                  setResumo('')
                  setFalhas([])
                }}
                placeholder={'Maria da Silva\tmaria@gmail.com\nJoão Souza\tjoao@gmail.com'}
              />
              <p className="text-xs text-muted-foreground">
                {validas.length} pessoa(s) reconhecida(s)
                {invalidas.length ? `, ${invalidas.length} linha(s) sem e-mail válido` : ''}.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Plano de todas as contas</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={plano}
                disabled={rodando}
                onChange={(e) => setPlano(e.target.value as PlanoOrg)}
              >
                {PLANOS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label} — {p.vagas}
                  </option>
                ))}
              </select>
            </div>
            {invalidas.length > 0 && (
              <p className="text-xs text-destructive">
                Sem e-mail válido (não serão criadas): {invalidas.slice(0, 5).join(' | ')}
                {invalidas.length > 5 ? ' ...' : ''}
              </p>
            )}
            {rodando && (
              <p className="text-sm text-muted-foreground">
                Criando {feitos} de {validas.length}... não feche esta janela.
              </p>
            )}
            {resumo && <p className="text-sm font-medium">{resumo}</p>}
            {falhas.length > 0 && (
              <ul className="max-h-32 space-y-1 overflow-auto text-xs text-destructive">
                {falhas.map((f) => (
                  <li key={f.email}>
                    {f.email}: {f.motivo}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter>
            <Button onClick={importar} disabled={rodando || validas.length === 0}>
              {rodando ? 'Criando...' : `Criar ${validas.length} conta(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
