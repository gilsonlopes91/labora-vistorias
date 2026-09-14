migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nome = 'NR-12 — Anexo X (Máquinas para Fabricação de Calçados e Afins)' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-12 — Anexo X (Máquinas para Fabricação de Calçados e Afins)')
      tipoRec.set('nr_referencia', 'NR-12')
      tipoRec.set(
        'descricao',
        'Checklist do Anexo X da NR-12 (item/grau/tipo do Anexo II da NR-28; subitens/alíneas de mesmo ' +
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
          item_ref: '1.a a 1.b',
          codigo: '212619-2',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 1.a a 1.b do Anexo X da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de fabricação de calçados: proteções em partes móveis e cortantes, dispositivos de acionamento seguro e sinalização de risco.',
        },
        {
          item_ref: '1.c a 1.d',
          codigo: '212621-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 1.c a 1.d do Anexo X da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de fabricação de calçados: proteções em partes móveis e cortantes, dispositivos de acionamento seguro e sinalização de risco.',
        },
        {
          item_ref: '2.a a 2.1',
          codigo: '212623-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 2.a a 2.1 do Anexo X da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de fabricação de calçados: proteções em partes móveis e cortantes, dispositivos de acionamento seguro e sinalização de risco.',
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
        "nome = 'NR-12 — Anexo X (Máquinas para Fabricação de Calçados e Afins)' && organizacao_id = ''",
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
