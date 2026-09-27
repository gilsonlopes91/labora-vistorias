/* "Como funciona": explicação, em texto corrido, de toda a lógica do módulo
   de Documentação SST — o fluxo, o GHE, as trilhas de probabilidade, as
   matrizes AIHA, a regra "app sugere, técnico confirma" e como cada
   documento chega na conclusão. Serve de manual para quem usa e de
   referência para quem revisa o método. */
import { Link } from 'react-router-dom'

import { DiagramaProcessoPgr } from '@/components/DiagramaProcessoPgr'
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
              <TableCell>GHE (ou a unidade escolhida — ver seção 3)</TableCell>
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
        <DiagramaProcessoPgr />
        <p>O trabalho segue uma ordem, e cada etapa fica em um lugar do módulo:</p>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            <strong>Planejamento</strong> (aba Levantamento, primeira sub-aba): antes de sair a
            campo, registra-se a data de início, o modo de organização predominante (GHE/GES ou
            atividade/posto/função/setor), a matriz de risco padrão e quem participa.
          </li>
          <li>
            <strong>Estrutura SST</strong>: cadastro dos setores (ambientes de trabalho, com área,
            piso, ventilação), das unidades de avaliação (GHE ou outra — ver seção 3) e das funções
            da empresa.
          </li>
          <li>
            <strong>Inventário de riscos</strong>: uma linha por unidade × agente ou perigo. É aqui
            que entram a fonte geradora, a exposição, os danos possíveis, os controles, o EPI, o
            levantamento preliminar e a trilha de probabilidade.
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
            <strong>Documentos</strong>: para o PGR, um editor por seções (liga/desliga, reordena,
            texto livre) dentro da sub-aba Documentos; o botão "Emitir PDF" gera o documento a
            partir das seções e dos dados atuais de estrutura, inventário e plano de ação, e trava
            aquela versão. Os laudos de insalubridade, periculosidade e o LTCAT, a partir do mesmo
            levantamento, ainda vêm nas próximas etapas.
          </li>
        </ol>
      </Secao>

      <Secao titulo="3. O desenho do processo: planejamento, levantamento preliminar e as regras do manual do MTE">
        <p>
          Esta seção documenta o que foi alinhado ao Manual de Interpretação do capítulo 1.5 da NR-1
          (MTE) — a base oficial usada para desenhar o fluxo do PGR neste app. O plano completo está
          registrado no Projeto (documento "Desenho do processo: PGR, laudos e LTCAT").
        </p>
        <p>
          <strong>GHE/GES é opcional (NR-1, item 13.3.1).</strong> O GHE/GES é a ferramenta da
          NR-09, mas a norma aceita organizar o PGR por atividade, posto de trabalho, função ou
          setor também. Por isso cada unidade de avaliação, na aba Estrutura SST, tem um "tipo de
          agrupamento" (GHE, Atividade, Posto de trabalho, Função ou Setor) — a escolha é do
          profissional, unidade por unidade, e pode ser mista dentro da mesma empresa. Todo o resto
          do inventário funciona igual, seja qual for o tipo escolhido.
        </p>
        <p>
          <strong>Levantamento preliminar (manual, item 9).</strong> Antes da avaliação formal pela
          matriz, cada linha do inventário pode ser marcada como risco evidente, perigo externo ou
          atividade não rotineira. Risco evidente exige ação imediata registrada ali mesmo — não
          espera a categoria de P × S ser calculada, porque a lógica da matriz não se aplica a um
          risco que já é claramente inaceitável.
        </p>
        <p>
          <strong>
            NR específica não atendida eleva a probabilidade ao teto (manual, item 11.4).
          </strong>{' '}
          O exemplo do manual é o dos assentos da NR-17: se existe um requisito específico de outra
          NR aplicável ao perigo e ele não está atendido, a probabilidade vai para o nível máximo da
          matriz automaticamente, não importa a trilha escolhida nem o dado bruto. O inventário tem
          um campo para declarar esse requisito (referência, se está atendido, justificativa) e o
          motor de cálculo aplica a regra sozinho.
        </p>
        <p>
          <strong>"Sem dados suficientes" é uma trilha própria.</strong> Antes só havia "Qualitativa
          (controle)", que pressupõe um julgamento sobre um controle existente. Agora, quando ainda
          não há nem medição nem esse julgamento, o técnico escolhe "Sem dados suficientes": a
          probabilidade fica no teto até a trilha ser trocada por uma das outras, com dado de apoio
          — em vez de forçar uma resposta qualitativa sem base real.
        </p>
        <p>
          <strong>Psicossocial: visível, mas desligada.</strong> A trilha psicossocial continua no
          inventário (para reservar o lugar dela e mostrar onde vai entrar), mas está desabilitada
          por enquanto — a análise psicossocial em si é uma fase futura, feita por questionário e
          observação por unidade, nunca individual.
        </p>
        <p>
          <strong>Terceira matriz: ISO 45002.</strong> Além das duas matrizes AIHA (3×3 e 5×5), o
          app agora oferece uma matriz 5×5 no estilo ISO 45001/45002, como o manual do MTE apresenta
          para ilustrar o GRO. A escolha da metodologia (AIHA ou ISO 45002) e da dimensão pode ser
          feita por avaliação, no inventário, ou definida como padrão da empresa na aba
          Planejamento.
        </p>
      </Secao>

      <Secao titulo="4. O GHE (ou a unidade escolhida) é a base da avaliação">
        <p>
          GHE é o Grupo Homogêneo de Exposição: trabalhadores que executam atividades parecidas, no
          mesmo ambiente, com exposição semelhante. Quando a organização escolhe usar GHE/GES, o PGR
          avalia por GHE; quando escolhe atividade, posto, função ou setor (seção 3), a mesma
          estrutura de dados representa essa unidade. As funções pertencem a uma unidade e herdam as
          avaliações dela; os laudos e o LTCAT concluem por função a partir do que a unidade tem.
        </p>
        <p>
          O critério de agrupamento fica registrado no cadastro da unidade, porque a NR-01 e a
          metodologia AIHA exigem que a escolha do grupo seja justificável.
        </p>
      </Secao>

      <Secao titulo="5. As trilhas de probabilidade">
        <p>
          A severidade segue sempre a mesma tabela (o pior dano plausível). A probabilidade chega
          por caminhos diferentes conforme o tipo de risco e o quanto já se sabe sobre ele, e todos
          são convertidos na mesma escala da matriz — sujeitos às regras de força-máxima da seção 3:
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
              <TableCell className="font-medium">Sem dados suficientes</TableCell>
              <TableCell>Nada ainda — nem medição, nem julgamento sobre um controle</TableCell>
              <TableCell>P no teto da matriz até trocar de trilha</TableCell>
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
              <TableCell className="font-medium">Psicossocial (desligada)</TableCell>
              <TableCell>
                Reservada para a análise por questionário/observação, ainda não feita
              </TableCell>
              <TableCell>—</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Secao>

      <Secao titulo="6. A categoria AIHA de exposição">
        <p>
          A metodologia AIHA julga cada unidade pela exposição comparada ao limite de exposição
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
          <strong>Estatística das medições.</strong> Com 6 ou mais amostras na unidade, o app assume
          distribuição lognormal e calcula média geométrica, desvio-padrão geométrico, o P95 e o
          limite superior de confiança de 95% do P95. A categoria é definida por esse limite
          superior, que é conservador. Com menos de 6 amostras não há base estatística: vale o maior
          valor medido e a incerteza fica alta, o que gera a ação "coletar mais dados".
        </p>
      </Secao>

      <Secao titulo="7. A matriz: AIHA (3×3 ou 5×5) ou ISO 45002">
        <p>
          A matriz pode ser escolhida por avaliação, no inventário, ou definida como padrão da
          empresa na aba Planejamento, e no futuro documento PGR emitido ficará gravada nele. Como a
          avaliação guarda o dado bruto (categoria de exposição, nível de controle, efeito à saúde)
          e não P e S "soltos", trocar a matriz recalcula tudo sem perder nada.
        </p>
        <p>
          As duas matrizes AIHA usam as categorias Trivial, Tolerável, Moderado, Substancial e
          Intolerável; a ISO 45002 usa Baixo, Moderado, Alto e Extremo, no estilo do exemplo do
          manual do MTE. Os critérios completos de cada uma, com a grade colorida, estão na aba{' '}
          <Link to="/documentacao?aba=matrizes" className="underline">
            Matrizes de risco
          </Link>
          .
        </p>
        <p>
          A 3×3 junta "irreversível" e "fatal" na mesma coluna de severidade, por isso o mesmo dado
          pode dar categorias diferentes nas duas matrizes AIHA. Exemplo: dosimetria de ruído com
          dose projetada de 86,7% (categoria 2, acima do nível de ação) e perda auditiva como efeito
          (irreversível, AIHA 3) dá Moderado na 5×5 e Substancial na 3×3.
        </p>
      </Secao>

      <Secao titulo="8. Regras que valem junto com a categoria">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Risco evidente</strong> (seção 3): ação imediata, antes da conclusão formal pela
            matriz.
          </li>
          <li>
            <strong>NR específica não atendida</strong> (seção 3): probabilidade no teto da matriz,
            independente da trilha.
          </li>
          <li>
            <strong>Sem dados suficientes</strong> (seção 3): probabilidade no teto até haver base
            para reavaliar.
          </li>
          <li>
            <strong>Incerteza alta</strong> (agente quantitativo sem medição, ou menos de 6
            amostras): o app avisa para coletar mais dados, mesmo em categorias baixas.
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
            (NR-01, 1.5.5.2.1.1) — o plano já lista primeiro pela categoria de risco e, dentro dela,
            por quem afeta mais gente.
          </li>
        </ul>
      </Secao>

      <Secao titulo="9. Sugerido e final: o app sugere, o técnico decide">
        <p>
          Todo campo de conclusão tem dois valores: o sugerido pelo app e o final, confirmado pelo
          responsável técnico. Isso vale para probabilidade, severidade, grau de insalubridade,
          periculosidade e enquadramento no LTCAT. Quando os dois divergem, a justificativa é
          obrigatória. O documento traz o valor final, não a sugestão; a sugestão fica guardada como
          rastro do método.
        </p>
      </Secao>

      <Secao titulo="10. Como cada documento vai chegar na conclusão">
        <p>
          <strong>PGR.</strong> Inventário com as nove alíneas do item 1.5.7.3.2 da NR-01, plano de
          ação com cronograma, responsáveis e forma de aferição, critérios de avaliação gerados pela
          matriz escolhida. Revisão em 2 anos (3 com certificação), com registro do gatilho quando
          for antecipada.
        </p>
        <p className="text-muted-foreground">
          Na prática: a sub-aba Documentos (dentro de Levantamento) tem um editor por seções — cada
          seção pode ser ligada/desligada, reordenada e ter seu texto editado. Ao emitir, o app gera
          o PDF juntando essas seções com as unidades de avaliação, o inventário de riscos e o plano
          de ação de hoje, calcula o hash do arquivo e trava aquela versão: para mudar qualquer
          coisa depois, é preciso criar uma nova revisão, que fica ligada à versão anterior (que
          passa a "substituída").
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
        <p className="text-muted-foreground">
          Os três laudos já têm campos de conclusão sugerida/final no inventário de riscos (grau de
          insalubridade, enquadramento de periculosidade, enquadramento do LTCAT); o motor de
          cálculo automático e a emissão do documento em si são a próxima fase (seção 11).
        </p>
      </Secao>

      <Secao titulo="11. O catálogo de agentes e a Tabela 24 do eSocial">
        <p>
          Cada agente do catálogo (aba{' '}
          <Link to="/documentacao?aba=catalogo" className="underline">
            Catálogo de agentes
          </Link>
          ) tem nome, tipo (Físico, Químico, Biológico, Ergonômico ou Acidente), o código eSocial
          quando existe, e três campos de exemplo — fonte geradora, possíveis danos à saúde e
          medidas de controle padrão — que servem de ponto de partida para o inventário de riscos e
          podem ser editados.
        </p>
        <p>
          O catálogo oficial da plataforma é somente leitura; para ajustar os exemplos de um agente
          oficial às práticas da sua organização, use "Duplicar para editar" — isso cria uma cópia
          editável na sua organização, sem afetar o catálogo oficial nem as avaliações já feitas.
          Também dá para cadastrar agentes totalmente novos.
        </p>
        <p>
          <strong>Sobre o código eSocial (Tabela 24).</strong> Essa tabela cobre só os agentes
          ligados à aposentadoria especial — grupos Físico, Químico e Biológico, mais o código
          09.01.001 para "sem agente nocivo". Ergonômico e Acidente/mecânico não têm código próprio
          na Tabela 24: isso não é uma lacuna do catálogo, é assim que o eSocial funciona (esses
          riscos entram no PGR, mas não no enquadramento de aposentadoria especial do LTCAT). Nos
          agentes Físico/Químico/Biológico onde o código ainda aparece vazio, é porque as fontes
          públicas consultadas divergem entre si na numeração exata — preencher errado é pior do que
          deixar em branco, já que o eSocial valida o código. Confira contra a tabela oficial antes
          de usar em produção.
        </p>
      </Secao>

      <Secao titulo="12. Assinatura eletrônica ao emitir, e o que o cliente vê">
        <p>
          Ao emitir o PDF do PGR (e, do mesmo jeito, o relatório de vistoria), o app pede a senha de
          quem está emitindo — confirma que é mesmo aquela pessoa antes de gerar o documento. Só
          depois disso o PDF é criado e a versão trava.
        </p>
        <p>
          O documento final traz um carimbo de "assinatura eletrônica": nome do profissional,
          conselho/registro/UF, data e hora da confirmação por senha, e um link curto de
          verificação. Qualquer pessoa que receba o PDF pode abrir esse link (sem precisar de login)
          para conferir os dados de emissão e, se quiser, enviar o próprio arquivo para comparar — a
          conferência do arquivo é feita no navegador de quem está verificando, o app nunca recebe
          esse arquivo.
        </p>
        <p>
          Esse é o nível 1 de assinatura: reautenticação por senha, carimbo e verificação pública.
          Não é assinatura com certificado ICP-Brasil nem integração com um provedor (ZapSign,
          D4Sign, Clicksign, Autentique) — isso fica para uma etapa futura, como um adicional pago.
        </p>
        <p>
          <strong>O que o cliente da empresa vistoriada enxerga.</strong> Quando a organização dá
          acesso ao portal do cliente para alguém da empresa vistoriada, essa pessoa só vê o que já
          foi concluído e emitido: vistorias concluídas (com o PDF e o link de verificação) e
          documentos de SST emitidos — nunca rascunhos, nem o PGR ainda em elaboração. Ela também
          acompanha e atualiza o andamento do plano de ação das próprias empresas, e responde a
          propostas de orçamento.
        </p>
      </Secao>

      <Secao titulo="13. O que já está pronto e o que vem">
        <p>
          <strong>Pronto:</strong> planejamento do PGR por empresa; estrutura da empresa (setores,
          unidades de avaliação com GHE/GES opcional, funções); catálogo de agentes editável (com
          exemplos de fonte geradora, danos à saúde e medidas de controle); três matrizes de risco
          (AIHA 3×3, AIHA 5×5 e ISO 45002 5×5); o inventário de riscos com as trilhas de
          probabilidade (incluindo "sem dados suficientes"), o levantamento preliminar (risco
          evidente, perigo externo, atividade não rotineira), a regra de NR específica não atendida,
          e a sugestão de P e S; as medições com a estatística lognormal; o plano de ação com
          geração de sugestões, priorizado por categoria de risco e número de expostos; e, para o
          PGR, o editor de documento por seções com emissão em PDF e trava de versão (nova revisão
          para editar depois de emitido).
        </p>
        <p>
          <strong>Próximas etapas:</strong> vínculo das fichas de campo de calor e ruído com as
          medições; conversão de item não conforme de vistoria em perigo de acidente; registro de
          cenários de emergência; biblioteca de textos-padrão reutilizáveis no editor de documentos;
          motores de cálculo automático e documentos dos laudos de insalubridade e periculosidade;
          LTCAT com o checklist do art. 276; análise de acidentes; assinatura digital; link de
          disponibilização pública do documento emitido; e alertas de revisão. A análise
          psicossocial (seção 3) fica para depois dessas etapas. Vídeos explicando o uso ficam para
          uma fase posterior, depois que o fluxo estiver fechado de ponta a ponta.
        </p>
      </Secao>
    </div>
  )
}

export default DocumentacaoComoFunciona
