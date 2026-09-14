migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-16' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-16 — Atividades e Operações Perigosas')
      tipoRec.set('nr_referencia', 'NR-16')
      tipoRec.set(
        'descricao',
        'Checklist da NR-16 (adicional de periculosidade e áreas de risco). Item/grau/tipo do Anexo II da ' +
          'NR-28. Multa pelo Anexo I da NR-28. Descrições redigidas a partir de conhecimento geral da norma, ' +
          'sem confirmação linha a linha — revisão obrigatória antes de laudo real.',
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
      'Descrição escrita a partir de conhecimento geral da NR-16, sem confirmação linha a linha do texto vigente — revisar com a fonte oficial antes de usar em laudo real.'

    if (!jaTemItens) {
      const itens = [
        {
          item_ref: '16.2',
          codigo: '116001-0',
          grau: 1,
          tipo: 'S',
          descricao:
            'Caracterização e pagamento do adicional de periculosidade conforme laudo técnico pericial, com percentual de 30% sobre o salário base do empregado, sem os acréscimos resultantes de gratificações, prêmios ou participação nos lucros da empresa.',
        },
        {
          item_ref: '16.8',
          codigo: '116029-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Condições e áreas classificadas como de risco (periculosidade) por inflamáveis, explosivos, energia elétrica, radiações ionizantes, roubos/violência física, ou outras atividades e operações perigosas previstas na norma.',
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
        "nr_referencia = 'NR-16' && organizacao_id = ''",
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
