// Toda organização nova nasce com os três modelos de proposta prontos, do
// mesmo jeito que a migration 0101 fez para as organizações já existentes.
// Sem isso, quem cria conta hoje abre a tela de modelos vazia e não consegue
// gerar PDF nenhum.
onRecordAfterCreateSuccess((e) => {
  try {
    const org = e.record
    const modelosCol = $app.findCollectionByNameOrId('modelos_proposta')

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

    const APRESENTACAO =
      'Agradecemos a oportunidade de apresentar esta proposta. Atuamos em segurança e saúde no ' +
      'trabalho com foco em conformidade legal e redução de risco, atendendo empresas de portes e ' +
      'setores variados. Os serviços descritos a seguir são executados por profissionais ' +
      'habilitados, com emissão da respectiva anotação de responsabilidade técnica.'

    const ENCERRAMENTO =
      'Permanecemos à disposição para esclarecer qualquer ponto desta proposta e para ajustar o ' +
      'escopo ao que a empresa precisa. A aprovação pode ser formalizada pela assinatura deste ' +
      'documento ou por confirmação por escrito.'

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

    const MODELOS = [
      {
        nome: 'Clássico',
        layout: 'classico',
        cor_primaria: '#6C8845',
        cor_secundaria: '#202720',
        secoes: SECOES_COMPLETAS,
        padrao: true,
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
        nome: 'Minimalista',
        layout: 'minimalista',
        cor_primaria: '#202720',
        cor_secundaria: '#6C8845',
        secoes: SECOES_ENXUTAS,
        padrao: false,
      },
    ]

    for (const modelo of MODELOS) {
      const rec = new Record(modelosCol)
      rec.set('organizacao_id', org.id)
      rec.set('nome', modelo.nome)
      rec.set('layout', modelo.layout)
      rec.set('cor_primaria', modelo.cor_primaria)
      rec.set('cor_secundaria', modelo.cor_secundaria)
      rec.set('secoes', modelo.secoes)
      rec.set('texto_apresentacao', APRESENTACAO)
      rec.set('texto_encerramento', ENCERRAMENTO)
      rec.set('itens_inclusos_padrao', INCLUSOS)
      rec.set('itens_exclusos_padrao', EXCLUSOS)
      rec.set('padrao', modelo.padrao)
      rec.set('ativo', true)
      $app.save(rec)
    }
  } catch (err) {
    $app.logger().error('falha ao criar modelos de proposta padrao', 'error', String(err))
  }

  e.next()
}, 'organizacoes')
