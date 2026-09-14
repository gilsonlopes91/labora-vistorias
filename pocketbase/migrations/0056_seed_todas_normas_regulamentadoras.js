migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')

    // Relação completa e oficial das Normas Regulamentadoras vigentes no Brasil (Ministério do Trabalho e Emprego - MTE / CTPP).
    // Observação legal:
    // - NR-02: REVOGADA pela Portaria SEPRT nº 915/2019
    // - NR-27: REVOGADA pela Portaria MTE nº 262/2008
    // Total de normas vigentes = 36 normas regulamentadoras.
    const normasVigentes = [
      {
        nr: 'NR-01',
        nome: 'NR-01 — Disposições Gerais e Gerenciamento de Riscos Ocupacionais',
        descricao:
          'Estabelece as disposições gerais, o campo de aplicação, os termos e as definições comuns às Normas Regulamentadoras e as diretrizes e os requisitos para o Gerenciamento de Riscos Ocupacionais (GRO) e o Programa de Gerenciamento de Riscos (PGR).',
      },
      {
        nr: 'NR-03',
        nome: 'NR-03 — Embargo e Interdição',
        descricao:
          'Estabelece as diretrizes e os requisitos técnicos para a caracterização das situações de grave e iminente risco e os procedimentos para a aplicação das medidas de embargo e interdição.',
      },
      {
        nr: 'NR-04',
        nome: 'NR-04 — Serviços Especializados em Segurança e em Medicina do Trabalho (SESMT)',
        descricao:
          'Estabelece os parâmetros e os requisitos para a constituição e a manutenção dos Serviços Especializados em Segurança e em Medicina do Trabalho (SESMT), com a finalidade de promover a saúde e proteger a integridade dos trabalhadores.',
      },
      {
        nr: 'NR-05',
        nome: 'NR-05 — Comissão Interna de Prevenção de Acidentes e de Assédio (CIPA)',
        descricao:
          'Estabelece os parâmetros e os requisitos para a constituição e a organização da Comissão Interna de Prevenção de Acidentes e de Assédio (CIPA), visando à prevenção de acidentes e doenças decorrentes do trabalho e ao combate ao assédio.',
      },
      {
        nr: 'NR-06',
        nome: 'NR-06 — Equipamento de Proteção Individual (EPI)',
        descricao:
          'Estabelece os requisitos para seleção, uso, fornecimento, higienização, manutenção e guarda dos Equipamentos de Proteção Individual (EPI), adequados aos riscos das atividades desenvolvidas.',
      },
      {
        nr: 'NR-07',
        nome: 'NR-07 — Programa de Controle Médico de Saúde Ocupacional (PCMSO)',
        descricao:
          'Estabelece as diretrizes e os requisitos para o desenvolvimento do Programa de Controle Médico de Saúde Ocupacional (PCMSO) nas organizações, com o objetivo de proteger e preservar a saúde de seus empregados em relação aos riscos ocupacionais.',
      },
      {
        nr: 'NR-08',
        nome: 'NR-08 — Edificações',
        descricao:
          'Estabelece os requisitos técnicos mínimos que devem ser observados nas edificações para garantir segurança e conforto aos trabalhadores.',
      },
      {
        nr: 'NR-09',
        nome: 'NR-09 — Avaliação e Controle das Exposições Ocupacionais a Agentes Físicos, Químicos e Biológicos',
        descricao:
          'Estabelece os requisitos para a avaliação das exposições ocupacionais a agentes físicos, químicos e biológicos quando identificados no PGR (NR-01) e os critérios para subsidiar as medidas de prevenção.',
      },
      {
        nr: 'NR-10',
        nome: 'NR-10 — Segurança em Instalações e Serviços em Eletricidade',
        descricao:
          'Estabelece os requisitos e as condições mínimas de segurança dos trabalhadores que direta ou indiretamente interajam em instalações elétricas e serviços com eletricidade.',
      },
      {
        nr: 'NR-11',
        nome: 'NR-11 — Transporte, Movimentação, Armazenagem e Manuseio de Materiais',
        descricao:
          'Norma técnica de segurança para operação de elevadores, guindastes, transportadores industriais e máquinas transportadoras e para a movimentação e armazenagem de materiais.',
      },
      {
        nr: 'NR-12',
        nome: 'NR-12 — Segurança no Trabalho em Máquinas e Equipamentos',
        descricao:
          'Define referências técnicas, princípios fundamentais e medidas de proteção para resguardar a saúde e a integridade física dos trabalhadores e estabelece requisitos mínimos para a prevenção de acidentes e doenças do trabalho nas fases de projeto e de utilização de máquinas e equipamentos.',
      },
      {
        nr: 'NR-13',
        nome: 'NR-13 — Caldeiras, Vasos de Pressão, Tubulações e Tanques Metálicos de Armazenamento',
        descricao:
          'Estabelece os requisitos mínimos para a gestão da integridade estrutural de caldeiras a vapor, vasos de pressão, suas tubulações de interligação e tanques metálicos de armazenamento nos aspectos relacionados à instalação, inspeção, operação e manutenção.',
      },
      {
        nr: 'NR-14',
        nome: 'NR-14 — Fornos',
        descricao:
          'Fixa as disposições e critérios técnicos de instalação, operação e manutenção de fornos industriais para garantir a segurança dos trabalhadores nos locais de trabalho.',
      },
      {
        nr: 'NR-15',
        nome: 'NR-15 — Atividades e Operações Insalubres',
        descricao:
          'Descreve as atividades, operações e agentes que são considerados insalubres (ruído, calor, radiações, condições hiperbáricas, agentes químicos e poeiras minerais), seus limites de tolerância e os critérios para fixação do adicional de insalubridade.',
      },
      {
        nr: 'NR-16',
        nome: 'NR-16 — Atividades e Operações Perigosas',
        descricao:
          'Regulamenta as atividades e operações perigosas (explosivos, inflamáveis, segurança patrimonial, energia elétrica, motocicleta e radiações ionizantes) e estabelece os requisitos para concessão do adicional de periculosidade.',
      },
      {
        nr: 'NR-17',
        nome: 'NR-17 — Ergonomia',
        descricao:
          'Estabelece as diretrizes e os requisitos que permitam a adaptação das condições de trabalho às características psicofisiológicas dos trabalhadores, de modo a proporcionar um máximo de conforto, segurança e desempenho eficiente.',
      },
      {
        nr: 'NR-18',
        nome: 'NR-18 — Segurança e Saúde no Trabalho na Indústria da Construção',
        descricao:
          'Estabelece diretrizes de ordem administrativa, de planejamento e de organização, que visam à implementação de medidas de controle e sistemas preventivos de segurança nos processos, nas condições e no meio ambiente de trabalho na Indústria da Construção.',
      },
      {
        nr: 'NR-19',
        nome: 'NR-19 — Explosivos',
        descricao:
          'Estabelece os requisitos e as condições mínimas de segurança para a fabricação, armazenamento, manuseio e transporte de explosivos.',
      },
      {
        nr: 'NR-20',
        nome: 'NR-20 — Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis',
        descricao:
          'Estabelece requisitos mínimos para a gestão da segurança e saúde no trabalho contra os fatores de risco de acidentes provenientes das atividades de extração, produção, armazenamento, transferência, manuseio e manipulação de inflamáveis e líquidos combustíveis.',
      },
      {
        nr: 'NR-21',
        nome: 'NR-21 — Trabalhos a Céu Aberto',
        descricao:
          'Tipifica as medidas preventivas relacionadas aos trabalhos realizados a céu aberto, tais como abrigos, proteção contra intempéries, alojamentos e condições sanitárias.',
      },
      {
        nr: 'NR-22',
        nome: 'NR-22 — Segurança e Saúde Ocupacional na Mineração',
        descricao:
          'Tem por objetivo disciplinar os preceitos a serem observados na organização e no ambiente de trabalho, de forma a tornar compatível o planejamento e o desenvolvimento da atividade mineradora com a busca permanente da segurança e da saúde dos trabalhadores.',
      },
      {
        nr: 'NR-23',
        nome: 'NR-23 — Proteção Contra Incêndios',
        descricao:
          'Estabelece as medidas de prevenção e proteção contra incêndios nos ambientes de trabalho, dispondo sobre saídas de emergência, sinalização e exercícios de alerta.',
      },
      {
        nr: 'NR-24',
        nome: 'NR-24 — Condições Sanitárias e de Conforto nos Locais de Trabalho',
        descricao:
          'Estabelece as condições mínimas de higiene e de conforto a serem observadas nos locais de trabalho, relativas a instalações sanitárias, vestiários, refeitórios, cozinhas, alojamentos e vestuário de trabalho.',
      },
      {
        nr: 'NR-25',
        nome: 'NR-25 — Resíduos Industriais',
        descricao:
          'Estabelece as medidas de prevenção a serem adotadas pelas empresas no destino final dado aos resíduos industriais resultantes dos processos produtivos.',
      },
      {
        nr: 'NR-26',
        nome: 'NR-26 — Sinalização de Segurança',
        descricao:
          'Fixa as cores que devem ser usadas nos locais de trabalho para prevenção de acidentes, identificação de equipamentos de segurança e de substâncias perigosas, conforme o sistema GHS (classificação e rotulagem de produtos químicos).',
      },
      {
        nr: 'NR-28',
        nome: 'NR-28 — Fiscalização e Penalidades',
        descricao:
          'Disciplina a atuação da Inspeção do Trabalho, fixando prazos para cumprimento de notificações e estabelecendo o quadro de classificação das infrações e os valores de multas por infração aos preceitos legais e regulamentares de SST.',
      },
      {
        nr: 'NR-29',
        nome: 'NR-29 — Norma Regulamentadora de Segurança e Saúde no Trabalho Portuário',
        descricao:
          'Regulamenta a proteção obrigatória contra acidentes e doenças profissionais, facilita os primeiros socorros a acidentados e alcança as melhores condições possíveis de segurança e saúde aos trabalhadores que atuam em operações portuárias.',
      },
      {
        nr: 'NR-30',
        nome: 'NR-30 — Segurança e Saúde no Trabalho Aquaviário',
        descricao:
          'Aplica-se aos trabalhadores das embarcações comerciais, de passageiros ou de pesca, fixando requisitos para a garantia de condições seguras e saudáveis no trabalho aquaviário a bordo.',
      },
      {
        nr: 'NR-31',
        nome: 'NR-31 — Segurança e Saúde no Trabalho na Agricultura, Pecuária, Silvicultura, Exploração Florestal e Aquicultura',
        descricao:
          'Estabelece os preceitos a serem observados na organização e no ambiente de trabalho rural, de forma a tornar compatível o planejamento e o desenvolvimento das atividades do setor com a segurança e a saúde dos trabalhadores.',
      },
      {
        nr: 'NR-32',
        nome: 'NR-32 — Segurança e Saúde no Trabalho em Serviços de Saúde',
        descricao:
          'Tem por finalidade estabelecer as diretrizes básicas para a implementação de medidas de proteção à segurança e à saúde dos trabalhadores dos serviços de saúde, bem como daqueles que exercem atividades de promoção e assistência à saúde em geral.',
      },
      {
        nr: 'NR-33',
        nome: 'NR-33 — Segurança e Saúde nos Trabalhos em Espaços Confinados',
        descricao:
          'Estabelece os requisitos para identificação de espaços confinados, reconhecimento, avaliação, monitoramento e controle dos riscos existentes, de forma a garantir permanentemente a segurança e saúde dos trabalhadores que neles interagem.',
      },
      {
        nr: 'NR-34',
        nome: 'NR-34 — Condições e Meio Ambiente de Trabalho na Indústria da Construção, Reparação e Desmonte Naval',
        descricao:
          'Estabelece os requisitos mínimos e as medidas de proteção à segurança, à saúde e ao meio ambiente de trabalho nas atividades da indústria de construção, reparação e desmonte naval.',
      },
      {
        nr: 'NR-35',
        nome: 'NR-35 — Trabalho em Altura',
        descricao:
          'Estabelece os requisitos mínimos e as medidas de proteção para o trabalho em altura, envolvendo o planejamento, a organização e a execução, de forma a garantir a segurança e a saúde dos trabalhadores envolvidos direta ou indiretamente com esta atividade.',
      },
      {
        nr: 'NR-36',
        nome: 'NR-36 — Segurança e Saúde no Trabalho em Empresas de Abate e Processamento de Carnes e Derivados',
        descricao:
          'Tem por objetivo estabelecer os requisitos mínimos para a avaliação, controle e monitoramento dos riscos existentes nas atividades desenvolvidas na indústria de abate e processamento de carnes e derivados destinados ao consumo humano.',
      },
      {
        nr: 'NR-37',
        nome: 'NR-37 — Segurança e Saúde em Plataformas de Petróleo',
        descricao:
          'Estabelece os requisitos mínimos de segurança, saúde e condições de vivência no trabalho a bordo de plataformas de exploração e produção de petróleo e gás em águas jurisdicionais brasileiras.',
      },
      {
        nr: 'NR-38',
        nome: 'NR-38 — Segurança e Saúde no Trabalho nas Atividades de Limpeza Urbana e Manejo de Resíduos Sólidos',
        descricao:
          'Estabelece os requisitos e as medidas de prevenção destinados a garantir condições de segurança e saúde aos trabalhadores nas atividades de limpeza urbana e manejo de resíduos sólidos.',
      },
    ]

    // Cadastro idempotente:
    // Se a norma já existir (global: organizacao_id = ''), mantém ou atualiza descrição/nome se for o registro principal.
    // Se não existir, insere o registro no catálogo global.
    for (const item of normasVigentes) {
      let rec
      try {
        rec = app.findFirstRecordByFilter(
          'tipos_vistoria',
          "nr_referencia = '" + item.nr + "' && organizacao_id = ''",
        )
      } catch (_) {
        rec = new Record(tiposCol)
        rec.set('organizacao_id', '')
        rec.set('nr_referencia', item.nr)
        rec.set('nome', item.nome)
        rec.set('descricao', item.descricao)
        rec.set('ativo', true)
        app.save(rec)
        continue
      }

      // Se já existia e estava inativo, ativa
      let mudou = false
      if (!rec.get('ativo')) {
        rec.set('ativo', true)
        mudou = true
      }
      if (mudou) {
        app.save(rec)
      }
    }
  },
  (app) => {
    // Reversão opcional (não remove NRs consolidadas criadas anteriormente)
    const novas = [
      'NR-03',
      'NR-18',
      'NR-19',
      'NR-20',
      'NR-21',
      'NR-22',
      'NR-23',
      'NR-24',
      'NR-25',
      'NR-26',
      'NR-28',
      'NR-29',
      'NR-30',
      'NR-31',
      'NR-32',
      'NR-33',
      'NR-34',
      'NR-35',
      'NR-36',
      'NR-37',
      'NR-38',
    ]
    for (const nr of novas) {
      try {
        const rec = app.findFirstRecordByFilter(
          'tipos_vistoria',
          "nr_referencia = '" + nr + "' && organizacao_id = ''",
        )
        // se não tem itens de vistoria associados, pode remover
        const itens = app.findRecordsByFilter(
          'itens_checklist',
          "tipo_vistoria_id = '" + rec.id + "'",
          '',
          1,
          0,
        )
        if (!itens || itens.length === 0) {
          app.delete(rec)
        }
      } catch (_) {}
    }
  },
)
