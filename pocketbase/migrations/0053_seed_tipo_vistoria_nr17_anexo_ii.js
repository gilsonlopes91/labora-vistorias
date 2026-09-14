migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nome = 'NR-17 — Anexo II (Trabalho em Teleatendimento/Telemarketing)' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-17 — Anexo II (Trabalho em Teleatendimento/Telemarketing)')
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
          item_ref: '2.1',
          codigo: '117096-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 2.1 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '2.1.a a 2.1.i',
          codigo: '117097-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 2.1.a a 2.1.i da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '2.1.j',
          codigo: '117106-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 2.1.j da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '3.1',
          codigo: '117107-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 3.1 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '3.1.3.a a 3.1.3.d',
          codigo: '117108-9',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 3.1.3.a a 3.1.3.d da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '3.2 a 3.3',
          codigo: '117112-7',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 3.2 a 3.3 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '3.4',
          codigo: '117114-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 3.4 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '4.1 a 4.2.1',
          codigo: '117115-1',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 4.1 a 4.2.1 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '4.3',
          codigo: '117121-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.3 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '4.3.1 a 4.3.2',
          codigo: '117122-4',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 4.3.1 a 4.3.2 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '4.3.3',
          codigo: '117124-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 4.3.3 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.1.2.1',
          codigo: '117125-9',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 5.1.2.1 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.1.3.1 a 5.2.1',
          codigo: '117126-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 5.1.3.1 a 5.2.1 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.3 a 5.4',
          codigo: '117129-1',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 5.3 a 5.4 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.4.1.a',
          codigo: '117131-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 5.4.1.a da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.4.1.b',
          codigo: '117132-1',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 5.4.1.b da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.4.1.c a 5.4.3',
          codigo: '117133-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 5.4.1.c a 5.4.3 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.4.4',
          codigo: '117136-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 5.4.4 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.4.4.1',
          codigo: '117137-2',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 5.4.4.1 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.4.4.2',
          codigo: '117138-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 5.4.4.2 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.4.5',
          codigo: '117139-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 5.4.5 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.5 a 5.6',
          codigo: '117141-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 5.5 a 5.6 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.7',
          codigo: '117143-7',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 5.7 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.8 a 5.9',
          codigo: '117144-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 5.8 a 5.9 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.10.a a 5.10.e',
          codigo: '117146-1',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 5.10.a a 5.10.e da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.11.a a 5.13.a',
          codigo: '117151-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 5.11.a a 5.13.a da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.13.b a 5.14',
          codigo: '117155-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 5.13.b a 5.14 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.15',
          codigo: '117158-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 5.15 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '5.16',
          codigo: '117159-3',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 5.16 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '6.1 a 6.1.1',
          codigo: '117160-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 6.1 a 6.1.1 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '6.1.2.a a 6.1.2.d',
          codigo: '117162-3',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 6.1.2.a a 6.1.2.d da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '6.1.2.e',
          codigo: '117166-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 6.1.2.e da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '6.1.2.f a 6.1.2.g',
          codigo: '117167-4',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 6.1.2.f a 6.1.2.g da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '6.2',
          codigo: '117169-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 6.2 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '6.3.a a 6.3.e',
          codigo: '117170-4',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 6.3.a a 6.3.e da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '7.1',
          codigo: '117175-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 7.1 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '7.2',
          codigo: '117176-3',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 7.2 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '7.3',
          codigo: '117177-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 7.3 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '8.1',
          codigo: '117178-0',
          grau: 2,
          tipo: 'M',
          descricao:
            'Item 8.1 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '8.1.1',
          codigo: '117179-8',
          grau: 1,
          tipo: 'M',
          descricao:
            'Item 8.1.1 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '8.2',
          codigo: '117180-1',
          grau: 3,
          tipo: 'M',
          descricao:
            'Item 8.2 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '8.2.1.a a 8.2.1.c',
          codigo: '117181-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 8.2.1.a a 8.2.1.c da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '8.3',
          codigo: '117184-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 8.3 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '8.4.a',
          codigo: '117185-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 8.4.a da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '8.4.b',
          codigo: '117186-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 8.4.b da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '8.4.b1 a 8.4.b8',
          codigo: '117187-9',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 8.4.b1 a 8.4.b8 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '8.4.c a 8.4.1.f',
          codigo: '117195-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 8.4.c a 8.4.1.f da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '8.5',
          codigo: '117206-9',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 8.5 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
        },
        {
          item_ref: '9.1 a 9.2',
          codigo: '117207-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 9.1 a 9.2 da NR-17 (Anexo II da NR-28). Requisitos ergonômicos para o trabalho em teleatendimento/telemarketing: mobiliário e equipamentos (estação de trabalho, headset), organização do trabalho (pausas, metas, monitoramento), condições ambientais (ruído, iluminação, climatização) e capacitação.',
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
        "nome = 'NR-17 — Anexo II (Trabalho em Teleatendimento/Telemarketing)' && organizacao_id = ''",
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
