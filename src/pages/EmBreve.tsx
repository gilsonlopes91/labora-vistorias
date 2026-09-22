/* Página "em breve" — destino de quem se inscreve pelo "Criar conta" enquanto
   o app não está liberado ao público. Mostra a confirmação da inscrição e um
   manual do que dá para fazer no app, com capturas de tela reais
   (coleção manual_imagens, leitura pública, a mais recente por chave). */
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'

interface Secao {
  chave: string
  titulo: string
  texto: string[]
}

const SECOES: Secao[] = [
  {
    chave: 'painel',
    titulo: '1. Painel inicial',
    texto: [
      'Ao entrar, você vê o que está em aberto: vistorias do dia, atrasadas, as dos próximos 7 dias e quantas foram concluídas no mês.',
      'Dá para filtrar por período e por responsável, e abrir direto a agenda ou uma nova vistoria.',
    ],
  },
  {
    chave: 'empresas',
    titulo: '2. Cadastro das empresas clientes',
    texto: [
      'Cada cliente fica com CNPJ, contato, endereço, grau de risco e número de empregados.',
      'O número de empregados e o grau de risco entram no cálculo da multa da NR-28. Ao abrir uma empresa, você vê as vistorias, os formulários e os orçamentos dela.',
    ],
  },
  {
    chave: 'agenda',
    titulo: '3. Agenda e rotinas recorrentes',
    texto: [
      'O calendário mostra as vistorias marcadas por dia e por responsável.',
      'Nas rotinas você define a frequência de visita de cada cliente (semanal, mensal, trimestral, semestral, anual). Quando a vistoria da rotina é concluída, a próxima já fica agendada.',
    ],
  },
  {
    chave: 'vistorias',
    titulo: '4. Lista de vistorias',
    texto: [
      'Todas as vistorias em um lugar, com a norma aplicada, a data e a situação: agendada, em andamento ou concluída.',
    ],
  },
  {
    chave: 'vistoria_resumo',
    titulo: '5. Checklist da NR em campo',
    texto: [
      'A vistoria segue o checklist da norma item por item. Para cada item você marca C (conforme), N/C (não conforme) ou N/A (não se aplica).',
      'A barra no topo mostra quanto já foi respondido, e a estimativa de multa da NR-28 é recalculada a cada item marcado como não conforme.',
    ],
  },
  {
    chave: 'vistoria_item',
    titulo: '6. Não conformidade com foto e localização',
    texto: [
      'Cada item traz o número do item na norma, o código da ementa e o grau da infração. Quando você marca N/C, aparece a faixa de multa daquele item.',
      'Você escreve a observação e anexa fotos pelo celular. A foto recebe uma marca com data, hora, coordenada GPS (quando ativado) e o logo da sua empresa.',
    ],
  },
  {
    chave: 'vistoria_concluida',
    titulo: '7. Finalização e relatório em PDF',
    texto: [
      'Ao finalizar, você escolhe o responsável técnico que assina. O app gera o PDF com o logo da sua empresa, os dados do cliente, o resumo por situação, os itens agrupados por seção com as fotos, a estimativa de multa e o bloco de assinatura.',
    ],
  },
  {
    chave: 'auditoria_nrs',
    titulo: '8. Catálogo das Normas Regulamentadoras',
    texto: [
      'O catálogo traz as NRs vigentes, com cada anexo separado como um checklist próprio (por exemplo, NR-12 corpo da norma e NR-12 Anexo VIII, prensas).',
      'Cada item vem com o código e a classificação do Anexo II da NR-28. A busca aceita número do item, código ou trecho do texto.',
    ],
  },
  {
    chave: 'formularios',
    titulo: '9. Formulários de campo',
    texto: [
      'Além das vistorias, há fichas de campo prontas para avaliações quantitativas: calor (IBUTG), vibração, dosimetria de ruído e amostragem de agentes químicos.',
      'Também é possível montar formulários próprios no construtor.',
    ],
  },
  {
    chave: 'formulario_preencher',
    titulo: '10. Preenchimento em etapas',
    texto: [
      'A ficha é preenchida por etapas, com os campos obrigatórios indicados. Dá para salvar como rascunho e vincular o registro a uma empresa cliente.',
    ],
  },
  {
    chave: 'orcamentos',
    titulo: '11. Orçamentos e propostas',
    texto: [
      'Você monta a proposta comercial para o cliente, acompanha a situação (rascunho, enviada, em negociação, aprovada, recusada) e o financeiro (recebido e a receber).',
      'A proposta sai em PDF com a identidade da sua empresa.',
    ],
  },
]

const EXTRAS = [
  'Equipe com papéis: dono, gerente e executor. O executor só preenche as vistorias atribuídas a ele.',
  'Assistente de IA dentro do app para tirar dúvidas sobre as NRs.',
  'Calculadora de multas da NR-28 aberta no site, sem precisar de conta.',
]

interface Estado {
  nome?: string
  email?: string
}

export default function EmBreve() {
  const location = useLocation()
  const estado = (location.state as Estado) || {}
  const [imagens, setImagens] = useState<Record<string, string>>({})
  const [ampliada, setAmpliada] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    pb.collection('manual_imagens')
      .getFullList({ sort: '-created' })
      .then((lista) => {
        const map: Record<string, string> = {}
        for (const rec of lista) {
          if (!map[rec.chave] && rec.imagem) map[rec.chave] = pb.files.getURL(rec, rec.imagem)
        }
        setImagens(map)
      })
      .catch(() => {})
  }, [])

  const primeiroNome = (estado.nome || '').trim().split(' ')[0]

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      {/* Confirmação */}
      <section className="mx-auto max-w-2xl text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground lg:text-4xl">
          {primeiroNome ? `Obrigado, ${primeiroNome}!` : 'Obrigado pelo interesse!'}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          O Labora Vistorias está na fase final de ajustes e o acesso ainda não foi liberado.
          {estado.email ? (
            <>
              {' '}
              Seu cadastro ficou registrado e vamos avisar em{' '}
              <span className="font-semibold text-foreground">{estado.email}</span> quando você
              puder entrar.
            </>
          ) : (
            ' Deixe seu nome e e-mail em "Criar conta" para ser avisado quando o acesso abrir.'
          )}
        </p>
        <p className="mt-3 text-muted-foreground">
          Enquanto isso, veja abaixo como o app funciona e o que você vai poder fazer nele.
        </p>
      </section>

      {/* Manual */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Como o app funciona</h2>
        <p className="mt-2 text-muted-foreground">
          As telas abaixo são do próprio app, com dados de exemplo.
        </p>

        <div className="mt-10 space-y-16">
          {SECOES.map((s) => (
            <article key={s.chave}>
              <h3 className="text-xl font-bold text-foreground">{s.titulo}</h3>
              <div className="mt-3 max-w-3xl space-y-2 text-muted-foreground">
                {s.texto.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </div>
              {imagens[s.chave] && (
                <button
                  type="button"
                  onClick={() => setAmpliada(imagens[s.chave])}
                  className="mt-5 block w-full overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Ampliar imagem: ${s.titulo}`}
                >
                  <img
                    src={imagens[s.chave]}
                    alt={s.titulo}
                    loading="lazy"
                    className="h-auto w-full"
                  />
                </button>
              )}
            </article>
          ))}

          <article>
            <h3 className="text-xl font-bold text-foreground">E também</h3>
            <ul className="mt-3 max-w-3xl list-disc space-y-2 pl-5 text-muted-foreground">
              {EXTRAS.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="mt-16 flex flex-wrap justify-center gap-3">
        <Button asChild className="rounded-full">
          <Link to="/calculadora">Testar a calculadora de multas</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/">Voltar ao site</Link>
        </Button>
      </section>

      {/* Imagem ampliada */}
      {ampliada && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setAmpliada(null)}
        >
          <img
            src={ampliada}
            alt="Captura de tela ampliada"
            className="max-h-full max-w-full rounded-lg"
          />
        </div>
      )}
    </div>
  )
}
