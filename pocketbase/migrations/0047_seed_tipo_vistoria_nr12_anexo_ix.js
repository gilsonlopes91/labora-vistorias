migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nome = 'NR-12 — Anexo IX (Injetoras de Materiais Plásticos)' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-12 — Anexo IX (Injetoras de Materiais Plásticos)')
      tipoRec.set('nr_referencia', 'NR-12')
      tipoRec.set(
        'descricao',
        'Checklist do Anexo IX da NR-12 (item/grau/tipo do Anexo II da NR-28; subitens/alíneas de mesmo ' +
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
          item_ref: '1.2.1.1 a 1.2.1.9.5.1',
          codigo: '212550-1',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 1.2.1.1 a 1.2.1.9.5.1 do Anexo IX da NR-12 (Anexo II da NR-28). Requisitos de segurança para injetoras de plásticos: proteção da zona de fechamento do molde, dispositivos de intertravamento da proteção móvel, sistemas de segurança redundantes e procedimentos de manutenção com a máquina bloqueada.',
        },
        {
          item_ref: '1.2.2.1 a 1.2.4.3.1',
          codigo: '212577-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 1.2.2.1 a 1.2.4.3.1 do Anexo IX da NR-12 (Anexo II da NR-28). Requisitos de segurança para injetoras de plásticos: proteção da zona de fechamento do molde, dispositivos de intertravamento da proteção móvel, sistemas de segurança redundantes e procedimentos de manutenção com a máquina bloqueada.',
        },
        {
          item_ref: '1.2.4.4',
          codigo: '212587-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 1.2.4.4 do Anexo IX da NR-12 (Anexo II da NR-28). Requisitos de segurança para injetoras de plásticos: proteção da zona de fechamento do molde, dispositivos de intertravamento da proteção móvel, sistemas de segurança redundantes e procedimentos de manutenção com a máquina bloqueada.',
        },
        {
          item_ref: '1.2.5.1 a 1.2.5.1.1',
          codigo: '212588-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 1.2.5.1 a 1.2.5.1.1 do Anexo IX da NR-12 (Anexo II da NR-28). Requisitos de segurança para injetoras de plásticos: proteção da zona de fechamento do molde, dispositivos de intertravamento da proteção móvel, sistemas de segurança redundantes e procedimentos de manutenção com a máquina bloqueada.',
        },
        {
          item_ref: '1.2.6.2',
          codigo: '212590-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 1.2.6.2 do Anexo IX da NR-12 (Anexo II da NR-28). Requisitos de segurança para injetoras de plásticos: proteção da zona de fechamento do molde, dispositivos de intertravamento da proteção móvel, sistemas de segurança redundantes e procedimentos de manutenção com a máquina bloqueada.',
        },
        {
          item_ref: '1.2.6.2.1',
          codigo: '212591-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 1.2.6.2.1 do Anexo IX da NR-12 (Anexo II da NR-28). Requisitos de segurança para injetoras de plásticos: proteção da zona de fechamento do molde, dispositivos de intertravamento da proteção móvel, sistemas de segurança redundantes e procedimentos de manutenção com a máquina bloqueada.',
        },
        {
          item_ref: '1.2.6.2.2 a 1.2.6.3',
          codigo: '212592-7',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 1.2.6.2.2 a 1.2.6.3 do Anexo IX da NR-12 (Anexo II da NR-28). Requisitos de segurança para injetoras de plásticos: proteção da zona de fechamento do molde, dispositivos de intertravamento da proteção móvel, sistemas de segurança redundantes e procedimentos de manutenção com a máquina bloqueada.',
        },
        {
          item_ref: '1.2.6.3.1 a 1.2.6.3.2',
          codigo: '212594-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 1.2.6.3.1 a 1.2.6.3.2 do Anexo IX da NR-12 (Anexo II da NR-28). Requisitos de segurança para injetoras de plásticos: proteção da zona de fechamento do molde, dispositivos de intertravamento da proteção móvel, sistemas de segurança redundantes e procedimentos de manutenção com a máquina bloqueada.',
        },
        {
          item_ref: '1.2.6.3.3.a a 1.2.6.3.5',
          codigo: '212596-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 1.2.6.3.3.a a 1.2.6.3.5 do Anexo IX da NR-12 (Anexo II da NR-28). Requisitos de segurança para injetoras de plásticos: proteção da zona de fechamento do molde, dispositivos de intertravamento da proteção móvel, sistemas de segurança redundantes e procedimentos de manutenção com a máquina bloqueada.',
        },
        {
          item_ref: '1.2.7.1 a 1.2.7.3.b',
          codigo: '212601-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 1.2.7.1 a 1.2.7.3.b do Anexo IX da NR-12 (Anexo II da NR-28). Requisitos de segurança para injetoras de plásticos: proteção da zona de fechamento do molde, dispositivos de intertravamento da proteção móvel, sistemas de segurança redundantes e procedimentos de manutenção com a máquina bloqueada.',
        },
        {
          item_ref: '1.2.8.1 a 1.2.10.2',
          codigo: '212609-5',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 1.2.8.1 a 1.2.10.2 do Anexo IX da NR-12 (Anexo II da NR-28). Requisitos de segurança para injetoras de plásticos: proteção da zona de fechamento do molde, dispositivos de intertravamento da proteção móvel, sistemas de segurança redundantes e procedimentos de manutenção com a máquina bloqueada.',
        },
        {
          item_ref: '1.2.11.1.a a 1.2.11.1.d',
          codigo: '212615-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 1.2.11.1.a a 1.2.11.1.d do Anexo IX da NR-12 (Anexo II da NR-28). Requisitos de segurança para injetoras de plásticos: proteção da zona de fechamento do molde, dispositivos de intertravamento da proteção móvel, sistemas de segurança redundantes e procedimentos de manutenção com a máquina bloqueada.',
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
        "nome = 'NR-12 — Anexo IX (Injetoras de Materiais Plásticos)' && organizacao_id = ''",
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
