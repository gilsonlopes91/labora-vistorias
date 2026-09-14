migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nome = 'NR-12 — Anexo XII (Equipamentos de Guindar para Elevação de Pessoas e Trabalho em Altura)' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set(
        'nome',
        'NR-12 — Anexo XII (Equipamentos de Guindar para Elevação de Pessoas e Trabalho em Altura)',
      )
      tipoRec.set('nr_referencia', 'NR-12')
      tipoRec.set(
        'descricao',
        'Checklist do Anexo XII da NR-12 (item/grau/tipo do Anexo II da NR-28; subitens/alíneas de mesmo ' +
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
          item_ref: '2.1.a a 2.1.e',
          codigo: '212803-9',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 2.1.a a 2.1.e do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.1.f',
          codigo: '212808-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 2.1.f do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.1.g a 2.1.n',
          codigo: '212809-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 2.1.g a 2.1.n do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.1.o',
          codigo: '212817-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 2.1.o do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.1.p a 2.2.a',
          codigo: '212818-7',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 2.1.p a 2.2.a do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.2.b',
          codigo: '212820-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 2.2.b do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.2.c',
          codigo: '212821-7',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 2.2.c do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.2.d a 2.2.f',
          codigo: '212822-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 2.2.d a 2.2.f do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.3',
          codigo: '212825-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 2.3 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.4 a 2.6',
          codigo: '212826-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 2.4 a 2.6 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.7 a 2.8',
          codigo: '212829-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 2.7 a 2.8 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.9',
          codigo: '212831-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 2.9 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.10',
          codigo: '212832-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 2.10 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.11',
          codigo: '212833-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 2.11 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.12',
          codigo: '212834-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 2.12 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.13.a a 2.14',
          codigo: '212835-7',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 2.13.a a 2.14 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.15',
          codigo: '212839-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 2.15 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '2.16 a 2.17',
          codigo: '212840-3',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 2.16 a 2.17 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '3.1.a a 3.1.d',
          codigo: '212842-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 3.1.a a 3.1.d do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '3.1.e',
          codigo: '212846-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 3.1.e do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '3.1.f a 3.1.p',
          codigo: '212847-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 3.1.f a 3.1.p do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '3.1.q',
          codigo: '212858-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 3.1.q do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '3.2.a a 3.2.b',
          codigo: '212859-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 3.2.a a 3.2.b do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '3.2.c',
          codigo: '212861-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 3.2.c do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '3.2.d a 3.2.e',
          codigo: '212862-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 3.2.d a 3.2.e do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '3.3 a 3.7',
          codigo: '212864-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 3.3 a 3.7 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '3.8 a 3.11',
          codigo: '212870-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 3.8 a 3.11 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '3.12',
          codigo: '212874-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 3.12 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '3.13 a 3.14',
          codigo: '212875-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 3.13 a 3.14 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '3.15',
          codigo: '212877-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 3.15 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.2',
          codigo: '212878-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 4.2 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.3',
          codigo: '212879-9',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.3 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.4',
          codigo: '212880-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 4.4 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.5 a 4.6',
          codigo: '212881-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.5 a 4.6 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.7.a a 4.17.c',
          codigo: '212883-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.7.a a 4.17.c do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.18.a a 4.18.b',
          codigo: '212899-3',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.18.a a 4.18.b do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.18.c',
          codigo: '212901-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.18.c do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.18.d a 4.18.g',
          codigo: '212902-7',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.18.d a 4.18.g do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.19',
          codigo: '212906-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.19 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.20',
          codigo: '212907-8',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 4.20 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.21 a 4.22',
          codigo: '212908-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.21 a 4.22 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.23',
          codigo: '212910-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.23 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.24 a 4.24.d',
          codigo: '212911-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.24 a 4.24.d do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.24.e a 4.24.f',
          codigo: '212916-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.24.e a 4.24.f do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.24.g a 4.24.i',
          codigo: '212918-3',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.24.g a 4.24.i do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.25',
          codigo: '212921-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.25 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.26.a a 4.27.e',
          codigo: '212922-1',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.26.a a 4.27.e do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.27.f',
          codigo: '212938-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.27.f do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.27.g a 4.27.q',
          codigo: '212939-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.27.g a 4.27.q do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.28.a',
          codigo: '212950-7',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 4.28.a do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.28.b',
          codigo: '212951-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.28.b do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.28.c a 4.29.d',
          codigo: '212952-3',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 4.28.c a 4.29.d do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.31',
          codigo: '212959-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.31 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.32',
          codigo: '212960-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.32 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.33',
          codigo: '212961-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 4.33 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.34 a 4.35',
          codigo: '212962-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.34 a 4.35 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.36',
          codigo: '212964-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.36 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.37',
          codigo: '212965-5',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.37 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.38',
          codigo: '212966-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.38 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.39 a 4.40',
          codigo: '212967-1',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 4.39 a 4.40 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '4.41 a 4.42',
          codigo: '212969-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.41 a 4.42 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '6',
          codigo: '212971-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 6 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
        },
        {
          item_ref: '7 a 7.2',
          codigo: '212972-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 7 a 7.2 do Anexo XII da NR-12 (Anexo II da NR-28). Requisitos de segurança para equipamentos de guindar utilizados na elevação de pessoas e trabalho em altura: sistemas de segurança e freios, dispositivos de ancoragem, inspeção e manutenção periódica, capacitação e procedimentos de resgate.',
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
        "nome = 'NR-12 — Anexo XII (Equipamentos de Guindar para Elevação de Pessoas e Trabalho em Altura)' && organizacao_id = ''",
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
