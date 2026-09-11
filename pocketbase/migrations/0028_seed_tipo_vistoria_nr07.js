migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-07' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-07 — Programa de Controle Médico de Saúde Ocupacional (PCMSO)')
      tipoRec.set('nr_referencia', 'NR-07')
      tipoRec.set(
        'descricao',
        'Checklist oficial da NR-07, com itens e classificação (grau/tipo) extraídos do Anexo II ' +
          'da NR-28 (Quadro de Classificação das Infrações). Cálculo de multa pelo Anexo I da NR-28.',
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
          item_ref: '7.3.2.1',
          codigo: '107099-1',
          grau: 2,
          tipo: 'M',
          descricao:
            'Incluir no PCMSO ações de vigilância passiva (a partir de demandas espontâneas) e de vigilância ativa (exames médicos dirigidos, com coleta de dados sobre sinais e sintomas).',
        },
        {
          item_ref: '7.3.2.2',
          codigo: '107100-9',
          grau: 3,
          tipo: 'M',
          descricao: 'Não usar o PCMSO como mecanismo de seleção ou triagem de pessoal.',
        },
        {
          item_ref: '7.4.1, alínea "a"',
          codigo: '107101-7',
          grau: 4,
          tipo: 'M',
          descricao: 'Garantir a elaboração e a implementação efetiva do PCMSO.',
        },
        {
          item_ref: '7.4.1, alínea "b"',
          codigo: '107102-5',
          grau: 2,
          tipo: 'M',
          descricao:
            'Financiar integralmente todos os procedimentos do PCMSO, sem custo para o empregado.',
        },
        {
          item_ref: '7.4.1, alínea "c"',
          codigo: '107103-3',
          grau: 2,
          tipo: 'M',
          descricao: 'Designar um médico do trabalho como responsável pela condução do PCMSO.',
        },
        {
          item_ref: '7.5.1',
          codigo: '107104-1',
          grau: 4,
          tipo: 'M',
          descricao:
            'Elaborar o PCMSO considerando os riscos ocupacionais identificados e classificados no Programa de Gerenciamento de Riscos (PGR).',
        },
        {
          item_ref: '7.5.3',
          codigo: '107105-0',
          grau: 3,
          tipo: 'M',
          descricao:
            'Avaliar a saúde dos empregados em atividades críticas, considerando os riscos e investigando patologias que impeçam o exercício seguro dessas funções.',
        },
        {
          item_ref: '7.5.4, alínea "a"',
          codigo: '107106-8',
          grau: 2,
          tipo: 'M',
          descricao:
            'Descrever no PCMSO os possíveis agravos à saúde relacionados aos riscos ocupacionais identificados no PGR.',
        },
        {
          item_ref: '7.5.4, alíneas "b" e "c"',
          codigo: '107107-6',
          grau: 2,
          tipo: 'M',
          descricao:
            'Planejar no PCMSO os exames clínicos e complementares necessários conforme os riscos ocupacionais, atendendo aos Anexos da norma, e estabelecer os critérios de interpretação e conduta para os achados dos exames.',
        },
        {
          item_ref: '7.5.4, alínea "d"',
          codigo: '107108-4',
          grau: 2,
          tipo: 'M',
          descricao:
            'Garantir que o PCMSO seja conhecido e atendido por todos os médicos que realizarem os exames ocupacionais dos empregados.',
        },
        {
          item_ref: '7.5.5',
          codigo: '107109-2',
          grau: 2,
          tipo: 'M',
          descricao:
            'Reavaliar, em conjunto com os responsáveis pelo PGR, eventuais inconsistências identificadas no inventário de riscos.',
        },
        {
          item_ref: '7.5.6, alínea "a"',
          codigo: '107110-6',
          grau: 3,
          tipo: 'M',
          descricao: 'Realizar o exame médico admissional.',
        },
        {
          item_ref: '7.5.6, alínea "b"',
          codigo: '107111-4',
          grau: 3,
          tipo: 'M',
          descricao: 'Realizar o exame médico periódico.',
        },
        {
          item_ref: '7.5.6, alínea "c"',
          codigo: '107112-2',
          grau: 3,
          tipo: 'M',
          descricao: 'Realizar o exame médico de retorno ao trabalho.',
        },
        {
          item_ref: '7.5.6, alínea "d"',
          codigo: '107113-0',
          grau: 3,
          tipo: 'M',
          descricao: 'Realizar o exame médico de mudança de riscos ocupacionais.',
        },
        {
          item_ref: '7.5.6, alínea "e"',
          codigo: '107114-9',
          grau: 3,
          tipo: 'M',
          descricao: 'Realizar o exame médico demissional.',
        },
        {
          item_ref: '7.5.8, inciso I',
          codigo: '107115-7',
          grau: 3,
          tipo: 'M',
          descricao:
            'Realizar o exame clínico admissional antes que o empregado assuma suas atividades.',
        },
        {
          item_ref: '7.5.8, inciso II, alínea "a", "1" e "2", e alínea "b"',
          codigo: '107116-5',
          grau: 3,
          tipo: 'M',
          descricao:
            'Cumprir a periodicidade do exame clínico periódico: anual (ou menor, a critério médico) para expostos a riscos ocupacionais ou portadores de doenças crônicas, conforme o Anexo IV para condições hiperbáricas, e a cada dois anos para os demais empregados.',
        },
        {
          item_ref: '7.5.9',
          codigo: '107117-3',
          grau: 3,
          tipo: 'M',
          descricao:
            'Realizar o exame clínico de retorno ao trabalho antes do retorno do empregado, quando o afastamento por doença ou acidente for igual ou superior a 30 dias.',
        },
        {
          item_ref: '7.5.9.1',
          codigo: '107118-1',
          grau: 2,
          tipo: 'M',
          descricao:
            'Garantir que o médico defina, na avaliação de retorno, a necessidade de retorno gradativo ao trabalho.',
        },
        {
          item_ref: '7.5.10',
          codigo: '107119-0',
          grau: 3,
          tipo: 'M',
          descricao:
            'Realizar o exame de mudança de risco ocupacional antes da mudança, adequando o controle médico aos novos riscos.',
        },
        {
          item_ref: '7.5.11',
          codigo: '107120-3',
          grau: 3,
          tipo: 'M',
          descricao:
            'Realizar a avaliação clínica do exame demissional em até 10 dias do término do contrato, podendo dispensá-la se o último exame ocupacional foi feito há menos de 135 dias (risco 1 ou 2) ou 90 dias (risco 3 ou 4).',
        },
        {
          item_ref: '7.5.12',
          codigo: '107121-1',
          grau: 3,
          tipo: 'M',
          descricao:
            'Realizar os exames complementares laboratoriais em laboratório conforme a RDC/Anvisa nº 302/2005, quando exigidos pelo PGR ou por exposições acima dos níveis de ação.',
        },
        {
          item_ref: '7.5.12, alíneas "a" e "b"',
          codigo: '107122-0',
          grau: 3,
          tipo: 'M',
          descricao:
            'Cumprir as demais determinações do item 7.5.12 sobre a realização dos exames complementares laboratoriais.',
        },
        {
          item_ref: '7.5.12.1 e 7.5.12.2',
          codigo: '107123-8',
          grau: 3,
          tipo: 'M',
          descricao:
            'Coletar as amostras biológicas conforme os Quadros 1 e 2 do Anexo I e seguir os procedimentos recomendados pelo laboratório ao armazenar/transportar as amostras.',
        },
        {
          item_ref: '7.5.13',
          codigo: '107124-6',
          grau: 3,
          tipo: 'M',
          descricao:
            'Realizar semestralmente os exames dos Quadros 1 e 2 do Anexo I, podendo antecipar ou postergar em até 45 dias mediante justificativa técnica do médico.',
        },
        {
          item_ref: '7.5.14',
          codigo: '107125-4',
          grau: 2,
          tipo: 'M',
          descricao:
            'Nas atividades sazonais, realizar anualmente, durante o período de execução, os exames dos Quadros 1 e 2 do Anexo I.',
        },
        {
          item_ref: '7.5.16 e 7.5.18',
          codigo: '107126-2',
          grau: 2,
          tipo: 'M',
          descricao:
            'Informar o empregado sobre as razões dos exames complementares e o significado dos resultados, e realizar outros exames complementares a critério médico quando relacionados aos riscos do PGR e justificados no PCMSO.',
        },
        {
          item_ref: '7.5.17',
          codigo: '107127-0',
          grau: 3,
          tipo: 'M',
          descricao:
            'Aceitar, no exame admissional, exames complementares realizados nos últimos 90 dias, salvo prazo diferente previsto nos Anexos.',
        },
        {
          item_ref: '7.5.19',
          codigo: '107128-9',
          grau: 3,
          tipo: 'M',
          descricao:
            'Garantir a emissão do Atestado de Saúde Ocupacional (ASO) em cada exame clínico ocupacional, disponibilizado ao empregado em meio físico quando solicitado.',
        },
        {
          item_ref: '7.5.19.1',
          codigo: '107129-7',
          grau: 2,
          tipo: 'M',
          descricao:
            'Garantir que o ASO contenha razão social e CNPJ/CAEPF, dados do empregado, descrição dos perigos/riscos do PGR (ou sua inexistência), indicação e data dos exames, definição de aptidão/inaptidão e dados do médico responsável.',
        },
        {
          item_ref: '7.5.19.2',
          codigo: '107130-0',
          grau: 2,
          tipo: 'M',
          descricao:
            'Fazer constar no ASO a aptidão para atividades específicas definidas em outras NR, quando aplicável.',
        },
        {
          item_ref: '7.5.19.3',
          codigo: '107131-9',
          grau: 1,
          tipo: 'M',
          descricao:
            'Emitir recibo de entrega do resultado ao empregado, em meio físico quando solicitado, quando os exames complementares forem feitos sem exame clínico.',
        },
        {
          item_ref: '7.5.19.4',
          codigo: '107132-7',
          grau: 3,
          tipo: 'M',
          descricao:
            'Informar aos responsáveis pelo PGR, para reavaliação de riscos e medidas de prevenção, quando constatada possibilidade de exposição excessiva a agentes do Quadro 1 do Anexo I.',
        },
        {
          item_ref: '7.5.19.5',
          codigo: '107133-5',
          grau: 4,
          tipo: 'M',
          descricao:
            'Emitir a CAT, afastar o empregado quando necessário, encaminhá-lo à Previdência Social quando o afastamento for superior a 15 dias, e reavaliar riscos e medidas de prevenção no PGR, quando constatada doença relacionada ao trabalho ou seu agravamento.',
        },
        {
          item_ref: '7.5.19.6 e 7.5.19.6.1',
          codigo: '107134-3',
          grau: 3,
          tipo: 'M',
          descricao:
            'Submeter o empregado a exame clínico e informá-lo sobre os achados e as condutas necessárias nas situações dos itens 7.5.19.4/7.5.19.5, e avaliar a necessidade de exame em outros empregados nas mesmas condições de trabalho.',
        },
        {
          item_ref: '7.6.1',
          codigo: '107135-1',
          grau: 2,
          tipo: 'M',
          descricao:
            'Registrar os dados dos exames clínicos e complementares em prontuário médico individual, sob responsabilidade do médico responsável pelo PCMSO.',
        },
        {
          item_ref: '7.6.1.1, 7.6.1.2 e 7.6.1.3',
          codigo: '107136-0',
          grau: 2,
          tipo: 'M',
          descricao:
            'Manter o prontuário do empregado por, no mínimo, 20 anos após o desligamento (salvo prazo diverso previsto nos Anexos), garantir a transferência formal dos prontuários ao médico sucessor e, se em meio eletrônico, atender às exigências do Conselho Federal de Medicina.',
        },
        {
          item_ref: '7.6.2',
          codigo: '107137-8',
          grau: 3,
          tipo: 'M',
          descricao:
            'Garantir a elaboração do relatório analítico anual do PCMSO, com número de exames, tipos de exames complementares, estatística de resultados anormais, incidência/prevalência de doenças relacionadas ao trabalho, informações sobre CAT emitidas e análise comparativa com o relatório anterior.',
        },
        {
          item_ref: '7.6.3 e 7.6.4',
          codigo: '107138-6',
          grau: 2,
          tipo: 'M',
          descricao:
            'Garantir que o médico considere os dados de prontuários transferidos na elaboração do relatório analítico, e que informe no relatório caso não os tenha recebido ou considere as informações insuficientes.',
        },
        {
          item_ref: '7.6.5',
          codigo: '107139-4',
          grau: 2,
          tipo: 'M',
          descricao:
            'Apresentar e discutir o relatório analítico com os responsáveis por segurança e saúde, incluindo a CIPA quando existente, para adoção de medidas de prevenção.',
        },
        {
          item_ref: '7.7.1',
          codigo: '107140-8',
          grau: 4,
          tipo: 'M',
          descricao:
            'Nas organizações dispensadas do PCMSO (MEI/ME/EPP, conforme item 1.8.6 da NR-01), realizar e financiar os exames médicos admissional, demissional e periódico bienal dos empregados.',
        },
        {
          item_ref: '7.7.1.1',
          codigo: '107141-6',
          grau: 2,
          tipo: 'M',
          descricao:
            'Encaminhar os empregados a médico do trabalho ou serviço especializado em medicina ocupacional devidamente registrado.',
        },
        {
          item_ref: '7.7.3',
          codigo: '107142-4',
          grau: 2,
          tipo: 'M',
          descricao:
            'Garantir a emissão do ASO em cada exame clínico ocupacional realizado nessas organizações dispensadas do PCMSO, disponibilizado ao empregado em meio físico quando solicitado.',
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
        rec.set('observacao', '')
        app.save(rec)
      })
    }
  },
  (app) => {
    try {
      const tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-07' && organizacao_id = ''",
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
