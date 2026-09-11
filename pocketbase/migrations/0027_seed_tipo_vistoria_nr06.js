migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-06' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-06 — Equipamento de Proteção Individual (EPI)')
      tipoRec.set('nr_referencia', 'NR-06')
      tipoRec.set(
        'descricao',
        'Checklist oficial da NR-06, com itens e classificação (grau/tipo) extraídos do Anexo II ' +
          'da NR-28 (Quadro de Classificação das Infrações). Cálculo de multa pelo Anexo I da NR-28. ' +
          'O item 6.8.1 está com descrição genérica — a numeração de alíneas do Anexo II não bateu ' +
          'com o texto vigente da NR-06 na pesquisa; revisar com a fonte oficial antes de usar em laudo real.',
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
          item_ref: '6.2',
          codigo: '206023-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Cumprir o campo de aplicação da NR-06 quanto às responsabilidades de quem adquire, fornece e fabrica/importa EPI.',
          observacao: '',
        },
        {
          item_ref: '6.3',
          codigo: '206024-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Fornecer apenas Equipamento de Proteção Individual (EPI) — dispositivo de uso individual concebido para proteger o trabalhador contra riscos ocupacionais — ou Equipamento Conjugado de Proteção Individual reconhecidos como tal pela norma.',
          observacao: '',
        },
        {
          item_ref: '6.6.1, alínea "a"',
          codigo: '206005-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Exigir/garantir que o trabalhador use o EPI fornecido pela organização, conforme o item 6.5.2.',
          observacao: '',
        },
        {
          item_ref: '6.6.1, alínea "b"',
          codigo: '206025-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Exigir/garantir que o trabalhador utilize o EPI apenas para a finalidade a que se destina.',
          observacao: '',
        },
        {
          item_ref: '6.6.1, alínea "c"',
          codigo: '206026-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Exigir/garantir que o trabalhador se responsabilize pela limpeza, guarda e conservação do EPI.',
          observacao: '',
        },
        {
          item_ref: '6.6.1, alínea "d"',
          codigo: '206008-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Garantir que o trabalhador comunique à organização quando o EPI for extraviado, danificado ou sofrer alteração que o torne impróprio para uso.',
          observacao: '',
        },
        {
          item_ref: '6.6.1, alínea "e"',
          codigo: '206009-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Garantir que o trabalhador cumpra as determinações da organização sobre o uso adequado do EPI.',
          observacao: '',
        },
        {
          item_ref: '6.6.1, alínea "f"',
          codigo: '206027-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir as demais determinações da alínea "f" do item 6.6.1 relativas às obrigações do trabalhador quanto ao EPI.',
          observacao: '',
        },
        {
          item_ref: '6.6.1, alínea "h"',
          codigo: '206033-7',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir as demais determinações da alínea "h" do item 6.6.1 relativas às obrigações do trabalhador quanto ao EPI.',
          observacao: '',
        },
        {
          item_ref: '6.8.1, alíneas "a" a "l"',
          codigo: '206047-7',
          grau: 4,
          tipo: 'S',
          descricao:
            'Cumprir as obrigações previstas no item 6.8.1 da NR-06 quanto ao fornecimento, fabricação, importação e/ou comercialização de EPI.',
          observacao:
            'A numeração de alíneas ("a" a "l") do Anexo II da NR-28 não bateu com o texto vigente da NR-06 encontrado na pesquisa (que traz só 5 alíneas para fabricante/importador). Revisar com a fonte oficial (gov.br) antes de usar este item em laudo real.',
        },
        {
          item_ref: '6.9.1',
          codigo: '206039-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Cumprir os procedimentos de emissão e renovação do Certificado de Aprovação (CA) do EPI, estabelecidos pelo órgão nacional competente em SST.',
          observacao: '',
        },
        {
          item_ref: '6.9.3',
          codigo: '206032-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Garantir que todo EPI apresente, em caracteres indeléveis, legíveis e visíveis, o nome comercial do fabricante ou importador, o lote de fabricação e o número do CA.',
          observacao: '',
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
        rec.set('observacao', it.observacao)
        app.save(rec)
      })
    }
  },
  (app) => {
    try {
      const tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-06' && organizacao_id = ''",
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
