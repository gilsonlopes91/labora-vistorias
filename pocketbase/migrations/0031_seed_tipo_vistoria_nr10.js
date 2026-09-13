migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-10' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-10 — Segurança em Instalações e Serviços em Eletricidade')
      tipoRec.set('nr_referencia', 'NR-10')
      tipoRec.set(
        'descricao',
        'Checklist oficial da NR-10, com itens e classificação (grau/tipo) extraídos do Anexo II da ' +
          'NR-28. Cálculo de multa pelo Anexo I da NR-28. Alguns itens (marcados na observação) foram ' +
          'descritos a partir de conhecimento geral da norma, sem confirmação linha a linha do texto ' +
          'vigente — revisar com a fonte oficial (gov.br) antes de usar em laudo real.',
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
      'Descrição escrita a partir de conhecimento geral da NR-10, sem confirmação linha a linha do texto vigente — revisar com a fonte oficial antes de usar em laudo real.'

    if (!jaTemItens) {
      const itens = [
        {
          item_ref: '10.2.1',
          codigo: '210122-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Aplicar a NR-10 a todas as fases da geração, transmissão, distribuição e consumo de energia elétrica, em qualquer tensão, de forma permanente ou temporária.',
          observacao: '',
        },
        {
          item_ref: '10.2.2',
          codigo: '210002-9',
          grau: 1,
          tipo: 'S',
          descricao:
            'Aplicar a norma quando houver exposição a perigos elétricos com possibilidade de entrada na zona controlada.',
          observacao: '',
        },
        {
          item_ref: '10.2.3',
          codigo: '210003-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Aplicar a norma também em situações de exposição a risco de arco elétrico, mesmo sem entrada na zona controlada.',
          observacao: '',
        },
        {
          item_ref: '10.2.4, alíneas "a" a "g"',
          codigo: '210178-5',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir os requisitos específicos aplicáveis às instalações de extrabaixa tensão previstos no item 10.2.4.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.2.5',
          codigo: '210012-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Atender ao projeto das instalações de extrabaixa tensão conforme as normas técnicas oficiais vigentes.',
          observacao: '',
        },
        {
          item_ref: '10.2.5, alínea "a"',
          codigo: '210127-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir a alínea "a" do item 10.2.5 quanto ao projeto de instalações de extrabaixa tensão.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.2.5, alínea "b"',
          codigo: '210128-9',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir a alínea "b" do item 10.2.5 quanto ao projeto de instalações de extrabaixa tensão.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.2.6',
          codigo: '210016-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir as demais disposições do campo de aplicação da NR-10 previstas no item 10.2.6.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.2.7',
          codigo: '210017-7',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir as demais disposições do campo de aplicação da NR-10 previstas no item 10.2.7.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.2.8.1, 10.2.8.2, 10.2.8.2.1 e 10.2.8.3',
          codigo: '210179-3',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir as disposições do item 10.2.8 sobre o campo de aplicação da NR-10.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.2.9.1, 10.2.9.2 e 10.2.9.3',
          codigo: '210180-7',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir as disposições do item 10.2.9 sobre o campo de aplicação da NR-10.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.3.1, 10.3.2, 10.3.3, 10.3.3.1, 10.3.4, 10.3.5 e 10.3.6',
          codigo: '210181-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Considerar, no gerenciamento de risco (PGR), as características das exposições a choque elétrico e arco elétrico, os métodos de trabalho, a entrada em operação de novas instalações e a necessidade de medidas de prevenção.',
          observacao: '',
        },
        {
          item_ref: '10.3.7',
          codigo: '210138-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir as demais exigências do gerenciamento de risco elétrico previstas no item 10.3.7.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.3.8',
          codigo: '210033-9',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir as demais exigências do gerenciamento de risco elétrico previstas no item 10.3.8.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.3.9, alíneas "a" a "g"',
          codigo: '210182-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir o conteúdo mínimo exigido para o gerenciamento de risco elétrico previsto no item 10.3.9.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.3.10',
          codigo: '210041-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir as demais exigências do gerenciamento de risco elétrico previstas no item 10.3.10.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.4.1',
          codigo: '210042-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Especificar no projeto dispositivos de desligamento com impedimento de reenergização e sinalização da condição operativa.',
          observacao: '',
        },
        {
          item_ref: '10.4.2',
          codigo: '210043-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Prever, quando possível, seccionamento de ação simultânea com impedimento de reenergização no projeto.',
          observacao: '',
        },
        {
          item_ref: '10.4.3 e 10.4.3.1',
          codigo: '210183-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Considerar no projeto o espaço seguro e o dimensionamento adequado, identificando e instalando separadamente circuitos com finalidades distintas.',
          observacao: '',
        },
        {
          item_ref: '10.4.4',
          codigo: '210046-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Definir no projeto a configuração de aterramento, a interligação entre neutro e proteção, e a conexão à terra das partes condutoras.',
          observacao: '',
        },
        {
          item_ref: '10.4.4.1',
          codigo: '210047-9',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir o detalhamento do item 10.4.4.1 sobre a configuração de aterramento do projeto.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.4.5',
          codigo: '210146-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Prever, quando viável, dispositivos de seccionamento com recursos de equipotencialização e aterramento no projeto.',
          observacao: '',
        },
        {
          item_ref: '10.4.6',
          codigo: '210049-5',
          grau: 3,
          tipo: 'S',
          descricao: 'Prever no projeto as condições para adoção de aterramento temporário.',
          observacao: '',
        },
        {
          item_ref: '10.5.1, 10.5.2 e 10.5.4',
          codigo: '210184-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Priorizar a desenergização das instalações elétricas como medida de eliminação do risco elétrico, adotando, quando impossível, proteção coletiva, medidas administrativas e, por último, proteção individual, na ordem de hierarquia de controle de riscos.',
          observacao: '',
        },
        {
          item_ref: '10.6.1 e 10.6.1.1',
          codigo: '210185-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Implementar as proteções básica e supletiva combinadas contra choques elétricos, previstas no item 10.6.1.',
          observacao: '',
        },
        {
          item_ref: '10.6.2',
          codigo: '210171-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Implementar as proteções contra arco elétrico conforme especificado em projeto.',
          observacao: '',
        },
        {
          item_ref: '10.6.3 e 10.6.5',
          codigo: '210186-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Instalar dispositivos diferenciais-residuais (DR) nos circuitos que atendem banheiros, áreas externas e áreas molhadas, e demais pontos exigidos pela norma.',
          observacao: '',
        },
        {
          item_ref: '10.6.4',
          codigo: '210067-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Adotar medidas de proteção contra explosão, incêndio, sobretensões e descargas atmosféricas nas instalações elétricas.',
          observacao: '',
        },
        {
          item_ref:
            '10.7.1, 10.7.2, 10.7.3, 10.7.4, 10.7.5, 10.7.6, 10.7.7, 10.7.7.1, 10.7.8 e 10.7.9',
          codigo: '210187-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Elaborar procedimentos de trabalho aprovados por profissional legalmente habilitado, emitir permissão de trabalho para serviços não rotineiros, realizar análise prévia no local, promover a sinalização adequada, proibir o uso de adornos, garantir supervisão, inspecionar as instalações regularmente e coordenar as ações entre organizações que compartilhem a mesma infraestrutura elétrica.',
          observacao: '',
        },
        {
          item_ref: '10.8.5 e 10.8.6',
          codigo: '210188-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Autorizar formalmente os trabalhadores para atuar em instalações elétricas, mediante exames de saúde compatíveis, capacitação e ciência dos riscos, e manter registro atualizado dos trabalhadores autorizados.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.8.7',
          codigo: '210156-4',
          grau: 2,
          tipo: 'M',
          descricao:
            'Garantir a supervisão adequada dos trabalhadores em capacitação ou em processo de qualificação.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.8.8, 10.8.8.1, 10.8.8.2, 10.8.8.3 e 10.8.8.4',
          codigo: '210189-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Submeter os trabalhadores autorizados a reciclagem/retreinamento sempre que ocorrer mudança de função, de risco, de método de trabalho, ou afastamento prolongado, conforme os prazos e situações previstos no item 10.8.8.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.8.9',
          codigo: '210090-8',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir as demais exigências documentais relativas à autorização dos trabalhadores previstas no item 10.8.9.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.9.1',
          codigo: '210091-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Custear e realizar, durante o expediente normal de trabalho, os treinamentos de segurança exigidos pela NR-10.',
          observacao: '',
        },
        {
          item_ref: '10.9.2',
          codigo: '210161-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Promover o treinamento básico em segurança em instalações e serviços em eletricidade, com carga horária mínima de 40 horas, para os trabalhadores autorizados.',
          observacao: '',
        },
        {
          item_ref: '10.9.3',
          codigo: '210162-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Promover o treinamento complementar do SEP, com carga horária mínima de 40 horas, para os trabalhadores que atuam no Sistema Elétrico de Potência ou em sua proximidade.',
          observacao: '',
        },
        {
          item_ref: '10.9.4',
          codigo: '210094-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir os demais requisitos de conteúdo programático dos treinamentos de segurança previstos no item 10.9.4.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.9.5',
          codigo: '210163-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Realizar o treinamento periódico (reciclagem) bienal, com carga horária mínima de 16 horas, adequado à realidade e às características das instalações elétricas da organização.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.10.1, alíneas "a" a "g"',
          codigo: '210190-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir os requisitos para autorização do trabalhador previstos no item 10.10.1: aptidão médica ocupacional prévia, capacitação e treinamento de segurança com aprovação satisfatória, e demais condições estabelecidas na norma.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.11.1, 10.11.2, 10.11.3 e 10.11.4',
          codigo: '210191-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Adotar equipamentos de proteção individual e coletiva adequados às atividades desenvolvidas, conforme a hierarquia de controle de riscos.',
          observacao: '',
        },
        {
          item_ref: '10.11.5',
          codigo: '210177-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Selecionar os EPI contra risco de arco elétrico conforme o Anexo IV da NR-10, considerando a corrente máxima, o tempo de eliminação e a distância mínima de trabalho.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.11.6 e 10.11.7',
          codigo: '210192-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir as demais exigências de seleção, uso e manutenção dos EPI e equipamentos de proteção coletiva previstas nos itens 10.11.6 e 10.11.7.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.11.8',
          codigo: '210166-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir as exigências relativas às ferramentas isolantes e aos dispositivos de proteção coletiva utilizados nos serviços em eletricidade, previstas no item 10.11.8.',
          observacao: REVISAR,
        },
        {
          item_ref: '10.12.1, 10.12.2, 10.12.3 e 10.12.4',
          codigo: '210193-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Garantir que a construção, montagem, comissionamento, operação e manutenção das instalações elétricas sejam executados e supervisionados por trabalhador autorizado, com comunicação direta e visual entre os envolvidos ou, quando isso não for possível, com equipamentos de comunicação em perfeito funcionamento.',
          observacao: '',
        },
        {
          item_ref: '10.13.2 e 10.13.3',
          codigo: '210194-7',
          grau: 4,
          tipo: 'S',
          descricao:
            'Seguir a sequência exigida para a reenergização das instalações (retirada de delimitações, ferramentas e pessoas não envolvidas, remoção do aterramento temporário e das proteções/sinalizações, e religamento dos dispositivos) e garantir a desenergização durante toda a execução do serviço, impedindo que outras equipes ou organizações reenergizem as instalações.',
          observacao: '',
        },
        {
          item_ref: '10.14.2 e 10.14.4',
          codigo: '210195-5',
          grau: 4,
          tipo: 'S',
          descricao:
            'Proibir a execução individual de serviços em instalações elétricas energizadas em média e alta tensão, e submeter equipamentos, ferramentas, dispositivos isolantes e EPC a ensaios dielétricos periódicos, no menor intervalo previsto em regulamentação ou, na ausência de previsão, anualmente.',
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
        "nr_referencia = 'NR-10' && organizacao_id = ''",
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
