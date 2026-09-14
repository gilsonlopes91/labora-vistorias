migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nome = 'NR-12 — Anexo VIII (Prensas e Similares)' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-12 — Anexo VIII (Prensas e Similares)')
      tipoRec.set('nr_referencia', 'NR-12')
      tipoRec.set(
        'descricao',
        'Checklist do Anexo VIII da NR-12 (item/grau/tipo do Anexo II da NR-28; subitens/alíneas de mesmo ' +
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
          item_ref: '2.1.a a 2.1.3',
          codigo: '212476-9',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 2.1.a a 2.1.3 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '3.1.a a 3.2.c',
          codigo: '212482-3',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 3.1.a a 3.2.c do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '4.1',
          codigo: '212487-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.1 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '4.1.1 a 4.1.5',
          codigo: '212488-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.1.1 a 4.1.5 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '4.2',
          codigo: '212493-9',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.2 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '4.2.1 a 4.2.4',
          codigo: '212494-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.2.1 a 4.2.4 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '4.3',
          codigo: '212498-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.3 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '4.3.1 a 4.3.5',
          codigo: '212499-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.3.1 a 4.3.5 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '5.1',
          codigo: '212504-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 5.1 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '5.2',
          codigo: '212505-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 5.2 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '5.3 a 5.4',
          codigo: '212506-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 5.3 a 5.4 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '6.1 a 6.3',
          codigo: '212508-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 6.1 a 6.3 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '7.1',
          codigo: '212513-7',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 7.1 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '7.2 a 7.4',
          codigo: '212514-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 7.2 a 7.4 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '7.5',
          codigo: '212517-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 7.5 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '8.1 a 8.1.1',
          codigo: '212518-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 8.1 a 8.1.1 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '9.1 a 9.1.2',
          codigo: '212520-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 9.1 a 9.1.2 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '10.1.a a 10.1.d',
          codigo: '212523-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 10.1.a a 10.1.d do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '11.1 a 11.4',
          codigo: '212527-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 11.1 a 11.4 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '12.1.a a 12.1.c',
          codigo: '212532-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 12.1.a a 12.1.c do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '12.2',
          codigo: '212535-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 12.2 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '13.1 a 13.4',
          codigo: '212536-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 13.1 a 13.4 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '14',
          codigo: '212545-5',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 14 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '15.1',
          codigo: '212546-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 15.1 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '15.2',
          codigo: '212547-1',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 15.2 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
        },
        {
          item_ref: '16.1 a 16.2',
          codigo: '212548-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 16.1 a 16.2 do Anexo VIII da NR-12 (Anexo II da NR-28). Requisitos de segurança para prensas e similares: sistemas de segurança (duplo comando, cortina de luz, intertravamento), dispositivos de parada de emergência, sinalização, capacitação do operador e proteção contra acionamento acidental.',
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
        "nome = 'NR-12 — Anexo VIII (Prensas e Similares)' && organizacao_id = ''",
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
