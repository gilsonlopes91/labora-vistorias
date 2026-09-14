migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nome = 'NR-12 — Anexo V (Motosserras)' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-12 — Anexo V (Motosserras)')
      tipoRec.set('nr_referencia', 'NR-12')
      tipoRec.set(
        'descricao',
        'Checklist do Anexo V da NR-12 (item/grau/tipo do Anexo II da NR-28; subitens/alíneas de mesmo ' +
          'grau/tipo e mesmo item foram agrupados numa linha). Multa pelo Anexo I da NR-28. Descrições ' +
          'redigidas a partir de conhecimento geral do anexo, sem confirmação linha a linha — revisão ' +
          'obrigatória antes de laudo real.',
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
      'Descrição escrita a partir de conhecimento geral do Anexo correspondente da NR-12, sem confirmação linha a linha do texto vigente — revisar com a fonte oficial antes de usar em laudo real.'

    if (!jaTemItens) {
      const itens = [
        {
          item_ref: '1.a a 1.1',
          codigo: '212375-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 1.a a 1.1 do Anexo V da NR-12 (Anexo II da NR-28). Requisitos de segurança para motosserras: dispositivos de proteção (freio de corrente, protetor de mão, pino pega-corrente), capacitação do operador, uso de EPIs específicos (perneira, luvas, protetor auricular e facial) e cuidados na operação.',
        },
        {
          item_ref: '2',
          codigo: '212381-9',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 2 do Anexo V da NR-12 (Anexo II da NR-28). Requisitos de segurança para motosserras: dispositivos de proteção (freio de corrente, protetor de mão, pino pega-corrente), capacitação do operador, uso de EPIs específicos (perneira, luvas, protetor auricular e facial) e cuidados na operação.',
        },
        {
          item_ref: '3 a 3.d',
          codigo: '212382-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 3 a 3.d do Anexo V da NR-12 (Anexo II da NR-28). Requisitos de segurança para motosserras: dispositivos de proteção (freio de corrente, protetor de mão, pino pega-corrente), capacitação do operador, uso de EPIs específicos (perneira, luvas, protetor auricular e facial) e cuidados na operação.',
        },
        {
          item_ref: '4',
          codigo: '212387-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4 do Anexo V da NR-12 (Anexo II da NR-28). Requisitos de segurança para motosserras: dispositivos de proteção (freio de corrente, protetor de mão, pino pega-corrente), capacitação do operador, uso de EPIs específicos (perneira, luvas, protetor auricular e facial) e cuidados na operação.',
        },
        {
          item_ref: '4.1',
          codigo: '212388-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.1 do Anexo V da NR-12 (Anexo II da NR-28). Requisitos de segurança para motosserras: dispositivos de proteção (freio de corrente, protetor de mão, pino pega-corrente), capacitação do operador, uso de EPIs específicos (perneira, luvas, protetor auricular e facial) e cuidados na operação.',
        },
        {
          item_ref: '4.2',
          codigo: '212389-4',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 4.2 do Anexo V da NR-12 (Anexo II da NR-28). Requisitos de segurança para motosserras: dispositivos de proteção (freio de corrente, protetor de mão, pino pega-corrente), capacitação do operador, uso de EPIs específicos (perneira, luvas, protetor auricular e facial) e cuidados na operação.',
        },
        {
          item_ref: '5',
          codigo: '212390-8',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 5 do Anexo V da NR-12 (Anexo II da NR-28). Requisitos de segurança para motosserras: dispositivos de proteção (freio de corrente, protetor de mão, pino pega-corrente), capacitação do operador, uso de EPIs específicos (perneira, luvas, protetor auricular e facial) e cuidados na operação.',
        },
        {
          item_ref: '6',
          codigo: '212391-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 6 do Anexo V da NR-12 (Anexo II da NR-28). Requisitos de segurança para motosserras: dispositivos de proteção (freio de corrente, protetor de mão, pino pega-corrente), capacitação do operador, uso de EPIs específicos (perneira, luvas, protetor auricular e facial) e cuidados na operação.',
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
        "nome = 'NR-12 — Anexo V (Motosserras)' && organizacao_id = ''",
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
