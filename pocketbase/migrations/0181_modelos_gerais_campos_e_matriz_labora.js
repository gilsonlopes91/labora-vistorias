// Modelos Gerais Labora como base dos documentos SST (plano
// claude/labora-vistoria-modelos-gerais-documentos-plano-2026-10-07.md,
// etapa 2). Os quatro modelos (PGR, LTCAT, NR-15, NR-16) pedem dados que o
// app ainda não guardava. Esta migração cria esses campos e cadastra a
// matriz de risco "Labora" (capítulo 11 do PGR modelo) como terceira matriz
// oficial, ao lado das AIHA (0143) e ISO 45002 (0152).
//
// empresas: dados do estabelecimento usados na capa e nos capítulos fixos
//   (representante legal, gestão de SST, jornada, canal de comunicação,
//   responsável pelo plano, guarda do documento, convenção coletiva, AVCB,
//   CNO, área construída). `porte` já existe como select (0011) e atende
//   [ENQUADRAMENTO_PORTE]. `pgr_matriz_padrao_metodologia` ganha a opção
//   LABORA.
// avaliacoes_risco: os dois critérios de eficácia do EPI que faltavam para
//   o questionário de sete itens do laudo NR-15 (EF e MP).
// documentos_sst: autor e coordenador (dois RTs), escolhas das alternativas
//   [MANTER APENAS UMA], configuração dos blocos (incluir/observação),
//   valores dos campos manuais, data do levantamento, cidade de emissão,
//   ART e a versão do modelo usada.
// setores: máquinas, equipamentos e substâncias (bloco 20.1 do PGR).
migrate(
  (app) => {
    // ---- empresas ----
    const empresas = app.findCollectionByNameOrId('empresas')
    const addE = (f) => {
      if (!empresas.fields.getByName(f.name)) empresas.fields.add(f)
    }
    addE(new TextField({ name: 'nome_estabelecimento', max: 200 }))
    addE(new TextField({ name: 'representante_legal_nome', max: 150 }))
    addE(new TextField({ name: 'representante_legal_cargo', max: 100 }))
    addE(
      new SelectField({
        name: 'gestao_sst',
        values: ['SESMT', 'CIPA', 'Designado de CIPA', 'Dispensado'],
        maxSelect: 1,
      }),
    )
    addE(new TextField({ name: 'jornada_trabalho', max: 200 }))
    addE(new TextField({ name: 'horario_trabalho', max: 200 }))
    addE(new TextField({ name: 'turnos_trabalho', max: 200 }))
    addE(new TextField({ name: 'descricao_processo_produtivo', max: 4000 }))
    addE(new TextField({ name: 'canal_comunicacao', max: 300 }))
    addE(new TextField({ name: 'responsavel_plano_nome', max: 150 }))
    addE(new TextField({ name: 'responsavel_plano_cargo', max: 100 }))
    addE(new TextField({ name: 'periodicidade_acompanhamento', max: 100 }))
    addE(new TextField({ name: 'forma_acesso_documento', max: 200 }))
    addE(new TextField({ name: 'local_guarda', max: 200 }))
    addE(new BoolField({ name: 'convencao_coletiva_insalubridade' }))
    addE(new TextField({ name: 'convencao_coletiva_clausula', max: 300 }))
    addE(new TextField({ name: 'area_construida_pavimentos', max: 200 }))
    addE(new TextField({ name: 'numero_cno', max: 30 }))
    addE(new TextField({ name: 'avcb_clcb', max: 200 }))
    const met = empresas.fields.getByName('pgr_matriz_padrao_metodologia')
    if (met && !met.values.includes('LABORA')) {
      met.values = [...met.values, 'LABORA']
    }
    app.save(empresas)

    // ---- avaliacoes_risco ----
    const aval = app.findCollectionByNameOrId('avaliacoes_risco')
    const addA = (f) => {
      if (!aval.fields.getByName(f.name)) aval.fields.add(f)
    }
    addA(new BoolField({ name: 'epi_eficacia_atenuacao_ok' }))
    addA(new BoolField({ name: 'epi_medida_previa_ok' }))
    app.save(aval)

    // ---- documentos_sst ----
    const docs = app.findCollectionByNameOrId('documentos_sst')
    const rts = app.findCollectionByNameOrId('responsaveis_tecnicos')
    const addD = (f) => {
      if (!docs.fields.getByName(f.name)) docs.fields.add(f)
    }
    addD(
      new RelationField({
        name: 'autor_rt_id',
        required: false,
        collectionId: rts.id,
        cascadeDelete: false,
        maxSelect: 1,
      }),
    )
    addD(
      new RelationField({
        name: 'coordenador_rt_id',
        required: false,
        collectionId: rts.id,
        cascadeDelete: false,
        maxSelect: 1,
      }),
    )
    // {alternativa_id: opcao_id}
    addD(new JSONField({ name: 'alternativas', maxSize: 20000 }))
    // {bloco_id: {incluir: bool, observacao: string}}
    addD(new JSONField({ name: 'blocos_config', maxSize: 50000 }))
    // {CAMPO_CANONICO: valor} para os campos de origem manual
    addD(new JSONField({ name: 'campos_manuais', maxSize: 100000 }))
    // [{campo, motivo}] calculado na última montagem
    addD(new JSONField({ name: 'pendencias', maxSize: 50000 }))
    addD(new DateField({ name: 'data_levantamento' }))
    addD(new TextField({ name: 'cidade_emissao', max: 100 }))
    addD(new TextField({ name: 'numero_art', max: 60 }))
    addD(new TextField({ name: 'modelo_versao', max: 40 }))
    app.save(docs)

    // ---- setores ----
    const setores = app.findCollectionByNameOrId('setores')
    if (!setores.fields.getByName('maquinas_equipamentos')) {
      setores.fields.add(new TextField({ name: 'maquinas_equipamentos', max: 2000 }))
      app.save(setores)
    }

    // ---- matriz Labora (capítulo 11 do PGR modelo) ----
    const col = app.findCollectionByNameOrId('matrizes_risco')
    const jaExiste = app.findRecordsByFilter(
      col,
      "organizacao_id = '' && metodologia = 'LABORA'",
      '',
      1,
      0,
    )
    if (jaExiste.length === 0) {
      const criteriosProbabilidade = [
        {
          nivel: 1,
          nome: 'Remota',
          quantitativo: 'Exposição menor que 10% do limite de exposição ocupacional (LEO).',
          qualitativo:
            'Improvável: exposição rara e barreiras eficazes e comprovadas. Fatores ergonômicos e psicossociais: exigências compatíveis com a capacidade; condições favoráveis e verificadas.',
        },
        {
          nivel: 2,
          nome: 'Baixa',
          quantitativo: 'De 10% a menos de 50% do LEO.',
          qualitativo:
            'Pode ocorrer excepcionalmente: exposição eventual e barreiras eficazes. Ergonômicos e psicossociais: exigências pontuais; medidas organizacionais eficazes.',
        },
        {
          nivel: 3,
          nome: 'Possível',
          quantitativo: 'De 50% a menos de 100% do LEO, com controle coletivo eficaz.',
          qualitativo:
            'Pode ocorrer: exposição regular ou barreiras parcialmente eficazes. Ergonômicos e psicossociais: exigências frequentes com medidas parcialmente eficazes.',
        },
        {
          nivel: 4,
          nome: 'Provável',
          quantitativo:
            'De 50% a menos de 100% do LEO sem controle eficaz, ou igual ou acima do LEO com controle coletivo parcial.',
          qualitativo:
            'Ocorre com frequência: exposição habitual e barreiras insuficientes. Ergonômicos e psicossociais: exigências habituais e elevadas com medidas insuficientes; queixas e indicadores desfavoráveis.',
        },
        {
          nivel: 5,
          nome: 'Quase certa',
          quantitativo: 'Igual ou acima do LEO sem controle coletivo eficaz.',
          qualitativo:
            'Ocorre ou já ocorreu: exposição contínua sem barreiras eficazes. Ergonômicos e psicossociais: exigências elevadas e contínuas sem medidas; indicadores e relatos consistentes de adoecimento ou violência.',
        },
      ]
      const criteriosSeveridade = [
        {
          nivel: 1,
          nome: 'Leve',
          descricao:
            'Lesão ou agravo que exige apenas primeiros socorros, sem afastamento; desconforto reversível.',
          dias_afastamento: '0',
          aiha_efeito: 0,
        },
        {
          nivel: 2,
          nome: 'Menor',
          descricao:
            'Lesão ou agravo com tratamento médico e afastamento breve, com recuperação completa; efeito reversível.',
          dias_afastamento: 'breve',
          aiha_efeito: 1,
        },
        {
          nivel: 3,
          nome: 'Moderada',
          descricao:
            'Lesão ou doença com afastamento prolongado ou sequela leve ou reversível a longo prazo; doença ocupacional tratável.',
          dias_afastamento: 'prolongado',
          aiha_efeito: 2,
        },
        {
          nivel: 4,
          nome: 'Maior',
          descricao:
            'Lesão ou doença grave com incapacidade permanente parcial, doença crônica ou irreversível, ou ocorrência de invalidez.',
          dias_afastamento: 'irreversível',
          aiha_efeito: 3,
        },
        {
          nivel: 5,
          nome: 'Extrema',
          descricao:
            'Morte, incapacidade permanente total, doença incapacitante ou fatal, ou evento de grande magnitude com múltiplas vítimas.',
          dias_afastamento: 'incapacitante/fatal',
          aiha_efeito: 4,
        },
      ]
      const categorias = [
        {
          categoria: 'Baixo',
          cor: '#22c55e',
          acao: 'Risco tolerável. Manter as medidas existentes; verificação em até 12 meses.',
          prazo_dias: 365,
        },
        {
          categoria: 'Médio',
          cor: '#eab308',
          acao: 'Risco moderado. Medidas planejadas e monitoramento.',
          prazo_dias: 270,
        },
        {
          categoria: 'Alto',
          cor: '#f97316',
          acao: 'Risco elevado. Medidas de prevenção prioritárias.',
          prazo_dias: 90,
        },
        {
          categoria: 'Muito Alto',
          cor: '#ef4444',
          acao: 'Risco inaceitável. Interromper ou restringir a atividade até a adoção de medida de contenção; medida definitiva em até 30 dias.',
          prazo_dias: 30,
        },
      ]
      const faixa = (n) => (n <= 4 ? 'Baixo' : n <= 9 ? 'Médio' : n <= 15 ? 'Alto' : 'Muito Alto')
      const celulas = []
      for (let p = 1; p <= 5; p++) {
        for (let s = 1; s <= 5; s++) {
          celulas.push({ p, s, categoria: faixa(p * s), pontuacao: p * s })
        }
      }
      const matriz = new Record(col)
      matriz.set('organizacao_id', '')
      matriz.set('nome', 'Labora 5x5 (NR-1, modelo geral)')
      matriz.set('metodologia', 'LABORA')
      matriz.set('dimensao', '5')
      matriz.set('criterios_probabilidade', criteriosProbabilidade)
      matriz.set('criterios_severidade', criteriosSeveridade)
      matriz.set('categorias', categorias)
      matriz.set('celulas', celulas)
      matriz.set('versao', '1.0')
      matriz.set('somente_leitura', true)
      app.save(matriz)
    }
  },
  (app) => {
    const tirar = (nome, campos) => {
      const c = app.findCollectionByNameOrId(nome)
      for (const n of campos) {
        const f = c.fields.getByName(n)
        if (f) c.fields.removeById(f.id)
      }
      return c
    }
    const empresas = tirar('empresas', [
      'nome_estabelecimento',
      'representante_legal_nome',
      'representante_legal_cargo',
      'gestao_sst',
      'jornada_trabalho',
      'horario_trabalho',
      'turnos_trabalho',
      'descricao_processo_produtivo',
      'canal_comunicacao',
      'responsavel_plano_nome',
      'responsavel_plano_cargo',
      'periodicidade_acompanhamento',
      'forma_acesso_documento',
      'local_guarda',
      'convencao_coletiva_insalubridade',
      'convencao_coletiva_clausula',
      'area_construida_pavimentos',
      'numero_cno',
      'avcb_clcb',
    ])
    const met = empresas.fields.getByName('pgr_matriz_padrao_metodologia')
    if (met) met.values = met.values.filter((v) => v !== 'LABORA')
    app.save(empresas)
    app.save(tirar('avaliacoes_risco', ['epi_eficacia_atenuacao_ok', 'epi_medida_previa_ok']))
    app.save(
      tirar('documentos_sst', [
        'autor_rt_id',
        'coordenador_rt_id',
        'alternativas',
        'blocos_config',
        'campos_manuais',
        'pendencias',
        'data_levantamento',
        'cidade_emissao',
        'numero_art',
        'modelo_versao',
      ]),
    )
    app.save(tirar('setores', ['maquinas_equipamentos']))
    const col = app.findCollectionByNameOrId('matrizes_risco')
    app
      .findRecordsByFilter(col, "organizacao_id = '' && metodologia = 'LABORA'", '', 0, 0)
      .forEach((r) => app.delete(r))
  },
)
