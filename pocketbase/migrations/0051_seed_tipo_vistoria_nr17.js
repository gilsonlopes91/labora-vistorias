migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nome = 'NR-17 — Ergonomia (corpo da norma)' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-17 — Ergonomia (corpo da norma)')
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
          item_ref: '17.1.2',
          codigo: '117037-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 17.1.2 da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
        },
        {
          item_ref: '17.2.2 a 17.2.3',
          codigo: '117038-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 17.2.2 a 17.2.3 da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
        },
        {
          item_ref: '17.2.4',
          codigo: '117040-6',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 17.2.4 da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
        },
        {
          item_ref: '17.2.5 a 17.3.2',
          codigo: '117041-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 17.2.5 a 17.3.2 da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
        },
        {
          item_ref: '17.3.2.a a 17.3.2.1',
          codigo: '117007-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 17.3.2.a a 17.3.2.1 da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
        },
        {
          item_ref: '17.3.3',
          codigo: '117046-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 17.3.3 da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
        },
        {
          item_ref: '17.3.4',
          codigo: '117047-3',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 17.3.4 da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
        },
        {
          item_ref: '17.3.5 a 17.4.1',
          codigo: '117048-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 17.3.5 a 17.4.1 da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
        },
        {
          item_ref: '17.4.2.a a 17.4.3.d',
          codigo: '117050-3',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 17.4.2.a a 17.4.3.d da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
        },
        {
          item_ref: '17.5.1',
          codigo: '117052-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 17.5.1 da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
        },
        {
          item_ref: '17.5.2.a a 17.5.3',
          codigo: '117023-6',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 17.5.2.a a 17.5.3 da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
        },
        {
          item_ref: '17.5.3.1 a 17.5.3.2',
          codigo: '117054-6',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 17.5.3.1 a 17.5.3.2 da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
        },
        {
          item_ref: '17.5.3.3',
          codigo: '117027-9',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 17.5.3.3 da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
        },
        {
          item_ref: '17.6.1',
          codigo: '117056-2',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 17.6.1 da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
        },
        {
          item_ref: '17.6.3.a',
          codigo: '117029-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 17.6.3.a da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
        },
        {
          item_ref: '17.6.3.b',
          codigo: '117057-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 17.6.3.b da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
        },
        {
          item_ref: '17.6.3.c a 17.6.4.e',
          codigo: '117031-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 17.6.3.c a 17.6.4.e da NR-17 (Anexo II da NR-28). Disposições gerais de ergonomia: levantamento e transporte manual de peso, mobiliário e posto de trabalho, condições ambientais de trabalho, organização do trabalho e Análise Ergonômica do Trabalho (AET).',
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
        "nome = 'NR-17 — Ergonomia (corpo da norma)' && organizacao_id = ''",
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
