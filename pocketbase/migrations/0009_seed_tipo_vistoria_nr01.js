migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    // tipo de vistoria oficial NR-01 (organizacao_id vazio = catálogo global)
    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-01' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-01 — Disposições Gerais e Gerenciamento de Riscos Ocupacionais')
      tipoRec.set('nr_referencia', 'NR-01')
      tipoRec.set(
        'descricao',
        'Checklist oficial da NR-01, com itens e classificação (grau/tipo) extraídos do Anexo II ' +
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
          item_ref: '1.4.1, alínea "a"',
          codigo: '101049-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir e fazer cumprir as disposições legais e regulamentares sobre segurança e saúde no trabalho.',
          observacao: '',
        },
        {
          ordem: 1,
          secao: '',
          item_ref: '1.4.1, alínea "b", incisos I, II, III e IV',
          codigo: '101050-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Informar aos trabalhadores os riscos ocupacionais existentes, as medidas de prevenção adotadas, os resultados dos exames médicos/complementares e os resultados das avaliações ambientais.',
          observacao: '',
        },
        {
          ordem: 2,
          secao: '',
          item_ref: '1.4.1, alínea "c"',
          codigo: '101051-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Elaborar ordens de serviço sobre segurança e saúde no trabalho, dando ciência aos trabalhadores.',
          observacao: '',
        },
        {
          ordem: 3,
          secao: '',
          item_ref: '1.4.1, alínea "d"',
          codigo: '101052-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Permitir que representantes dos trabalhadores acompanhem a fiscalização dos preceitos legais e regulamentares sobre SST.',
          observacao: '',
        },
        {
          ordem: 4,
          secao: '',
          item_ref: '1.4.1, alínea "e"',
          codigo: '101053-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Determinar procedimentos a serem adotados em caso de acidente ou doença relacionada ao trabalho, incluindo a análise das causas.',
          observacao: '',
        },
        {
          ordem: 5,
          secao: '',
          item_ref: '1.4.1, alínea "f", e 1.6.5',
          codigo: '101054-9',
          grau: 2,
          tipo: 'S',
          descricao:
            'Disponibilizar à Inspeção do Trabalho todas as informações de SST e garantir amplo e irrestrito acesso aos documentos digitalizados ou nato digitais.',
          observacao: '',
        },
        {
          ordem: 6,
          secao: '',
          item_ref: '1.4.1, alínea "g", incisos I, II, III e IV',
          codigo: '101055-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Implementar medidas de prevenção na ordem de prioridade: eliminação dos riscos, proteção coletiva, medidas administrativas/organização do trabalho e, por fim, EPI.',
          observacao: '',
        },
        {
          ordem: 7,
          secao: '',
          item_ref: '1.4.1.1, alínea "a", "b" e "c"',
          codigo: '101114-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Organizações com CIPA: incluir regras de conduta sobre assédio sexual/violência, definir procedimentos de denúncia e realizar capacitação/sensibilização a cada 12 meses.',
          observacao: '',
        },
        {
          ordem: 8,
          secao: '',
          item_ref: '1.4.3.1',
          codigo: '101056-5',
          grau: 4,
          tipo: 'S',
          descricao:
            'Não exigir o retorno dos trabalhadores à atividade enquanto não adotadas as medidas corretivas de situação de risco grave e iminente.',
          observacao: '',
        },
        {
          ordem: 9,
          secao: '',
          item_ref: '1.4.4, alíneas "a", "b", "c", "d" e "e"',
          codigo: '101057-3',
          grau: 2,
          tipo: 'S',
          descricao:
            'Informar o trabalhador, na admissão ou mudança de função com alteração de risco, sobre riscos, meios de prevenção, medidas adotadas, procedimentos de emergência e de interrupção da atividade.',
          observacao: '',
        },
        {
          ordem: 10,
          secao: '',
          item_ref: '1.5.1 e 1.5.2',
          codigo: '101112-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Aplicar o gerenciamento de riscos ocupacionais; para insalubridade/periculosidade, observar a NR-15 e a NR-16.',
          observacao: '',
        },
        {
          ordem: 11,
          secao: '',
          item_ref: '1.5.3.1, 1.5.3.1.1 e 1.5.3.1.3',
          codigo: '101058-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Implementar o gerenciamento de riscos ocupacionais por estabelecimento, constituindo o PGR, integrado aos demais programas/documentos legais de SST.',
          observacao:
            'Pode ser dispensado quanto à elaboração formal do PGR se MEI, ou ME/EPP com grau de risco 1 ou 2 sem exposição identificada a agentes físicos/químicos/biológicos (NR-01, itens 1.8.1 e 1.8.4).',
        },
        {
          ordem: 12,
          secao: '',
          item_ref: '1.5.3.2, alínea "a"',
          codigo: '101059-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Evitar ou eliminar os perigos ocupacionais que possam ser originados no trabalho.',
          observacao: '',
        },
        {
          ordem: 13,
          secao: '',
          item_ref: '1.5.3.2, alínea "b", 1.5.4.3.1, alíneas "a", "b" e "c", e 1.5.4.3.2',
          codigo: '101060-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Identificar os perigos e possíveis lesões/agravos à saúde, descrevendo fontes/circunstâncias e o grupo de trabalhadores expostos, incluindo perigos externos previsíveis.',
          observacao: '',
        },
        {
          ordem: 14,
          secao: '',
          item_ref: '1.5.3.2, alínea "c"',
          codigo: '101061-1',
          grau: 3,
          tipo: 'S',
          descricao: 'Avaliar os riscos ocupacionais indicando o nível de risco.',
          observacao: '',
        },
        {
          ordem: 15,
          secao: '',
          item_ref: '1.5.3.2, alínea "d"',
          codigo: '101062-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Classificar os riscos ocupacionais para determinar a necessidade de adoção de medidas de prevenção.',
          observacao: '',
        },
        {
          ordem: 16,
          secao: '',
          item_ref: '1.5.3.2, alínea "d", e 1.5.5.1.1, alíneas "a", "b" e "c"',
          codigo: '101063-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Classificar os riscos e adotar medidas de prevenção sempre que exigido por NR/legislação, pela classificação de risco, por evidência de nexo com lesões/agravos ou por conclusão de análise de acidentes/doenças.',
          observacao: '',
        },
        {
          ordem: 17,
          secao: '',
          item_ref: '1.5.3.2.1',
          codigo: '101064-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Considerar as condições de trabalho da NR-17, incluindo os fatores de risco psicossociais relacionados ao trabalho.',
          observacao: '',
        },
        {
          ordem: 18,
          secao: '',
          item_ref: '1.5.3.3, alíneas "a" e "b", e 1.5.5.1.3',
          codigo: '101065-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Adotar mecanismos de participação dos trabalhadores no GRO e de consulta sobre percepção de riscos (inclusive via CIPA), informando sobre procedimentos e limitações das medidas de prevenção.',
          observacao: '',
        },
        {
          ordem: 19,
          secao: '',
          item_ref: '1.5.3.4',
          codigo: '101066-2',
          grau: 3,
          tipo: 'S',
          descricao: 'Adotar as medidas necessárias para avaliar e melhorar o desempenho em SST.',
          observacao: '',
        },
        {
          ordem: 20,
          secao: '',
          item_ref: '1.5.4.1',
          codigo: '101067-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Considerar as NR e exigências legais no processo de identificação de perigos e avaliação de riscos ocupacionais.',
          observacao: '',
        },
        {
          ordem: 21,
          secao: '',
          item_ref: '1.5.4.2.1, alíneas "a", "b" e "c"',
          codigo: '101068-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Realizar o levantamento preliminar de perigos e riscos antes do funcionamento do estabelecimento/novas instalações, para atividades existentes e em mudanças/novos processos.',
          observacao: '',
        },
        {
          ordem: 22,
          secao: '',
          item_ref: '1.5.4.4.1, 1.5.4.4.2 e 1.5.4.4.2.1',
          codigo: '101069-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Avaliar os riscos ocupacionais dos perigos identificados, indicando o nível de risco (severidade x probabilidade) com ferramentas/técnicas adequadas.',
          observacao: '',
        },
        {
          ordem: 23,
          secao: '',
          item_ref: '1.5.4.4.3 e 1.5.4.4.3.1',
          codigo: '101113-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Classificar os riscos após a determinação dos níveis, para fins de adoção/manutenção de medidas de prevenção e elaboração do plano de ação.',
          observacao: '',
        },
        {
          ordem: 24,
          secao: '',
          item_ref: '1.5.4.4.4, alíneas "a", "b", "c" e "d"',
          codigo: '101070-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Estabelecer a severidade em razão da magnitude das possíveis consequências das lesões/agravos, considerando a de maior magnitude quando houver mais de uma.',
          observacao: '',
        },
        {
          ordem: 25,
          secao: '',
          item_ref: '1.5.4.4.5',
          codigo: '101071-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Estabelecer a probabilidade com base na chance de ocorrência das lesões ou agravos à saúde.',
          observacao: '',
        },
        {
          ordem: 26,
          secao: '',
          item_ref: '1.5.4.4.6, alíneas "a", "b", "c", "d" e "e", e 1.5.4.4.6.1',
          codigo: '101072-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Rever a avaliação de riscos a cada 2 anos (ou 3, com certificação de gestão de SST) ou nas situações previstas (após medidas de prevenção, inovações, inadequações, acidentes/doenças, mudança legal ou solicitação da CIPA).',
          observacao: '',
        },
        {
          ordem: 27,
          secao: '',
          item_ref: '1.5.5.1.2, alíneas "a" e "b"',
          codigo: '101073-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Quando inviável/insuficiente a proteção coletiva, adotar medidas administrativas/organização do trabalho e, complementarmente, EPI.',
          observacao: '',
        },
        {
          ordem: 28,
          secao: '',
          item_ref: '1.5.5.2.1 e 1.5.5.2.2',
          codigo: '101074-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Elaborar plano de ação com as medidas de prevenção e definir cronograma, responsáveis e formas de acompanhamento/aferição de resultados.',
          observacao: '',
        },
        {
          ordem: 29,
          secao: '',
          item_ref: '1.5.5.3.1, 1.5.5.3.2, alíneas "a", "b" e "c", e 1.5.5.3.2.1',
          codigo: '101075-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Registrar a implementação das medidas de prevenção e acompanhar seu desempenho (execução, inspeções, monitoramento ambiental, participação dos trabalhadores/CIPA), corrigindo-as quando ineficazes.',
          observacao: '',
        },
        {
          ordem: 30,
          secao: '',
          item_ref: '1.5.5.4.1 e 1.5.5.4.2',
          codigo: '101076-0',
          grau: 3,
          tipo: 'M',
          descricao:
            'Desenvolver ações de saúde ocupacional integradas às demais medidas de SST, com controle da saúde dos empregados de forma preventiva, planejada e contínua (NR-7).',
          observacao: '',
        },
        {
          ordem: 31,
          secao: '',
          item_ref: '1.5.5.5.1 e 1.5.5.5.2, alíneas "a", "b" e "c"',
          codigo: '101077-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Analisar e documentar os acidentes e doenças relacionadas ao trabalho (situações geradoras, dados epidemiológicos, evidências para revisão das medidas de prevenção).',
          observacao: '',
        },
        {
          ordem: 32,
          secao: '',
          item_ref: '1.5.6.1 e 1.5.6.2, alíneas "a" e "b"',
          codigo: '101078-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Estabelecer, implementar e manter procedimentos de resposta a emergências, prevendo meios/responsáveis para primeiros socorros e medidas para emergências de grande magnitude.',
          observacao: '',
        },
        {
          ordem: 33,
          secao: '',
          item_ref:
            '1.5.7.1, alínea "a", 1.5.7.3.1, 1.5.7.3.2, alíneas "a", "b", "c", "d", "e" e "f", 1.5.7.3.3 e 1.5.7.3.3.1',
          codigo: '101079-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Manter o inventário de riscos ocupacionais com as informações mínimas exigidas, atualizado, com histórico preservado por no mínimo 20 anos.',
          observacao: '',
        },
        {
          ordem: 34,
          secao: '',
          item_ref: '1.5.8.2',
          codigo: '101080-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Organização contratante deve informar às contratadas os riscos ocupacionais sob sua responsabilidade que possam impactar as atividades das contratadas.',
          observacao: '',
        },
        {
          ordem: 35,
          secao: '',
          item_ref: '1.5.8.2',
          codigo: '101081-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Mesma exigência do item anterior — item 1.5.8.2 consta duas vezes no Anexo II da NR-28, com códigos distintos, conforme publicado oficialmente.',
          observacao: '',
        },
        {
          ordem: 36,
          secao: '',
          item_ref: '1.5.8.3',
          codigo: '101082-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Organização contratada deve informar à contratante os riscos ocupacionais sob sua responsabilidade que possam impactar as atividades da contratante.',
          observacao: '',
        },
        {
          ordem: 37,
          secao: '',
          item_ref: '1.5.8.4',
          codigo: '101083-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Quando os riscos resultarem da interação entre organizações, definir em conjunto as medidas de prevenção, sob coordenação da contratante.',
          observacao: '',
        },
        {
          ordem: 38,
          secao: '',
          item_ref: '1.6.1 e 1.6.4',
          codigo: '101084-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Prestar informações de SST em formato digital conforme modelo aprovado pela STRAB e garantir a preservação/validade jurídica de todos os documentos nato digitais ou digitalizados.',
          observacao: '',
        },
        {
          ordem: 39,
          secao: '',
          item_ref: '1.6.5.1',
          codigo: '101085-9',
          grau: 2,
          tipo: 'S',
          descricao:
            'Prover aos trabalhadores/representantes meios de acesso às informações que devem estar à sua disposição.',
          observacao: '',
        },
        {
          ordem: 40,
          secao: '',
          item_ref: '1.7.1',
          codigo: '101086-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Promover capacitação e treinamento dos trabalhadores conforme disposto nas NR.',
          observacao: '',
        },
        {
          ordem: 41,
          secao: '',
          item_ref: '1.7.1.1 e 1.7.3',
          codigo: '101087-5',
          grau: 1,
          tipo: 'S',
          descricao:
            'Emitir certificado ao término dos treinamentos (nome, assinatura, conteúdo, carga horária, data, local, instrutores e responsável técnico), disponibilizá-lo ao trabalhador e arquivar cópia.',
          observacao: '',
        },
        {
          ordem: 42,
          secao: '',
          item_ref: '1.7.1.2, alínea "a", e 1.7.1.2.1',
          codigo: '101088-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Realizar o treinamento inicial antes do trabalhador iniciar suas funções ou no prazo especificado em NR.',
          observacao: '',
        },
        {
          ordem: 43,
          secao: '',
          item_ref: '1.7.1.2, alínea "b", e 1.7.1.2.2',
          codigo: '101089-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Realizar o treinamento periódico conforme periodicidade da NR ou, quando não estabelecida, em prazo definido pelo empregador.',
          observacao: '',
        },
        {
          ordem: 44,
          secao: '',
          item_ref: '1.7.1.2, alínea "c", 1.7.1.2.3, alíneas "a", "b", e "c", e 1.7.1.2.3.1',
          codigo: '101090-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Realizar treinamento eventual em caso de mudança de risco, acidente grave/fatal ou retorno de afastamento superior a 180 dias, com carga horária/conteúdo compatíveis.',
          observacao: '',
        },
        {
          ordem: 45,
          secao: '',
          item_ref: '1.7.2 e 1.7.4',
          codigo: '101091-3',
          grau: 2,
          tipo: 'S',
          descricao:
            'Considerar o tempo de treinamento como trabalho efetivo e consignar a capacitação nos documentos funcionais do empregado.',
          observacao: '',
        },
        {
          ordem: 46,
          secao: '',
          item_ref: '1.7.5',
          codigo: '101092-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Permitir treinamentos das NR em conjunto com outros treinamentos da organização, respeitados conteúdo e carga horária da norma.',
          observacao: '',
        },
        {
          ordem: 47,
          secao: '',
          item_ref:
            '1.7.6, alíneas "a", "b" e "c", 1.7.6.1, 1.7.6.1.1, 1.7.7, 1.7.7.1, alíneas "a", "b", "c", "d" e "e", 1.7.8 e 1.7.8.1',
          codigo: '101093-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Observar as regras de aproveitamento de conteúdos de treinamento (na mesma organização ou entre organizações), com registro no certificado e emissão da certificação mesmo em caso de convalidação.',
          observacao: '',
        },
        {
          ordem: 48,
          secao: '',
          item_ref: '1.7.9 e 1.7.9.1',
          codigo: '101094-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir os requisitos do Anexo II da NR-01 quando os treinamentos forem ministrados a distância ou semipresencial.',
          observacao: '',
        },
        {
          ordem: 49,
          secao: '',
          item_ref: '1.8.1.1',
          codigo: '101095-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'A dispensa do PGR ao MEI não alcança a organização contratante, que deve incluí-lo em suas ações de prevenção e no seu PGR quando ele atuar em suas dependências.',
          observacao:
            'Só se aplica quando a empresa contrata um MEI que atua em suas dependências.',
        },
        {
          ordem: 50,
          secao: '',
          item_ref: '1.8.4.1',
          codigo: '101096-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Divulgar aos trabalhadores as informações digitais de SST declaradas em substituição ao PGR.',
          observacao:
            'Aplica-se a ME/EPP grau de risco 1 ou 2 sem exposição ocupacional identificada a agentes físicos, químicos e biológicos (NR-01, item 1.8.4).',
        },
        {
          ordem: 51,
          secao: '',
          item_ref: '1.8.6.1',
          codigo: '101097-2',
          grau: 3,
          tipo: 'M',
          descricao:
            'A dispensa do PCMSO (MEI/ME/EPP grau de risco 1 ou 2) não desobriga a realização dos exames médicos e a emissão do ASO.',
          observacao:
            'Aplica-se a MEI/ME/EPP grau de risco 1 ou 2 que declararem informações digitais e não identificarem exposições ocupacionais (NR-01, item 1.8.6).',
        },
        {
          ordem: 52,
          secao: '',
          item_ref: '1.5.7.1, alínea "b"',
          codigo: '101110-3',
          grau: 2,
          tipo: 'S',
          descricao: 'O PGR deve conter, no mínimo, o plano de ação, além do inventário de riscos.',
          observacao: '',
        },
        {
          ordem: 53,
          secao: '',
          item_ref: '1.5.7.2 e 1.5.7.2.1',
          codigo: '101111-1',
          grau: 2,
          tipo: 'S',
          descricao:
            'Os documentos do PGR devem ser elaborados sob responsabilidade da organização, datados e assinados, e mantidos disponíveis aos trabalhadores, sindicatos e à Inspeção do Trabalho.',
          observacao: '',
        },
        {
          ordem: 54,
          secao: 'NR-1 - Anexo II',
          item_ref: '2.2',
          codigo: '101037-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Ao contratar empresa/instituição para ministrar capacitação EaD, fazer constar contratualmente a obrigatoriedade do prestador de atender aos requisitos do Anexo II e das NR.',
          observacao: '',
        },
        {
          ordem: 55,
          secao: 'NR-1 - Anexo II',
          item_ref: '2.3 e 2.4',
          codigo: '101038-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'As capacitações EaD/semipresenciais devem ter, no mínimo, a duração da modalidade presencial, com conteúdo programático que respeite a carga horária exigida.',
          observacao: '',
        },
        {
          ordem: 56,
          secao: 'NR-1 - Anexo II',
          item_ref: '2.5',
          codigo: '101039-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'As atividades práticas obrigatórias devem respeitar as orientações das NR e estar descritas no projeto pedagógico.',
          observacao: '',
        },
        {
          ordem: 57,
          secao: 'NR-1 - Anexo II',
          item_ref: '3.1 e 3.2',
          codigo: '101040-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Elaborar projeto pedagógico com todos os elementos mínimos exigidos (objetivo, estratégia, responsável técnico, instrutores, conteúdo, carga horária, avaliação etc.).',
          observacao: '',
        },
        {
          ordem: 58,
          secao: 'NR-1 - Anexo II',
          item_ref: '4.1',
          codigo: '101116-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Manter o projeto pedagógico disponível para a Inspeção do Trabalho, o sindicato da categoria e a CIPA.',
          observacao: '',
        },
        {
          ordem: 59,
          secao: 'NR-1 - Anexo II',
          item_ref: '4.1.1',
          codigo: '101042-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'A empresa/instituição especializada deve disponibilizar o projeto pedagógico aos contratantes.',
          observacao: '',
        },
        {
          ordem: 60,
          secao: 'NR-1 - Anexo II',
          item_ref: '4.2 e 4.3',
          codigo: '101043-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Disponibilizar aos trabalhadores todo o material didático necessário e recursos/ambiente adequados à concentração e absorção do conhecimento.',
          observacao: '',
        },
        {
          ordem: 61,
          secao: 'NR-1 - Anexo II',
          item_ref: '4.4',
          codigo: '101044-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'O período do curso deve ser exclusivo, sem concomitância com as atividades diárias de trabalho.',
          observacao: '',
        },
        {
          ordem: 62,
          secao: 'NR-1 - Anexo II',
          item_ref: '4.5',
          codigo: '101045-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Manter canal de comunicação operacional para esclarecimento de dúvidas durante o curso.',
          observacao: '',
        },
        {
          ordem: 63,
          secao: 'NR-1 - Anexo II',
          item_ref: '4.6, 4.6.1, 4.6.2 e 4.6.3',
          codigo: '101046-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Realizar a verificação de aprendizagem conforme a estratégia pedagógica, com registro de assinatura ou identificação/senha, rastreabilidade e situações práticas da rotina laboral.',
          observacao: '',
        },
        {
          ordem: 64,
          secao: 'NR-1 - Anexo II',
          item_ref: '4.7 e 4.7.1',
          codigo: '101047-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Registrar a realização do curso, mantendo resultados de avaliação e logs de acesso dos participantes por, no mínimo, 2 anos após o término da validade do curso.',
          observacao: '',
        },
        {
          ordem: 65,
          secao: 'NR-1 - Anexo II',
          item_ref: '5.1',
          codigo: '101048-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Realizar as capacitações EaD/semipresenciais somente em Ambiente Virtual de Aprendizagem apropriado.',
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
        "nr_referencia = 'NR-01' && organizacao_id = ''",
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
