// Questionário de seleção do beta (público, sem login).
// 1) beta_quiz_questoes: banco das 10 questões com gabarito e explicação.
//    Regras todas fechadas — só os hooks leem; o gabarito nunca vai ao
//    navegador.
// 2) beta_quiz_respostas: um envio por e-mail (índice único), corrigido no
//    servidor pelo hook beta_quiz_enviar. Só o admin da plataforma lê;
//    o admin pode marcar "convidado".
migrate(
  (app) => {
    const ADMIN = "@request.auth.papel = 'admin_plataforma'"

    let questoes = null
    try {
      questoes = app.findCollectionByNameOrId('beta_quiz_questoes')
    } catch (_) {
      questoes = null
    }
    if (!questoes) {
      questoes = new Collection({
        name: 'beta_quiz_questoes',
        type: 'base',
        listRule: null,
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: 'ordem', type: 'number', required: true },
          { name: 'tema', type: 'text', required: true, max: 60 },
          { name: 'enunciado', type: 'text', required: true, max: 2000 },
          { name: 'alternativas', type: 'json', required: true, maxSize: 20000 },
          { name: 'correta', type: 'text', required: true, max: 10 },
          { name: 'explicacao', type: 'text', required: true, max: 4000 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_beta_quiz_questoes_ordem ON beta_quiz_questoes (ordem)'],
      })
      app.save(questoes)
    }

    let respostas = null
    try {
      respostas = app.findCollectionByNameOrId('beta_quiz_respostas')
    } catch (_) {
      respostas = null
    }
    if (!respostas) {
      respostas = new Collection({
        name: 'beta_quiz_respostas',
        type: 'base',
        listRule: ADMIN,
        viewRule: ADMIN,
        createRule: null,
        updateRule: ADMIN,
        deleteRule: ADMIN,
        fields: [
          { name: 'nome', type: 'text', required: true, min: 2, max: 200 },
          { name: 'email', type: 'email', required: true },
          { name: 'respostas', type: 'json', maxSize: 20000 },
          { name: 'acertos', type: 'json', maxSize: 20000 },
          { name: 'nota', type: 'number', min: 0, max: 10 },
          { name: 'ip', type: 'text', max: 100 },
          { name: 'aceite_lgpd', type: 'bool' },
          { name: 'convidado', type: 'bool' },
          { name: 'email_enviado', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_beta_quiz_respostas_email ON beta_quiz_respostas (email)',
          'CREATE INDEX idx_beta_quiz_respostas_ip ON beta_quiz_respostas (ip, created)',
        ],
      })
      app.save(respostas)
    }

    // Banco de questões — gabarito conferido no texto oficial das normas em
    // 29/09/2026 (NR-01 Portaria MTE 765/2025; NR-15 e NR-16 Portaria MTE
    // 2.021/2025; IN PRES/INSS 128/2022; Decreto 3.048/99).
    const BANCO = [
      {
        ordem: 1,
        tema: 'PGR',
        enunciado:
          'Segundo a NR-01, o Programa de Gerenciamento de Riscos deve conter, no mínimo, quais documentos?',
        alternativas: [
          { id: 'a', texto: 'Mapa de risco e ordem de serviço.' },
          { id: 'b', texto: 'Inventário de riscos ocupacionais e plano de ação.' },
          { id: 'c', texto: 'PCMSO e LTCAT.' },
          { id: 'd', texto: 'Análise ergonômica do trabalho e matriz de risco.' },
        ],
        correta: 'b',
        explicacao:
          'O item 1.5.7.1 da NR-01 define que o PGR deve conter, no mínimo, o inventário de riscos ocupacionais e o plano de ação. Mapa de risco, ordem de serviço, PCMSO, LTCAT e AET são documentos relacionados, mas não são o conteúdo mínimo do PGR. A matriz de risco é um método de classificação, não um documento exigido por nome.',
      },
      {
        ordem: 2,
        tema: 'PGR',
        enunciado:
          'Uma empresa sem certificação em sistema de gestão de SST elaborou a avaliação de riscos do PGR em março de 2025. Não houve acidente, mudança de processo nem pedido da CIPA. Quando, no mais tardar, ela deve ser revista?',
        alternativas: [
          { id: 'a', texto: 'Em março de 2026, porque a revisão é anual.' },
          { id: 'b', texto: 'Em março de 2027, porque a revisão é a cada dois anos.' },
          { id: 'c', texto: 'Em março de 2028, porque a revisão é a cada três anos.' },
          {
            id: 'd',
            texto:
              'Não há prazo fixo; a revisão só é obrigatória quando ocorre um dos gatilhos da norma.',
          },
        ],
        correta: 'b',
        explicacao:
          'O item 1.5.4.4.6 da NR-01 determina que a avaliação de riscos seja revista a cada dois anos ou quando ocorrer um dos gatilhos listados (medidas implementadas, mudança de processo, ineficácia das medidas, acidente ou doença, mudança legal, pedido dos trabalhadores ou da CIPA). O prazo de até três anos (item 1.5.4.4.6.1) só vale para organizações com certificação em sistema de gestão de SST.',
      },
      {
        ordem: 3,
        tema: 'PGR',
        enunciado:
          'Uma padaria com 8 empregados, enquadrada como microempresa e grau de risco 2 pela NR-04, fez o levantamento preliminar de perigos e identificou exposição a calor dos fornos. O contador diz que ela está dispensada do PGR por ser ME de grau 2. Qual é a resposta correta?',
        alternativas: [
          {
            id: 'a',
            texto: 'O contador está certo: toda ME de grau de risco 1 ou 2 é dispensada do PGR.',
          },
          {
            id: 'b',
            texto: 'A dispensa só existe para MEI; ME e EPP sempre precisam de PGR completo.',
          },
          {
            id: 'c',
            texto:
              'A padaria não está dispensada, porque a dispensa do item 1.8.4 exige que o levantamento preliminar não identifique exposição a agentes físicos, químicos ou biológicos, e calor é agente físico.',
          },
          { id: 'd', texto: 'A padaria está dispensada desde que elabore apenas o PCMSO.' },
        ],
        correta: 'c',
        explicacao:
          'O item 1.8.4 da NR-01 dispensa do PGR as ME e EPP de graus de risco 1 e 2 que, no levantamento preliminar, não identifiquem exposição a agentes físicos, químicos e biológicos conforme a NR-09 e declarem as informações digitais na forma do item 1.6.1. O calor é agente físico, então a padaria precisa elaborar o PGR. A alternativa que fala em PCMSO confunde dois documentos diferentes.',
      },
      {
        ordem: 4,
        tema: 'LTCAT',
        enunciado:
          'Quem pode assinar o Laudo Técnico das Condições Ambientais do Trabalho para fins de aposentadoria especial?',
        alternativas: [
          { id: 'a', texto: 'Qualquer profissional de SST com registro no conselho de classe.' },
          {
            id: 'b',
            texto: 'Técnico de segurança do trabalho ou engenheiro de qualquer modalidade.',
          },
          { id: 'c', texto: 'Médico do trabalho ou engenheiro de segurança do trabalho.' },
          { id: 'd', texto: 'Apenas o médico do trabalho responsável pelo PCMSO.' },
        ],
        correta: 'c',
        explicacao:
          'O art. 58, § 1º, da Lei 8.213/91 e o art. 68, § 3º, do Decreto 3.048/99 exigem laudo técnico expedido por médico do trabalho ou engenheiro de segurança do trabalho. A IN PRES/INSS 128/2022 repete a exigência. Técnico de segurança pode participar do levantamento, mas não assina o LTCAT.',
      },
      {
        ordem: 5,
        tema: 'LTCAT',
        enunciado:
          'Uma empresa fornece protetor auricular com CA válido, uso comprovado e atenuação suficiente para levar o nível de exposição abaixo de 85 dB(A). Para fins de aposentadoria especial, qual é o efeito desse EPI sobre a caracterização da exposição a ruído acima do limite?',
        alternativas: [
          {
            id: 'a',
            texto: 'Descaracteriza a exposição, porque a atenuação leva o nível abaixo do limite.',
          },
          { id: 'b', texto: 'Descaracteriza apenas se houver também EPC com plano de manutenção.' },
          {
            id: 'c',
            texto:
              'Não descaracteriza: para o ruído, o EPI eficaz não afasta o direito à aposentadoria especial.',
          },
          {
            id: 'd',
            texto: 'Descaracteriza desde que o trabalhador assine termo de responsabilidade.',
          },
        ],
        correta: 'c',
        explicacao:
          'No Tema 555 de repercussão geral, o STF decidiu que o EPI eficaz descaracteriza o tempo especial para os demais agentes, mas não para o ruído acima dos limites de tolerância, porque a proteção auditiva não neutraliza todos os efeitos do ruído sobre o organismo. A IN 128/2022 segue esse entendimento. Os requisitos do art. 291 (funcionamento, uso ininterrupto, validade do CA, troca e higienização) valem para os outros agentes.',
      },
      {
        ordem: 6,
        tema: 'LTCAT',
        enunciado:
          'Um soldador trabalha 8 horas por dia, 5 dias por semana, com dosimetria apontando NEN de 88 dB(A) pelo critério da NHO-01 (q = 3). A empresa fornece protetor auricular com CA válido. O que o LTCAT deve concluir?',
        alternativas: [
          { id: 'a', texto: 'Não enquadra, porque o EPI neutraliza o ruído.' },
          { id: 'b', texto: 'Não enquadra, porque só enquadra ruído acima de 90 dB(A).' },
          {
            id: 'c',
            texto:
              'Enquadra como agente nocivo físico (ruído), com aposentadoria especial aos 25 anos, informando o EPI no PPP mas sem descaracterizar a exposição.',
          },
          { id: 'd', texto: 'Enquadra apenas se a exposição também for insalubre pela NR-15.' },
        ],
        correta: 'c',
        explicacao:
          'Desde 19/11/2003 o limite para ruído na aposentadoria especial é 85 dB(A), medido pelo NEN conforme a NHO-01 (IN 128/2022 e Decreto 3.048, Anexo IV, código 2.0.1). O NEN de 88 dB(A) em jornada habitual e permanente enquadra, com tempo de 25 anos. O EPI deve ser informado no PPP, mas não descaracteriza o ruído (Tema 555 do STF). Insalubridade e aposentadoria especial são regimes distintos: um não depende do outro.',
      },
      {
        ordem: 7,
        tema: 'Insalubridade',
        enunciado:
          'Um trabalhador exposto simultaneamente a ruído acima do limite de tolerância (grau médio) e a um agente químico enquadrado em grau máximo tem direito a qual adicional de insalubridade?',
        alternativas: [
          { id: 'a', texto: '20% + 40% = 60% sobre o salário mínimo.' },
          { id: 'b', texto: '40%, porque só é considerado o grau mais elevado.' },
          { id: 'c', texto: '20%, porque prevalece o agente avaliado quantitativamente.' },
          { id: 'd', texto: '30%, média entre os dois graus.' },
        ],
        correta: 'b',
        explicacao:
          'O item 15.3 da NR-15 determina que, havendo mais de um fator de insalubridade, só é considerado o de grau mais elevado, sem acumulação. Os percentuais estão no item 15.2: 40% para grau máximo, 20% para médio e 10% para mínimo. A base de cálculo é o salário mínimo, salvo norma coletiva mais favorável (Súmula Vinculante 4 do STF).',
      },
      {
        ordem: 8,
        tema: 'Insalubridade',
        enunciado:
          'Pelo Anexo 1 da NR-15, qual é o tempo máximo de exposição diária permitida a ruído contínuo de 85 dB(A), e como a leitura deve ser feita?',
        alternativas: [
          { id: 'a', texto: '4 horas, com o medidor no circuito "C" e resposta rápida (FAST).' },
          {
            id: 'b',
            texto:
              '8 horas, com o medidor no circuito "A" e resposta lenta (SLOW), próximo ao ouvido do trabalhador.',
          },
          { id: 'c', texto: '6 horas, com dosímetro configurado em q = 3.' },
          { id: 'd', texto: '8 horas, desde que o trabalhador use protetor auricular.' },
        ],
        correta: 'b',
        explicacao:
          'O Quadro do Anexo 1 da NR-15 fixa 8 horas como exposição máxima para 85 dB(A). O item 2 do anexo determina leitura em decibéis no circuito de compensação "A" e resposta lenta (SLOW), próximo ao ouvido do trabalhador. O incremento de duplicação de dose do Anexo 1 é q = 5; o q = 3 é o critério da NHO-01, usado para o LTCAT, não para a insalubridade. O uso de EPI não muda o limite, só pode neutralizar a insalubridade.',
      },
      {
        ordem: 9,
        tema: 'Periculosidade',
        enunciado:
          'Um eletricista de manutenção tem periculosidade caracterizada pelo Anexo 4 da NR-16 e também insalubridade de grau médio por ruído. Como fica o pagamento?',
        alternativas: [
          { id: 'a', texto: 'Recebe os dois adicionais, porque decorrem de fatos diferentes.' },
          { id: 'b', texto: 'Recebe apenas o adicional de periculosidade, por ser o maior.' },
          {
            id: 'c',
            texto: 'O empregado pode optar por um dos dois adicionais; não há cumulação.',
          },
          {
            id: 'd',
            texto: 'Recebe apenas o de insalubridade, porque o laudo de insalubridade prevalece.',
          },
        ],
        correta: 'c',
        explicacao:
          'O art. 193, § 2º, da CLT e o item 16.2.1 da NR-16 dão ao empregado o direito de optar pelo adicional de insalubridade que eventualmente lhe seja devido. O TST, no Tema 17 de recursos repetitivos, fixou que os dois adicionais não são cumuláveis. A escolha é do empregado, não da empresa nem do laudo.',
      },
      {
        ordem: 10,
        tema: 'Periculosidade',
        enunciado:
          'Um técnico de manutenção predial entra em áreas com equipamentos energizados três vezes por semana, por cerca de 40 minutos cada vez, como parte da rotina. A empresa alega que a exposição é "intermitente" e por isso paga o adicional de periculosidade proporcional ao tempo. Qual é a análise correta pelo Anexo 4 da NR-16?',
        alternativas: [
          {
            id: 'a',
            texto:
              'A empresa está certa: exposição intermitente gera adicional proporcional às horas de exposição.',
          },
          {
            id: 'b',
            texto: 'A exposição é eventual, porque não ocorre todos os dias, e não gera adicional.',
          },
          {
            id: 'c',
            texto:
              'O trabalho intermitente é equiparado à exposição permanente para pagamento integral do adicional nos meses em que houver exposição; só a exposição eventual (fortuita ou fora da rotina) é excluída.',
          },
          {
            id: 'd',
            texto: 'O adicional só é devido se o técnico for eletricista com curso NR-10.',
          },
        ],
        correta: 'c',
        explicacao:
          'O item 3 do Anexo 4 da NR-16 diz que o trabalho intermitente é equiparado à exposição permanente para fins de pagamento integral do adicional nos meses em que houver exposição, excluída a exposição eventual, assim considerado o caso fortuito ou o que não faz parte da rotina. Três vezes por semana, como rotina, é intermitente, não eventual. A Súmula 364 do TST segue a mesma linha. O curso da NR-10 é obrigação de segurança, não condição para o adicional.',
      },
    ]

    for (const q of BANCO) {
      let existente = null
      try {
        existente = app.findFirstRecordByFilter('beta_quiz_questoes', 'ordem = ' + q.ordem)
      } catch (_) {
        existente = null
      }
      const rec = existente || new Record(questoes)
      rec.set('ordem', q.ordem)
      rec.set('tema', q.tema)
      rec.set('enunciado', q.enunciado)
      rec.set('alternativas', q.alternativas)
      rec.set('correta', q.correta)
      rec.set('explicacao', q.explicacao)
      app.save(rec)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('beta_quiz_respostas'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('beta_quiz_questoes'))
    } catch (_) {}
  },
)
