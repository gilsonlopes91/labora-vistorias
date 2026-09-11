migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    // NR-02 e NR-03 estão revogadas desde 2019 — não entram no catálogo.
    // tipo de vistoria oficial NR-04 (organizacao_id vazio = catálogo global)
    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-04' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set(
        'nome',
        'NR-04 — Serviços Especializados em Segurança e em Medicina do Trabalho (SESMT)',
      )
      tipoRec.set('nr_referencia', 'NR-04')
      tipoRec.set(
        'descricao',
        'Checklist oficial da NR-04, com itens e classificação (grau/tipo) extraídos do Anexo II ' +
          'da NR-28 (Quadro de Classificação das Infrações). Cálculo de multa pelo Anexo I da NR-28.',
      )
      tipoRec.set('ativo', true)
      app.save(tipoRec)
    }

    // itens do checklist — idempotente: só semeia se este tipo ainda não tiver nenhum item
    let jaTemItens = true
    try {
      app.findFirstRecordByFilter('itens_checklist', "tipo_vistoria_id = '" + tipoRec.id + "'")
    } catch (_) {
      jaTemItens = false
    }

    if (!jaTemItens) {
      const itens = [
        {
          ordem: 0,
          secao: '',
          item_ref: '4.2.1',
          codigo: '104044-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Constituir e manter o SESMT no local de trabalho, para organizações e órgãos públicos com empregados regidos pela CLT.',
          observacao: '',
        },
        {
          ordem: 1,
          secao: '',
          item_ref: '4.3.1, alíneas "a" a "k"',
          codigo: '104045-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir as atribuições do SESMT: elaborar/participar do inventário de riscos, acompanhar o plano de ação do PGR, implementar medidas de prevenção conforme a classificação de risco, elaborar plano de trabalho e monitorar metas e indicadores, responsabilizar-se tecnicamente pelo cumprimento das NR aplicáveis, manter interação com a CIPA, promover orientação e conscientização dos trabalhadores, propor a interrupção de atividades em risco grave e iminente, conduzir/acompanhar investigações de acidentes e doenças, compartilhar informações com outros SESMT e a CIPA, e acompanhar as ações do PCMSO (NR-07).',
          observacao: '',
        },
        {
          ordem: 2,
          secao: '',
          item_ref: '4.3.2',
          codigo: '104046-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Compor o SESMT com médico do trabalho, engenheiro de segurança do trabalho, técnico de segurança do trabalho, enfermeiro do trabalho e auxiliar/técnico de enfermagem do trabalho, conforme o Anexo II.',
          observacao: '',
        },
        {
          ordem: 3,
          secao: '',
          item_ref: '4.3.3',
          codigo: '104047-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Garantir que os profissionais do SESMT tenham formação e registro profissional de acordo com a regulamentação da profissão e do respectivo conselho.',
          observacao: '',
        },
        {
          ordem: 4,
          secao: '',
          item_ref: '4.3.4',
          codigo: '104048-0',
          grau: 3,
          tipo: 'S',
          descricao: 'Coordenar o SESMT por um dos profissionais integrantes do serviço.',
          observacao: '',
        },
        {
          ordem: 5,
          secao: '',
          item_ref: '4.3.5',
          codigo: '104049-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Garantir que o técnico de segurança do trabalho e o auxiliar/técnico de enfermagem do trabalho dediquem 44 horas semanais às atividades do SESMT, conforme o Anexo II.',
          observacao: '',
        },
        {
          ordem: 6,
          secao: '',
          item_ref: '4.3.6',
          codigo: '104050-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Na modalidade individual com mais de um técnico de segurança do trabalho, organizar as escalas para garantir atendimento por pelo menos um profissional em cada turno com 101 ou mais trabalhadores (grau de risco 3) ou 50 ou mais trabalhadores (grau de risco 4), sem aumentar o número de profissionais previsto no Anexo II.',
          observacao: '',
        },
        {
          ordem: 7,
          secao: '',
          item_ref: '4.3.7 e 4.3.7.1',
          codigo: '104051-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Garantir que engenheiro de segurança do trabalho, médico do trabalho e enfermeiro do trabalho dediquem 15h (tempo parcial) ou 30h (tempo integral) semanais ao SESMT, podendo contratar mais de um profissional desde que cada um cumpra ao menos metade da carga horária.',
          observacao: '',
        },
        {
          ordem: 8,
          secao: '',
          item_ref: '4.3.8',
          codigo: '104052-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Não permitir que os profissionais do SESMT exerçam, durante o horário de atuação no serviço, atividades fora das atribuições previstas na NR-04.',
          observacao: '',
        },
        {
          ordem: 9,
          secao: '',
          item_ref: '4.3.9',
          codigo: '104053-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Garantir os meios e recursos necessários para o cumprimento dos objetivos e atribuições do SESMT.',
          observacao: '',
        },
        {
          ordem: 10,
          secao: '',
          item_ref: '4.4.1.1',
          codigo: '104054-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Garantir que o SESMT atenda estabelecimentos da mesma unidade da federação, ressalvada a exceção do SESMT compartilhado (item 4.4.5).',
          observacao: '',
        },
        {
          ordem: 11,
          secao: '',
          item_ref: '4.4.2',
          codigo: '104055-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Constituir SESMT individual quando possuir estabelecimento enquadrado no Anexo II da NR-04.',
          observacao: '',
        },
        {
          ordem: 12,
          secao: '',
          item_ref: '4.4.3',
          codigo: '104056-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Constituir SESMT regionalizado quando possuir estabelecimento enquadrado no Anexo II e outro(s) que não se enquadre(m), estendendo a assistência e somando os trabalhadores atendidos no dimensionamento.',
          observacao: '',
        },
        {
          ordem: 13,
          secao: '',
          item_ref: '4.4.4',
          codigo: '104057-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Constituir SESMT estadual quando o somatório de trabalhadores de todos os estabelecimentos da mesma UF atingir os limites do Anexo II, sem que nenhum estabelecimento se enquadre isoladamente.',
          observacao: '',
        },
        {
          ordem: 14,
          secao: '',
          item_ref: '4.4.5, 4.4.5.1 e 4.4.5.2',
          codigo: '104058-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Observar as regras do SESMT compartilhado entre organizações de mesma atividade econômica em município(s) limítrofe(s), incluindo o dimensionamento pelo somatório de trabalhadores assistidos.',
          observacao: '',
        },
        {
          ordem: 15,
          secao: '',
          item_ref: '4.5.1 e 4.5.1.2.1',
          codigo: '104059-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Dimensionar o SESMT conforme o número de empregados e o maior grau de risco entre a atividade econômica principal e a preponderante, considerando a de maior grau de risco em caso de empate no número de trabalhadores.',
          observacao: '',
        },
        {
          ordem: 16,
          secao: '',
          item_ref: '4.5.2',
          codigo: '104060-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Ao contratar empresa prestadora de serviços a terceiros, dimensionar o SESMT da contratante somando seus empregados e os trabalhadores das contratadas que atuem de forma não eventual em suas dependências.',
          observacao: '',
        },
        {
          ordem: 17,
          secao: '',
          item_ref: '4.5.3 e 4.5.3.1',
          codigo: '104061-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'No SESMT regionalizado ou estadual com estabelecimentos de graus de risco diversos, somar os trabalhadores de todos os estabelecimentos atendidos, considerando metade do número de trabalhadores nos estabelecimentos ME/EPP de grau de risco 1 ou 2.',
          observacao: '',
        },
        {
          ordem: 18,
          secao: '',
          item_ref: '4.5.4, 4.5.4.1, alíneas "a" e "b", e 4.5.4.2',
          codigo: '104062-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Em canteiros de obras/frentes de trabalho com menos de mil trabalhadores na mesma UF, organizar o SESMT pela empresa de engenharia principal, podendo centralizar engenheiro/médico/enfermeiro, mas dimensionando técnicos e auxiliares por canteiro/frente e garantindo atendimento a todos eles.',
          observacao: '',
        },
        {
          ordem: 19,
          secao: '',
          item_ref: '4.5.6',
          codigo: '104063-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Complementar o SESMT durante o período de aumento de trabalhadores por prazo determinado, atendendo ao dimensionamento do Anexo II.',
          observacao: '',
        },
        {
          ordem: 20,
          secao: '',
          item_ref: '4.6.1 e 4.6.1.1, alíneas "a", "b", "c" e "d"',
          codigo: '104064-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Registrar o SESMT em sistema eletrônico do portal gov.br, mantendo atualizados o CPF, a qualificação e o registro dos profissionais, o grau de risco e o número de trabalhadores atendidos por estabelecimento, e o horário de trabalho dos profissionais.',
          observacao: '',
        },
        {
          ordem: 21,
          secao: '',
          item_ref: '4.7.1',
          codigo: '104065-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Organizações obrigadas a constituir SESMT e SESTR (NR-31) podem optar por constituir apenas um dos serviços, somando os trabalhadores de ambas as atividades.',
          observacao: '',
        },
        {
          ordem: 22,
          secao: '',
          item_ref: '4.7.2',
          codigo: '104066-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Assegurar a isenção técnica e o exercício profissional dos integrantes do SESMT constituído.',
          observacao: '',
        },
        {
          ordem: 23,
          secao: '',
          item_ref: '4.7.3',
          codigo: '104067-7',
          grau: 2,
          tipo: 'S',
          descricao: 'Indicar, entre os médicos do SESMT, um responsável pelo PCMSO.',
          observacao: '',
        },
      ]
      for (const it of itens) {
        const rec = new Record(itensCol)
        rec.set('tipo_vistoria_id', tipoRec.id)
        rec.set('ordem', it.ordem)
        rec.set('secao', it.secao)
        rec.set('item_ref', it.item_ref)
        rec.set('codigo', it.codigo)
        rec.set('grau', it.grau)
        rec.set('tipo', it.tipo)
        rec.set('descricao', it.descricao)
        rec.set('observacao', it.observacao)
        app.save(rec)
      }
    }
  },
  (app) => {
    try {
      const tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-04' && organizacao_id = ''",
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
