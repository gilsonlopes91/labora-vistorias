// 0188: segunda empresa cliente FICTÍCIA, "Marcenaria Serra Azul Ltda", para testar o
// novo motor de documentos (PGR, LTCAT, laudos NR-15 e NR-16) com várias funções e vários
// riscos por função, de todas as categorias. Fica na organização de teste "Horizonte
// Segurança do Trabalho Ltda" (0165); se ela não existir, a migração não faz nada.
//
//   GHE-01 Marcenaria (8 trab.)    -> Marceneiro: ruído (insalubre), poeira de madeira, partes
//                                     móveis (serra), vibração mãos-braços, carga manual (AET
//                                     recomendada), postura, sobrecarga de metas.
//   GHE-02 Acabamento (4 trab.)    -> Pintor: solventes (insalubre), inflamáveis (periculoso,
//                                     NR-16 Anexo 2), ruído baixo, postura, queda mesmo nível.
//   Sem GHE (risco direto da função)
//                  Auxiliar de expedição (3): carga manual, empilhamento, motocicleta (NR-16
//                                     Anexo 5), queda mesmo nível.
//   GHE-03 Administrativo (3)      -> Auxiliar administrativo: mobiliário, esforço visual,
//                                     assédio/conflitos; sem agente nocivo.
// Todos os números (CNPJ, CA, série, certificado, medições) são inventados e não representam
// nenhuma empresa ou equipamento real.
migrate(
  (app) => {
    let org
    try {
      org = app.findFirstRecordByData(
        'organizacoes',
        'nome',
        'Horizonte Segurança do Trabalho Ltda',
      )
    } catch (_) {
      return
    }

    const CNPJ = '33.444.555/0001-81'
    const col = (n) => app.findCollectionByNameOrId(n)
    const achar = (colecao, filtro, params) => {
      try {
        return app.findFirstRecordByFilter(colecao, filtro, params)
      } catch (_) {
        return null
      }
    }
    // nome exato do catálogo oficial (organizacao_id vazio)
    const agente = (nome) =>
      achar('agentes_catalogo', "organizacao_id = '' && nome = {:n}", { n: nome })

    // ---------- Empresa ----------
    let empresa = achar('empresas', 'organizacao_id = {:o} && cnpj = {:c}', { o: org.id, c: CNPJ })
    if (!empresa) {
      empresa = new Record(col('empresas'))
      empresa.set('organizacao_id', org.id)
    }
    const defE = {
      razao_social: 'Marcenaria Serra Azul Ltda (FICTÍCIA)',
      nome_fantasia: 'Marcenaria Serra Azul',
      cnpj: CNPJ,
      cnae: '31.01-2',
      cnae_descricao: 'Fabricação de móveis com predominância de madeira',
      porte: 'Demais / Não se enquadra',
      grau_risco: 3,
      numero_funcionarios: 18,
      endereco: 'Av. das Acácias, 450, Distrito Industrial',
      cidade: 'Teresina',
      uf: 'PI',
      contato_nome: 'Helena Ribeiro',
      contato_telefone: '(86) 3000-0001',
      contato_email: 'contato@serraazul.exemplo.invalid',
      pgr_matriz_padrao_dimensao: '5',
      pgr_matriz_padrao_metodologia: 'LABORA',
      nome_estabelecimento: 'Unidade Matriz, Teresina/PI',
      representante_legal_nome: 'Helena Ribeiro',
      representante_legal_cargo: 'Sócia-administradora',
      gestao_sst: 'Designado de CIPA',
      jornada_trabalho: '44 horas semanais',
      horario_trabalho: 'Segunda a sexta, das 7h às 17h, com 1h de intervalo; sábado das 7h às 11h',
      turnos_trabalho: 'Turno único (diurno)',
      descricao_processo_produtivo:
        'Fabricação de móveis sob medida: corte e usinagem de MDF e madeira maciça, montagem, lixamento e acabamento com verniz e laca em cabine de pintura, estoque e expedição com entrega própria. Há um escritório administrativo no mesmo terreno.',
      canal_comunicacao: 'sst@serraazul.exemplo.invalid e quadro de avisos na copa',
      responsavel_plano_nome: 'Helena Ribeiro',
      responsavel_plano_cargo: 'Sócia-administradora',
      periodicidade_acompanhamento: 'Trimestral',
      forma_acesso_documento: 'Cópia digital sob solicitação e cópia impressa no escritório',
      local_guarda: 'Escritório administrativo da empresa',
      convencao_coletiva_insalubridade: false,
      area_construida_pavimentos: '1.800 m², térreo',
      avcb_clcb: 'AVCB fictício nº 0001/2026, válido até 12/2027',
    }
    Object.entries(defE).forEach(([k, v]) => empresa.set(k, v))
    app.save(empresa)

    // ---------- Setores ----------
    const setores = {}
    const defSetores = [
      {
        nome: 'Marcenaria',
        maquinas_equipamentos:
          'Serra circular de bancada (2), esquadrejadeira (1), plaina (1), furadeira de bancada (2), lixadeiras orbitais (4), coletor de pó (1).',
      },
      {
        nome: 'Acabamento',
        maquinas_equipamentos:
          'Cabine de pintura com exaustão (1), compressor (1), pistolas de pintura (3), estufa de secagem (1).',
      },
      {
        nome: 'Expedição e estoque',
        maquinas_equipamentos: 'Paleteira manual, carrinhos, 1 motocicleta de entrega.',
      },
      { nome: 'Administrativo', maquinas_equipamentos: 'Computadores, impressora.' },
    ]
    for (const d of defSetores) {
      let s = achar('setores', 'empresa_id = {:e} && nome = {:n}', { e: empresa.id, n: d.nome })
      if (!s) {
        s = new Record(col('setores'))
        s.set('organizacao_id', org.id)
        s.set('empresa_id', empresa.id)
        s.set('nome', d.nome)
      }
      s.set('maquinas_equipamentos', d.maquinas_equipamentos)
      app.save(s)
      setores[d.nome] = s
    }

    // ---------- GHEs ----------
    const defGhes = [
      {
        codigo: 'GHE-01',
        nome: 'Marcenaria',
        setor: 'Marcenaria',
        criterio: 'Marceneiros do galpão de usinagem, expostos às mesmas máquinas e ao mesmo pó.',
        descricao: 'Corte, furação, plainamento e lixamento de peças de madeira e MDF.',
        expostos: 8,
      },
      {
        codigo: 'GHE-02',
        nome: 'Acabamento',
        setor: 'Acabamento',
        criterio: 'Pintores da cabine de pintura e da área de secagem.',
        descricao: 'Aplicação de verniz e laca com pistola e secagem em estufa.',
        expostos: 4,
      },
      {
        codigo: 'GHE-03',
        nome: 'Administrativo',
        setor: 'Administrativo',
        criterio: 'Funções de escritório, sem exposição a agentes ambientais.',
        descricao: 'Atividades de escritório com computador.',
        expostos: 3,
      },
    ]
    const ghes = {}
    for (const d of defGhes) {
      let g = achar('ghes', 'empresa_id = {:e} && codigo = {:c}', { e: empresa.id, c: d.codigo })
      if (!g) {
        g = new Record(col('ghes'))
        g.set('organizacao_id', org.id)
        g.set('empresa_id', empresa.id)
        g.set('codigo', d.codigo)
      }
      g.set('nome', d.nome)
      g.set('tipo_agrupamento', 'GHE')
      g.set('criterio_agrupamento', d.criterio)
      g.set('descricao_atividades', d.descricao)
      g.set('numero_expostos', d.expostos)
      g.set('setor_id', setores[d.setor].id)
      app.save(g)
      ghes[d.codigo] = g
    }

    // ---------- Funções ----------
    const defFuncoes = [
      {
        nome: 'Marceneiro',
        cbo: '7711-05',
        ghe: 'GHE-01',
        setor: 'Marcenaria',
        qtd: 8,
        h: 7,
        m: 1,
        desc: 'Opera serra circular, esquadrejadeira, plaina e furadeira; monta e lixa os móveis; movimenta chapas de MDF.',
      },
      {
        nome: 'Pintor',
        cbo: '7166-10',
        ghe: 'GHE-02',
        setor: 'Acabamento',
        qtd: 4,
        h: 3,
        m: 1,
        desc: 'Prepara tintas e vernizes, aplica com pistola na cabine, controla a estufa de secagem e limpa os equipamentos com solvente.',
      },
      {
        nome: 'Auxiliar de expedição',
        cbo: '4141-05',
        ghe: null,
        setor: 'Expedição e estoque',
        qtd: 3,
        h: 3,
        m: 0,
        desc: 'Separa, embala e empilha os móveis no estoque, carrega o veículo e faz entregas de pequeno porte de motocicleta.',
      },
      {
        nome: 'Auxiliar administrativo',
        cbo: '4110-10',
        ghe: 'GHE-03',
        setor: 'Administrativo',
        qtd: 3,
        h: 1,
        m: 2,
        desc: 'Atendimento a clientes, orçamentos, lançamentos financeiros, arquivo e emissão de documentos.',
      },
    ]
    const funcoes = {}
    for (const d of defFuncoes) {
      let f = achar('funcoes_sst', 'empresa_id = {:e} && nome = {:n}', { e: empresa.id, n: d.nome })
      if (!f) {
        f = new Record(col('funcoes_sst'))
        f.set('organizacao_id', org.id)
        f.set('empresa_id', empresa.id)
        f.set('nome', d.nome)
      }
      f.set('cbo', d.cbo)
      f.set('descricao_atividades', d.desc)
      f.set('setor_id', setores[d.setor].id)
      f.set('ghe_id', d.ghe ? ghes[d.ghe].id : '')
      f.set('numero_empregados', d.qtd)
      f.set('numero_homens', d.h)
      f.set('numero_mulheres', d.m)
      app.save(f)
      funcoes[d.nome] = f
    }

    // ---------- Avaliações de risco ----------
    const aval = (alvo, perigo, dados) => {
      const campo = alvo.tipo === 'ghe' ? 'ghe_id' : 'funcao_id'
      let a = achar('avaliacoes_risco', `${campo} = {:a} && perigo_descricao = {:p}`, {
        a: alvo.id,
        p: perigo,
      })
      if (!a) {
        a = new Record(col('avaliacoes_risco'))
        a.set('organizacao_id', org.id)
        a.set('perigo_descricao', perigo)
      }
      a.set(campo, alvo.id)
      Object.entries(dados).forEach(([k, v]) => a.set(k, v))
      a.set('ativo', true)
      a.set('origem', 'Manual')
      app.save(a)
      return a
    }
    const g1 = { tipo: 'ghe', id: ghes['GHE-01'].id }
    const g2 = { tipo: 'ghe', id: ghes['GHE-02'].id }
    const g3 = { tipo: 'ghe', id: ghes['GHE-03'].id }
    const fExp = { tipo: 'funcao', id: funcoes['Auxiliar de expedição'].id }
    const idDe = (nome) => {
      const r = agente(nome)
      return r ? r.id : ''
    }
    const SEM = {
      insalubridade_sugerida: 'Não caracteriza',
      insalubridade_final: 'Não caracteriza',
      periculosidade_sugerida: false,
      periculosidade_final: false,
      ltcat_enquadra_sugerido: 'Não',
      ltcat_enquadra_final: 'Não',
    }

    // ===== GHE-01 Marcenaria (Marceneiro) =====
    const avRuido = aval(g1, 'Ruído nas máquinas de marcenaria', {
      agente_id: idDe('Ruído contínuo ou intermitente'),
      fonte_geradora: 'Serra circular, plaina e esquadrejadeira',
      atividades_relacionadas: 'Corte e plainamento de madeira e MDF',
      meio_propagacao: 'Ar',
      frequencia_exposicao: 'Habitual e permanente',
      tempo_exposicao_min_jornada: 450,
      numero_expostos: 8,
      danos_possiveis: 'Perda auditiva induzida por ruído (PAIR)',
      efeito_saude_aiha: '3',
      trilha_probabilidade: 'Quantitativa (medição)',
      controle_descricao:
        'Sem enclausuramento das máquinas; protetor auditivo fornecido, com higienização irregular.',
      controle_nivel: 'Deficiente ou incompleto',
      categoria_aiha_exposicao: '3',
      incerteza: '1',
      epc_lista: 'Nenhum EPC específico para ruído',
      epc_eficaz: false,
      epc_plano_manutencao: false,
      medidas_administrativas: 'Treinamento anual de conservação auditiva; audiometria periódica',
      epis_utilizados: 'Protetor auditivo tipo concha (CA fictício TESTE-101)',
      epi_condicao_funcionamento: true,
      epi_uso_ininterrupto: true,
      epi_validade_ca_ok: true,
      epi_periodicidade_troca_ok: true,
      epi_higienizacao_ok: false,
      probabilidade_sugerida: 4,
      probabilidade_final: 4,
      severidade_sugerida: 3,
      severidade_final: 3,
      justificativa_ajuste: 'Probabilidade alta: NEN medido acima do limite e controle deficiente.',
      insalubridade_sugerida: 'Médio (20%)',
      insalubridade_final: 'Médio (20%)',
      insalubridade_justificativa:
        'NEN de 91,4 dB(A) (dose de 156%), acima do limite de 85 dB(A) do Anexo 1 da NR-15; protetor sem higienização regular, sem neutralizar o agente.',
      periculosidade_sugerida: false,
      periculosidade_final: false,
      ltcat_enquadra_sugerido: 'Sim - 25 anos',
      ltcat_enquadra_final: 'Sim - 25 anos',
      ltcat_justificativa:
        'Ruído acima de 85 dB(A) em exposição habitual e permanente (código 2.0.1 do Anexo IV do Decreto 3.048/1999).',
      comentario_tecnico:
        'O ruído vem principalmente da serra circular e da plaina, que trabalham juntas na maior parte do dia. O protetor existe, mas a higienização é irregular e isso reduz a proteção real.',
      medidas_faltantes:
        'Enclausuramento ou cortina acústica na plaina; cronograma de higienização e troca dos protetores.',
    })

    const avPoeira = aval(g1, 'Poeira de madeira', {
      agente_id: idDe('Poeira de madeira'),
      fonte_geradora: 'Serra, plaina e lixadeiras',
      atividades_relacionadas: 'Usinagem e lixamento de madeira e MDF',
      meio_propagacao: 'Ar (partículas)',
      via_absorcao: 'Inalatória',
      frequencia_exposicao: 'Habitual e permanente',
      tempo_exposicao_min_jornada: 400,
      numero_expostos: 8,
      danos_possiveis: 'Rinite, asma ocupacional, irritação das vias aéreas',
      efeito_saude_aiha: '2',
      trilha_probabilidade: 'Quantitativa (medição)',
      controle_descricao: 'Coletor de pó atende só a serra circular; lixamento sem captação.',
      controle_nivel: 'Adequado, com pequenas deficiências',
      categoria_aiha_exposicao: '2',
      incerteza: '2',
      epc_lista: 'Coletor de pó na serra circular',
      epc_eficaz: false,
      epc_plano_manutencao: true,
      epis_utilizados: 'Respirador PFF2 (CA fictício TESTE-102)',
      epi_condicao_funcionamento: true,
      epi_uso_ininterrupto: true,
      epi_validade_ca_ok: true,
      epi_periodicidade_troca_ok: true,
      epi_higienizacao_ok: true,
      probabilidade_sugerida: 3,
      probabilidade_final: 3,
      severidade_sugerida: 2,
      severidade_final: 2,
      insalubridade_sugerida: 'Não caracteriza',
      insalubridade_final: 'Não caracteriza',
      insalubridade_justificativa:
        'Concentração de 1,8 mg/m³, abaixo do limite adotado de 4 mg/m³ (dado fictício); sem enquadramento nos anexos da NR-15.',
      periculosidade_sugerida: false,
      periculosidade_final: false,
      ltcat_enquadra_sugerido: 'Não',
      ltcat_enquadra_final: 'Não',
      ltcat_justificativa: 'Concentração abaixo do limite de tolerância.',
      comentario_tecnico:
        'A concentração medida está abaixo do limite, mas só a serra circular tem captação de pó. No lixamento a exposição depende do respirador.',
      medidas_faltantes: 'Captação de pó nas lixadeiras e na plaina.',
    })

    const avSerra = aval(g1, 'Contato com partes móveis da serra circular', {
      agente_id: idDe('Contato com partes móveis de máquinas'),
      fonte_geradora: 'Serra circular de bancada e plaina',
      atividades_relacionadas: 'Corte de peças',
      frequencia_exposicao: 'Habitual e permanente',
      tempo_exposicao_min_jornada: 300,
      numero_expostos: 8,
      danos_possiveis: 'Cortes profundos, amputação de dedos e mãos',
      efeito_saude_aiha: '4',
      trilha_probabilidade: 'Acidente/mecânico',
      controle_descricao:
        'Proteção da lâmina em uma das duas serras; empurrador disponível; sem dispositivo de parada por freio.',
      controle_nivel: 'Deficiente ou incompleto',
      epc_lista: 'Proteção da lâmina (1 de 2 serras), empurrador',
      epc_eficaz: false,
      epc_plano_manutencao: true,
      medidas_administrativas: 'Treinamento NR-12 e procedimento de operação',
      epis_utilizados: 'Óculos de proteção (CA fictício TESTE-103)',
      probabilidade_sugerida: 3,
      probabilidade_final: 4,
      severidade_sugerida: 5,
      severidade_final: 5,
      justificativa_ajuste:
        'Probabilidade elevada de 3 para 4: uma das duas serras está sem a proteção da lâmina.',
      ...SEM,
      ltcat_justificativa: 'Risco de acidente, sem agente nocivo do Anexo IV.',
      comentario_tecnico:
        'Uma das duas serras opera sem a proteção da lâmina. É o risco mais grave da função, porque o dano possível é a amputação.',
      medidas_faltantes:
        'Instalar a proteção da lâmina na segunda serra e avaliar freio de parada rápida.',
    })

    aval(g1, 'Vibração de mãos e braços nas lixadeiras', {
      agente_id: idDe('Vibração de mãos e braços'),
      fonte_geradora: 'Lixadeiras orbitais',
      atividades_relacionadas: 'Lixamento de peças',
      meio_propagacao: 'Empunhadura',
      frequencia_exposicao: 'Habitual e intermitente',
      tempo_exposicao_min_jornada: 150,
      numero_expostos: 8,
      danos_possiveis: 'Formigamento, perda de sensibilidade, síndrome de Raynaud',
      efeito_saude_aiha: '2',
      trilha_probabilidade: 'Qualitativa (controle)',
      controle_descricao: 'Ferramentas em bom estado; sem medição de aceleração ainda.',
      controle_nivel: 'Adequado, com pequenas deficiências',
      categoria_aiha_exposicao: '1',
      incerteza: '3',
      epis_utilizados: 'Luvas antivibratórias (CA fictício TESTE-104)',
      epi_condicao_funcionamento: true,
      epi_uso_ininterrupto: false,
      epi_validade_ca_ok: true,
      probabilidade_sugerida: 2,
      probabilidade_final: 2,
      severidade_sugerida: 2,
      severidade_final: 2,
      insalubridade_sugerida: 'Não caracteriza',
      insalubridade_final: 'Não caracteriza',
      insalubridade_justificativa:
        'Sem medição de vibração; exposição intermitente e curta. Recomenda-se avaliar.',
      periculosidade_sugerida: false,
      periculosidade_final: false,
      ltcat_enquadra_sugerido: 'Não',
      ltcat_enquadra_final: 'Não',
      ltcat_justificativa: 'Sem dado quantitativo que indique enquadramento.',
      comentario_tecnico:
        'A exposição é curta e intermitente. Ainda não há medição, então a conclusão é provisória.',
      medidas_faltantes: 'Medir a aceleração (aren) das lixadeiras.',
    })

    aval(g1, 'Levantamento manual de chapas de MDF', {
      agente_id: idDe('Levantamento e transporte manual de cargas'),
      fonte_geradora: 'Chapas de MDF de 18 a 28 kg',
      atividades_relacionadas: 'Abastecer a serra e a esquadrejadeira',
      frequencia_exposicao: 'Habitual e permanente',
      tempo_exposicao_min_jornada: 120,
      numero_expostos: 8,
      danos_possiveis: 'Lombalgia, hérnia de disco',
      efeito_saude_aiha: '2',
      trilha_probabilidade: 'Ergonômica (AEP/AET)',
      resultado_aep_aet: 'Médio',
      observacoes_aep_aet:
        'Análise preliminar (fictícia): peso das chapas e altura de pega acima do recomendado; sem carrinho de apoio.',
      controle_nivel: 'Deficiente ou incompleto',
      probabilidade_sugerida: 3,
      probabilidade_final: 3,
      severidade_sugerida: 2,
      severidade_final: 2,
      aet_situacao: 'Recomendada',
      ...SEM,
      comentario_tecnico:
        'As chapas são pesadas e levantadas por um só trabalhador. A análise preliminar indica risco médio e uma AET deve aprofundar o caso.',
      medidas_faltantes:
        'Carrinho para chapas e rodízio de tarefas; AET da movimentação de chapas.',
    })

    aval(g1, 'Metas de produção e prazos de entrega', {
      agente_id: idDe('Sobrecarga de trabalho e pressão por metas'),
      fonte_geradora: 'Prazos de entrega de móveis sob medida',
      atividades_relacionadas: 'Produção',
      frequencia_exposicao: 'Habitual e intermitente',
      numero_expostos: 8,
      danos_possiveis: 'Estresse, ansiedade',
      efeito_saude_aiha: '2',
      trilha_probabilidade: 'Psicossocial',
      controle_nivel: 'Adequado, com pequenas deficiências',
      probabilidade_sugerida: 2,
      probabilidade_final: 2,
      severidade_sugerida: 2,
      severidade_final: 2,
      ...SEM,
      comentario_tecnico: 'Há picos de pressão perto das entregas, sem queixa formal registrada.',
      medidas_faltantes: 'Escuta periódica da equipe e planejamento das entregas.',
    })

    // ===== GHE-02 Acabamento (Pintor) =====
    const avSolvente = aval(g2, 'Solventes orgânicos na pintura', {
      agente_id: idDe('Solventes orgânicos (genérico)'),
      fonte_geradora: 'Tintas, vernizes, lacas e thinner',
      atividades_relacionadas: 'Aplicação com pistola e limpeza de equipamentos',
      meio_propagacao: 'Ar (vapores)',
      via_absorcao: 'Inalatória e cutânea',
      frequencia_exposicao: 'Habitual e permanente',
      tempo_exposicao_min_jornada: 360,
      numero_expostos: 4,
      danos_possiveis: 'Irritação respiratória, cefaleia, dermatite',
      efeito_saude_aiha: '3',
      trilha_probabilidade: 'Quantitativa (medição)',
      controle_descricao:
        'Cabine com exaustão; filtro da cabine vencido; limpeza de pistolas fora da cabine.',
      controle_nivel: 'Deficiente ou incompleto',
      categoria_aiha_exposicao: '3',
      incerteza: '1',
      epc_lista: 'Cabine de pintura com exaustão',
      epc_eficaz: false,
      epc_plano_manutencao: false,
      epis_utilizados:
        'Respirador com filtro para vapores orgânicos (CA fictício TESTE-105), luvas nitrílicas',
      epi_condicao_funcionamento: true,
      epi_uso_ininterrupto: true,
      epi_validade_ca_ok: true,
      epi_periodicidade_troca_ok: false,
      epi_higienizacao_ok: true,
      probabilidade_sugerida: 4,
      probabilidade_final: 4,
      severidade_sugerida: 3,
      severidade_final: 3,
      insalubridade_sugerida: 'Médio (20%)',
      insalubridade_final: 'Médio (20%)',
      insalubridade_justificativa:
        'Concentração de 118 ppm de mistura de solventes, acima do limite de 78 ppm adotado (dado fictício); filtro do respirador sem troca na periodicidade.',
      periculosidade_sugerida: false,
      periculosidade_final: false,
      ltcat_enquadra_sugerido: 'Não',
      ltcat_enquadra_final: 'Não',
      ltcat_justificativa:
        'Sem enquadramento de aposentadoria especial no Anexo IV para esta mistura.',
      comentario_tecnico:
        'A cabine existe, mas o filtro está vencido e as pistolas são limpas fora dela. Por isso a concentração passa do limite.',
      medidas_faltantes:
        'Trocar o filtro da cabine, limpar as pistolas dentro dela e trocar os filtros do respirador no prazo.',
    })

    const avInflamavel = aval(g2, 'Armazenamento e uso de inflamáveis', {
      agente_id: idDe('Incêndio e explosão — inflamáveis'),
      fonte_geradora: 'Latas de tinta, thinner e verniz; estoque de 380 litros',
      atividades_relacionadas: 'Preparo e aplicação de tintas, limpeza',
      frequencia_exposicao: 'Habitual e permanente',
      tempo_exposicao_min_jornada: 360,
      numero_expostos: 4,
      danos_possiveis: 'Queimaduras graves, explosão, óbito',
      efeito_saude_aiha: '4',
      trilha_probabilidade: 'Acidente/mecânico',
      controle_descricao:
        'Armário metálico ventilado; sinalização presente; extintores válidos; sem aterramento dos recipientes.',
      controle_nivel: 'Adequado, com pequenas deficiências',
      epc_lista: 'Armário ventilado, extintores, sinalização',
      epc_eficaz: true,
      epc_plano_manutencao: true,
      probabilidade_sugerida: 2,
      probabilidade_final: 2,
      severidade_sugerida: 5,
      severidade_final: 5,
      insalubridade_sugerida: 'Não caracteriza',
      insalubridade_final: 'Não caracteriza',
      periculosidade_sugerida: true,
      periculosidade_final: true,
      periculosidade_anexo: '2',
      periculosidade_justificativa:
        'Permanência habitual em área de risco de inflamáveis líquidos acima do limite de 250 litros (Anexo 2 da NR-16), com 380 litros armazenados.',
      ltcat_enquadra_sugerido: 'Não',
      ltcat_enquadra_final: 'Não',
      ltcat_justificativa: 'Inflamável é risco de acidente, sem agente nocivo do Anexo IV.',
      comentario_tecnico:
        'O estoque de 380 litros passa do limite de 250 litros e o pintor permanece na área durante o trabalho. Os controles de armazenamento estão em ordem, mas isso não afasta a periculosidade.',
      medidas_faltantes:
        'Aterramento dos recipientes na transferência e redução do volume estocado na área.',
    })

    aval(g2, 'Ruído do compressor e da exaustão', {
      agente_id: idDe('Ruído contínuo ou intermitente'),
      fonte_geradora: 'Compressor e exaustor da cabine',
      atividades_relacionadas: 'Pintura',
      meio_propagacao: 'Ar',
      frequencia_exposicao: 'Habitual e permanente',
      tempo_exposicao_min_jornada: 420,
      numero_expostos: 4,
      danos_possiveis: 'Desconforto e, a longo prazo, perda auditiva',
      efeito_saude_aiha: '3',
      trilha_probabilidade: 'Quantitativa (medição)',
      controle_descricao: 'Compressor em casa isolada; exaustor com manutenção em dia.',
      controle_nivel: 'Conforme, com manutenção garantida',
      categoria_aiha_exposicao: '1',
      incerteza: '1',
      epc_lista: 'Casa isolada do compressor',
      epc_eficaz: true,
      epc_plano_manutencao: true,
      probabilidade_sugerida: 1,
      probabilidade_final: 1,
      severidade_sugerida: 3,
      severidade_final: 3,
      insalubridade_sugerida: 'Não caracteriza',
      insalubridade_final: 'Não caracteriza',
      insalubridade_justificativa:
        'NEN de 78,6 dB(A), abaixo do limite de 85 dB(A) e do nível de ação de 80 dB(A).',
      periculosidade_sugerida: false,
      periculosidade_final: false,
      ltcat_enquadra_sugerido: 'Não',
      ltcat_enquadra_final: 'Não',
      ltcat_justificativa: 'Ruído abaixo de 85 dB(A).',
      comentario_tecnico:
        'O nível ficou abaixo do nível de ação, então não exige ações além do monitoramento.',
    })

    aval(g2, 'Posturas forçadas na aplicação de tinta', {
      agente_id: idDe('Posturas forçadas e repetitividade'),
      fonte_geradora: 'Aplicação manual em peças grandes',
      atividades_relacionadas: 'Pintura de móveis',
      frequencia_exposicao: 'Habitual e permanente',
      numero_expostos: 4,
      danos_possiveis: 'Dor em ombros e coluna, tendinites',
      efeito_saude_aiha: '2',
      trilha_probabilidade: 'Ergonômica (AEP/AET)',
      resultado_aep_aet: 'Baixo',
      observacoes_aep_aet:
        'Análise preliminar (fictícia): peças são giradas em cavaletes reguláveis.',
      controle_nivel: 'Conforme, com manutenção garantida',
      probabilidade_sugerida: 2,
      probabilidade_final: 2,
      severidade_sugerida: 2,
      severidade_final: 2,
      aet_situacao: 'Não exigida nesta data',
      ...SEM,
      comentario_tecnico: 'Os cavaletes reguláveis reduzem as posturas extremas.',
    })

    // ===== Auxiliar de expedição (sem GHE, risco direto da função) =====
    aval(fExp, 'Levantamento e empilhamento manual de móveis', {
      agente_id: idDe('Levantamento e transporte manual de cargas'),
      fonte_geradora: 'Caixas e módulos de móveis de 15 a 35 kg',
      atividades_relacionadas: 'Carregar o veículo e organizar o estoque',
      frequencia_exposicao: 'Habitual e permanente',
      tempo_exposicao_min_jornada: 240,
      numero_expostos: 3,
      danos_possiveis: 'Lombalgia, hérnia de disco',
      efeito_saude_aiha: '2',
      trilha_probabilidade: 'Ergonômica (AEP/AET)',
      resultado_aep_aet: 'Alto',
      observacoes_aep_aet:
        'Análise preliminar (fictícia): cargas acima de 25 kg erguidas acima da cintura.',
      controle_nivel: 'Inexistente ou inadequado',
      probabilidade_sugerida: 4,
      probabilidade_final: 4,
      severidade_sugerida: 3,
      severidade_final: 3,
      aet_situacao: 'Elaborada',
      ...SEM,
      comentario_tecnico:
        'A AET já foi feita e confirma o risco alto: peças pesadas sem ajuda mecânica e prateleiras altas.',
      medidas_faltantes: 'Paleteira elétrica, limite de peso por pessoa e prateleiras mais baixas.',
    })

    aval(fExp, 'Armazenamento e empilhamento inadequados', {
      agente_id: idDe('Armazenamento e empilhamento inadequados'),
      fonte_geradora: 'Pilhas de móveis acima de 2 metros',
      atividades_relacionadas: 'Organização do estoque',
      frequencia_exposicao: 'Habitual e intermitente',
      numero_expostos: 3,
      danos_possiveis: 'Queda de materiais, esmagamento',
      efeito_saude_aiha: '2',
      trilha_probabilidade: 'Acidente/mecânico',
      controle_nivel: 'Deficiente ou incompleto',
      probabilidade_sugerida: 3,
      probabilidade_final: 3,
      severidade_sugerida: 3,
      severidade_final: 3,
      ...SEM,
      comentario_tecnico: 'As pilhas passam de 2 metros e não há limite de altura sinalizado.',
      medidas_faltantes: 'Racks com limite de carga e sinalização do limite de empilhamento.',
    })

    aval(fExp, 'Entregas de motocicleta em vias públicas', {
      agente_id: idDe('Uso de motocicleta em vias públicas'),
      fonte_geradora: 'Deslocamento de entrega com motocicleta da empresa',
      atividades_relacionadas: 'Entregas de pequeno porte',
      frequencia_exposicao: 'Habitual e intermitente',
      tempo_exposicao_min_jornada: 90,
      numero_expostos: 1,
      danos_possiveis: 'Acidente de trânsito, fraturas, óbito',
      efeito_saude_aiha: '3',
      trilha_probabilidade: 'Acidente/mecânico',
      controle_descricao:
        'Capacete e jaqueta; treinamento de direção defensiva em dia; moto com revisão em dia.',
      controle_nivel: 'Adequado, com pequenas deficiências',
      epis_utilizados: 'Capacete (CA fictício TESTE-106), jaqueta com proteções',
      probabilidade_sugerida: 3,
      probabilidade_final: 3,
      severidade_sugerida: 4,
      severidade_final: 4,
      insalubridade_sugerida: 'Não caracteriza',
      insalubridade_final: 'Não caracteriza',
      periculosidade_sugerida: true,
      periculosidade_final: true,
      periculosidade_anexo: '5',
      periculosidade_justificativa:
        'Uso de motocicleta em vias abertas à circulação pública como parte da atividade (Anexo 5 da NR-16), com uso habitual intermitente.',
      ltcat_enquadra_sugerido: 'Não',
      ltcat_enquadra_final: 'Não',
      ltcat_justificativa: 'Risco de acidente, sem agente nocivo do Anexo IV.',
      comentario_tecnico: 'Um dos três auxiliares faz as entregas de moto, em parte da jornada.',
    })

    aval(fExp, 'Queda de mesmo nível no estoque', {
      agente_id: idDe('Queda de mesmo nível'),
      fonte_geradora: 'Piso com sobras de embalagem e paletes fora do lugar',
      atividades_relacionadas: 'Circulação no estoque',
      frequencia_exposicao: 'Habitual e intermitente',
      numero_expostos: 3,
      danos_possiveis: 'Contusões, entorses, fraturas',
      efeito_saude_aiha: '1',
      trilha_probabilidade: 'Acidente/mecânico',
      controle_nivel: 'Adequado, com pequenas deficiências',
      probabilidade_sugerida: 3,
      probabilidade_final: 3,
      severidade_sugerida: 2,
      severidade_final: 2,
      ...SEM,
    })

    // ===== GHE-03 Administrativo =====
    aval(g3, 'Mobiliário e posto de trabalho administrativo', {
      agente_id: idDe('Mobiliário e posto de trabalho inadequados'),
      fonte_geradora: 'Cadeiras sem regulagem de altura',
      atividades_relacionadas: 'Trabalho com computador',
      frequencia_exposicao: 'Habitual e permanente',
      numero_expostos: 3,
      danos_possiveis: 'Dores posturais e fadiga',
      efeito_saude_aiha: '1',
      trilha_probabilidade: 'Ergonômica (AEP/AET)',
      resultado_aep_aet: 'Baixo',
      observacoes_aep_aet: 'Análise preliminar (fictícia): duas cadeiras sem regulagem.',
      controle_nivel: 'Adequado, com pequenas deficiências',
      probabilidade_sugerida: 2,
      probabilidade_final: 2,
      severidade_sugerida: 1,
      severidade_final: 1,
      aet_situacao: 'Não exigida nesta data',
      ...SEM,
      medidas_faltantes: 'Trocar as duas cadeiras sem regulagem.',
    })

    aval(g3, 'Esforço visual no trabalho com telas', {
      agente_id: idDe('Esforço visual / iluminação inadequada'),
      fonte_geradora: 'Telas por mais de 6 horas, reflexo da janela',
      atividades_relacionadas: 'Lançamentos e orçamentos',
      frequencia_exposicao: 'Habitual e permanente',
      numero_expostos: 3,
      danos_possiveis: 'Fadiga visual, cefaleia',
      efeito_saude_aiha: '1',
      trilha_probabilidade: 'Ergonômica (AEP/AET)',
      resultado_aep_aet: 'Baixo',
      observacoes_aep_aet: 'Análise preliminar (fictícia): reflexo de luz em uma das telas.',
      controle_nivel: 'Adequado, com pequenas deficiências',
      probabilidade_sugerida: 2,
      probabilidade_final: 2,
      severidade_sugerida: 1,
      severidade_final: 1,
      aet_situacao: 'Não exigida nesta data',
      ...SEM,
    })

    aval(g3, 'Conflitos interpessoais no atendimento', {
      agente_id: idDe('Assédio moral e conflitos interpessoais'),
      fonte_geradora: 'Relação com clientes insatisfeitos e com a produção',
      atividades_relacionadas: 'Atendimento',
      frequencia_exposicao: 'Eventual/ocasional',
      numero_expostos: 3,
      danos_possiveis: 'Estresse, sofrimento psíquico',
      efeito_saude_aiha: '3',
      trilha_probabilidade: 'Psicossocial',
      controle_nivel: 'Adequado, com pequenas deficiências',
      probabilidade_sugerida: 1,
      probabilidade_final: 1,
      severidade_sugerida: 3,
      severidade_final: 3,
      ...SEM,
      comentario_tecnico:
        'Sem registro de ocorrência. O canal de denúncia ainda não foi divulgado.',
      medidas_faltantes: 'Divulgar o canal de denúncia e orientar a equipe de atendimento.',
    })

    // ---------- Medições ----------
    const med = (avaliacao, ponto, dados) => {
      let m = achar('medicoes', 'avaliacao_id = {:a} && trabalhador_ou_ponto = {:p}', {
        a: avaliacao.id,
        p: ponto,
      })
      if (!m) {
        m = new Record(col('medicoes'))
        m.set('organizacao_id', org.id)
        m.set('avaliacao_id', avaliacao.id)
        m.set('trabalhador_ou_ponto', ponto)
      }
      m.set('data', '2026-09-22 12:00:00.000Z')
      m.set('calibracao_validade', '2027-04-10 12:00:00.000Z')
      m.set('observacoes', 'Medição fictícia para teste do sistema.')
      Object.entries(dados).forEach(([k, v]) => m.set(k, v))
      app.save(m)
    }
    const dosimetro = {
      funcao_avaliada: 'Marceneiro',
      metodologia: 'NHO 01 (ruído)',
      equipamento: 'Dosímetro de ruído (modelo fictício DR-200)',
      numero_serie: 'FICT-0517',
      certificado_calibracao: 'CERT-FICT-2026/203',
      calibracao_leitura_inicial: 114,
      calibracao_leitura_final: 114,
      tempo_amostragem_min: 450,
      jornada_min: 480,
      resultado_unidade: 'dB(A)',
    }
    med(avRuido, 'Marceneiro, serra circular', {
      ...dosimetro,
      resultado_valor: 91.9,
      ruido_dose_nr15_pct: 163,
      ruido_nen_nr15_dba: 91.9,
      ruido_nen_nho01_dba: 89.4,
    })
    med(avRuido, 'Marceneiro, plaina', {
      ...dosimetro,
      resultado_valor: 90.8,
      ruido_dose_nr15_pct: 149,
      ruido_nen_nr15_dba: 90.8,
      ruido_nen_nho01_dba: 88.6,
    })
    med(avPoeira, 'Marceneiro, lixamento', {
      funcao_avaliada: 'Marceneiro',
      metodologia: 'NHO 08 (aerodispersoides)',
      equipamento: 'Bomba de amostragem (modelo fictício BA-50)',
      numero_serie: 'FICT-0902',
      certificado_calibracao: 'CERT-FICT-2026/204',
      tempo_amostragem_min: 400,
      jornada_min: 480,
      resultado_valor: 1.8,
      resultado_unidade: 'mg/m³',
    })
    med(avSolvente, 'Pintor, cabine de pintura', {
      funcao_avaliada: 'Pintor',
      metodologia: 'NHO 07 (vapores orgânicos)',
      equipamento: 'Bomba de amostragem (modelo fictício BA-50)',
      numero_serie: 'FICT-0902',
      certificado_calibracao: 'CERT-FICT-2026/204',
      tempo_amostragem_min: 360,
      jornada_min: 480,
      resultado_valor: 118,
      resultado_unidade: 'ppm',
    })

    // ---------- EPIs ----------
    const epi = (ca, dados) => {
      let e = achar('epis_catalogo', 'organizacao_id = {:o} && numero_ca = {:c}', {
        o: org.id,
        c: ca,
      })
      if (!e) {
        e = new Record(col('epis_catalogo'))
        e.set('organizacao_id', org.id)
        e.set('numero_ca', ca)
      }
      Object.entries(dados).forEach(([k, v]) => e.set(k, v))
      e.set('empresa_id', empresa.id)
      e.set('ativo', true)
      app.save(e)
    }
    const ids = (...nomes) => nomes.map(idDe).filter(Boolean)
    epi('TESTE-101', {
      validade_ca: '2028-12-31 12:00:00.000Z',
      fabricante: 'Fabricante Fictício A',
      especificacoes: 'Protetor auditivo tipo concha, NRRsf 20 dB (dado fictício)',
      agentes_protegidos_ids: ids('Ruído contínuo ou intermitente'),
      funcoes_ids: [funcoes['Marceneiro'].id],
    })
    epi('TESTE-102', {
      validade_ca: '2028-12-31 12:00:00.000Z',
      fabricante: 'Fabricante Fictício B',
      especificacoes: 'Respirador descartável PFF2 (dado fictício)',
      agentes_protegidos_ids: ids('Poeira de madeira'),
      funcoes_ids: [funcoes['Marceneiro'].id],
    })
    epi('TESTE-103', {
      validade_ca: '2028-12-31 12:00:00.000Z',
      fabricante: 'Fabricante Fictício C',
      especificacoes: 'Óculos de proteção incolor (dado fictício)',
      agentes_protegidos_ids: ids('Contato com partes móveis de máquinas'),
      funcoes_ids: [funcoes['Marceneiro'].id],
    })
    epi('TESTE-104', {
      validade_ca: '2028-12-31 12:00:00.000Z',
      fabricante: 'Fabricante Fictício D',
      especificacoes: 'Luvas antivibratórias (dado fictício)',
      agentes_protegidos_ids: ids('Vibração de mãos e braços'),
      funcoes_ids: [funcoes['Marceneiro'].id],
    })
    epi('TESTE-105', {
      validade_ca: '2028-12-31 12:00:00.000Z',
      fabricante: 'Fabricante Fictício E',
      especificacoes: 'Respirador semifacial com filtro para vapores orgânicos (dado fictício)',
      agentes_protegidos_ids: ids('Solventes orgânicos (genérico)'),
      funcoes_ids: [funcoes['Pintor'].id],
    })
    epi('TESTE-106', {
      validade_ca: '2028-12-31 12:00:00.000Z',
      fabricante: 'Fabricante Fictício F',
      especificacoes: 'Capacete para motociclista (dado fictício)',
      agentes_protegidos_ids: ids('Uso de motocicleta em vias públicas'),
      funcoes_ids: [funcoes['Auxiliar de expedição'].id],
    })

    // ---------- Plano de ação ----------
    let plano = achar('planos_acao', 'empresa_id = {:e} && nome = {:n}', {
      e: empresa.id,
      n: 'Plano de ação 2026, Serra Azul',
    })
    if (!plano) {
      plano = new Record(col('planos_acao'))
      plano.set('organizacao_id', org.id)
      plano.set('empresa_id', empresa.id)
      plano.set('nome', 'Plano de ação 2026, Serra Azul')
    }
    plano.set('descricao', 'Medidas decorrentes do levantamento fictício de teste.')
    plano.set('status', 'Ativo')
    app.save(plano)

    const acoes = [
      [
        'Instalar a proteção da lâmina na segunda serra circular',
        avSerra,
        'Engenharia',
        'Substancial',
        'Em andamento',
        3500,
        8,
        '2026-11-05',
      ],
      [
        'Instalar cortina acústica na plaina',
        avRuido,
        'Engenharia',
        'Substancial',
        'Pendente',
        14000,
        8,
        '2026-12-20',
      ],
      [
        'Implantar cronograma de higienização e troca dos protetores auriculares',
        avRuido,
        'EPI',
        'Moderado',
        'Pendente',
        1500,
        8,
        '2026-11-15',
      ],
      [
        'Instalar captação de pó nas lixadeiras',
        avPoeira,
        'Engenharia',
        'Moderado',
        'Pendente',
        9800,
        8,
        '2027-02-28',
      ],
      [
        'Trocar o filtro da cabine de pintura e criar rotina de troca',
        avSolvente,
        'Engenharia',
        'Substancial',
        'Em andamento',
        2200,
        4,
        '2026-10-30',
      ],
      [
        'Aterrar os recipientes na transferência de inflamáveis',
        avInflamavel,
        'Engenharia',
        'Moderado',
        'Pendente',
        1800,
        4,
        '2026-12-10',
      ],
      [
        'Divulgar o canal de denúncia e orientar a equipe de atendimento',
        null,
        'Administrativa',
        'Tolerável',
        'Pendente',
        0,
        3,
        '2027-01-31',
      ],
    ]
    for (const [medida, av, nivel, prioridade, status, custo, expostos, prazo] of acoes) {
      let r = achar('acoes_plano', 'empresa_id = {:e} && medida = {:m}', {
        e: empresa.id,
        m: medida,
      })
      if (!r) {
        r = new Record(col('acoes_plano'))
        r.set('organizacao_id', org.id)
        r.set('empresa_id', empresa.id)
        r.set('medida', medida)
      }
      r.set('plano_id', plano.id)
      if (av) r.set('avaliacao_id', av.id)
      r.set('nivel_hierarquia', nivel)
      r.set('responsavel', 'Helena Ribeiro')
      r.set('prazo', `${prazo} 12:00:00.000Z`)
      r.set('prioridade', prioridade)
      r.set('status', status)
      r.set('custo_estimado', custo)
      r.set('numero_expostos', expostos)
      r.set('origem', 'Manual')
      app.save(r)
    }
  },
  (app) => {
    try {
      const empresa = app.findFirstRecordByFilter('empresas', "cnpj = '33.444.555/0001-81'")
      const apagar = (colecao, filtro) => {
        try {
          app
            .findRecordsByFilter(colecao, filtro, '', 0, 0, { e: empresa.id })
            .forEach((r) => app.delete(r))
        } catch (_) {}
      }
      const funcoes = app.findRecordsByFilter('funcoes_sst', 'empresa_id = {:e}', '', 0, 0, {
        e: empresa.id,
      })
      const ghes = app.findRecordsByFilter('ghes', 'empresa_id = {:e}', '', 0, 0, { e: empresa.id })
      const avs = []
      funcoes.forEach((f) =>
        avs.push(
          ...app.findRecordsByFilter('avaliacoes_risco', 'funcao_id = {:f}', '', 0, 0, { f: f.id }),
        ),
      )
      ghes.forEach((g) =>
        avs.push(
          ...app.findRecordsByFilter('avaliacoes_risco', 'ghe_id = {:g}', '', 0, 0, { g: g.id }),
        ),
      )
      avs.forEach((a) => {
        try {
          app
            .findRecordsByFilter('medicoes', 'avaliacao_id = {:a}', '', 0, 0, { a: a.id })
            .forEach((m) => app.delete(m))
        } catch (_) {}
      })
      apagar('acoes_plano', 'empresa_id = {:e}')
      apagar('planos_acao', 'empresa_id = {:e}')
      apagar('epis_catalogo', 'empresa_id = {:e}')
      avs.forEach((a) => {
        try {
          app.delete(a)
        } catch (_) {}
      })
      apagar('funcoes_sst', 'empresa_id = {:e}')
      apagar('ghes', 'empresa_id = {:e}')
      apagar('setores', 'empresa_id = {:e}')
      app.delete(empresa)
    } catch (_) {}
  },
)
