// Expansão do catálogo de agentes/perigos (pedido: cobrir os 5 grupos da
// Tabela 24/S-2240 — Físico, Químico, Biológico, Ergonômico e Acidente — com
// exemplos de fonte geradora, danos à saúde e medidas de controle padrão,
// todos editáveis pela organização).
//
// Sobre o código eSocial (Tabela 24): ela cobre apenas agentes relevantes
// para aposentadoria especial (grupos 01 Físico, 02 Biológico, 03 Químico e
// 09 "sem agente") — Ergonômico e Acidente/Mecânico não têm código próprio
// na Tabela 24 (ficam de fora do enquadramento de aposentadoria especial,
// mesmo entrando no PGR). Por isso os novos registros de Ergonômico/Acidente
// abaixo não têm codigo_esocial — não é lacuna, é como o eSocial funciona.
// Para os novos Físico/Químico/Biológico também deixamos em branco: as
// fontes públicas consultadas (mirrors de terceiros) divergem entre si na
// numeração exata e no próprio catálogo já havia esse alerta (migração
// 0149) — preencher errado é pior do que deixar em branco, porque o eSocial
// valida o código. Continua sendo tarefa do usuário (ou de conferência
// posterior) preencher codigo_esocial contra a Tabela 24 oficial antes de
// usar em produção real do eSocial.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('agentes_catalogo')

    const criar = (dados) => {
      const r = new Record(col)
      r.set('organizacao_id', '')
      r.set('ativo', true)
      Object.entries(dados).forEach(([k, v]) => r.set(k, v))
      app.save(r)
    }

    // Completa medidas_controle_tipicas nos registros do catálogo inicial
    // (0149) que ficaram sem esse campo.
    const completar = (nome, medidas) => {
      const registros = app.findRecordsByFilter(
        col,
        `organizacao_id = '' && nome = '${nome.replace(/'/g, "\\'")}'`,
        '',
        1,
        0,
      )
      const r = registros[0]
      if (r && !r.get('medidas_controle_tipicas')) {
        r.set('medidas_controle_tipicas', medidas)
        app.save(r)
      }
    }

    completar(
      'Ruído de impacto',
      'Enclausuramento da fonte, manutenção preventiva, protetor auditivo',
    )
    completar(
      'Vibração de corpo inteiro',
      'Manutenção da suspensão/assento, redução de velocidade, rodízio de operadores',
    )
    completar(
      'Vibração de mãos e braços',
      'Ferramentas com menor emissão, luvas antivibratórias, pausas, rodízio',
    )
    completar(
      'Radiações ionizantes',
      'Blindagem, dosimetria individual, restrição de acesso, distância',
    )
    completar('Frio', 'Vestimenta térmica, pausas em ambiente aquecido, rodízio')
    completar(
      'Asbesto (crisotila)',
      'Substituição do material, encapsulamento, remoção por empresa especializada, respirador PFF3',
    )
    completar(
      'Poeiras, fumos e gases não listados (avaliação por TLV/ACGIH)',
      'Exaustão local, enclausuramento do processo, respirador adequado ao contaminante',
    )
    completar(
      'Óleos minerais (contato com a pele)',
      'Luvas resistentes a óleo, creme protetor, troca de uniforme',
    )
    completar(
      'Higienização de instalações sanitárias de uso público/coletivo',
      'EPI (luvas, avental), procedimento de limpeza, produtos adequados',
    )
    completar(
      'Posturas forçadas e repetitividade',
      'Pausas, alternância de tarefas, ginástica laboral, ajuste de posto',
    )
    completar(
      'Mobiliário e posto de trabalho inadequados',
      'Adequação ergonômica do posto, mobiliário regulável',
    )
    completar(
      'Assédio moral e conflitos interpessoais',
      'Canal de denúncia, treinamento de lideranças, política de conduta',
    )
    completar(
      'Violência no trabalho (interna ou externa)',
      'Controle de acesso, treinamento de defesa pessoal, comunicação com apoio, evitar trabalho isolado',
    )
    completar(
      'Uso de motocicleta em vias públicas',
      'Treinamento de direção defensiva, EPI (capacete, jaqueta), manutenção do veículo, jornada compatível',
    )
    completar(
      'Assalto / roubo — segurança patrimonial',
      'Procedimento de segurança, cofre com tempo de abertura, apoio psicológico pós-evento',
    )

    // ---------- Novos Físicos ----------
    criar({
      nome: 'Radiações não ionizantes',
      tipo: 'Físico',
      anexo_nr15: '7',
      tipo_avaliacao_nr15: 'Qualitativa',
      grau_insalubridade_nr15: 'Médio (20%)',
      fonte_geradora_tipica: 'Solda elétrica, raios ultravioleta, laser, radiação solar direta',
      danos_saude_tipicos: 'Queimaduras, lesões oculares (fotoceratite), câncer de pele',
      efeito_saude_aiha: '2',
      medidas_controle_tipicas: 'Anteparos, óculos com filtro adequado, protetor facial, EPI',
    })
    criar({
      nome: 'Pressão atmosférica anormal (trabalho hiperbárico)',
      tipo: 'Físico',
      anexo_nr15: '6',
      tipo_avaliacao_nr15: 'Qualitativa',
      grau_insalubridade_nr15: 'Máximo (40%)',
      anos_aposentadoria_especial: '25',
      fonte_geradora_tipica: 'Mergulho, câmara hiperbárica, trabalho em caixão pneumático',
      danos_saude_tipicos: 'Doença descompressiva, barotrauma',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Tabela de descompressão, supervisão de mergulho, equipamento certificado',
    })
    criar({
      nome: 'Umidade excessiva',
      tipo: 'Físico',
      anexo_nr15: '10',
      tipo_avaliacao_nr15: 'Qualitativa',
      grau_insalubridade_nr15: 'Médio (20%)',
      fonte_geradora_tipica: 'Trabalho em local alagado, encharcado, com umidade excessiva',
      danos_saude_tipicos: 'Doenças de pele, do aparelho respiratório e reumáticas',
      efeito_saude_aiha: '1',
      medidas_controle_tipicas: 'Botas impermeáveis, drenagem do local, rodízio',
    })

    // ---------- Novos Químicos ----------
    criar({
      nome: 'Chumbo e seus compostos',
      tipo: 'Químico',
      anexo_nr15: '13',
      tipo_avaliacao_nr15: 'Quantitativa',
      grau_insalubridade_nr15: 'Máximo (40%)',
      via_absorcao_pele: false,
      fonte_geradora_tipica: 'Fundição, reforma de baterias, soldagem, tintas antigas',
      danos_saude_tipicos: 'Saturnismo, danos neurológicos e renais',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Exaustão, higiene pessoal rigorosa, monitoramento biológico (plumbemia)',
    })
    criar({
      nome: 'Mercúrio e seus compostos',
      tipo: 'Químico',
      anexo_nr15: '13',
      tipo_avaliacao_nr15: 'Quantitativa',
      grau_insalubridade_nr15: 'Máximo (40%)',
      via_absorcao_pele: true,
      fonte_geradora_tipica: 'Garimpo, laboratórios, lâmpadas fluorescentes quebradas',
      danos_saude_tipicos: 'Intoxicação neurológica, danos renais',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas: 'Sistema fechado, exaustão, monitoramento biológico',
    })
    criar({
      nome: 'Cromo hexavalente e seus compostos',
      tipo: 'Químico',
      anexo_nr15: '13',
      tipo_avaliacao_nr15: 'Quantitativa',
      grupo_linach: '1',
      fonte_geradora_tipica: 'Cromação eletrolítica, soldagem de aço inox, curtumes',
      danos_saude_tipicos: 'Câncer de pulmão, lesões nasais e de pele',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas: 'Exaustão local, substituição de processo, EPI respiratório',
    })
    criar({
      nome: 'Cádmio e seus compostos',
      tipo: 'Químico',
      anexo_nr15: '13',
      tipo_avaliacao_nr15: 'Quantitativa',
      grupo_linach: '1',
      fonte_geradora_tipica: 'Soldagem, baterias, pigmentos, galvanoplastia',
      danos_saude_tipicos: 'Danos renais e pulmonares, câncer',
      efeito_saude_aiha: '3',
    })
    criar({
      nome: 'Monóxido de carbono',
      tipo: 'Químico',
      anexo_nr15: '11',
      tipo_avaliacao_nr15: 'Quantitativa',
      fonte_geradora_tipica: 'Motores de combustão em local fechado, fornos, garagens',
      danos_saude_tipicos: 'Asfixia, intoxicação, óbito',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Ventilação, detector de gás, proibição de motor ligado em local fechado',
    })
    criar({
      nome: 'Poeira de madeira',
      tipo: 'Químico',
      anexo_nr15: '11',
      tipo_avaliacao_nr15: 'Quantitativa',
      fonte_geradora_tipica: 'Marcenaria, serraria, lixamento de madeira',
      danos_saude_tipicos: 'Rinite, asma ocupacional, câncer nasossinusal (madeiras duras)',
      efeito_saude_aiha: '2',
      medidas_controle_tipicas: 'Exaustão localizada nas máquinas, respirador contra poeira',
    })
    criar({
      nome: 'Agrotóxicos e praguicidas',
      tipo: 'Químico',
      anexo_nr15: '13',
      tipo_avaliacao_nr15: 'Qualitativa',
      grau_insalubridade_nr15: 'Máximo (40%)',
      via_absorcao_pele: true,
      fonte_geradora_tipica: 'Aplicação de defensivos agrícolas, manuseio e armazenamento',
      danos_saude_tipicos: 'Intoxicação aguda e crônica, danos neurológicos',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas: 'EPI completo (NR-31), tempo de reentrada, capacitação',
    })

    // ---------- Novos Biológicos ----------
    criar({
      nome: 'Perfurocortantes contaminados (resíduos de serviços de saúde)',
      tipo: 'Biológico',
      anexo_nr15: '14',
      tipo_avaliacao_nr15: 'Qualitativa',
      grau_insalubridade_nr15: 'Máximo (40%)',
      fonte_geradora_tipica: 'Manuseio de agulhas, lâminas e resíduos de saúde',
      danos_saude_tipicos: 'Hepatite B/C, HIV (exposição a material biológico)',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Descarte em caixa rígida (NR-32), CIPA, vacinação, PEP quando indicado',
    })
    criar({
      nome: 'Contato com animais e dejetos (trabalho rural/veterinário)',
      tipo: 'Biológico',
      anexo_nr15: '14',
      tipo_avaliacao_nr15: 'Qualitativa',
      fonte_geradora_tipica: 'Manejo de rebanho, ordenha, abate, clínica veterinária',
      danos_saude_tipicos: 'Zoonoses (brucelose, leptospirose, raiva)',
      efeito_saude_aiha: '2',
      medidas_controle_tipicas: 'EPI, vacinação do rebanho e dos trabalhadores, higiene',
    })

    // ---------- Novos Ergonômicos ----------
    criar({
      nome: 'Jornada de trabalho prolongada / trabalho noturno',
      tipo: 'Ergonômico',
      fonte_geradora_tipica: 'Turnos alternados, dupla jornada, prorrogação habitual de horário',
      danos_saude_tipicos: 'Distúrbios do sono, fadiga crônica, doenças cardiovasculares',
      efeito_saude_aiha: '2',
      medidas_controle_tipicas: 'Escala compatível com NR-17, pausas, controle de horas extras',
    })
    criar({
      nome: 'Esforço visual / iluminação inadequada',
      tipo: 'Ergonômico',
      fonte_geradora_tipica:
        'Telas por longos períodos, iluminação insuficiente ou com ofuscamento',
      danos_saude_tipicos: 'Fadiga visual, cefaleia',
      efeito_saude_aiha: '1',
      medidas_controle_tipicas:
        'Adequação de iluminância (NBR 8995), pausas, correção de ofuscamento',
    })
    criar({
      nome: 'Ritmo de trabalho excessivo / monotonia',
      tipo: 'Ergonômico',
      fonte_geradora_tipica: 'Metas de produção elevadas, tarefas repetitivas em ciclo curto',
      danos_saude_tipicos: 'Fadiga, LER/DORT, sofrimento mental',
      efeito_saude_aiha: '2',
      medidas_controle_tipicas: 'Dimensionamento de metas, pausas, rodízio de tarefas',
    })

    // ---------- Novos Acidentes/mecânicos ----------
    criar({
      nome: 'Espaço confinado',
      tipo: 'Acidente',
      fonte_geradora_tipica: 'Tanques, silos, poços, galerias, reservatórios (NR-33)',
      danos_saude_tipicos: 'Asfixia, intoxicação, óbito',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas:
        'PET (permissão de entrada), monitoramento de atmosfera, vigia, resgate',
    })
    criar({
      nome: 'Animais peçonhentos',
      tipo: 'Acidente',
      fonte_geradora_tipica: 'Trabalho rural, florestal, obras em área com vegetação',
      danos_saude_tipicos: 'Envenenamento, reações alérgicas graves, óbito',
      efeito_saude_aiha: '2',
      medidas_controle_tipicas:
        'Botas de cano alto, inspeção do local, treinamento, soro disponível',
    })
    criar({
      nome: 'Armazenamento e empilhamento inadequados',
      tipo: 'Acidente',
      fonte_geradora_tipica: 'Estoques, depósitos, prateleiras sobrecarregadas',
      danos_saude_tipicos: 'Queda de materiais, esmagamento, soterramento',
      efeito_saude_aiha: '2',
      medidas_controle_tipicas: 'Limite de altura/peso, racks adequados, sinalização, treinamento',
    })
    criar({
      nome: 'Manuseio de ferramentas perfurocortantes',
      tipo: 'Acidente',
      fonte_geradora_tipica: 'Facas, serras, estiletes, ferramentas de corte manual',
      danos_saude_tipicos: 'Cortes, perfurações',
      efeito_saude_aiha: '1',
      medidas_controle_tipicas:
        'Luva de proteção adequada, procedimento de corte, ferramenta com proteção',
    })
  },
  (app) => {
    const col = app.findCollectionByNameOrId('agentes_catalogo')
    const nomes = [
      'Radiações não ionizantes',
      'Pressão atmosférica anormal (trabalho hiperbárico)',
      'Umidade excessiva',
      'Chumbo e seus compostos',
      'Mercúrio e seus compostos',
      'Cromo hexavalente e seus compostos',
      'Cádmio e seus compostos',
      'Monóxido de carbono',
      'Poeira de madeira',
      'Agrotóxicos e praguicidas',
      'Perfurocortantes contaminados (resíduos de serviços de saúde)',
      'Contato com animais e dejetos (trabalho rural/veterinário)',
      'Jornada de trabalho prolongada / trabalho noturno',
      'Esforço visual / iluminação inadequada',
      'Ritmo de trabalho excessivo / monotonia',
      'Espaço confinado',
      'Animais peçonhentos',
      'Armazenamento e empilhamento inadequados',
      'Manuseio de ferramentas perfurocortantes',
    ]
    nomes.forEach((nome) => {
      const registros = app.findRecordsByFilter(
        col,
        `organizacao_id = '' && nome = '${nome.replace(/'/g, "\\'")}'`,
        '',
        1,
        0,
      )
      registros.forEach((r) => app.delete(r))
    })
    // Nota: a reversão não desfaz os "completar()" de medidas_controle_tipicas
    // nos registros de 0149 — são apenas preenchimentos de campos vazios.
  },
)
