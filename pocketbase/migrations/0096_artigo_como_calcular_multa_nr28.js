// Primeiro post do blog: como a multa da NR-28 é calculada.
// Entra como artigo publicado normal, editável pelo admin de artigos — o
// conteúdo, o resumo e a capa podem ser trocados por lá depois. A capa fica
// vazia aqui de propósito: arquivo binário não vai por migration, é upload
// pela tela de artigos.
//
// Como o blog ordena por -created, este artigo assume o destaque da home
// enquanto for o mais recente.
migrate(
  (app) => {
    const slug = 'como-a-multa-da-nr-28-e-calculada'

    // Idempotente: se já existe, não duplica.
    try {
      app.findFirstRecordByData('artigos', 'slug', slug)
      return
    } catch (_) {}

    const col = app.findCollectionByNameOrId('artigos')

    const conteudo =
      '<h2>Não existe uma conta só</h2>' +
      '<p>Quem recebe um auto de infração costuma procurar "a tabela da NR-28", como se houvesse uma. Há três caminhos diferentes, e o que decide qual vale é a norma descumprida. Dois deles fogem completamente da tabela que a maioria conhece.</p>' +
      '<h2>A regra geral: Anexo II mais Anexo I</h2>' +
      '<p>Vale para a maior parte das Normas Regulamentadoras. São quatro passos.</p>' +
      '<h3>1. O item descumprido tem grau e tipo</h3>' +
      '<p>O Anexo II da NR-28 lista item por item de cada NR e atribui a cada um um <strong>grau</strong>, de 1 a 4, conforme a gravidade, e um <strong>tipo</strong>: S para segurança do trabalho, M para medicina do trabalho.</p>' +
      '<p>Essa separação não é burocracia. O art. 201 da CLT fixa tetos diferentes para as duas famílias de infração, e por isso a tabela de medicina é sempre menor que a de segurança.</p>' +
      '<h3>2. O porte entra pelo número de empregados</h3>' +
      '<p>São oito faixas, da menor (1 a 10 empregados) à maior (mais de 1000). A base é o número de empregados do estabelecimento autuado, não o da empresa inteira — o que faz diferença grande em quem tem várias unidades.</p>' +
      '<h3>3. O cruzamento aponta uma célula</h3>' +
      '<p>Faixa, grau e tipo apontam uma única célula do Anexo I, que traz um valor mínimo e um máximo. Esses valores estão expressos em UFIR.</p>' +
      '<h3>4. A UFIR vira real</h3>' +
      '<p>A UFIR foi extinta em 2000 e ficou congelada em R$ 1,0641. Multiplicando o mínimo e o máximo da célula por esse fator, chega-se ao intervalo em reais.</p>' +
      '<p>Repare que o resultado é sempre um <strong>intervalo</strong>, nunca um valor fechado. Quem arbitra o ponto dentro dele é o auditor-fiscal, seguindo os cinco critérios do art. 75 da Portaria MTP nº 667/2021: natureza da infração, intenção do infrator, meios ao seu alcance para cumprir a lei, extensão da infração e situação econômico-financeira.</p>' +
      '<h2>Trabalho portuário tem outra tabela</h2>' +
      '<p>As infrações da NR-29 não usam o Anexo I. Usam o <strong>Anexo I-A</strong>, incluído na NR-28 pela Portaria SIT nº 319, de 2012.</p>' +
      '<p>A estrutura é parecida — mesmas oito faixas, mesmos quatro graus, mesma separação entre segurança e medicina — mas há uma diferença que engana muita gente: <strong>esta tabela não é expressa em UFIR</strong>. A norma já publica os valores em reais. Aplicar o fator de 1,0641 sobre ela infla a multa indevidamente.</p>' +
      '<p>A diferença aparece logo na primeira célula: grau 1, segurança, empresa de 1 a 10 empregados. Pelo Anexo I-A são R$ 575,00. Pela grade geral dariam R$ 670,38. Os tetos também são outros: R$ 5.750,00 em segurança e R$ 3.450,00 em medicina.</p>' +
      '<h2>Trabalho rural não tem tabela nenhuma</h2>' +
      '<p>Esta é a mudança mais recente e a menos difundida. Desde 30 de janeiro de 2026, com a nova redação do item 28.3.2 dada pela Portaria MTE nº 104/2026, as infrações da NR-31 saíram da grade do Anexo I.</p>' +
      '<p>Agora seguem o art. 18 da Lei nº 5.889/1973: um valor fixo <strong>por empregado em situação irregular</strong>, dobrado em caso de reincidência, embaraço ou resistência à fiscalização. Não entra grau, não entra tipo, não entra faixa de porte. O valor literal da lei é R$ 380,00, e o reajustado pela Portaria MTE nº 1.131/2025 é R$ 392,89.</p>' +
      '<p>Quantos empregados entram na conta depende do item. Uma infração coletiva, como a falta do PGRTR, alcança todos os empregados do estabelecimento. Uma infração individual, como exame médico não realizado, alcança só os trabalhadores efetivamente atingidos.</p>' +
      '<p>A mesma portaria revogou os códigos da NR-31 do Anexo II, o que é coerente: sem grade, não há grau a atribuir.</p>' +
      '<h2>O que ainda mexe no valor depois de tudo isso</h2>' +
      '<p><strong>Reincidência e agravantes.</strong> Em caso de reincidência, embaraço ou resistência à fiscalização, artifício ou simulação para fraudar a lei, o parágrafo único do art. 201 da CLT manda aplicar o <strong>valor máximo</strong> da tabela. Isso anula porte e grau: uma empresa de quatro empregados reincidente paga o mesmo que uma de três mil. E reincidente tem definição fechada — pelo art. 25 da Portaria MTP nº 667/2021, é quem é autuado pelo mesmo dispositivo antes de dois anos da decisão definitiva da autuação anterior. Não é simplesmente "já levou duas multas".</p>' +
      '<p><strong>Infrações de natureza individual.</strong> Fora do rural, itens que se materializam em cada trabalhador — ASO, EPI, treinamento — costumam ser autuados por trabalhador. A diferença entre "a empresa não tem PCMSO" e "22 empregados sem ASO" é a diferença entre uma multa e vinte e duas.</p>' +
      '<p><strong>Dupla visita.</strong> Não é cálculo, é condição de validade do auto. O art. 627 da CLT exige a dupla visita quando a norma é nova e na primeira inspeção de estabelecimento recém-inaugurado. O art. 55 da Lei Complementar nº 123/2006 estende o critério a microempresas e empresas de pequeno porte, com exceções. Se era cabível e não foi observada, o auto cai — e o cálculo vira zero.</p>' +
      '<p><strong>Redução pela metade.</strong> O art. 39, § 3º da Portaria MTP nº 667/2021 reduz a multa em 50% se o autuado recolher no prazo de dez dias contados do recebimento da notificação da decisão.</p>' +
      '<p><strong>Reajuste anual.</strong> A Portaria MTE nº 104/2026 também incluiu o item 28.3.3, que manda reajustar anualmente os valores da NR-28 conforme o art. 634, § 2º da CLT. Enquanto o Ministério do Trabalho não publica a tabela convertida, na prática segue valendo a conversão pela UFIR congelada. É o ponto que mais deve mudar nos próximos anos.</p>' +
      '<h2>Por que isso importa antes de a fiscalização chegar</h2>' +
      '<p>Saber de qual tabela sai a multa de cada item muda a ordem de prioridade de um plano de ação. Um item grau 4 numa empresa de 500 empregados pesa muito mais que três itens grau 1, e um mesmo descumprimento no campo ou no porto tem valor completamente diferente do que teria numa indústria.</p>' +
      '<p>É por isso que a vistoria com o valor estimado ao lado de cada não conformidade costuma convencer mais do que a lista de itens sozinha.</p>'

    const rec = new Record(col)
    rec.set('titulo', 'Como a multa da NR-28 é calculada, item por item')
    rec.set('slug', slug)
    rec.set(
      'resumo',
      'A conta não é uma só. Dependendo da norma descumprida, a multa sai de três lugares diferentes — e o trabalho portuário e o rural fogem da tabela que quase todo mundo conhece. Veja como cada uma é apurada, passo a passo.',
    )
    rec.set('conteudo', conteudo)
    rec.set('status', 'publicado')

    try {
      const autor = app.findFirstRecordByData('users', 'papel', 'dono')
      if (autor) rec.set('autor_id', autor.id)
    } catch (_) {}

    app.save(rec)
  },
  (app) => {
    try {
      const rec = app.findFirstRecordByData('artigos', 'slug', 'como-a-multa-da-nr-28-e-calculada')
      app.delete(rec)
    } catch (_) {}
  },
)
