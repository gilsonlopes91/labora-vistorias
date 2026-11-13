/* Página "Como funciona" da Documentação SST: guia curto para quem usa o
   módulo. Fala só do que existe na tela hoje. */
import { Link } from 'react-router-dom'

const PASSOS: { titulo: string; texto: string }[] = [
  {
    titulo: 'Escolha a empresa',
    texto:
      'Em Levantamento, clique na empresa. Se ela ainda não tem nada cadastrado e você já fez o levantamento de outra parecida, dá para copiar os ambientes, os grupos, as funções e os riscos da outra. Os riscos copiados vêm sem probabilidade e sem severidade, para você avaliar de novo.',
  },
  {
    titulo: 'Planejamento',
    texto:
      'Data de início do levantamento, como a empresa será organizada (por GHE, por função, por setor ou misto), a matriz de risco e quem participa.',
  },
  {
    titulo: 'Ambiente, Função e GHE',
    texto:
      'Cadastre os ambientes de trabalho, as funções e, se for usar, os grupos de exposição. Os riscos são lançados dentro da função ou do GHE: agente, fonte, danos possíveis, controles existentes, EPI, probabilidade e severidade. Quando houver medição, ela entra no próprio risco.',
  },
  {
    titulo: 'Plano de ação',
    texto:
      'As medidas de controle, com responsável e prazo. O botão de sugerir ações cria uma ação para cada risco alto que ainda não tem nenhuma.',
  },
  {
    titulo: 'Documentos',
    texto:
      'Escolha o documento (PGR, LTCAT, laudo de insalubridade ou laudo de periculosidade), confira os dados e resolva as pendências na própria lista. As obrigatórias bloqueiam o documento; as opcionais, se ficarem em branco, saem em branco. "Baixar PDF" gera o arquivo sem assinatura e mantém o rascunho. "Baixar e assinar" pede a sua senha, assina e trava a versão.',
  },
]

const COMPARACAO: { linha: string; pgr: string; insal: string; peric: string; ltcat: string }[] = [
  {
    linha: 'Para que serve',
    pgr: 'Prevenção (NR-01 e NR-09)',
    insal: 'Adicional da NR-15',
    peric: 'Adicional da NR-16',
    ltcat: 'Aposentadoria especial',
  },
  {
    linha: 'Conclui por',
    pgr: 'GHE ou a unidade escolhida',
    insal: 'Função',
    peric: 'Função',
    ltcat: 'Função',
  },
  {
    linha: 'Riscos que entram',
    pgr: 'Todos, inclusive ergonômicos e de acidente',
    insal: 'Agentes dos anexos da NR-15',
    peric: 'Atividades dos anexos da NR-16',
    ltcat: 'Agentes do Anexo IV do Decreto 3.048',
  },
  {
    linha: 'Conclusão',
    pgr: 'Nível de risco e plano de ação',
    insal: 'Grau de 10, 20 ou 40%',
    peric: '30% ou não devido',
    ltcat: 'Enquadra ou não, e o tempo',
  },
]

export function DocumentacaoComoFunciona() {
  return (
    <div className="max-w-3xl space-y-8 text-sm leading-relaxed">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Um levantamento, quatro documentos</h2>
        <p className="text-muted-foreground">
          Você faz o levantamento de campo uma vez e ele alimenta o PGR, o LTCAT e os laudos de
          insalubridade e de periculosidade. O que muda de um documento para o outro é a régua de
          comparação e a conclusão.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Passo a passo</h2>
        <ol className="space-y-3">
          {PASSOS.map((p, i) => (
            <li key={p.titulo} className="rounded-lg border bg-card p-4">
              <p className="font-medium">
                {i + 1}. {p.titulo}
              </p>
              <p className="mt-1 text-muted-foreground">{p.texto}</p>
            </li>
          ))}
        </ol>
        <p>
          <Link
            to="/documentacao?aba=levantamento"
            className="font-medium text-primary underline underline-offset-2"
          >
            Ir para o Levantamento
          </Link>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">O que muda em cada documento</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="p-3 font-medium" />
                <th scope="col" className="p-3 font-medium">
                  PGR
                </th>
                <th scope="col" className="p-3 font-medium">
                  Insalubridade
                </th>
                <th scope="col" className="p-3 font-medium">
                  Periculosidade
                </th>
                <th scope="col" className="p-3 font-medium">
                  LTCAT
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARACAO.map((c) => (
                <tr key={c.linha} className="border-t align-top">
                  <th scope="row" className="p-3 font-medium">
                    {c.linha}
                  </th>
                  <td className="p-3 text-muted-foreground">{c.pgr}</td>
                  <td className="p-3 text-muted-foreground">{c.insal}</td>
                  <td className="p-3 text-muted-foreground">{c.peric}</td>
                  <td className="p-3 text-muted-foreground">{c.ltcat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">O sistema sugere, você decide</h2>
        <p className="text-muted-foreground">
          A probabilidade, a severidade e as conclusões de insalubridade, periculosidade e LTCAT
          aparecem como sugestão. Vale o que você confirmar. Quando mudar a sugestão, o sistema pede
          a justificativa, e o documento sai com o valor que você definiu.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Assinatura e conferência</h2>
        <p className="text-muted-foreground">
          O documento assinado leva o nome e o registro do profissional, a data e a hora da
          assinatura e um link de conferência. Quem recebe o PDF abre o link, sem precisar de login,
          e confere os dados de emissão. A assinatura é feita com a sua senha; não é certificado
          digital ICP-Brasil.
        </p>
        <p className="text-muted-foreground">
          Documento assinado não é mais alterado. Para mudar, crie uma nova revisão: ela nasce como
          rascunho e, quando for assinada, a versão anterior fica marcada como substituída.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">O que o seu cliente vê</h2>
        <p className="text-muted-foreground">
          Quem tem acesso ao portal do cliente vê só os documentos já assinados e as vistorias
          concluídas da própria empresa. Rascunho não aparece.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Catálogos</h2>
        <p className="text-muted-foreground">
          O catálogo de agentes traz o nome, o tipo, o código do eSocial quando existe e exemplos de
          fonte, danos e medidas de controle, que servem de ponto de partida ao lançar um risco. O
          catálogo da plataforma não é editável; para adaptar um agente, duplique e edite a cópia. O
          catálogo de EPIs guarda os equipamentos e o número do CA.
        </p>
      </section>
    </div>
  )
}
