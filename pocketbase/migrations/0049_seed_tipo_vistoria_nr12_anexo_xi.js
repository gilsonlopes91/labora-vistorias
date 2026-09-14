migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nome = 'NR-12 — Anexo XI (Máquinas e Implementos para Uso Agrícola e Florestal)' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-12 — Anexo XI (Máquinas e Implementos para Uso Agrícola e Florestal)')
      tipoRec.set('nr_referencia', 'NR-12')
      tipoRec.set(
        'descricao',
        'Checklist do Anexo XI da NR-12 (item/grau/tipo do Anexo II da NR-28; subitens/alíneas de mesmo ' +
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
          item_ref: '2',
          codigo: '212628-1',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 2 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '3.a a 3.e',
          codigo: '212629-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 3.a a 3.e do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '4',
          codigo: '212634-6',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 4 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '5',
          codigo: '212635-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 5 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '6 a 6.3.1',
          codigo: '212636-2',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 6 a 6.3.1 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '6.4.a a 6.5.4.1',
          codigo: '212640-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 6.4.a a 6.5.4.1 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '6.6 a 6.10',
          codigo: '212666-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 6.6 a 6.10 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '6.11 a 6.12.1',
          codigo: '212673-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 6.11 a 6.12.1 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '7.a a 7.c',
          codigo: '212676-1',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 7.a a 7.c do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '8',
          codigo: '212679-6',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 8 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '9',
          codigo: '212680-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 9 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '10',
          codigo: '212681-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 10 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '11',
          codigo: '212682-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 11 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '12',
          codigo: '212683-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 12 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '12.1',
          codigo: '212684-2',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 12.1 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '12.2',
          codigo: '212685-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 12.2 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '13.a a 13.g',
          codigo: '212686-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 13.a a 13.g do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '14',
          codigo: '212693-1',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 14 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '14.1.a a 14.2.d',
          codigo: '212694-0',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 14.1.a a 14.2.d do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '14.2.e',
          codigo: '212702-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 14.2.e do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '14.2.f',
          codigo: '212703-2',
          grau: 1,
          tipo: 'S',
          descricao:
            'Item 14.2.f do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '14.2.g a 14.2.n',
          codigo: '212704-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 14.2.g a 14.2.n do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '15 a 15.6',
          codigo: '212712-1',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 15 a 15.6 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '15.7 a 15.7.1.1',
          codigo: '212720-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 15.7 a 15.7.1.1 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
        },
        {
          item_ref: '15.8 a 15.25.2',
          codigo: '212728-8',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 15.8 a 15.25.2 do Anexo XI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas e implementos agrícolas/florestais: proteção da tomada de força e transmissões, estrutura de proteção contra capotamento (ROPS) e contra queda de objetos (FOPS) quando aplicável, cinto de segurança, sinalização e procedimentos de operação segura.',
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
        "nome = 'NR-12 — Anexo XI (Máquinas e Implementos para Uso Agrícola e Florestal)' && organizacao_id = ''",
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
