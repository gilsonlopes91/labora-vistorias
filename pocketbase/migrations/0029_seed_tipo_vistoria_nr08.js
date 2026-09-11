migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-08' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-08 — Edificações')
      tipoRec.set('nr_referencia', 'NR-08')
      tipoRec.set(
        'descricao',
        'Checklist oficial da NR-08, com itens e classificação (grau/tipo) extraídos do Anexo II ' +
          'da NR-28 (Quadro de Classificação das Infrações). Cálculo de multa pelo Anexo I da NR-28.',
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

    if (!jaTemItens) {
      const itens = [
        {
          item_ref: '8.3.1',
          codigo: '108031-8',
          grau: 2,
          tipo: 'S',
          descricao:
            'Garantir que a altura do piso ao teto atenda aos códigos de obras locais, às normas técnicas oficiais e às condições de segurança, conforto e salubridade.',
        },
        {
          item_ref: '8.3.2.1',
          codigo: '108032-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Manter os pisos dos locais de trabalho sem saliências nem depressões que prejudiquem a circulação de pessoas ou a movimentação de materiais.',
        },
        {
          item_ref: '8.3.2.2',
          codigo: '108033-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Proteger as aberturas existentes nos pisos e paredes para impedir a queda de pessoas ou objetos.',
        },
        {
          item_ref: '8.3.2.3',
          codigo: '108034-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Projetar, construir e manter pisos, escadas fixas e rampas capazes de suportar as cargas permanentes e móveis conforme as normas técnicas.',
        },
        {
          item_ref: '8.3.2.4',
          codigo: '108035-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Aplicar materiais ou sistemas antiderrapantes em pisos, escadas, rampas, corredores e passagens onde exista risco de escorregamento.',
        },
        {
          item_ref: '8.3.2.5',
          codigo: '108036-9',
          grau: 4,
          tipo: 'S',
          descricao:
            'Instalar proteção contra queda de pessoas ou objetos nos andares acima do solo, conforme a legislação municipal e as normas técnicas.',
        },
        {
          item_ref: '8.3.3.1',
          codigo: '108037-7',
          grau: 2,
          tipo: 'S',
          descricao:
            'Observar as normas técnicas nas partes externas e nas divisões entre unidades da edificação quanto à resistência ao fogo, ao isolamento térmico e acústico, à resistência estrutural e à impermeabilidade.',
        },
        {
          item_ref: '8.3.3.2',
          codigo: '108038-5',
          grau: 2,
          tipo: 'S',
          descricao: 'Impermeabilizar pisos e paredes contra a umidade, quando aplicável.',
        },
        {
          item_ref: '8.3.3.3',
          codigo: '108039-3',
          grau: 2,
          tipo: 'S',
          descricao: 'Assegurar que as coberturas protejam os locais de trabalho contra as chuvas.',
        },
        {
          item_ref: '8.3.3.4',
          codigo: '108040-7',
          grau: 2,
          tipo: 'S',
          descricao:
            'Projetar e construir a edificação evitando insolação excessiva ou insuficiente, conforme as necessidades do ambiente.',
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
        rec.set('observacao', '')
        app.save(rec)
      })
    }
  },
  (app) => {
    try {
      const tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-08' && organizacao_id = ''",
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
