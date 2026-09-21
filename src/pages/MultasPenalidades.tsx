/* Página informativa: como a multa de cada não conformidade é calculada.
   Não é calculadora nem configuração — é a referência que explica de onde sai
   cada número mostrado na vistoria, e o que a NR-28 prevê mas o app não
   calcula. */
import TabelaAnexoI from '@/components/TabelaAnexoI'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function Secao({
  titulo,
  chamada,
  children,
}: {
  titulo: string
  chamada?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{titulo}</CardTitle>
        {chamada && <p className="text-sm text-muted-foreground">{chamada}</p>}
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed">{children}</CardContent>
    </Card>
  )
}

function Passo({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold text-muted-foreground">
        {n}
      </div>
      <div className="space-y-1">
        <div className="font-medium">{titulo}</div>
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}

export default function MultasPenalidades() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-xl font-bold">Multas e penalidades</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          De onde vem o valor que aparece em cada item marcado como não conforme, e o que a NR-28
          prevê além disso.
        </p>
      </div>

      <Secao
        titulo="Três regimes de cálculo"
        chamada="A NR-28 não tem uma conta só. Cada checklist declara qual regime segue."
      >
        <div className="space-y-3">
          <div>
            <div className="font-medium">Anexo I — regra geral</div>
            <p className="text-muted-foreground">
              Vale para a maioria das NRs. O Anexo II da NR-28 dá a infração (1 a 4) e o tipo do
              item — S de Segurança do Trabalho ou M de Medicina do Trabalho. O Anexo I cruza isso
              com a faixa de número de empregados da empresa e devolve um intervalo em UFIR,
              convertido para reais. Na grade do Anexo I essa escala aparece como I1, I2, I3 e I4.
            </p>
          </div>
          <div>
            <div className="font-medium">Anexo I-A — trabalho portuário (NR-29)</div>
            <p className="text-muted-foreground">
              Mesma estrutura de infração, tipo e faixa, mas em uma tabela própria, cujos valores já
              estão fixados em reais na norma. Não entra a conversão da UFIR.
            </p>
          </div>
          <div>
            <div className="font-medium">Art. 18 da Lei 5.889/1973 — rural (NR-31)</div>
            <p className="text-muted-foreground">
              Desde a Portaria MTE nº 104/2026, o item 28.3.2 tirou o rural da grade do Anexo I. Não
              existe infração I1 a I4, tipo nem faixa de porte: é um valor fixo por empregado em
              situação irregular.
            </p>
          </div>
        </div>
      </Secao>

      <Secao
        titulo="Regra geral, passo a passo"
        chamada="O caminho percorrido pelo cálculo em todo item fora do portuário e do rural."
      >
        <div className="space-y-4">
          <Passo n={1} titulo="Infração e tipo do item">
            Vêm do Anexo II da NR-28, já gravados em cada item do checklist. A infração mede a
            gravidade, de 1 a 4 — I1 a I4 na grade do Anexo I. O tipo separa Segurança do Trabalho
            de Medicina do Trabalho, porque o art. 201 da CLT fixa tetos diferentes para as duas —
            por isso a tabela de medicina é sempre menor. Cuidado para não confundir essa escala com
            o grau de risco da NR-4, que também vai de 1 a 4 e é outra coisa.
          </Passo>
          <Passo n={2} titulo="Faixa de número de empregados">
            São oito faixas, da menor (01 a 10) à maior (mais de 1000). O app usa o número de
            empregados cadastrado na empresa.
          </Passo>
          <Passo n={3} titulo="Cruzamento na tabela">
            Faixa, infração e tipo apontam uma célula do Anexo I, que traz um valor mínimo e um
            máximo em UFIR.
          </Passo>
          <Passo n={4} titulo="Conversão para reais">
            A UFIR foi extinta em 2000 e congelada em R$ 1,0641. O app multiplica mínimo e máximo
            por esse fator, que fica ajustável em Configurações.
          </Passo>
        </div>
        <Separator />
        <p className="text-muted-foreground">
          O resultado é sempre um intervalo, nunca um valor único. Quem arbitra o ponto dentro dele
          é o agente da inspeção do trabalho, pelos critérios do art. 75 da Portaria MTP nº 667/2021
          — natureza da infração, intenção do infrator, meios ao seu alcance para cumprir a lei,
          extensão da infração e situação econômico-financeira.
        </p>
      </Secao>

      <Card>
        <CardContent className="pt-6">
          <TabelaAnexoI />
        </CardContent>
      </Card>

      <Secao
        titulo="Trabalho portuário (NR-29)"
        chamada="Anexo I-A da NR-28, incluído pela Portaria SIT nº 319, de 15/05/2012."
      >
        <p className="text-muted-foreground">
          A diferença que mais engana: esta tabela não é expressa em UFIR. A norma já publica os
          valores em reais, então aplicar o fator de 1,0641 sobre ela infla a multa. Na infração I1,
          tipo Segurança do Trabalho, faixa de 01 a 10 empregados, a diferença é entre R$ 575,00
          pelo Anexo I-A e R$ 670,38 se fosse calculado pela grade geral.
        </p>
        <p className="text-muted-foreground">
          O teto também é outro: R$ 5.750,00 em segurança e R$ 3.450,00 em medicina, contra 6.304 e
          3.782 UFIR da grade geral.
        </p>
        <div className="pt-1">
          <TabelaAnexoI anexo="ia" />
        </div>
      </Secao>

      <Secao
        titulo="Trabalho rural (NR-31)"
        chamada="Item 28.3.2 da NR-28, com a redação da Portaria MTE nº 104/2026."
      >
        <p className="text-muted-foreground">
          A multa é por empregado em situação irregular, dobrada em caso de reincidência, embaraço
          ou resistência à fiscalização. O valor do art. 18 da Lei 5.889/1973 é de R$ 380,00 no
          texto da lei, e de R$ 392,89 depois do reajuste da Portaria MTE nº 1.131/2025. A vistoria
          deixa escolher qual base usar.
        </p>
        <p className="text-muted-foreground">
          Quantos empregados entram na conta depende da natureza do item. Infração coletiva — falta
          de PGRTR, por exemplo — alcança todos os empregados do estabelecimento. Infração
          individual, como exame médico, alcança só os empregados efetivamente atingidos. Deixar o
          campo em branco na resposta faz o app tratar como coletiva.
        </p>
      </Secao>

      <Secao
        titulo="O que a NR-28 prevê e o app não calcula"
        chamada="Fica aqui como informação. O valor estimado na vistoria não substitui o auto de infração."
      >
        <div className="space-y-3 text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">Reincidência e agravantes.</span> Em caso
            de reincidência, embaraço ou resistência à fiscalização, artifício ou simulação para
            fraudar a lei, o art. 201, parágrafo único, da CLT manda aplicar o valor máximo da
            tabela — 6.304 UFIR em segurança e 3.782 em medicina. Isso anula porte e infração: uma
            empresa de quatro empregados reincidente paga o mesmo que uma de três mil. Reincidente,
            pelo art. 25 da Portaria MTP nº 667/2021, é quem é autuado pelo mesmo dispositivo antes
            de dois anos da decisão definitiva da autuação anterior.
          </div>
          <div>
            <span className="font-medium text-foreground">Infrações de natureza individual.</span>{' '}
            Fora do rural, itens que se materializam em cada trabalhador — ASO, EPI, treinamento —
            costumam ser autuados por trabalhador, multiplicando o valor unitário. O app mostra a
            multa unitária.
          </div>
          <div>
            <span className="font-medium text-foreground">Dupla visita.</span> Não é cálculo, é
            condição de validade do auto. O art. 627 da CLT exige a dupla visita quando a norma é
            nova e na primeira inspeção de estabelecimento recém-inaugurado; o art. 55 da Lei
            Complementar nº 123/2006 estende o critério a microempresas e empresas de pequeno porte,
            com exceções. Se era cabível e não foi observada, o auto cai.
          </div>
          <div>
            <span className="font-medium text-foreground">Redução de 50%.</span> O art. 39, § 3º da
            Portaria MTP nº 667/2021 reduz a multa pela metade se o autuado recolher em dez dias do
            recebimento da notificação da decisão.
          </div>
          <div>
            <span className="font-medium text-foreground">Reajuste anual.</span> O item 28.3.3,
            também novo em 2026, manda reajustar anualmente os valores da NR-28 conforme o art. 634,
            § 2º da CLT. Enquanto o Ministério do Trabalho não publica a tabela convertida, segue
            valendo a conversão pela UFIR congelada.
          </div>
        </div>
      </Secao>

      <Secao titulo="Base legal">
        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
          <li>NR-28 — Fiscalização e Penalidades, Anexos I, I-A e II</li>
          <li>
            Portaria MTE nº 104, de 29/01/2026 — nova redação dos itens 28.1.1, 28.1.3 e 28.3.2
          </li>
          <li>Portaria SIT nº 319, de 15/05/2012 — Anexo I-A, trabalho portuário</li>
          <li>CLT, arts. 201, 627 e 634, § 2º</li>
          <li>Lei nº 5.889/1973, art. 18 — trabalho rural</li>
          <li>Portaria MTP nº 667/2021, arts. 25, 39 e 75</li>
          <li>Portaria MTE nº 1.131, de 03/07/2025 — reajuste do valor rural</li>
        </ul>
      </Secao>
    </div>
  )
}
