/* Questionário de seleção do beta — página pública (sem login). O aluno
   informa nome e e-mail, responde as 10 questões e envia; a correção é feita
   no servidor e o resultado vai por e-mail. O botão só libera com tudo
   preenchido. */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Send } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { enviarQuiz, listarPerguntasQuiz, type QuestaoQuiz } from '@/services/quizBeta'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export default function QuizBeta() {
  const [questoes, setQuestoes] = useState<QuestaoQuiz[]>([])
  const [carregando, setCarregando] = useState(true)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [aceite, setAceite] = useState(false)
  const [site, setSite] = useState('')
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

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
    aceite

  const enviar = async () => {
    if (!completo) return
    setEnviando(true)
    try {
      await enviarQuiz({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        aceite_lgpd: aceite,
        respostas,
        site,
      })
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
        todas, informe seu nome e e-mail e envie. O resultado com a explicação de cada questão vai
        para o seu e-mail.
      </p>

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

      <div className="mt-8 space-y-4">
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

      <Card className="sticky bottom-4 mt-8 rounded-2xl border-none p-5 shadow-subtle">
        <div className="flex items-start gap-2">
          <Checkbox
            id="quiz-aceite"
            checked={aceite}
            onCheckedChange={(v) => setAceite(v === true)}
            className="mt-0.5"
          />
          <Label htmlFor="quiz-aceite" className="text-sm font-normal leading-snug">
            Autorizo o uso do meu nome e e-mail apenas para a seleção e o contato sobre o beta do
            Labora Vistorias.
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
            O envio libera quando nome, e-mail, aceite e as {questoes.length || 10} questões
            estiverem preenchidos.
          </p>
        )}
      </Card>
    </div>
  )
}
