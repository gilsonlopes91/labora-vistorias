// Quarto modelo de proposta: "Labora completo", reproduzindo o documento de
// cinco páginas do projeto original (capa, institucional, escopo, valores com
// dados bancários e fechamento com aceite).
//
// Esta migration também conserta a semeadura dos modelos. Na 0101 os campos
// JSON eram gravados com objeto JS direto e a falha ficava engolida por um
// try/catch, o que deixou organizações sem modelo nenhum e o seletor de modelo
// vazio no orçamento. Aqui os JSON vão como string e a criação é idempotente
// por nome, então rodar de novo não duplica nada.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('modelos_proposta')

    // Novo layout disponível.
    const layoutField = col.fields.getByName('layout')
    if (layoutField) {
      layoutField.values = ['classico', 'moderno', 'minimalista', 'labora']
    }

    // Imagens das seções internas, como no documento original.
    const imagens = [
      'imagem_institucional',
      'imagem_servicos',
      'imagem_valores',
      'imagem_encerramento',
    ]
    for (const nome of imagens) {
      if (!col.fields.getByName(nome)) {
        col.fields.add(
          new FileField({
            name: nome,
            maxSelect: 1,
            maxSize: 10485760,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          }),
        )
      }
    }

    // Bloco institucional editável: contato, CNPJ, dados bancários, valores,
    // serviços e etapas da metodologia.
    if (!col.fields.getByName('dados_institucionais')) {
      col.fields.add(new JSONField({ name: 'dados_institucionais', maxSize: 200000 }))
    }
    app.save(col)

    const SECOES_COMPLETAS = {
      capa: true,
      apresentacao: true,
      objeto: true,
      normas_referencia: true,
      itens_inclusos: true,
      itens_exclusos: true,
      tabela_valores: true,
      condicoes_pagamento: true,
      prazo_entrega: true,
      validade: true,
      responsavel_tecnico: true,
      encerramento: true,
      assinatura: true,
    }

    const SECOES_ENXUTAS = {
      capa: false,
      apresentacao: false,
      objeto: true,
      normas_referencia: true,
      itens_inclusos: true,
      itens_exclusos: false,
      tabela_valores: true,
      condicoes_pagamento: true,
      prazo_entrega: true,
      validade: true,
      responsavel_tecnico: true,
      encerramento: false,
      assinatura: true,
    }

    const INCLUSOS = [
      'Visita técnica para levantamento e avaliação em campo',
      'Elaboração de laudo e relatório técnico conclusivo',
      'Emissão de ART/RRT junto ao respectivo conselho de classe',
      'Envio de via digital em formato PDF',
    ]

    const EXCLUSOS = [
      'Taxas e emolumentos de ART/RRT junto aos conselhos regionais',
      'Implementação de adequações estruturais, físicas ou de maquinários',
      'Realização de exames médicos ocupacionais e laboratoriais',
      'Despesas com deslocamento e hospedagem fora da região metropolitana',
    ]

    const APRESENTACAO =
      'Agradecemos a oportunidade de apresentar esta proposta. Atuamos em segurança e saúde no ' +
      'trabalho com foco em conformidade legal e redução de risco, atendendo empresas de portes e ' +
      'setores variados. Os serviços descritos a seguir são executados por profissionais ' +
      'habilitados, com emissão da respectiva anotação de responsabilidade técnica.'

    const ENCERRAMENTO =
      'Permanecemos à disposição para esclarecer qualquer ponto desta proposta e para ajustar o ' +
      'escopo ao que a empresa precisa. A aprovação pode ser formalizada pela assinatura deste ' +
      'documento ou por confirmação por escrito.'

    // Conteúdo institucional do modelo completo. Telefone, e-mail, CNPJ e dados
    // bancários ficam em branco de propósito: são dados reais da empresa e
    // devem ser preenchidos na tela de modelos.
    const INSTITUCIONAL = {
      tagline: 'HIGIENE OCUPACIONAL · SEGURANÇA DO TRABALHO',
      subtitulo: 'Soluções integradas em saúde e segurança ocupacional',
      lema: '',
      telefone: '',
      email: '',
      cnpj: '',
      razao_social: '',
      cidade_emissao: '',
      banco: { instituicao: '', agencia: '', conta: '', pix: '', favorecido: '' },
      etapas: [
        {
          num: '01',
          titulo: 'Entender sua necessidade',
          desc: 'Diagnóstico do cenário da empresa e das exigências normativas aplicáveis.',
        },
        {
          num: '02',
          titulo: 'Elaborar uma solução',
          desc: 'Proposta técnica e comercial sob medida, com metodologia e custos transparentes.',
        },
        {
          num: '03',
          titulo: 'Executar',
          desc: 'Levantamento de campo, avaliações instrumentais e elaboração por profissional habilitado.',
        },
        {
          num: '04',
          titulo: 'Finalizar',
          desc: 'Entrega dos documentos, treinamentos e envio dos eventos ao eSocial, com suporte.',
        },
      ],
      valores: [
        {
          titulo: 'Trabalho',
          desc: 'Compromisso com a excelência técnica, agilidade e proximidade com a demanda real de cada cliente.',
        },
        {
          titulo: 'Ética',
          desc: 'Transparência, integridade e conformidade legal em todos os laudos, programas e treinamentos.',
        },
        {
          titulo: 'Responsabilidade',
          desc: 'Foco na preservação da vida, na saúde do trabalhador e na segurança jurídica da empresa.',
        },
      ],
      servicos: [
        'Elaboração e gestão do PGR (NR-01)',
        'Elaboração e acompanhamento do PCMSO (NR-07)',
        'Laudo Técnico das Condições Ambientais de Trabalho (LTCAT)',
        'Laudos de insalubridade (NR-15) e periculosidade (NR-16)',
        'Avaliação ergonômica preliminar e AET (NR-17)',
        'Projeto e plano de prevenção e combate a incêndio',
        'Envio e gestão de eventos de SST no eSocial (S-2210, S-2220, S-2240)',
        'Treinamentos normativos (NR-05, NR-06, NR-10, NR-12, NR-18, NR-33, NR-35)',
        'Avaliações quantitativas de agentes físicos e químicos',
      ],
    }

    const MODELOS = [
      {
        nome: 'Simples',
        layout: 'minimalista',
        cor_primaria: '#202720',
        cor_secundaria: '#6C8845',
        secoes: SECOES_ENXUTAS,
        padrao: false,
      },
      {
        nome: 'Clássico',
        layout: 'classico',
        cor_primaria: '#6C8845',
        cor_secundaria: '#202720',
        secoes: SECOES_COMPLETAS,
        padrao: false,
      },
      {
        nome: 'Moderno',
        layout: 'moderno',
        cor_primaria: '#6C8845',
        cor_secundaria: '#3B4A2C',
        secoes: SECOES_COMPLETAS,
        padrao: false,
      },
      {
        nome: 'Labora completo',
        layout: 'labora',
        cor_primaria: '#6C8845',
        cor_secundaria: '#3D4D27',
        secoes: SECOES_COMPLETAS,
        padrao: true,
      },
    ]

    const orgs = app.findRecordsByFilter('organizacoes', "id != ''", '', 0, 0)
    for (const org of orgs) {
      for (const modelo of MODELOS) {
        // Idempotente por nome: se já existe, só completa o que falta.
        let existente = null
        try {
          existente = app.findFirstRecordByFilter(
            'modelos_proposta',
            "organizacao_id = '" + org.id + "' && nome = '" + modelo.nome + "'",
          )
        } catch (_) {}

        const rec = existente || new Record(col)
        if (!existente) {
          rec.set('organizacao_id', org.id)
          rec.set('nome', modelo.nome)
          rec.set('layout', modelo.layout)
          rec.set('cor_primaria', modelo.cor_primaria)
          rec.set('cor_secundaria', modelo.cor_secundaria)
          rec.set('padrao', modelo.padrao)
          rec.set('ativo', true)
          rec.set('texto_apresentacao', APRESENTACAO)
          rec.set('texto_encerramento', ENCERRAMENTO)
        }

        // JSON vai como string: objeto JS direto falha no JSVM do PocketBase.
        if (!rec.get('secoes')) rec.set('secoes', JSON.stringify(modelo.secoes))
        if (!rec.get('itens_inclusos_padrao')) {
          rec.set('itens_inclusos_padrao', JSON.stringify(INCLUSOS))
        }
        if (!rec.get('itens_exclusos_padrao')) {
          rec.set('itens_exclusos_padrao', JSON.stringify(EXCLUSOS))
        }
        if (modelo.layout === 'labora' && !rec.get('dados_institucionais')) {
          rec.set('dados_institucionais', JSON.stringify(INSTITUCIONAL))
        }

        app.save(rec)
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('modelos_proposta')
    for (const nome of [
      'imagem_institucional',
      'imagem_servicos',
      'imagem_valores',
      'imagem_encerramento',
      'dados_institucionais',
    ]) {
      col.fields.removeByName(nome)
    }
    app.save(col)
  },
)
