/* Questionário de seleção do beta — página pública (sem login). O aluno
   informa nome e e-mail, responde as 10 questões e envia; a correção é feita
   no servidor e o resultado vai por e-mail. O botão só libera com tudo
   preenchido. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Send } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { enviarQuiz, listarPerguntasQuiz, type QuestaoQuiz } from '@/services/quizBeta'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
const soDigitos = (v: string) => v.replace(/\D/g, '').slice(0, 11)
const mascaraTelefone = (v: string) => {
  const d = soDigitos(v)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
const telefoneValido = (v: string) => {
  const n = soDigitos(v).length
  return n === 10 || n === 11
}
const respondidas0 = (r: Record<string, string>) => Object.keys(r).length

export default function QuizBeta() {
  const [questoes, setQuestoes] = useState<QuestaoQuiz[]>([])
  const [carregando, setCarregando] = useState(true)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [aceite, setAceite] = useState(false)
  const [site, setSite] = useState('')
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [saidas, setSaidas] = useState(0)

  // Controle de saídas da página: conta cada vez que a pessoa troca de aba,
  // minimiza ou muda de janela, e soma o tempo fora. Vai junto com o envio.
  const saidasRef = useRef(0)
  const segundosForaRef = useRef(0)
  const inicioForaRef = useRef<number | null>(null)
  const enviadoRef = useRef(false)
  const iniciouRef = useRef(false)

  useEffect(() => {
    const sair = () => {
      if (enviadoRef.current || inicioForaRef.current !== null) return
      inicioForaRef.current = Date.now()
    }
    const voltar = () => {
      if (inicioForaRef.current === null) return
      const seg = Math.round((Date.now() - inicioForaRef.current) / 1000)
      inicioForaRef.current = null
      if (enviadoRef.current) return
      saidasRef.current += 1
      segundosForaRef.current += seg
      setSaidas(saidasRef.current)
    }
    const aoMudarVisibilidade = () => (document.hidden ? sair() : voltar())
    const aoSair = (e: BeforeUnloadEvent) => {
      if (enviadoRef.current || !iniciouRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    window.addEventListener('blur', sair)
    window.addEventListener('focus', voltar)
    window.addEventListener('beforeunload', aoSair)
    return () => {
      document.removeEventListener('visibilitychange', aoMudarVisibilidade)
      window.removeEventListener('blur', sair)
      window.removeEventListener('focus', voltar)
      window.removeEventListener('beforeunload', aoSair)
    }
  }, [])

  useEffect(() => {
    // Só protege contra fechar a página depois que a pessoa começou.
    iniciouRef.current =
      nome.trim() !== '' ||
      email.trim() !== '' ||
      telefone.trim() !== '' ||
      respondidas0(respostas) > 0
  }, [nome, email, telefone, respostas])

  useEffect(() => {
    listarPerguntasQuiz()
      .then(setQuestoes)
      .catch((error) =>
        toast.error('Não foi possível carregar as questões', {
          description: getErrorMessage(error),
        }),
      )
      .finally(() => setCarregando(false))
  }, [])

  const respondidas = useMemo(
    () => questoes.filter((q) => respostas[`q${q.ordem}`]).length,
    [questoes, respostas],
  )
  const completo =
    questoes.length > 0 &&
    respondidas === questoes.length &&
    nome.trim().length >= 2 &&
    emailValido(email) &&
    telefoneValido(telefone) &&
    aceite

  const enviar = async () => {
    if (!completo) return
    setEnviando(true)
    // Fecha uma eventual saída em andamento antes de contar.
    if (inicioForaRef.current !== null) {
      segundosForaRef.current += Math.round((Date.now() - inicioForaRef.current) / 1000)
      inicioForaRef.current = null
    }
    try {
      await enviarQuiz({
        saidas: saidasRef.current,
        segundos_fora: segundosForaRef.current,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: soDigitos(telefone),
        aceite_lgpd: aceite,
        respostas,
        site,
      })
      enviadoRef.current = true
      setEnviado(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      toast.error('Não foi possível enviar', { description: getErrorMessage(error) })
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <Card className="rounded-2xl border-none p-8 text-center shadow-subtle">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Respostas recebidas</h1>
          <p className="mt-2 text-muted-foreground">
            Você vai receber a nota, o gabarito e a explicação de cada questão no e-mail{' '}
            <span className="font-medium text-foreground">{email.trim().toLowerCase()}</span>.
            Confira também a caixa de spam.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Os selecionados para o beta serão avisados por e-mail.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Seleção para o beta
      </p>
      <h1 className="text-4xl font-extrabold tracking-tight">
        Questionário <span className="text-primary">Labora Vistorias</span>
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Dez questões sobre PGR, LTCAT, Laudo de Insalubridade e Laudo de Periculosidade. Responda
        todas, informe seu nome, e-mail e telefone e envie. O resultado com a explicação de cada
        questão vai para o seu e-mail.
      </p>

      <Card className="mt-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 shadow-none dark:bg-amber-950/30 dark:text-amber-100">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Responda sem sair desta página. Trocar de aba, minimizar o navegador ou abrir outro
            aplicativo é registrado (quantas vezes e por quanto tempo) e o resultado aparece para a
            equipe na seleção. Não é permitido copiar as questões.
          </p>
        </div>
      </Card>

      {saidas > 0 && !enviado && (
        <Card
          role="alert"
          className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive shadow-none"
        >
          Você saiu da página {saidas} {saidas === 1 ? 'vez' : 'vezes'}. Essa informação foi
          registrada junto com as suas respostas.
        </Card>
      )}

      <Card className="mt-8 rounded-2xl border-none p-5 shadow-subtle">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="quiz-nome">Nome completo</Label>
            <Input
              id="quiz-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="mt-1.5"
              autoComplete="name"
            />
          </div>
          <div>
            <Label htmlFor="quiz-email">E-mail</Label>
            <Input
              id="quiz-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="mt-1.5"
              autoComplete="email"
            />
          </div>
          <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
            <Label htmlFor="quiz-telefone">Telefone / WhatsApp (com DDD)</Label>
            <Input
              id="quiz-telefone"
              type="tel"
              inputMode="tel"
              value={telefone}
              onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
              placeholder="(86) 99999-9999"
              className="mt-1.5"
              autoComplete="tel"
            />
          </div>
        </div>
        {/* Honeypot: fica fora da tela; pessoas não preenchem. */}
        <div className="absolute -left-[9999px] top-0" aria-hidden="true">
          <label>
            Site
            <input
              tabIndex={-1}
              autoComplete="off"
              value={site}
              onChange={(e) => setSite(e.target.value)}
            />
          </label>
        </div>
      </Card>

      <div
        className="mt-8 select-none space-y-4"
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {carregando ? (
          <>
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </>
        ) : (
          questoes.map((q) => {
            const chave = `q${q.ordem}`
            return (
              <Card key={chave} className="rounded-2xl border-none p-5 shadow-subtle">
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Questão {q.ordem} · {q.tema}
                </div>
                <p className="mt-2 font-medium">{q.enunciado}</p>
                <div className="mt-3 space-y-1.5">
                  {q.alternativas.map((a) => {
                    const marcada = respostas[chave] === a.id
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setRespostas((r) => ({ ...r, [chave]: a.id }))}
                        className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                          marcada ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                        }`}
                      >
                        {a.texto}
                      </button>
                    )
                  })}
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Card className="mt-8 rounded-2xl border-none p-5 shadow-subtle">
        <div className="flex items-start gap-2">
          <Checkbox
            id="quiz-aceite"
            checked={aceite}
            onCheckedChange={(v) => setAceite(v === true)}
            className="mt-0.5"
          />
          <Label htmlFor="quiz-aceite" className="text-sm font-normal leading-snug">
            Autorizo o uso do meu nome, e-mail e telefone apenas para a seleção e o contato sobre o
            beta do Labora Vistorias.
          </Label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {respondidas} de {questoes.length || 10} respondidas
          </span>
          <Button onClick={enviar} disabled={!completo || enviando} className="rounded-full">
            <Send className="mr-2 h-4 w-4" />
            {enviando ? 'Enviando...' : 'Enviar respostas'}
          </Button>
        </div>
        {!completo && !carregando && (
          <p className="mt-2 text-xs text-muted-foreground">
            O envio libera quando nome, e-mail, telefone, aceite e as {questoes.length || 10}{' '}
            questões estiverem preenchidos.
          </p>
        )}
      </Card>
    </div>
  )
}
