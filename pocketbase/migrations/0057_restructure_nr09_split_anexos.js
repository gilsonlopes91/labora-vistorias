migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    // 1) Remove o registro antigo combinado (corpo + Anexo I + Anexo III em um só tipo_vistoria),
    //    criado antes da adoção do padrão "cada NR limpa + cada Anexo separado".
    try {
      const antigo = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nome = 'NR-09 — Avaliação e Controle das Exposições Ocupacionais a Agentes Físicos, Químicos e Biológicos' && organizacao_id = ''",
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
        nome: 'NR-09 — Corpo da Norma (Avaliação e Controle das Exposições Ocupacionais)',
        descricao:
          'Checklist do corpo da NR-09 (avaliação e controle das exposições ocupacionais a agentes físicos, ' +
          'químicos e biológicos). Item/grau/tipo do Anexo II da NR-28. Multa pelo Anexo I da NR-28.',
        itens: [
          {
            item_ref: '9.3.1, alíneas "a" a "f"',
            codigo: '109183-2',
            grau: 3,
            tipo: 'S',
            descricao:
              'Descrever as atividades e identificar os agentes e as formas de exposição, os possíveis danos à saúde, os fatores determinantes, as medidas de prevenção já existentes e os grupos de trabalhadores expostos.',
          },
          {
            item_ref: '9.4.1',
            codigo: '109184-0',
            grau: 3,
            tipo: 'S',
            descricao:
              'Realizar a análise preliminar das atividades de trabalho e dos dados já disponíveis, para determinar a necessidade de medidas diretas de controle ou de avaliação qualitativa/quantitativa.',
          },
          {
            item_ref: '9.4.2, alíneas "a", "b" e "c", e 9.4.2.1',
            codigo: '109185-9',
            grau: 3,
            tipo: 'S',
            descricao:
              'Realizar avaliação quantitativa da exposição para comprovar o controle da exposição, dimensionar a exposição dos grupos de trabalhadores e subsidiar o equacionamento das medidas de prevenção, considerando os aspectos organizacionais e as condições ambientais que envolvam o trabalhador.',
          },
          {
            item_ref: '9.4.3',
            codigo: '109186-7',
            grau: 2,
            tipo: 'S',
            descricao:
              'Incorporar os resultados das avaliações ao inventário de riscos do Programa de Gerenciamento de Riscos (PGR).',
          },
          {
            item_ref: '9.5.2',
            codigo: '109187-5',
            grau: 3,
            tipo: 'S',
            descricao:
              'Adotar as medidas necessárias para eliminação ou controle das exposições, conforme os critérios dos Anexos da NR-09, em conformidade com o PGR.',
          },
          {
            item_ref: '9.5.3',
            codigo: '109188-3',
            grau: 2,
            tipo: 'S',
            descricao:
              'Integrar as medidas de prevenção e controle aos controles do PGR e incorporá-las ao plano de ação.',
          },
          {
            item_ref: '9.6.1, alíneas "a", "b" e "c", e 9.6.1.1',
            codigo: '109189-1',
            grau: 3,
            tipo: 'S',
            descricao:
              'Nas disposições transitórias, utilizar os critérios da NR-15 e, na ausência de limites nela previstos, adotar como nível de ação metade dos limites de tolerância para agentes químicos e metade da dose para ruído, complementando com os limites da ACGIH quando necessário.',
          },
        ],
      },
      {
        nome: 'NR-09 — Anexo I (Vibração)',
        descricao:
          'Checklist do Anexo I da NR-09 (avaliação e controle da exposição ocupacional a vibrações — mãos/braços ' +
          'e corpo inteiro). Item/grau/tipo do Anexo II da NR-28. Multa pelo Anexo I da NR-28.',
        itens: [
          {
            item_ref: '3.1 e 3.1.1',
            codigo: '109190-5',
            grau: 3,
            tipo: 'S',
            descricao:
              'Adotar medidas para eliminar ou reduzir a exposição ocupacional a vibrações, considerando os esforços físicos e posturais envolvidos.',
          },
          {
            item_ref: '3.2',
            codigo: '109191-3',
            grau: 3,
            tipo: 'S',
            descricao:
              'Comprovar, por meio de manutenção preventiva e corretiva, a adoção de medidas de controle e redução de vibrações.',
          },
          {
            item_ref: '3.3',
            codigo: '109192-1',
            grau: 2,
            tipo: 'S',
            descricao:
              'Exigir que ferramentas/máquinas com vibração acima de 2,5 m/s² informem as especificações técnicas da vibração emitida.',
          },
          {
            item_ref: '4.1',
            codigo: '109193-0',
            grau: 3,
            tipo: 'S',
            descricao:
              'Realizar avaliação preliminar da exposição a vibrações considerando o ambiente, as máquinas, as informações dos fabricantes, o estado de conservação, o tempo de exposição e os aspectos posturais.',
          },
          {
            item_ref: '4.2 e 4.3',
            codigo: '109194-8',
            grau: 3,
            tipo: 'S',
            descricao:
              'Usar os resultados da avaliação preliminar para subsidiar medidas preventivas e corretivas, e realizar avaliação quantitativa quando a avaliação preliminar for insuficiente.',
          },
          {
            item_ref: '5.1.1',
            codigo: '109195-6',
            grau: 2,
            tipo: 'S',
            descricao:
              'Adotar os procedimentos de avaliação de vibração conforme as Normas de Higiene Ocupacional (NHO) da Fundacentro.',
          },
          {
            item_ref: '5.2.1',
            codigo: '109196-4',
            grau: 2,
            tipo: 'S',
            descricao:
              'Na avaliação de vibração de mãos e braços (VMB), obter a aceleração resultante de exposição normalizada (aren).',
          },
          {
            item_ref: '5.2.4 e 5.2.5',
            codigo: '109197-2',
            grau: 3,
            tipo: 'S',
            descricao:
              'Adotar medidas preventivas quando a exposição a VMB exceder o nível de ação, e medidas corretivas quando exceder o limite de exposição.',
          },
          {
            item_ref: '5.3.1',
            codigo: '109198-0',
            grau: 2,
            tipo: 'S',
            descricao:
              'Na avaliação de vibração de corpo inteiro (VCI), determinar a aceleração resultante de exposição normalizada (aren) e a dose de vibração resultante (VDVR).',
          },
          {
            item_ref: '5.3.4 e 5.3.5',
            codigo: '109199-9',
            grau: 3,
            tipo: 'S',
            descricao:
              'Adotar medidas preventivas quando a exposição a VCI exceder o nível de ação, e medidas corretivas quando exceder o limite de exposição.',
          },
          {
            item_ref: '6.1, alíneas "a", "b", "c" e "d"',
            codigo: '109200-6',
            grau: 3,
            tipo: 'S',
            descricao:
              'Como medida preventiva contra vibração, realizar avaliações periódicas, orientar os trabalhadores sobre os riscos e o uso adequado dos equipamentos, realizar a vigilância da saúde e adotar procedimentos alternativos de trabalho.',
          },
          {
            item_ref: '6.2, alíneas "a", "b", "c" e "d"',
            codigo: '109201-4',
            grau: 3,
            tipo: 'S',
            descricao:
              'Como medida corretiva contra vibração, modificar processos/operações, reduzir o tempo/intensidade de exposição e alternar atividades com diferentes níveis de exposição.',
          },
        ],
      },
      {
        nome: 'NR-09 — Anexo III (Calor)',
        descricao:
          'Checklist do Anexo III da NR-09 (avaliação e controle da exposição ocupacional ao calor — IBUTG). ' +
          'Item/grau/tipo do Anexo II da NR-28. Multa pelo Anexo I da NR-28.',
        itens: [
          {
            item_ref: '3.1',
            codigo: '109202-2',
            grau: 3,
            tipo: 'S',
            descricao:
              'Adotar medidas para que a exposição ocupacional ao calor não cause danos à saúde do trabalhador.',
          },
          {
            item_ref: '3.1.1, alíneas "a" a "f", e 3.1.2',
            codigo: '109203-0',
            grau: 2,
            tipo: 'S',
            descricao:
              'Orientar os trabalhadores sobre os fatores de risco do calor, os distúrbios térmicos e seus sinais/sintomas, a necessidade de informar os superiores, as medidas preventivas, as características do ambiente e as condutas em emergência, e realizar treinamento periódico anual quando indicado.',
          },
          {
            item_ref: '3.2, alíneas "a" a "l"',
            codigo: '109204-9',
            grau: 3,
            tipo: 'S',
            descricao:
              'Realizar a avaliação preliminar da exposição ao calor considerando a identificação do perigo, as fontes geradoras, as trajetórias de propagação, os trabalhadores expostos, as atividades, os dados de saúde, as medidas existentes, os fatores ambientais, o tempo de exposição, a taxa metabólica e os registros de exposição.',
          },
          {
            item_ref: '3.2.1 e 3.2.1.1, alíneas "a", "b" e "c"',
            codigo: '109205-7',
            grau: 3,
            tipo: 'S',
            descricao:
              'Usar a avaliação preliminar para subsidiar medidas preventivas e, quando insuficiente, realizar avaliação quantitativa para comprovar o controle ou a inexistência de risco, dimensionar a exposição e subsidiar as medidas de prevenção.',
          },
          {
            item_ref: '3.3, alíneas "a", "b", "c" e "d"',
            codigo: '109206-5',
            grau: 2,
            tipo: 'S',
            descricao:
              'Realizar a avaliação quantitativa do calor pela metodologia da NHO-06 da Fundacentro, determinando a sobrecarga térmica pelo IBUTG, com os equipamentos, procedimentos e cálculos previstos.',
          },
          {
            item_ref: '4.1.1, alíneas "a" e "b", e 4.1.2',
            codigo: '109207-3',
            grau: 3,
            tipo: 'S',
            descricao:
              'Quando excedido o nível de ação, disponibilizar água fresca e potável, programar os trabalhos mais pesados para períodos termicamente mais amenos e, em ambientes fechados ou com fontes artificiais de calor, fornecer vestimentas adaptadas.',
          },
          {
            item_ref: '4.2.2, alíneas "a", "b" e "c", e 4.2.2.1',
            codigo: '109208-1',
            grau: 3,
            tipo: 'S',
            descricao:
              'Quando ultrapassado o limite de exposição, adequar processos e operações, alternar atividades com diferentes níveis de calor, disponibilizar locais termicamente amenos para recuperação e, em ambientes fechados, adaptar postos de trabalho, reduzir a temperatura, usar barreiras radiantes e adequar a ventilação/umidade.',
          },
          {
            item_ref: '4.2.3',
            codigo: '109209-0',
            grau: 3,
            tipo: 'M',
            descricao:
              'Prever no PCMSO exames complementares e monitoramento da saúde quando ultrapassados os limites de exposição ao calor.',
          },
          {
            item_ref: '5.1 e 5.2',
            codigo: '109210-3',
            grau: 3,
            tipo: 'S',
            descricao:
              'Considerar a aclimatização dos trabalhadores no PCMSO quando a exposição ao calor exceder o nível de ação, seguindo os parâmetros da NHO-06 ou referência técnica equivalente.',
          },
          {
            item_ref: '6.1, alíneas "a" e "b"',
            codigo: '109211-1',
            grau: 3,
            tipo: 'S',
            descricao:
              'Prever no procedimento de emergência para calor os meios e recursos para o primeiro atendimento e a informação aos envolvidos nos cenários de risco.',
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
        tipoRec.set('nr_referencia', 'NR-09')
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
          rec.set('observacao', '')
          app.save(rec)
        })
      }
    }
  },
  (app) => {
    const nomes = [
      'NR-09 — Corpo da Norma (Avaliação e Controle das Exposições Ocupacionais)',
      'NR-09 — Anexo I (Vibração)',
      'NR-09 — Anexo III (Calor)',
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
