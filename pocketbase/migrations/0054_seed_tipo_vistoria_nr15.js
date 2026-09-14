migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-15' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-15 — Atividades e Operações Insalubres')
      tipoRec.set('nr_referencia', 'NR-15')
      tipoRec.set(
        'descricao',
        'Checklist da NR-15 (corpo + Anexos 1, 2, 3, 5, 6, 11 e 12 — ruído, calor, radiações, condições ' +
          'hiperbáricas, agentes químicos e poeiras minerais). Item/grau/tipo do Anexo II da NR-28. Multa ' +
          'pelo Anexo I da NR-28. Descrições redigidas a partir de conhecimento geral da norma, sem ' +
          'confirmação linha a linha — revisão obrigatória antes de laudo real.',
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
      'Descrição escrita a partir de conhecimento geral da NR-15, sem confirmação linha a linha do texto vigente — revisar com a fonte oficial antes de usar em laudo real.'

    if (!jaTemItens) {
      const itens = [
        {
          item_ref: '15.2',
          secao: 'Corpo',
          codigo: '115001-4',
          grau: 1,
          tipo: 'S',
          descricao:
            'Caracterização e pagamento do adicional de insalubridade conforme laudo técnico de condições ambientais de trabalho. (Corpo, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 1, item 3',
          secao: 'Anexo 1 — Ruído Contínuo ou Intermitente',
          codigo: '115050-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Limites de tolerância para ruído contínuo ou intermitente (NPS em dB(A) por tempo de exposição). (Anexo 1 — Ruído Contínuo ou Intermitente, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 1, item 5',
          secao: 'Anexo 1 — Ruído Contínuo ou Intermitente',
          codigo: '115051-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Limites de tolerância para ruído contínuo ou intermitente (NPS em dB(A) por tempo de exposição). (Anexo 1 — Ruído Contínuo ou Intermitente, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 2, item 4',
          secao: 'Anexo 2 — Ruído de Impacto',
          codigo: '115052-9',
          grau: 4,
          tipo: 'S',
          descricao:
            'Limites de tolerância para ruído de impacto. (Anexo 2 — Ruído de Impacto, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 3, item 1',
          secao: 'Anexo 3 — Exposição ao Calor',
          codigo: '115053-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Limites de tolerância para exposição ocupacional ao calor (IBUTG). (Anexo 3 — Exposição ao Calor, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 5',
          secao: 'Anexo 5 — Radiações Ionizantes',
          codigo: '115054-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Condições de insalubridade por exposição a radiações ionizantes. (Anexo 5 — Radiações Ionizantes, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 6, item 1.3.1',
          secao: 'Anexo 6 — Trabalho sob Condições Hiperbáricas',
          codigo: '115055-3',
          grau: 4,
          tipo: 'S',
          descricao:
            'Condições de segurança e insalubridade para trabalho sob condições hiperbáricas (mergulho, ar comprimido). (Anexo 6 — Trabalho sob Condições Hiperbáricas, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 6, item 2.3.1.a',
          secao: 'Anexo 6 — Trabalho sob Condições Hiperbáricas',
          codigo: '115056-1',
          grau: 4,
          tipo: 'S',
          descricao:
            'Condições de segurança e insalubridade para trabalho sob condições hiperbáricas (mergulho, ar comprimido). (Anexo 6 — Trabalho sob Condições Hiperbáricas, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 11, item 3',
          secao: 'Anexo 11 — Agentes Químicos (limite de tolerância)',
          codigo: '115057-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Insalubridade por agentes químicos caracterizada por limite de tolerância e inspeção no local de trabalho. (Anexo 11 — Agentes Químicos (limite de tolerância), Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 11, item 4',
          secao: 'Anexo 11 — Agentes Químicos (limite de tolerância)',
          codigo: '115058-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Insalubridade por agentes químicos caracterizada por limite de tolerância e inspeção no local de trabalho. (Anexo 11 — Agentes Químicos (limite de tolerância), Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 11, item 7',
          secao: 'Anexo 11 — Agentes Químicos (limite de tolerância)',
          codigo: '115059-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Insalubridade por agentes químicos caracterizada por limite de tolerância e inspeção no local de trabalho. (Anexo 11 — Agentes Químicos (limite de tolerância), Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 2.1',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115016-2',
          grau: 4,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 2.3',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115060-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 4',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115018-9',
          grau: 4,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 5',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115019-7',
          grau: 4,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 6',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115020-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 7',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115021-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 7.2',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115061-8',
          grau: 2,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 7.3',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115062-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 8 (Sílica)',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115024-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 8 (Sílica)',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115079-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 8 (Sílica)',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115093-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 9',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115025-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 9.1',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115063-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 9.2',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115064-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 10',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115028-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 11',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115029-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 11.1',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115030-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 11.2',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115065-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 11.4',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115066-9',
          grau: 1,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 14',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115034-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 14.1',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115067-7',
          grau: 2,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 14.2',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115068-5',
          grau: 2,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 15',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115069-3',
          grau: 2,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 16',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115070-7',
          grau: 2,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 17',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115071-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 18',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115072-3',
          grau: 3,
          tipo: 'M',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 18.2',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115041-3',
          grau: 2,
          tipo: 'M',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 19',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115073-1',
          grau: 3,
          tipo: 'M',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 19.1',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115074-0',
          grau: 2,
          tipo: 'M',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 19.2',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115075-8',
          grau: 1,
          tipo: 'M',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 20',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115099-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, item 20.1',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115077-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
        {
          item_ref: 'Anexo 12, Manganês (item 7)',
          secao: 'Anexo 12 — Poeiras Minerais',
          codigo: '115078-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.). (Anexo 12 — Poeiras Minerais, Anexo II da NR-28).',
        },
      ]
      itens.forEach((it, idx) => {
        const rec = new Record(itensCol)
        rec.set('tipo_vistoria_id', tipoRec.id)
        rec.set('ordem', idx)
        rec.set('secao', it.secao)
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
        "nr_referencia = 'NR-15' && organizacao_id = ''",
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
