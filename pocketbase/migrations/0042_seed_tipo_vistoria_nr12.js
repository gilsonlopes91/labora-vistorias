migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-12' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set(
        'nome',
        'NR-12 — Segurança no Trabalho em Máquinas e Equipamentos (corpo da norma)',
      )
      tipoRec.set('nr_referencia', 'NR-12')
      tipoRec.set(
        'descricao',
        'Checklist do CORPO da NR-12 (12.3 a 12.154 — regras gerais, válidas p/ qualquer máquina). ' +
          'Anexos V-XII (por tipo de máquina) ficam p/ cadastro futuro. Item/grau/tipo do Anexo II da ' +
          'NR-28; subitens/alíneas de mesmo grau/tipo foram agrupados numa linha (multa é por grau/tipo, ' +
          'não pelo código). Multa pelo Anexo I da NR-28. Descrições redigidas a partir de conhecimento ' +
          'geral da norma, sem confirmação linha a linha — revisão obrigatória antes de laudo real.',
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
      'Descrição escrita a partir de conhecimento geral da estrutura da NR-12, sem confirmação linha a linha do texto vigente — revisão obrigatória com a fonte oficial antes de usar em laudo real. Item agrupa subitens/alíneas de mesmo grau/tipo do Anexo II da NR-28.'

    if (!jaTemItens) {
      const itens = [
        {
          item_ref: '12.3',
          codigo: '212001-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Aplicar as disposições da NR-12 a toda máquina ou equipamento novo ou usado, exceto os já excluídos expressamente do campo de aplicação.',
          secao: '12.1 — Disposições gerais',
        },
        {
          item_ref: '12.4',
          codigo: '212002-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Cumprir as exigências gerais de segurança aplicáveis à fabricação, importação, venda, locação, exposição e cessão de máquinas e equipamentos a qualquer título.',
          secao: '12.1 — Disposições gerais',
        },
        {
          item_ref: '12.5',
          codigo: '212003-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir os requisitos de segurança exigidos para máquinas e equipamentos fabricados a partir da vigência da norma.',
          secao: '12.1 — Disposições gerais',
        },
        {
          item_ref: '12.6, 12.6.1 e 12.6.2',
          codigo: '212004-6',
          grau: 1,
          tipo: 'S',
          descricao:
            'Manter o inventário/relação das máquinas e equipamentos existentes no estabelecimento, com suas características e riscos.',
          secao: '12.1 — Disposições gerais',
        },
        {
          item_ref: '12.7',
          codigo: '212007-0',
          grau: 1,
          tipo: 'S',
          descricao:
            'Elaborar e manter atualizado o Manual de Instruções da máquina, em língua portuguesa.',
          secao: '12.1 — Disposições gerais',
        },
        {
          item_ref: '12.8, 12.8.1 e 12.8.2',
          codigo: '212008-9',
          grau: 2,
          tipo: 'S',
          descricao:
            'Manter as informações do Manual de Instruções acessíveis aos operadores e demais trabalhadores envolvidos.',
          secao: '12.1 — Disposições gerais',
        },
        {
          item_ref: '12.9, alíneas a a c',
          codigo: '212011-9',
          grau: 2,
          tipo: 'S',
          descricao:
            'Incluir no Manual de Instruções as informações mínimas exigidas (dados técnicos, riscos residuais, instruções de uso seguro).',
          secao: '12.1 — Disposições gerais',
        },
        {
          item_ref: '12.10',
          codigo: '212014-3',
          grau: 1,
          tipo: 'S',
          descricao:
            'Disponibilizar treinamento adequado ao uso do Manual de Instruções aos trabalhadores responsáveis pela operação e manutenção.',
          secao: '12.1 — Disposições gerais',
        },
        {
          item_ref: '12.11 e 12.11.1',
          codigo: '212015-1',
          grau: 2,
          tipo: 'S',
          descricao:
            'Adequar as máquinas às condições de segurança estabelecidas na NR-12, inclusive as fabricadas antes de sua vigência.',
          secao: '12.1 — Disposições gerais',
        },
        {
          item_ref: '12.12',
          codigo: '212017-8',
          grau: 2,
          tipo: 'S',
          descricao:
            'Elaborar a análise de risco da máquina, considerando as fases de sua vida útil, quando exigido.',
          secao: '12.1 — Disposições gerais',
        },
        {
          item_ref: '12.13',
          codigo: '212018-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Adotar a hierarquia de medidas de proteção (eliminação, proteção coletiva, administrativa e EPI) para os riscos identificados na máquina.',
          secao: '12.1 — Disposições gerais',
        },
        {
          item_ref: '12.14',
          codigo: '212019-4',
          grau: 3,
          tipo: 'S',
          descricao: 'Implementar as medidas de proteção definidas na análise de risco da máquina.',
          secao: '12.1 — Disposições gerais',
        },
        {
          item_ref: '12.15',
          codigo: '212020-8',
          grau: 2,
          tipo: 'S',
          descricao:
            'Manter documentação técnica que comprove a conformidade da máquina com a NR-12.',
          secao: '12.1 — Disposições gerais',
        },
        {
          item_ref: '12.16',
          codigo: '212021-6',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir as demais disposições gerais de segurança aplicáveis às máquinas previstas no item 12.16.',
          secao: '12.1 — Disposições gerais',
        },

        {
          item_ref: '12.17, alíneas a a f',
          codigo: '212022-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Garantir arranjo físico e instalação da máquina compatíveis com os riscos, incluindo espaço, circulação e distâncias de segurança.',
          secao: '12.2 — Arranjo físico e instalações',
        },
        {
          item_ref: '12.18, alíneas a a e',
          codigo: '212028-3',
          grau: 2,
          tipo: 'S',
          descricao:
            'Manter vias de circulação e passagens sinalizadas, desobstruídas e com dimensões compatíveis com a movimentação de pessoas e materiais.',
          secao: '12.2 — Arranjo físico e instalações',
        },
        {
          item_ref: '12.19',
          codigo: '212033-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Garantir piso nivelado, resistente e não escorregadio nas áreas de trabalho e circulação em torno das máquinas.',
          secao: '12.2 — Arranjo físico e instalações',
        },
        {
          item_ref: '12.20 e 12.20.1',
          codigo: '212034-8',
          grau: 2,
          tipo: 'S',
          descricao:
            'Assegurar espaço suficiente ao redor da máquina para movimentação segura do operador e para operações de manutenção.',
          secao: '12.2 — Arranjo físico e instalações',
        },
        {
          item_ref: '12.20.2',
          codigo: '212036-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir a exigência complementar de espaço/circulação prevista no item 12.20.2.',
          secao: '12.2 — Arranjo físico e instalações',
        },
        {
          item_ref: '12.21, alíneas a a c',
          codigo: '212037-2',
          grau: 4,
          tipo: 'S',
          descricao:
            'Instalar e manter as proteções fixas e móveis exigidas nas partes móveis de transmissão de força da máquina.',
          secao: '12.3 — Instalações e dispositivos elétricos',
        },
        {
          item_ref: '12.22, alíneas a a c',
          codigo: '212040-2',
          grau: 1,
          tipo: 'S',
          descricao:
            'Manter os componentes elétricos da máquina em conformidade com as normas técnicas oficiais aplicáveis.',
          secao: '12.3 — Instalações e dispositivos elétricos',
        },
        {
          item_ref: '12.23',
          codigo: '212043-7',
          grau: 1,
          tipo: 'S',
          descricao:
            'Manter o painel/quadro elétrico da máquina sinalizado e com acesso restrito a pessoas autorizadas.',
          secao: '12.3 — Instalações e dispositivos elétricos',
        },
        {
          item_ref: '12.24, alíneas a a e',
          codigo: '212044-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Adotar dispositivos de proteção contra partida acidental e contra riscos elétricos na máquina.',
          secao: '12.3 — Instalações e dispositivos elétricos',
        },
        {
          item_ref: '12.25',
          codigo: '212049-6',
          grau: 2,
          tipo: 'S',
          descricao: 'Manter aterramento elétrico da máquina em condições adequadas de segurança.',
          secao: '12.3 — Instalações e dispositivos elétricos',
        },
        {
          item_ref: '12.26, alíneas a a g',
          codigo: '212050-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Cumprir os requisitos de segurança para sistemas pneumáticos, hidráulicos e outras fontes de energia da máquina.',
          secao: '12.3 — Instalações e dispositivos elétricos',
        },
        {
          item_ref: '12.28, alíneas a a c',
          codigo: '212057-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Sinalizar adequadamente os riscos da máquina, incluindo advertências visuais e sonoras quando exigido.',
          secao: '12.4 — Sinalização',
        },
        {
          item_ref: '12.29, alíneas a e b',
          codigo: '212060-7',
          grau: 2,
          tipo: 'S',
          descricao:
            'Manter a sinalização de segurança da máquina legível e em conformidade com as normas técnicas de cores e símbolos.',
          secao: '12.4 — Sinalização',
        },

        {
          item_ref: '12.30, 12.30.1 e 12.30.2',
          codigo: '212062-3',
          grau: 4,
          tipo: 'S',
          descricao:
            'Dotar a máquina de dispositivo de parada de emergência de fácil acesso e acionamento.',
          secao: '12.5 — Dispositivos de partida, acionamento e parada',
        },
        {
          item_ref: '12.30.3',
          codigo: '212065-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir a exigência complementar sobre dispositivo de parada de emergência prevista no item 12.30.3.',
          secao: '12.5 — Dispositivos de partida, acionamento e parada',
        },
        {
          item_ref: '12.31, alíneas a a d',
          codigo: '212066-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Posicionar os dispositivos de acionamento e parada de forma segura e de fácil visualização/acesso pelo operador.',
          secao: '12.5 — Dispositivos de partida, acionamento e parada',
        },
        {
          item_ref: '12.32',
          codigo: '212070-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Assegurar que o acionamento da máquina exija ação deliberada do operador, evitando partidas acidentais.',
          secao: '12.5 — Dispositivos de partida, acionamento e parada',
        },
        {
          item_ref: '12.33',
          codigo: '212071-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Garantir que o comando de parada tenha prioridade sobre o comando de partida da máquina.',
          secao: '12.5 — Dispositivos de partida, acionamento e parada',
        },
        {
          item_ref: '12.34',
          codigo: '212072-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Manter os dispositivos de acionamento e parada identificados e sinalizados quanto à sua função.',
          secao: '12.5 — Dispositivos de partida, acionamento e parada',
        },
        {
          item_ref: '12.35',
          codigo: '212073-9',
          grau: 2,
          tipo: 'S',
          descricao:
            'Impedir o rearme automático da máquina após interrupção de energia ou parada de emergência sem ação deliberada do operador.',
          secao: '12.5 — Dispositivos de partida, acionamento e parada',
        },
        {
          item_ref: '12.36, alíneas a e b',
          codigo: '212074-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir os requisitos de segurança para sistemas de comando bimanual, quando aplicável.',
          secao: '12.5 — Dispositivos de partida, acionamento e parada',
        },
        {
          item_ref: '12.37',
          codigo: '212076-3',
          grau: 2,
          tipo: 'S',
          descricao:
            'Garantir tempo de parada da máquina compatível com a distância de segurança dos dispositivos de proteção.',
          secao: '12.5 — Dispositivos de partida, acionamento e parada',
        },
        {
          item_ref: '12.38 e 12.38.1',
          codigo: '212077-1',
          grau: 4,
          tipo: 'S',
          descricao:
            'Assegurar que a máquina permaneça parada e travada durante intervenções de manutenção, ajuste ou limpeza.',
          secao: '12.5 — Dispositivos de partida, acionamento e parada',
        },
        {
          item_ref: '12.39, alíneas a a f',
          codigo: '212079-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Adotar procedimento de bloqueio e etiquetagem (LOTO) para intervenções em partes perigosas da máquina.',
          secao: '12.5 — Dispositivos de partida, acionamento e parada',
        },
        {
          item_ref: '12.40',
          codigo: '212085-2',
          grau: 4,
          tipo: 'S',
          descricao:
            'Garantir que o dispositivo de parada de emergência não seja utilizado como meio normal de parada da máquina.',
          secao: '12.5 — Dispositivos de partida, acionamento e parada',
        },

        {
          item_ref: '12.43',
          codigo: '212086-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Instalar sistema de segurança (proteção fixa, móvel ou intertravada) adequado ao risco identificado na máquina.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.44 e alíneas a e b',
          codigo: '212087-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Selecionar o sistema de segurança conforme a categoria e o nível de desempenho exigidos pela análise de risco.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.45, alíneas a a c',
          codigo: '212090-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir os requisitos técnicos de projeto exigidos para o sistema de segurança adotado.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.46, alíneas a a c',
          codigo: '212093-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Assegurar a manutenção e a aferição periódica do sistema de segurança da máquina.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.47, 12.47.1 e 12.47.2',
          codigo: '212096-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Garantir que as proteções móveis intertravadas impeçam o acesso à zona de perigo enquanto a máquina estiver em movimento.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.48',
          codigo: '212099-2',
          grau: 4,
          tipo: 'S',
          descricao: 'Impedir a anulação ou burla dos dispositivos de segurança da máquina.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.49, alíneas a a l',
          codigo: '212100-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir o conjunto de requisitos técnicos exigidos para proteções e dispositivos de segurança previstos nas alíneas do item 12.49.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.50',
          codigo: '212112-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Assegurar distância de segurança adequada entre a proteção e a zona de perigo, conforme normas técnicas.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.51',
          codigo: '212113-1',
          grau: 4,
          tipo: 'S',
          descricao:
            'Instalar dispositivo de detecção de presença (cortina de luz, tapete de segurança etc.) quando exigido pela análise de risco.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.52',
          codigo: '212114-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Garantir que o dispositivo de detecção de presença esteja corretamente posicionado e calibrado.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.53',
          codigo: '212115-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Testar periodicamente o funcionamento dos dispositivos de detecção de presença e demais sistemas de segurança.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.54',
          codigo: '212116-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Assegurar que a falha de um componente do sistema de segurança não resulte em perda da função de segurança da máquina.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.55',
          codigo: '212117-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Manter registro das inspeções e testes realizados nos sistemas de segurança da máquina.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.55.1',
          codigo: '212118-2',
          grau: 1,
          tipo: 'S',
          descricao: 'Cumprir a exigência complementar de registro prevista no item 12.55.1.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.56 e 12.56.1',
          codigo: '212119-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Instalar proteção adequada nas zonas de esmagamento, cisalhamento e arraste da máquina.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.57',
          codigo: '212121-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir os requisitos de segurança para dispositivos de alimentação e retirada de peças da máquina.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.58, alíneas a a g',
          codigo: '212122-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir o conjunto de exigências técnicas para proteções e dispositivos de segurança previstos nas alíneas do item 12.58.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.59, alíneas a a c',
          codigo: '212129-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir as exigências complementares de segurança previstas nas alíneas do item 12.59.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.60 e 12.60.1',
          codigo: '212132-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Garantir que dispositivos de segurança removíveis só possam ser retirados com uso de ferramenta.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.61, alíneas a a c',
          codigo: '212134-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir as exigências técnicas complementares de proteção previstas nas alíneas do item 12.61.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.62 e 12.62.1',
          codigo: '212137-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Assegurar visibilidade adequada da zona de operação da máquina pelo operador, sem comprometer a proteção.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.63 e 12.63.1',
          codigo: '212139-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir as exigências complementares de segurança previstas nos itens 12.63 e 12.63.1.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.64 e 12.64.3',
          codigo: '212141-7',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir as exigências complementares de segurança previstas nos itens 12.64 e 12.64.3.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.65',
          codigo: '212143-3',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.65.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.66',
          codigo: '212144-1',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.66.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.67',
          codigo: '212145-0',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.67.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.68, alíneas a a d',
          codigo: '212146-8',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir o conjunto de exigências técnicas complementares de segurança previstas no item 12.68 e suas alíneas.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.69 e 12.69.1',
          codigo: '212151-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir as exigências complementares de segurança previstas nos itens 12.69 e 12.69.1.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.70 e alíneas a a e',
          codigo: '212153-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir o conjunto de exigências técnicas de segurança previstas no item 12.70 e suas alíneas.',
          secao: '12.6 — Sistemas de segurança',
        },
        {
          item_ref: '12.71 e 12.71.1',
          codigo: '212159-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir as exigências complementares de segurança previstas nos itens 12.71 e 12.71.1.',
          secao: '12.6 — Sistemas de segurança',
        },

        {
          item_ref: '12.73, alíneas a a c',
          codigo: '212161-1',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir os requisitos de segurança para transporte e movimentação de materiais junto à máquina.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.74, alíneas a a g',
          codigo: '212164-6',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir os requisitos de segurança complementares para dispositivos de transporte e movimentação associados à máquina.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.75, alíneas a a e',
          codigo: '212171-9',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir os requisitos de segurança para componentes de transmissão de força (correias, engrenagens, eixos).',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.76 e 12.76.1, todas as alíneas',
          codigo: '212176-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir o conjunto extenso de exigências técnicas de segurança previstas no item 12.76 e seu subitem 12.76.1.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.77',
          codigo: '212190-5',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.77.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.78',
          codigo: '212191-3',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.78.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.79',
          codigo: '212192-1',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.79.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.80, alíneas a e b',
          codigo: '212193-0',
          grau: 3,
          tipo: 'S',
          descricao: 'Cumprir as exigências de segurança previstas nas alíneas do item 12.80.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.81',
          codigo: '212195-6',
          grau: 3,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.81.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.82',
          codigo: '212196-4',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.82.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.83, alíneas a e b',
          codigo: '212197-2',
          grau: 3,
          tipo: 'S',
          descricao: 'Cumprir as exigências de segurança previstas nas alíneas do item 12.83.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.84 e 12.84.1',
          codigo: '212199-9',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir as exigências de segurança previstas nos itens 12.84 e 12.84.1.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.85, 12.85.1 e 12.85.2',
          codigo: '212201-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Cumprir as exigências de segurança previstas nos itens 12.85, 12.85.1 e 12.85.2.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.86 e 12.86.1',
          codigo: '212204-9',
          grau: 3,
          tipo: 'S',
          descricao: 'Cumprir as exigências de segurança previstas nos itens 12.86 e 12.86.1.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.87',
          codigo: '212206-5',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.87.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.88',
          codigo: '212207-3',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.88.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.89',
          codigo: '212208-1',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.89.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.90 e 12.90.1',
          codigo: '212209-0',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir as exigências de segurança previstas nos itens 12.90 e 12.90.1.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.90.2 e 12.90.3',
          codigo: '212211-1',
          grau: 3,
          tipo: 'S',
          descricao: 'Cumprir as exigências de segurança previstas nos itens 12.90.2 e 12.90.3.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.91',
          codigo: '212213-8',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.91.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.92 e alíneas a e b',
          codigo: '212214-6',
          grau: 3,
          tipo: 'S',
          descricao: 'Cumprir as exigências de segurança previstas no item 12.92 e suas alíneas.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.93',
          codigo: '212217-0',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.93.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.93.1',
          codigo: '212218-9',
          grau: 3,
          tipo: 'S',
          descricao: 'Cumprir a exigência complementar de segurança prevista no item 12.93.1.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.94, alíneas a a h',
          codigo: '212219-7',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir o conjunto de exigências técnicas de segurança previstas nas alíneas do item 12.94.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.95, alíneas a a e',
          codigo: '212227-8',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir o conjunto de exigências técnicas de segurança previstas nas alíneas do item 12.95.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.96',
          codigo: '212232-4',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.96.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.97',
          codigo: '212233-2',
          grau: 1,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.97.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.98',
          codigo: '212234-0',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.98.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.99',
          codigo: '212235-9',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.99.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.100 e 12.100.1',
          codigo: '212236-7',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir as exigências de segurança previstas nos itens 12.100 e 12.100.1.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.101, alíneas a a c',
          codigo: '212238-3',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir as exigências de segurança previstas nas alíneas do item 12.101.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.102',
          codigo: '212241-3',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.102.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.103 e 12.103.1',
          codigo: '212242-1',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir as exigências de segurança previstas nos itens 12.103 e 12.103.1.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.104',
          codigo: '212244-8',
          grau: 3,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.104.',
          secao: '12.7 — Transporte e movimentação',
        },
        {
          item_ref: '12.105',
          codigo: '212245-6',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.105.',
          secao: '12.7 — Transporte e movimentação',
        },

        {
          item_ref: '12.107',
          codigo: '212246-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Capacitar os operadores de máquinas conforme exigido pela NR-12, com carga horária, conteúdo e certificado.',
          secao: '12.8 — Capacitação',
        },
        {
          item_ref: '12.108',
          codigo: '212247-2',
          grau: 4,
          tipo: 'S',
          descricao:
            'Assegurar que somente trabalhadores capacitados e autorizados operem as máquinas.',
          secao: '12.8 — Capacitação',
        },
        {
          item_ref: '12.109',
          codigo: '212248-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Manter registro da capacitação dos operadores, com validade e reciclagem periódica.',
          secao: '12.8 — Capacitação',
        },
        {
          item_ref: '12.110',
          codigo: '212249-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Fornecer capacitação específica para trabalhadores que realizam manutenção, ajuste ou reparo em máquinas.',
          secao: '12.8 — Capacitação',
        },
        {
          item_ref: '12.111',
          codigo: '212250-2',
          grau: 4,
          tipo: 'S',
          descricao:
            'Elaborar e disponibilizar procedimentos de trabalho e segurança para operação, manutenção e limpeza da máquina.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.111.1',
          codigo: '212251-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir a exigência complementar sobre procedimentos de trabalho prevista no item 12.111.1.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.112, alíneas a a h',
          codigo: '212252-9',
          grau: 2,
          tipo: 'S',
          descricao:
            'Incluir no procedimento de trabalho e segurança o conteúdo mínimo exigido nas alíneas do item 12.112.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.112.1',
          codigo: '212261-8',
          grau: 1,
          tipo: 'S',
          descricao:
            'Cumprir a exigência complementar sobre o conteúdo do procedimento de trabalho prevista no item 12.112.1.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.113, alíneas a a e, e 12.113.1, alíneas a a f',
          codigo: '212262-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Cumprir o conjunto extenso de exigências técnicas do procedimento de trabalho e segurança previstas nos itens 12.113 e 12.113.1.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.114 e 12.114.1',
          codigo: '212274-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir as exigências complementares de procedimento de trabalho previstas nos itens 12.114 e 12.114.1.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.115',
          codigo: '212276-6',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.115.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.116 e 12.116.3',
          codigo: '212277-4',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir as exigências complementares previstas nos itens 12.116 e 12.116.3.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.117, alíneas a a c',
          codigo: '212279-0',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir as exigências previstas nas alíneas do item 12.117.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.118',
          codigo: '212282-0',
          grau: 1,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.118.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.119, alíneas a e b, e 12.119.1',
          codigo: '212283-9',
          grau: 1,
          tipo: 'S',
          descricao:
            'Cumprir as exigências previstas no item 12.119, suas alíneas e o subitem 12.119.1.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.120',
          codigo: '212286-3',
          grau: 1,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.120.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.121, alíneas a a d',
          codigo: '212287-1',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir as exigências previstas nas alíneas do item 12.121.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.122, alíneas a e b',
          codigo: '212291-0',
          grau: 1,
          tipo: 'S',
          descricao: 'Cumprir as exigências previstas nas alíneas do item 12.122.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.123, alíneas a a e',
          codigo: '212293-6',
          grau: 1,
          tipo: 'S',
          descricao: 'Cumprir as exigências previstas nas alíneas do item 12.123.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.124 e 12.124.1',
          codigo: '212298-7',
          grau: 1,
          tipo: 'S',
          descricao: 'Cumprir as exigências previstas nos itens 12.124 e 12.124.1.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.125',
          codigo: '212300-2',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.125.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.126',
          codigo: '212301-0',
          grau: 1,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.126.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.127, alíneas a a d',
          codigo: '212302-9',
          grau: 1,
          tipo: 'S',
          descricao: 'Cumprir as exigências previstas nas alíneas do item 12.127.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.128, alíneas a a e e g',
          codigo: '212306-1',
          grau: 1,
          tipo: 'S',
          descricao: 'Cumprir as exigências previstas nas alíneas "a" a "e" e "g" do item 12.128.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.128, alíneas f e h a p',
          codigo: '212311-8',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir as exigências previstas nas alíneas "f" e "h" a "p" do item 12.128.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },
        {
          item_ref: '12.129',
          codigo: '212322-3',
          grau: 1,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.129.',
          secao: '12.9 — Procedimentos de trabalho e segurança',
        },

        {
          item_ref: '12.130 e 12.130.1',
          codigo: '212323-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Manter e conservar adequadamente os componentes e dispositivos de segurança da máquina (manutenção preventiva).',
          secao: '12.10 — Manutenção, inspeção, preparação, ajustes e reparos',
        },
        {
          item_ref: '12.131',
          codigo: '212325-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Realizar manutenção corretiva da máquina por trabalhador qualificado/capacitado.',
          secao: '12.10 — Manutenção, inspeção, preparação, ajustes e reparos',
        },
        {
          item_ref: '12.132',
          codigo: '212326-6',
          grau: 3,
          tipo: 'S',
          descricao: 'Realizar inspeções periódicas de segurança da máquina, com registro.',
          secao: '12.10 — Manutenção, inspeção, preparação, ajustes e reparos',
        },
        {
          item_ref: '12.132.1, alíneas a a d',
          codigo: '212327-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Incluir no registro de inspeção o conteúdo mínimo exigido nas alíneas do item 12.132.1.',
          secao: '12.10 — Manutenção, inspeção, preparação, ajustes e reparos',
        },
        {
          item_ref: '12.133, 12.133.1, 12.133.2 e 12.133.3',
          codigo: '212332-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir os requisitos de segurança para operações de preparação, ajuste e reparo da máquina.',
          secao: '12.10 — Manutenção, inspeção, preparação, ajustes e reparos',
        },
        {
          item_ref: '12.134',
          codigo: '212336-3',
          grau: 4,
          tipo: 'S',
          descricao:
            'Assegurar a desenergização e o bloqueio da máquina antes de intervenções de manutenção com risco de acionamento acidental.',
          secao: '12.10 — Manutenção, inspeção, preparação, ajustes e reparos',
        },
        {
          item_ref: '12.135',
          codigo: '212337-1',
          grau: 3,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.135.',
          secao: '12.10 — Manutenção, inspeção, preparação, ajustes e reparos',
        },
        {
          item_ref: '12.136',
          codigo: '212338-0',
          grau: 3,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.136.',
          secao: '12.10 — Manutenção, inspeção, preparação, ajustes e reparos',
        },
        {
          item_ref: '12.137',
          codigo: '212339-8',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir a exigência de segurança prevista no item 12.137.',
          secao: '12.10 — Manutenção, inspeção, preparação, ajustes e reparos',
        },
        {
          item_ref: '12.138, alíneas a a e',
          codigo: '212340-1',
          grau: 3,
          tipo: 'S',
          descricao: 'Cumprir as exigências previstas nas alíneas do item 12.138.',
          secao: '12.10 — Manutenção, inspeção, preparação, ajustes e reparos',
        },
        {
          item_ref: '12.139',
          codigo: '212345-2',
          grau: 1,
          tipo: 'S',
          descricao:
            'Manter registro histórico das intervenções de manutenção, ajuste e reparo da máquina.',
          secao: '12.10 — Manutenção, inspeção, preparação, ajustes e reparos',
        },

        {
          item_ref: '12.144 e 12.144.1',
          codigo: '212346-0',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir as disposições complementares previstas nos itens 12.144 e 12.144.1.',
          secao: '12.11 — Disposições finais e transitórias',
        },
        {
          item_ref: '12.145',
          codigo: '212348-7',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência prevista no item 12.145.',
          secao: '12.11 — Disposições finais e transitórias',
        },
        {
          item_ref: '12.146',
          codigo: '212349-5',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência prevista no item 12.146.',
          secao: '12.11 — Disposições finais e transitórias',
        },
        {
          item_ref: '12.147, 12.147.1 (alíneas a a i) e 12.147.2 (alíneas a a d)',
          codigo: '212350-9',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir o conjunto extenso de disposições finais e transitórias previstas no item 12.147 e seus subitens.',
          secao: '12.11 — Disposições finais e transitórias',
        },
        {
          item_ref: '12.148',
          codigo: '212365-7',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência prevista no item 12.148.',
          secao: '12.11 — Disposições finais e transitórias',
        },
        {
          item_ref: '12.149',
          codigo: '212366-5',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência prevista no item 12.149.',
          secao: '12.11 — Disposições finais e transitórias',
        },
        {
          item_ref: '12.150',
          codigo: '212367-3',
          grau: 3,
          tipo: 'S',
          descricao: 'Cumprir a exigência prevista no item 12.150.',
          secao: '12.11 — Disposições finais e transitórias',
        },
        {
          item_ref: '12.151',
          codigo: '212368-1',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir a exigência prevista no item 12.151.',
          secao: '12.11 — Disposições finais e transitórias',
        },
        {
          item_ref: '12.151.1',
          codigo: '212369-0',
          grau: 1,
          tipo: 'S',
          descricao: 'Cumprir a exigência complementar prevista no item 12.151.1.',
          secao: '12.11 — Disposições finais e transitórias',
        },
        {
          item_ref: '12.151.2 e 12.151.3',
          codigo: '212370-3',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir as exigências complementares previstas nos itens 12.151.2 e 12.151.3.',
          secao: '12.11 — Disposições finais e transitórias',
        },
        {
          item_ref: '12.153 e 12.153.1',
          codigo: '212372-0',
          grau: 2,
          tipo: 'S',
          descricao: 'Cumprir as exigências finais previstas nos itens 12.153 e 12.153.1.',
          secao: '12.11 — Disposições finais e transitórias',
        },
        {
          item_ref: '12.154',
          codigo: '212374-6',
          grau: 1,
          tipo: 'S',
          descricao: 'Cumprir a disposição final prevista no item 12.154.',
          secao: '12.11 — Disposições finais e transitórias',
        },
      ]
      itens.forEach((it, idx) => {
        const rec = new Record(itensCol)
        rec.set('tipo_vistoria_id', tipoRec.id)
        rec.set('ordem', idx)
        rec.set('secao', it.secao || '')
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
        "nr_referencia = 'NR-12' && organizacao_id = ''",
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
