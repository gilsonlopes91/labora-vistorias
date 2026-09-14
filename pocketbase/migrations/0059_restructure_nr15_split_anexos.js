migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    // Remove o registro antigo combinado (corpo + 7 Anexos em um só tipo_vistoria, distinguidos só por 'secao').
    try {
      const antigo = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nome = 'NR-15 — Atividades e Operações Insalubres' && organizacao_id = ''",
      )
      const itensAntigos = app.findRecordsByFilter(
        'itens_checklist',
        "tipo_vistoria_id = '" + antigo.id + "'",
        '',
        0,
        0,
      )
      for (const it of itensAntigos) {
        app.delete(it)
      }
      app.delete(antigo)
    } catch (_) {}

    const grupos = [
      {
        nome: 'NR-15 — Corpo da Norma (Adicional de Insalubridade)',
        descricao:
          'Checklist do corpo da NR-15 (caracterização e pagamento do adicional de insalubridade conforme laudo técnico). Item/grau/tipo do Anexo II da NR-28. Multa pelo Anexo I da NR-28. Descrições redigidas a partir de conhecimento geral da norma, sem confirmação linha a linha — revisão obrigatória antes de laudo real.',
        itens: [
          {
            item_ref: '15.2',
            codigo: '115001-4',
            grau: 1,
            tipo: 'S',
            descricao:
              'Caracterização e pagamento do adicional de insalubridade conforme laudo técnico de condições ambientais de trabalho.',
          },
        ],
      },
      {
        nome: 'NR-15 — Anexo 1 (Ruído Contínuo ou Intermitente)',
        descricao:
          'Checklist do Anexo 1 da NR-15 (limites de tolerância para ruído contínuo ou intermitente). Item/grau/tipo do Anexo II da NR-28. Multa pelo Anexo I da NR-28. Descrições redigidas a partir de conhecimento geral da norma, sem confirmação linha a linha — revisão obrigatória antes de laudo real.',
        itens: [
          {
            item_ref: 'Anexo 1, item 3',
            codigo: '115050-2',
            grau: 3,
            tipo: 'S',
            descricao:
              'Limites de tolerância para ruído contínuo ou intermitente (NPS em dB(A) por tempo de exposição).',
          },
          {
            item_ref: 'Anexo 1, item 5',
            codigo: '115051-0',
            grau: 4,
            tipo: 'S',
            descricao:
              'Limites de tolerância para ruído contínuo ou intermitente (NPS em dB(A) por tempo de exposição).',
          },
        ],
      },
      {
        nome: 'NR-15 — Anexo 2 (Ruído de Impacto)',
        descricao:
          'Checklist do Anexo 2 da NR-15 (limites de tolerância para ruído de impacto). Item/grau/tipo do Anexo II da NR-28. Multa pelo Anexo I da NR-28. Descrições redigidas a partir de conhecimento geral da norma, sem confirmação linha a linha — revisão obrigatória antes de laudo real.',
        itens: [
          {
            item_ref: 'Anexo 2, item 4',
            codigo: '115052-9',
            grau: 4,
            tipo: 'S',
            descricao: 'Limites de tolerância para ruído de impacto.',
          },
        ],
      },
      {
        nome: 'NR-15 — Anexo 3 (Exposição ao Calor)',
        descricao:
          'Checklist do Anexo 3 da NR-15 (limites de tolerância para exposição ocupacional ao calor — IBUTG). Item/grau/tipo do Anexo II da NR-28. Multa pelo Anexo I da NR-28. Descrições redigidas a partir de conhecimento geral da norma, sem confirmação linha a linha — revisão obrigatória antes de laudo real.',
        itens: [
          {
            item_ref: 'Anexo 3, item 1',
            codigo: '115053-7',
            grau: 3,
            tipo: 'S',
            descricao: 'Limites de tolerância para exposição ocupacional ao calor (IBUTG).',
          },
        ],
      },
      {
        nome: 'NR-15 — Anexo 5 (Radiações Ionizantes)',
        descricao:
          'Checklist do Anexo 5 da NR-15 (condições de insalubridade por exposição a radiações ionizantes). Item/grau/tipo do Anexo II da NR-28. Multa pelo Anexo I da NR-28. Descrições redigidas a partir de conhecimento geral da norma, sem confirmação linha a linha — revisão obrigatória antes de laudo real.',
        itens: [
          {
            item_ref: 'Anexo 5',
            codigo: '115054-5',
            grau: 3,
            tipo: 'S',
            descricao: 'Condições de insalubridade por exposição a radiações ionizantes.',
          },
        ],
      },
      {
        nome: 'NR-15 — Anexo 6 (Trabalho sob Condições Hiperbáricas)',
        descricao:
          'Checklist do Anexo 6 da NR-15 (condições de segurança e insalubridade para trabalho sob condições hiperbáricas — mergulho, ar comprimido). Item/grau/tipo do Anexo II da NR-28. Multa pelo Anexo I da NR-28. Descrições redigidas a partir de conhecimento geral da norma, sem confirmação linha a linha — revisão obrigatória antes de laudo real.',
        itens: [
          {
            item_ref: 'Anexo 6, item 1.3.1',
            codigo: '115055-3',
            grau: 4,
            tipo: 'S',
            descricao:
              'Condições de segurança e insalubridade para trabalho sob condições hiperbáricas (mergulho, ar comprimido).',
          },
          {
            item_ref: 'Anexo 6, item 2.3.1.a',
            codigo: '115056-1',
            grau: 4,
            tipo: 'S',
            descricao:
              'Condições de segurança e insalubridade para trabalho sob condições hiperbáricas (mergulho, ar comprimido).',
          },
        ],
      },
      {
        nome: 'NR-15 — Anexo 11 (Agentes Químicos)',
        descricao:
          'Checklist do Anexo 11 da NR-15 (insalubridade por agentes químicos — limite de tolerância). Item/grau/tipo do Anexo II da NR-28. Multa pelo Anexo I da NR-28. Descrições redigidas a partir de conhecimento geral da norma, sem confirmação linha a linha — revisão obrigatória antes de laudo real.',
        itens: [
          {
            item_ref: 'Anexo 11, item 3',
            codigo: '115057-0',
            grau: 4,
            tipo: 'S',
            descricao:
              'Insalubridade por agentes químicos caracterizada por limite de tolerância e inspeção no local de trabalho.',
          },
          {
            item_ref: 'Anexo 11, item 4',
            codigo: '115058-8',
            grau: 4,
            tipo: 'S',
            descricao:
              'Insalubridade por agentes químicos caracterizada por limite de tolerância e inspeção no local de trabalho.',
          },
          {
            item_ref: 'Anexo 11, item 7',
            codigo: '115059-6',
            grau: 4,
            tipo: 'S',
            descricao:
              'Insalubridade por agentes químicos caracterizada por limite de tolerância e inspeção no local de trabalho.',
          },
        ],
      },
      {
        nome: 'NR-15 — Anexo 12 (Poeiras Minerais)',
        descricao:
          'Checklist do Anexo 12 da NR-15 (limites de tolerância e condições de insalubridade por exposição a poeiras minerais — sílica, asbesto/amianto, manganês etc.). Item/grau/tipo do Anexo II da NR-28. Multa pelo Anexo I da NR-28. Descrições redigidas a partir de conhecimento geral da norma, sem confirmação linha a linha — revisão obrigatória antes de laudo real.',
        itens: [
          {
            item_ref: 'Anexo 12, item 2.1',
            codigo: '115016-2',
            grau: 4,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 2.3',
            codigo: '115060-0',
            grau: 3,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 4',
            codigo: '115018-9',
            grau: 4,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 5',
            codigo: '115019-7',
            grau: 4,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 6',
            codigo: '115020-0',
            grau: 4,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 7',
            codigo: '115021-9',
            grau: 3,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 7.2',
            codigo: '115061-8',
            grau: 2,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 7.3',
            codigo: '115062-6',
            grau: 3,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 8 (Sílica)',
            codigo: '115024-3',
            grau: 3,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 8 (Sílica)',
            codigo: '115079-0',
            grau: 3,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 8 (Sílica)',
            codigo: '115093-6',
            grau: 3,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 9',
            codigo: '115025-1',
            grau: 3,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 9.1',
            codigo: '115063-4',
            grau: 2,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 9.2',
            codigo: '115064-2',
            grau: 2,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 10',
            codigo: '115028-6',
            grau: 3,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 11',
            codigo: '115029-4',
            grau: 3,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 11.1',
            codigo: '115030-8',
            grau: 3,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 11.2',
            codigo: '115065-0',
            grau: 2,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 11.4',
            codigo: '115066-9',
            grau: 1,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 14',
            codigo: '115034-0',
            grau: 3,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 14.1',
            codigo: '115067-7',
            grau: 2,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 14.2',
            codigo: '115068-5',
            grau: 2,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 15',
            codigo: '115069-3',
            grau: 2,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 16',
            codigo: '115070-7',
            grau: 2,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 17',
            codigo: '115071-5',
            grau: 3,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 18',
            codigo: '115072-3',
            grau: 3,
            tipo: 'M',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 18.2',
            codigo: '115041-3',
            grau: 2,
            tipo: 'M',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 19',
            codigo: '115073-1',
            grau: 3,
            tipo: 'M',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 19.1',
            codigo: '115074-0',
            grau: 2,
            tipo: 'M',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 19.2',
            codigo: '115075-8',
            grau: 1,
            tipo: 'M',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 20',
            codigo: '115099-5',
            grau: 3,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, item 20.1',
            codigo: '115077-4',
            grau: 2,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
          {
            item_ref: 'Anexo 12, Manganês (item 7)',
            codigo: '115078-2',
            grau: 3,
            tipo: 'S',
            descricao:
              'Limites de tolerância e condições de insalubridade por exposição a poeiras minerais (sílica, asbesto/amianto, manganês etc.).',
          },
        ],
      },
    ]

    for (const grupo of grupos) {
      let tipoRec
      try {
        tipoRec = app.findFirstRecordByFilter(
          'tipos_vistoria',
          "nome = '" + grupo.nome.replace(/'/g, "\\'") + "' && organizacao_id = ''",
        )
      } catch (_) {
        tipoRec = new Record(tiposCol)
        tipoRec.set('organizacao_id', '')
        tipoRec.set('nome', grupo.nome)
        tipoRec.set('nr_referencia', 'NR-15')
        tipoRec.set('descricao', grupo.descricao)
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
        grupo.itens.forEach((it, idx) => {
          const rec = new Record(itensCol)
          rec.set('tipo_vistoria_id', tipoRec.id)
          rec.set('ordem', idx)
          rec.set('secao', '')
          rec.set('item_ref', it.item_ref)
          rec.set('codigo', it.codigo)
          rec.set('grau', it.grau)
          rec.set('tipo', it.tipo)
          rec.set('descricao', it.descricao)
          rec.set(
            'observacao',
            'Descrição escrita a partir de conhecimento geral da NR-15, sem confirmação linha a linha do texto vigente — revisar com a fonte oficial antes de usar em laudo real.',
          )
          app.save(rec)
        })
      }
    }
  },
  (app) => {
    const nomes = [
      'NR-15 — Corpo da Norma (Adicional de Insalubridade)',
      'NR-15 — Anexo 1 (Ruído Contínuo ou Intermitente)',
      'NR-15 — Anexo 2 (Ruído de Impacto)',
      'NR-15 — Anexo 3 (Exposição ao Calor)',
      'NR-15 — Anexo 5 (Radiações Ionizantes)',
      'NR-15 — Anexo 6 (Trabalho sob Condições Hiperbáricas)',
      'NR-15 — Anexo 11 (Agentes Químicos)',
      'NR-15 — Anexo 12 (Poeiras Minerais)',
    ]
    for (const nome of nomes) {
      try {
        const tipoRec = app.findFirstRecordByFilter(
          'tipos_vistoria',
          "nome = '" + nome.replace(/'/g, "\\'") + "' && organizacao_id = ''",
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
    }
  },
)
