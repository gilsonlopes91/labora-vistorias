migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nome = 'NR-17 — Anexo I (Trabalho dos Operadores de Checkout)' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-17 — Anexo I (Trabalho dos Operadores de Checkout)')
      tipoRec.set('nr_referencia', 'NR-17')
      tipoRec.set(
        'descricao',
        'Checklist da NR-17 (item/grau/tipo do Anexo II da NR-28; subitens/alíneas de mesmo grau/tipo e ' +
          'mesmo item foram agrupados numa linha). Multa pelo Anexo I da NR-28. Descrições redigidas a ' +
          'partir de conhecimento geral da norma, sem confirmação linha a linha — revisão obrigatória ' +
          'antes de laudo real.',
      )
      tipoRec.set('ativo', true)
      app.save(tipoRec)
    }

    let jaTemItens = true
    try {
      app.findFirstRecordByFilter('itens_checklist', "tipo_vistoria_id = '" + tipoRec.id + "'")
    } catch (_) {
      jaTemItens = false
    }

    const REVISAR =
      'Descrição escrita a partir de conhecimento geral da NR-17, sem confirmação linha a linha do texto vigente — revisar com a fonte oficial antes de usar em laudo real.'

    if (!jaTemItens) {
      const itens = [
        {
          item_ref: '2.1.a',
          codigo: '117058-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 2.1.a da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '2.1.b a 2.1.d',
          codigo: '117059-7',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 2.1.b a 2.1.d da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '2.1.e',
          codigo: '117062-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 2.1.e da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '2.1.f a 2.2.d',
          codigo: '117063-5',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 2.1.f a 2.2.d da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '2.3.a a 2.3.c',
          codigo: '117071-6',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 2.3.a a 2.3.c da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '2.4',
          codigo: '117074-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 2.4 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '3.1 a 3.4.a',
          codigo: '117075-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 3.1 a 3.4.a da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '3.4.b a 3.4.e',
          codigo: '117079-1',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 3.4.b a 3.4.e da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '3.5',
          codigo: '117083-0',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 3.5 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '4.1',
          codigo: '117084-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.1 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '4.2',
          codigo: '117085-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.2 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '4.3',
          codigo: '117086-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.3 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '4.4',
          codigo: '117087-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 4.4 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '5.1',
          codigo: '117088-0',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 5.1 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '5.2',
          codigo: '117089-9',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 5.2 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '6.1',
          codigo: '117090-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 6.1 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '6.2 a 6.3',
          codigo: '117091-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 6.2 a 6.3 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
        {
          item_ref: '6.4 a 6.6',
          codigo: '117094-5',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 6.4 a 6.6 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho dos operadores de checkout (caixas de supermercado/comércio): mobiliário e posto de trabalho, organização do trabalho, pausas, treinamento e condições ambientais específicas da atividade.',
        },
      ]
      itens.forEach((it, idx) => {
        const rec = new Record(itensCol)
        rec.set('tipo_vistoria_id', tipoRec.id)
        rec.set('ordem', idx)
        rec.set('secao', '')
        rec.set('item_ref', it.item_ref)
        rec.set('codigo', it.codigo)
        rec.set('grau', it.grau)
        rec.set('tipo', it.tipo)
        rec.set('descricao', it.descricao)
        rec.set('observacao', REVISAR)
        app.save(rec)
      })
    }
  },
  (app) => {
    try {
      const tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nome = 'NR-17 — Anexo I (Trabalho dos Operadores de Checkout)' && organizacao_id = ''",
      )
      const itens = app.findRecordsByFilter(
        'itens_checklist',
        "tipo_vistoria_id = '" + tipoRec.id + "'",
        '',
        0,
        0,
      )
      for (const it of itens) {
        app.delete(it)
      }
      app.delete(tipoRec)
    } catch (_) {}
  },
)
