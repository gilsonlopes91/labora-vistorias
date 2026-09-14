migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-11' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-11 — Transporte, Movimentação, Armazenagem e Manuseio de Materiais')
      tipoRec.set('nr_referencia', 'NR-11')
      tipoRec.set(
        'descricao',
        'Checklist oficial da NR-11, com item/código/grau/tipo extraídos do Anexo II da NR-28. ' +
          'Cálculo de multa pelo Anexo I da NR-28. As descrições foram redigidas a partir do conteúdo ' +
          'geral conhecido da norma, sem confirmação linha a linha do texto vigente (item marcado na ' +
          'observação) — revisar com a fonte oficial (gov.br) antes de usar em laudo real.',
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
      'Descrição escrita a partir de conhecimento geral da NR-11, sem confirmação linha a linha do texto vigente — revisar com a fonte oficial antes de usar em laudo real.'

    if (!jaTemItens) {
      const itens = [
        {
          item_ref: '11.1.1',
          codigo: '111036-5',
          grau: 4,
          tipo: 'S',
          descricao:
            'Aplicar as disposições da NR-11 ao transporte, à movimentação, à armazenagem e ao manuseio de materiais, de forma manual ou mecânica.',
        },
        {
          item_ref: '11.1.2',
          codigo: '111037-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Manter vias de circulação demarcadas e dimensionadas de forma compatível com os materiais, equipamentos e pessoas transportadas.',
        },
        {
          item_ref: '11.1.3',
          codigo: '111038-1',
          grau: 4,
          tipo: 'S',
          descricao:
            'Cercar todo o perímetro dos poços dos elevadores de carga, de forma a impedir o acesso de pessoas não autorizadas.',
        },
        {
          item_ref: '11.1.3.1',
          codigo: '111039-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Proteger as aberturas de acesso a material do elevador de carga quando a cabina não estiver no nível do pavimento.',
        },
        {
          item_ref: '11.1.3.2',
          codigo: '111040-3',
          grau: 2,
          tipo: 'S',
          descricao:
            'Sinalizar de forma visível a carga máxima permitida em cada elevador de carga.',
        },
        {
          item_ref: '11.1.3.3',
          codigo: '111041-1',
          grau: 4,
          tipo: 'S',
          descricao:
            'Realizar inspeção e manutenção periódica dos elevadores de carga, mantendo registro.',
        },
        {
          item_ref: '11.1.4',
          codigo: '111042-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Inspecionar periodicamente cabos de aço, cordas e correntes utilizados em equipamentos de transporte e movimentação de materiais.',
        },
        {
          item_ref: '11.1.5',
          codigo: '111043-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Dotar os equipamentos de transporte motorizados de sinal sonoro de advertência.',
        },
        {
          item_ref: '11.1.6',
          codigo: '111044-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Exigir habilitação/qualificação para operadores de equipamentos motorizados de transporte e movimentação de materiais.',
        },
        {
          item_ref: '11.1.6.1',
          codigo: '111045-4',
          grau: 2,
          tipo: 'M',
          descricao:
            'Manter cartão de identificação do operador atualizado, vinculado à validade do exame de saúde, para cada trabalhador autorizado.',
        },
        {
          item_ref: '11.1.7',
          codigo: '111046-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Prover proteção contra risco de acidentes nos transportadores industriais (correias, esteiras, roletes).',
        },
        {
          item_ref: '11.1.8',
          codigo: '111047-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Controlar a emissão de gases tóxicos ou monóxido de carbono em locais fechados onde operem equipamentos motorizados.',
        },
        {
          item_ref: '11.1.9',
          codigo: '111048-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Não utilizar máquinas com motor de combustão interna em locais fechados sem ventilação adequada.',
        },
        {
          item_ref: '11.1.10',
          codigo: '111014-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir as demais disposições gerais de segurança na movimentação mecânica de materiais previstas no item 11.1.',
        },
        {
          item_ref: '11.2.2',
          codigo: '111051-9',
          grau: 2,
          tipo: 'S',
          descricao: 'Respeitar peso e condições estabelecidas para o transporte manual de sacos.',
        },
        {
          item_ref: '11.2.2.1',
          codigo: '111052-7',
          grau: 2,
          tipo: 'S',
          descricao:
            'Limitar a 60 metros a distância de transporte manual de sacos; acima disso, utilizar meio mecanizado.',
        },
        {
          item_ref: '11.2.3',
          codigo: '111053-5',
          grau: 1,
          tipo: 'S',
          descricao:
            'Não permitir o transporte de sacos sobre vãos ou aberturas sem proteção adequada.',
        },
        {
          item_ref: '11.2.3.1',
          codigo: '111018-7',
          grau: 1,
          tipo: 'S',
          descricao:
            'Utilizar prancha ou passadiço com dimensões mínimas exigidas para a travessia de vãos no transporte de sacos.',
        },
        {
          item_ref: '11.2.4',
          codigo: '111054-3',
          grau: 2,
          tipo: 'S',
          descricao: 'Exigir a presença de ajudante nas operações de carga e descarga de sacos.',
        },
        {
          item_ref: '11.2.5',
          codigo: '111055-1',
          grau: 3,
          tipo: 'S',
          descricao: 'Respeitar a altura máxima permitida no empilhamento manual de sacos.',
        },
        {
          item_ref: '11.2.8',
          codigo: '111056-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Atender às especificações técnicas para escadas removíveis de madeira usadas no transporte de sacos.',
        },
        {
          item_ref: '11.2.9',
          codigo: '111057-8',
          grau: 2,
          tipo: 'S',
          descricao:
            'Manter o piso dos locais de carga e descarga não escorregadio e em bom estado de conservação.',
        },
        {
          item_ref: '11.2.10',
          codigo: '111049-7',
          grau: 2,
          tipo: 'S',
          descricao:
            'Prover cobertura apropriada nos locais de carga e descarga para proteção contra intempéries.',
        },
        {
          item_ref: '11.2.11',
          codigo: '111050-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir as demais condições de segurança no transporte manual de sacos previstas no item 11.2.',
        },
        {
          item_ref: '11.3.1',
          codigo: '111058-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Respeitar e sinalizar visivelmente a carga máxima admissível do piso nas áreas de armazenamento.',
        },
        {
          item_ref: '11.3.2',
          codigo: '111059-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Dispor o material armazenado de forma a não obstruir portas, corredores, saídas de emergência e equipamentos de combate a incêndio.',
        },
        {
          item_ref: '11.3.3',
          codigo: '111033-0',
          grau: 1,
          tipo: 'S',
          descricao:
            'Respeitar o afastamento mínimo entre o material armazenado e paredes ou estruturas laterais.',
        },
        {
          item_ref: '11.3.4',
          codigo: '111060-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Manter facilidade de trânsito e acesso a materiais e a equipamentos de emergência entre as pilhas de material armazenado.',
        },
        {
          item_ref: '11.3.5',
          codigo: '111061-6',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir os requisitos específicos de armazenamento conforme a natureza do material estocado.',
        },
        {
          item_ref: '11.4.1',
          codigo: '111035-7',
          grau: 4,
          tipo: 'S',
          descricao:
            'Atender ao Regulamento Técnico do Anexo I da NR-11 na movimentação e no manuseio de chapas de rochas ornamentais.',
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
        "nr_referencia = 'NR-11' && organizacao_id = ''",
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
