migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-14' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-14 — Fornos')
      tipoRec.set('nr_referencia', 'NR-14')
      tipoRec.set(
        'descricao',
        'Checklist oficial da NR-14, com item/código/grau/tipo extraídos do Anexo II da NR-28. ' +
          'Cálculo de multa pelo Anexo I da NR-28. As descrições foram redigidas a partir do conteúdo ' +
          'geral conhecido da norma, sem confirmação linha a linha do texto vigente — revisar com a ' +
          'fonte oficial (gov.br) antes de usar em laudo real.',
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
      'Descrição escrita a partir de conhecimento geral da NR-14, sem confirmação linha a linha do texto vigente — revisar com a fonte oficial antes de usar em laudo real.'

    if (!jaTemItens) {
      const itens = [
        {
          item_ref: '14.1',
          codigo: '114008-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Construir os fornos solidamente e revesti-los com material refratário, de forma que o calor radiante não ultrapasse os limites de tolerância fixados na NR-15.',
        },
        {
          item_ref: '14.2',
          codigo: '114009-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Cumprir as condições mínimas de segurança exigidas para a construção e a localização dos fornos.',
        },
        {
          item_ref: '14.2.1',
          codigo: '114010-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Localizar o forno em área que não ofereça risco a trabalhadores não envolvidos na sua operação.',
        },
        {
          item_ref: '14.2.2',
          codigo: '114011-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Construir e instalar o forno de acordo com as normas técnicas oficiais aplicáveis.',
        },
        {
          item_ref: '14.3. a',
          codigo: '114005-1',
          grau: 4,
          tipo: 'S',
          descricao:
            'Não permitir qualquer ligação entre o tubo de saída dos gases do forno e o ambiente de trabalho.',
        },
        {
          item_ref: '14.3. b',
          codigo: '114006-0',
          grau: 4,
          tipo: 'S',
          descricao: 'Não permitir depósito de combustível dentro da área de operação do forno.',
        },
        {
          item_ref: '14.3.1',
          codigo: '114012-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Adotar medidas de proteção coletiva e individual contra o calor irradiante e os demais riscos da operação de fornos.',
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
        "nr_referencia = 'NR-14' && organizacao_id = ''",
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
