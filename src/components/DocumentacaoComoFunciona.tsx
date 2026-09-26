/* "Como funciona": explicação, em texto corrido, de toda a lógica do módulo
   de Documentação SST — o fluxo, o GHE, as trilhas de probabilidade, as
   matrizes AIHA, a regra "app sugere, técnico confirma" e como cada
   documento chega na conclusão. Serve de manual para quem usa e de
   referência para quem revisa o método. */
import { Link } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed">{children}</CardContent>
    </Card>
  )
}

export function DocumentacaoComoFunciona() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Como funciona a Documentação SST</h2>
        <p className="text-sm text-muted-foreground">
          Um levantamento de campo alimenta quatro documentos: PGR, laudo de insalubridade, laudo de
          periculosidade e LTCAT. Esta página explica o método por trás das telas.
        </p>
      </div>

      <Secao titulo="1. A ideia central: um levantamento, quatro documentos">
        <p>
          O mesmo trabalho de campo serve para os quatro documentos. O que muda entre eles é a régua
          de comparação e a conclusão: o PGR olha para prevenção (NR-01 e NR-09), o laudo de
          insalubridade para o adicional da NR-15, o de periculosidade para o adicional da NR-16, e
          o LTCAT para a aposentadoria especial (Lei 8.213, art. 58, e IN 128 do INSS).
        </p>
        <p>
          Por isso a avaliação guarda o dado bruto uma vez só: a medição, a descrição da exposição e
          os controles existentes. Cada documento tem seu próprio motor de conclusão sobre esse
          dado. O app sugere; o responsável técnico confirma ou muda, e mudar exige justificativa.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>PGR</TableHead>
              <TableHead>Insalubridade</TableHead>
              <TableHead>Periculosidade</TableHead>
              <TableHead>LTCAT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Unidade de análise</TableCell>
              <TableCell>GHE</TableCell>
              <TableCell>Função</TableCell>
              <TableCell>Função</TableCell>
              <TableCell>Função (e GHE)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Riscos que entram</TableCell>
              <TableCell>Todos, inclusive ergonômicos, acidentes e psicossociais</TableCell>
              <TableCell>Agentes dos Anexos 1 a 14 da NR-15</TableCell>
              <TableCell>Atividades dos Anexos 1 a 5 da NR-16 e radiação ionizante</TableCell>
              <TableCell>Agentes do Anexo IV do Decreto 3.048</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Ruído</TableCell>
              <TableCell>Nível de ação: 50% da dose</TableCell>
              <TableCell>Dose com q = 5, limite 100%</TableCell>
              <TableCell>não se aplica</TableCell>
              <TableCell>NEN com q = 3 (NHO 01) acima de 85 dB(A)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">EPI</TableCell>
              <TableCell>Último nível da hierarquia</TableCell>
              <TableCell>Pode neutralizar, com uso comprovado</TableCell>
              <TableCell>Não neutraliza</TableCell>
              <TableCell>
                No ruído nunca descaracteriza; nos demais, só com os 5 requisitos do art. 291 da IN
                128
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Conclusão</TableCell>
              <TableCell>Categoria de risco e plano de ação</TableCell>
              <TableCell>Grau 10, 20 ou 40% (só o maior por função)</TableCell>
              <TableCell>30% ou não devido</TableCell>
              <TableCell>Enquadra ou não; 15, 20 ou 25 anos; código do Anexo IV</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Secao>

      <Secao titulo="2. O fluxo dentro do app">
        <p>O trabalho segue uma ordem, e cada etapa fica em um lugar do módulo:</p>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            <strong>Estrutura SST</strong> (aba Levantamento): cadastro dos setores (ambientes de
            trabalho, com área, piso, ventilação), dos GHE e das funções da empresa.
          </li>
          <li>
            <strong>Inventário de riscos</strong>: uma linha por GHE × agente ou perigo. É aqui que
            entram a fonte geradora, a exposição, os danos possíveis, os controles, o EPI e a trilha
            de probabilidade.
          </li>
          <li>
            <strong>Medições</strong>: dentro da avaliação com trilha quantitativa, as amostras de
            campo (data, metodologia, equipamento, resultado). Com 6 ou mais amostras, o app calcula
            a estatística e sugere a categoria de exposição.
          </li>
          <li>
            <strong>Plano de ação</strong>: as medidas de controle, ordenadas pela categoria de
            risco e pelo número de expostos (NR-01, 1.5.5.2.1.1). Avaliações Substanciais e
            Intoleráveis sem ação geram sugestões com um clique.
          </li>
          <li>
            <strong>Documentos</strong> (próxima fase): editor por seções, escolha da matriz no PGR,
            prévia em PDF, emissão com trava e versão.
          </li>
        </ol>
      </Secao>

      <Secao titulo="3. O GHE é a unidade de avaliação">
        <p>
          GHE é o Grupo Homogêneo de Exposição: trabalhadores que executam atividades parecidas, no
          mesmo ambiente, com exposição semelhante. O PGR avalia por GHE. As funções pertencem a um
          GHE e herdam as avaliações dele; os laudos e o LTCAT concluem por função a partir do que o
          GHE tem.
        </p>
        <p>
          O critério de agrupamento fica registrado no cadastro do GHE, porque a NR-01 e a
          metodologia AIHA exigem que a escolha do grupo seja justificável.
        </p>
      </Secao>

      <Secao titulo="4. As cinco trilhas de probabilidade">
        <p>
          A severidade segue sempre a mesma tabela (o pior dano plausível). A probabilidade chega
          por caminhos diferentes conforme o tipo de risco, e todos são convertidos na mesma escala
          da matriz:
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trilha</TableHead>
              <TableHead>O que o técnico informa</TableHead>
              <TableHead>Como vira probabilidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Quantitativa (medição)</TableCell>
              <TableCell>As medições; o app calcula a exposição em relação ao limite</TableCell>
              <TableCell>Categoria AIHA de exposição 0–4 → P</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Qualitativa (controle)</TableCell>
              <TableCell>
                Nível do controle existente, em 5 graus (de "excelente" a "inexistente")
              </TableCell>
              <TableCell>Direto para P; a incerteza fica alta</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Acidente/mecânico</TableCell>
              <TableCell>Frequência de exposição ao perigo e eficácia das medidas</TableCell>
              <TableCell>Mesmo quadro da trilha qualitativa</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Ergonômica (AEP/AET)</TableCell>
              <TableCell>Resultado da análise ergonômica: baixo, médio ou alto</TableCell>
              <TableCell>Baixo → P2, médio → P3, alto → P4 na 5×5 (P1/P2/P3 na 3×3)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Psicossocial</TableCell>
              <TableCell>Avaliação por GHE (questionário, observação), nunca individual</TableCell>
              <TableCell>Mesma conversão da ergonômica</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Secao>

      <Secao titulo="5. A categoria AIHA de exposição">
        <p>
          A metodologia AIHA julga cada GHE pela exposição comparada ao limite de exposição
          ocupacional (LEO). O app usa cinco categorias, medidas pela razão exposição ÷ limite:
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead>Exposição em relação ao limite</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>0</TableCell>
              <TableCell>abaixo de 10%</TableCell>
              <TableCell>Trivial</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>1</TableCell>
              <TableCell>10% a 50%</TableCell>
              <TableCell>Bem controlada</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>2</TableCell>
              <TableCell>50% a 100%</TableCell>
              <TableCell>Acima do nível de ação: monitoramento e PCMSO</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>3</TableCell>
              <TableCell>100% a 500%</TableCell>
              <TableCell>Acima do limite</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>4</TableCell>
              <TableCell>acima de 500%</TableCell>
              <TableCell>Muito acima do limite</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p>
          <strong>Estatística das medições.</strong> Com 6 ou mais amostras no GHE, o app assume
          distribuição lognormal e calcula média geométrica, desvio-padrão geométrico, o P95 e o
          limite superior de confiança de 95% do P95. A categoria é definida por esse limite
          superior, que é conservador. Com menos de 6 amostras não há base estatística: vale o maior
          valor medido e a incerteza fica alta, o que gera a ação "coletar mais dados".
        </p>
      </Secao>

      <Secao titulo="6. A matriz: 3×3 ou 5×5">
        <p>
          A matriz é escolhida no documento PGR e fica gravada nele. Como a avaliação guarda o dado
          bruto (categoria de exposição, nível de controle, efeito à saúde) e não P e S "soltos",
          trocar a matriz recalcula tudo sem perder nada. Dois PGRs da mesma empresa podem usar
          matrizes diferentes.
        </p>
        <p>
          As duas matrizes usam as mesmas cinco categorias — Trivial, Tolerável, Moderado,
          Substancial e Intolerável — então a tabela de ações e prazos é uma só. Os critérios
          completos de cada uma, com a grade colorida, estão na aba{' '}
          <Link to="/documentacao?aba=matrizes" className="underline">
            Matrizes de risco
          </Link>
          .
        </p>
        <p>
          A 3×3 junta "irreversível" e "fatal" na mesma coluna de severidade, por isso o mesmo dado
          pode dar categorias diferentes nas duas matrizes. Exemplo: dosimetria de ruído com dose
          projetada de 86,7% (categoria 2, acima do nível de ação) e perda auditiva como efeito
          (irreversível, AIHA 3) dá Moderado na 5×5 e Substancial na 3×3.
        </p>
      </Secao>

      <Secao titulo="7. Regras que valem junto com a categoria">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Incerteza alta</strong> (agente quantitativo sem medição, ou menos de 6
            amostras): o app avisa para coletar mais dados, mesmo em Trivial ou Tolerável.
          </li>
          <li>
            <strong>Acima do nível de ação</strong> (categoria 2 ou mais): monitoramento sistemático
            e inclusão no PCMSO (NR-09, 9.6.1.2; NR-07, 7.5.1), qualquer que seja a categoria da
            matriz.
          </li>
          <li>
            <strong>Mais de uma consequência possível</strong>: vale a de maior severidade (NR-01,
            1.5.4.4.4.1).
          </li>
          <li>
            <strong>Número de expostos</strong>: não muda a categoria, mas ordena o plano de ação
            (NR-01, 1.5.5.2.1.1).
          </li>
        </ul>
      </Secao>

      <Secao titulo="8. Sugerido e final: o app sugere, o técnico decide">
        <p>
          Todo campo de conclusão tem dois valores: o sugerido pelo app e o final, confirmado pelo
          responsável técnico. Isso vale para probabilidade, severidade, grau de insalubridade,
          periculosidade e enquadramento no LTCAT. Quando os dois divergem, a justificativa é
          obrigatória. O documento traz o valor final, não a sugestão; a sugestão fica guardada como
          rastro do método.
        </p>
      </Secao>

      <Secao titulo="9. Como cada documento chega na conclusão">
        <p>
          <strong>PGR.</strong> Inventário com as nove alíneas do item 1.5.7.3.2 da NR-01, plano de
          ação com cronograma, responsáveis e forma de aferição, critérios de avaliação gerados pela
          matriz escolhida. Revisão em 2 anos (3 com certificação), com registro do gatilho quando
          for antecipada.
        </p>
        <p>
          <strong>Laudo de insalubridade.</strong> Agentes quantitativos comparados com o limite do
          catálogo (Anexos 1, 2, 3, 5, 8, 11 e 12 da NR-15); qualitativos pela atividade listada no
          anexo (6, 7, 9, 10, 13 e 14). EPI só neutraliza com CA válido, fornecimento registrado e
          uso comprovado. Por função, só o maior grau. Aviso quando a função também tem
          periculosidade, porque não há cumulação.
        </p>
        <p>
          <strong>Laudo de periculosidade.</strong> Por função e anexo da NR-16 (explosivos,
          inflamáveis, segurança patrimonial, energia elétrica, motocicleta) mais radiação
          ionizante. Exposição permanente ou intermitente é devida; eventual ou de tempo
          extremamente reduzido não é (Súmula 364 do TST).
        </p>
        <p>
          <strong>LTCAT.</strong> Por função e agente: está no Anexo IV? A exposição é habitual e
          permanente? Está acima do critério da IN 128? EPC só conta com plano de manutenção
          registrado. EPI no ruído nunca descaracteriza; nos demais agentes, só com os 5 requisitos
          do art. 291 marcados. Saída: enquadra ou não, 15/20/25 anos, código do Anexo IV e da
          Tabela 24 do eSocial. Sem os 12 elementos do art. 276, o LTCAT não é emitido.
        </p>
      </Secao>

      <Secao titulo="10. O que já está pronto e o que vem">
        <p>
          <strong>Pronto:</strong> estrutura da empresa (setores, GHE, funções), catálogo inicial de
          agentes, as duas matrizes AIHA, o inventário de riscos com as cinco trilhas e a sugestão
          de P e S, as medições com a estatística lognormal, e o plano de ação com geração de
          sugestões.
        </p>
        <p>
          <strong>Próximas etapas:</strong> vínculo das fichas de campo de calor e ruído com as
          medições; conversão de item não conforme de vistoria em perigo de acidente; editor de
          documentos por seções com biblioteca de textos e emissão do PGR em PDF; motores e
          documentos dos laudos de insalubridade e periculosidade; LTCAT com o checklist do art.
          276; alertas de revisão, link de disponibilização e envio do PDF assinado.
        </p>
        <p className="text-muted-foreground">
          Os códigos da Tabela 24 do eSocial e do Anexo IV só entram no catálogo depois de
          conferidos na fonte oficial; por isso vários agentes ainda aparecem sem código.
        </p>
      </Secao>
    </div>
  )
}

export default DocumentacaoComoFunciona
