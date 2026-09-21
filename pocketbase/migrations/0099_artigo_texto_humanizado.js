// Reescreve o texto do primeiro post do blog em linguagem natural.
// Sai o travessão, saem os negritos decorativos, saem as construções que
// denunciam texto gerado por IA (fecho de efeito, "não é X, é Y", frases de
// três partes por hábito, promessa de futuro no fim). O conteúdo técnico e as
// referências legais continuam os mesmos.
//
// Substitui o conteúdo inteiro, então roda uma vez só: se o texto já tiver
// sido editado pelo editor de artigos depois desta migration, a edição manual
// prevalece e esta migration não roda de novo.
migrate(
  (app) => {
    let rec
    try {
      rec = app.findFirstRecordByData('artigos', 'slug', 'como-a-multa-da-nr-28-e-calculada')
    } catch (_) {
      return
    }

    const conteudo =
      '<h2>Não existe uma conta só</h2>' +
      '<p>Quando chega um auto de infração, a primeira reação é procurar a tabela da NR-28. O problema é que existem três, e qual delas vale depende da norma que foi descumprida. Duas fogem da grade que quase todo mundo conhece.</p>' +
      '<h2>A regra geral</h2>' +
      '<p>Vale para a maior parte das Normas Regulamentadoras e funciona em quatro passos.</p>' +
      '<h3>1. O item tem infração e tipo</h3>' +
      '<p>O Anexo II da NR-28 percorre item por item de cada NR e atribui a cada um uma infração, de 1 a 4, conforme a gravidade. Atribui também um tipo, S para Segurança do Trabalho e M para Medicina do Trabalho. Na grade do Anexo I essa escala aparece como I1, I2, I3 e I4.</p>' +
      '<p>Vale um cuidado aqui. A infração I1 a I4 não tem relação com o grau de risco da NR-4, que também vai de 1 a 4. São escalas diferentes, e confundir uma com a outra é mais comum do que parece.</p>' +
      '<p>A separação entre S e M existe porque o art. 201 da CLT fixou tetos diferentes para cada uma. Por isso a tabela de medicina fica sempre abaixo da de segurança.</p>' +
      '<h3>2. O porte entra pelo número de empregados</h3>' +
      '<p>São oito faixas, da menor, de 1 a 10 empregados, até a maior, acima de mil. A base é o número de empregados do estabelecimento autuado, e não o da empresa inteira. Para quem tem várias unidades, isso muda bastante o valor.</p>' +
      '<h3>3. O cruzamento aponta uma célula</h3>' +
      '<p>Faixa, infração e tipo levam a uma célula do Anexo I, com um valor mínimo e um máximo, os dois expressos em UFIR.</p>' +
      '<h3>4. A UFIR vira real</h3>' +
      '<p>A UFIR foi extinta em 2000 e ficou congelada em R$ 1,0641. Multiplique o mínimo e o máximo da célula por esse fator e você chega ao intervalo em reais.</p>' +
      '<p>O resultado é sempre um intervalo. Quem escolhe o ponto dentro dele é o agente da inspeção do trabalho, pelos critérios do art. 75 da Portaria MTP nº 667/2021: natureza da infração, intenção do infrator, meios ao seu alcance para cumprir a lei, extensão da infração e situação econômico-financeira do infrator.</p>' +
      '<h2>Trabalho portuário usa outra tabela</h2>' +
      '<p>As infrações da NR-29 não passam pelo Anexo I. Elas usam o Anexo I-A, que entrou na NR-28 pela Portaria SIT nº 319, de 2012.</p>' +
      '<p>A estrutura é parecida, com as mesmas oito faixas, os mesmos quatro níveis de infração e a mesma divisão entre segurança e medicina. A diferença está num detalhe que passa despercebido com frequência. Essa tabela não é expressa em UFIR. A norma já publica os valores em reais, e quem aplica o fator de 1,0641 sobre ela acaba inflando a multa.</p>' +
      '<p>Dá para ver isso na primeira célula. Infração I1, tipo segurança, empresa de 1 a 10 empregados: são R$ 575,00 pelo Anexo I-A. Pela grade geral dariam R$ 670,38. Os tetos também mudam, R$ 5.750,00 em segurança e R$ 3.450,00 em medicina.</p>' +
      '<h2>No rural não tem tabela</h2>' +
      '<p>Essa mudança é recente e ainda pouco conhecida. Desde 30 de janeiro de 2026, com a nova redação do item 28.3.2 dada pela Portaria MTE nº 104/2026, as infrações da NR-31 saíram da grade do Anexo I.</p>' +
      '<p>Passaram a seguir o art. 18 da Lei nº 5.889/1973, que fixa um valor por empregado em situação irregular, dobrado em caso de reincidência, embaraço ou resistência à fiscalização. A infração I1 a I4 e a faixa de porte deixam de entrar na conta. O valor literal da lei é R$ 380,00, e o reajustado pela Portaria MTE nº 1.131/2025 é R$ 392,89.</p>' +
      '<p>Quantos empregados entram na conta depende do item. Se a infração é coletiva, como a falta do PGRTR, ela alcança todos os empregados do estabelecimento. Se é individual, como exame médico não realizado, alcança só quem foi atingido.</p>' +
      '<p>A mesma portaria revogou os códigos da NR-31 no Anexo II, o que faz sentido. Sem grade, não há infração a atribuir.</p>' +
      '<h2>O que ainda mexe no valor</h2>' +
      '<h3>Reincidência e agravantes</h3>' +
      '<p>Em caso de reincidência, embaraço ou resistência à fiscalização, artifício ou simulação para fraudar a lei, o parágrafo único do art. 201 da CLT manda aplicar o valor máximo da tabela. Isso apaga porte e infração do cálculo. Uma empresa de quatro empregados reincidente paga o mesmo que uma de três mil.</p>' +
      '<p>Reincidente tem definição fechada. Pelo art. 25 da Portaria MTP nº 667/2021, é quem é autuado pelo mesmo dispositivo antes de dois anos da decisão definitiva da autuação anterior. Ter levado duas multas não basta.</p>' +
      '<h3>Infrações de natureza individual</h3>' +
      '<p>Fora do rural, os itens que se materializam em cada trabalhador, como ASO, EPI e treinamento, costumam ser autuados por trabalhador. A empresa sem PCMSO leva uma multa. A empresa com 22 empregados sem ASO leva 22.</p>' +
      '<h3>Dupla visita</h3>' +
      '<p>A dupla visita decide se o auto vale, antes de qualquer conta. O art. 627 da CLT a exige quando a norma é nova e na primeira inspeção de estabelecimento recém-inaugurado. O art. 55 da Lei Complementar nº 123/2006 estende o critério às microempresas e empresas de pequeno porte, com exceções. Se era cabível e o agente não observou, o auto cai e o cálculo vai a zero.</p>' +
      '<h3>Redução pela metade</h3>' +
      '<p>O art. 39, § 3º da Portaria MTP nº 667/2021 corta a multa em 50% se o autuado recolher no prazo de dez dias contados do recebimento da notificação da decisão.</p>' +
      '<h3>Reajuste anual</h3>' +
      '<p>A Portaria MTE nº 104/2026 incluiu também o item 28.3.3, que manda reajustar os valores da NR-28 todo ano, conforme o art. 634, § 2º da CLT. Até agora o Ministério do Trabalho não publicou a tabela convertida, então na prática continua valendo a conversão pela UFIR congelada.</p>' +
      '<h2>Por que olhar isso antes da fiscalização chegar</h2>' +
      '<p>Saber de qual tabela sai a multa de cada item muda a ordem do plano de ação. Um item de infração I4 numa empresa de 500 empregados pesa mais que três itens I1 somados. E o mesmo descumprimento no campo ou no porto dá um valor bem diferente do que daria numa indústria.</p>' +
      '<p>Na nossa experiência, a vistoria que traz o valor estimado ao lado de cada não conformidade convence mais do que a lista de itens sozinha.</p>'

    rec.set('conteudo', conteudo)
    rec.set(
      'resumo',
      'Existem três tabelas diferentes na NR-28, e qual delas vale depende da norma descumprida. O trabalho portuário e o rural fogem da grade que quase todo mundo conhece. Veja como cada uma é apurada, passo a passo.',
    )
    app.save(rec)
  },
  (app) => {
    // Rollback no-op: o texto anterior não é restaurado.
  },
)
