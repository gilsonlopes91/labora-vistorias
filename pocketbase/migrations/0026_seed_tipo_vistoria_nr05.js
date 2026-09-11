migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-05' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-05 — Comissão Interna de Prevenção de Acidentes e de Assédio (CIPA)')
      tipoRec.set('nr_referencia', 'NR-05')
      tipoRec.set(
        'descricao',
        'Checklist oficial da NR-05, com itens e classificação (grau/tipo) extraídos do Anexo II ' +
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
          item_ref: '5.2.1, 5.8.1 e 5.8.1.1',
          codigo: '205113-3',
          grau: 4,
          tipo: 'S',
          descricao:
            'Constituir e manter a CIPA na organização, com empregados regidos pela CLT, e, quando aplicável, a CIPA centralizada ou própria da prestadora de serviços.',
        },
        {
          item_ref: '5.3.2, alíneas "a", "b" e "c"',
          codigo: '205114-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Disponibilizar aos membros da CIPA os meios e o tempo necessários ao desempenho de suas atribuições, permitir a colaboração dos demais trabalhadores nas ações da comissão e fornecer as informações solicitadas.',
        },
        {
          item_ref: '5.4.1',
          codigo: '205115-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Constituir CIPA por estabelecimento, com representantes da organização e dos empregados, conforme o dimensionamento previsto na norma.',
        },
        {
          item_ref: '5.4.2',
          codigo: '205116-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Nas organizações com atividade sazonal, dimensionar a CIPA pela média aritmética do número de trabalhadores do ano anterior.',
        },
        {
          item_ref: '5.4.3 e 5.4.4',
          codigo: '205117-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Designar os representantes titulares e suplentes da organização na CIPA, no prazo estabelecido.',
        },
        {
          item_ref: '5.4.5',
          codigo: '205118-4',
          grau: 2,
          tipo: 'S',
          descricao: 'Designar o presidente da CIPA dentre os representantes da organização.',
        },
        {
          item_ref: '5.4.6',
          codigo: '205119-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir os prazos e formalidades relativos à posse e à investidura dos membros da CIPA.',
        },
        {
          item_ref: '5.4.7',
          codigo: '205120-6',
          grau: 2,
          tipo: 'S',
          descricao: 'Fornecer cópia das atas de eleição e posse aos membros da CIPA.',
        },
        {
          item_ref: '5.4.8 e 5.4.9',
          codigo: '205121-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Encaminhar a documentação do processo eleitoral ao sindicato da categoria em até 10 dias, quando solicitado.',
        },
        {
          item_ref: '5.4.10',
          codigo: '205122-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Não reduzir o número de representantes nem desativar a CIPA antes do término do mandato.',
        },
        {
          item_ref: '5.4.11, alíneas "a" e "b"',
          codigo: '205123-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Não alterar as atividades normais do trabalhador eleito para a CIPA nem transferi-lo de estabelecimento sem sua anuência.',
        },
        {
          item_ref: '5.4.12',
          codigo: '205124-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Não dispensar arbitrariamente o empregado eleito para cargo de direção da CIPA, desde o registro da candidatura até um ano após o fim do mandato.',
        },
        {
          item_ref: '5.4.13, 5.4.14, 5.8.2 e 5.8.2.3',
          codigo: '205125-7',
          grau: 2,
          tipo: 'S',
          descricao:
            'Nos estabelecimentos não enquadrados no Quadro I e sem SESMT, nomear formalmente um representante para a NR-05 a cada ano (dispensado apenas o MEI); exigência que também se aplica à prestadora de serviços com 5 ou mais empregados no estabelecimento.',
        },
        {
          item_ref: '5.5.1',
          codigo: '205126-5',
          grau: 2,
          tipo: 'S',
          descricao:
            'Convocar as eleições da CIPA com antecedência mínima de 60 dias e comunicar o sindicato da categoria, com confirmação de entrega.',
        },
        {
          item_ref: '5.5.1.1',
          codigo: '205127-3',
          grau: 1,
          tipo: 'S',
          descricao:
            'Garantir a posse imediata dos candidatos quando houver apenas uma chapa inscrita no processo eleitoral.',
        },
        {
          item_ref: '5.5.2 e 5.5.2.1',
          codigo: '205128-1',
          grau: 1,
          tipo: 'S',
          descricao:
            'Organizar o processo eleitoral por meio de comissão eleitoral, com publicação de edital e inscrição de candidaturas.',
        },
        {
          item_ref: '5.5.3, alíneas "a" a "j"',
          codigo: '205129-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir as regras do processo eleitoral: inscrição de candidatos por 15 dias, votação em dia normal de trabalho, voto secreto e apuração acompanhada pelos interessados.',
        },
        {
          item_ref: '5.5.4, 5.5.4.1 e 5.5.4.2',
          codigo: '205130-3',
          grau: 2,
          tipo: 'S',
          descricao:
            'Prorrogar a votação para o dia seguinte quando a participação for inferior a 50% dos empregados, e novamente quando inferior a um terço, comunicando o sindicato da prorrogação.',
        },
        {
          item_ref: '5.5.5.2, 5.5.5.3 e 5.5.5.4',
          codigo: '205131-1',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir os prazos de apuração e divulgação do resultado da eleição e de encaminhamento de eventuais denúncias sobre o processo eleitoral, em até 30 dias.',
        },
        {
          item_ref: '5.5.6',
          codigo: '205132-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Empossar os eleitos conforme o resultado da votação, decidindo empates pelo critério do maior tempo de serviço na organização.',
        },
        {
          item_ref: '5.5.8',
          codigo: '205133-8',
          grau: 2,
          tipo: 'S',
          descricao:
            'Relacionar em ata os candidatos não eleitos, na ordem de votação, para eventual substituição de vacância.',
        },
        {
          item_ref: '5.6.1, 5.6.2, 5.6.2.1, 5.6.3, 5.6.3.1, 5.6.3.2 e 5.6.5',
          codigo: '205134-6',
          grau: 2,
          tipo: 'S',
          descricao:
            'Garantir reuniões ordinárias mensais da CIPA (podendo ser bimestrais em ME/EPP de grau de risco 1 ou 2), realizadas na organização, preferencialmente presenciais, com data e horário acordados entre os membros respeitando os turnos de trabalho; designar secretário para cada reunião e assegurar que as atas sejam assinadas e disponibilizadas aos integrantes, com as deliberações publicadas em quadro de aviso.',
        },
        {
          item_ref: '5.6.4, alíneas "a" e "b"',
          codigo: '205135-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Garantir a realização de reuniões extraordinárias da CIPA em caso de acidente grave ou fatal, ou mediante solicitação dos representantes dos trabalhadores.',
        },
        {
          item_ref: '5.6.6',
          codigo: '205136-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Considerar a perda do mandato do titular que faltar a mais de quatro reuniões ordinárias sem justificativa.',
        },
        {
          item_ref: '5.6.7',
          codigo: '205137-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Preencher a vacância de membro da CIPA pelo respectivo suplente, na ordem de eleição ou indicação.',
        },
        {
          item_ref: '5.6.7.1, 5.6.7.1.1 e 5.6.7.1.2',
          codigo: '205138-9',
          grau: 2,
          tipo: 'S',
          descricao:
            'Realizar eleição extraordinária quando não houver suplentes disponíveis nos primeiros seis meses do mandato, com prazos reduzidos e validação com participação mínima de um terço dos empregados.',
        },
        {
          item_ref: '5.6.7.2',
          codigo: '205139-7',
          grau: 1,
          tipo: 'S',
          descricao:
            'Garantir eleição extraordinária válida mesmo com participação inferior a um terço, quando esgotadas as tentativas de convocação regular.',
        },
        {
          item_ref: '5.6.7.4',
          codigo: '205140-0',
          grau: 2,
          tipo: 'S',
          descricao: 'Substituir o presidente afastado da CIPA no prazo de dois dias úteis.',
        },
        {
          item_ref: '5.6.7.5',
          codigo: '205141-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir as demais formalidades da eleição extraordinária de reposição da CIPA.',
        },
        {
          item_ref: '5.7.1 e 5.7.1.1',
          codigo: '205142-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Promover o treinamento dos membros da CIPA antes da posse, em prazo máximo de 30 dias.',
        },
        {
          item_ref: '5.7.2, alíneas "a" a "g", e 5.7.4.4',
          codigo: '205143-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Garantir que o treinamento da CIPA contemple, no mínimo, os temas exigidos pela norma — ambiente e processo de trabalho, riscos ocupacionais, metodologia de investigação e análise de acidentes, noções de higiene ocupacional, legislação de SST, inclusão de pessoas com deficiência e prevenção e combate ao assédio sexual e a outras formas de violência — podendo considerar o treinamento realizado há menos de dois anos na mesma organização.',
        },
        {
          item_ref: '5.7.4, 5.7.4.1, 5.7.4.2, 5.7.4.3, alíneas "a" e "b", e 5.8.4',
          codigo: '205144-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Garantir a carga horária mínima de treinamento conforme o grau de risco da organização — 8h (grau 1), 12h (grau 2), 16h (grau 3) e 20h (grau 4) —, distribuída em no máximo 8 horas diárias e respeitando a exigência de presencialidade conforme o grau de risco; e, para a prestadora de serviços, treinar seu representante conforme o grau de risco da contratante.',
        },
        {
          item_ref: '5.8.3, 5.8.3.1, 5.8.3.2 e 5.8.7.1',
          codigo: '205145-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Garantir a interação entre os estabelecimentos da organização e da prestadora de serviços contratada, com participação dos representantes desta nas reuniões centralizadas da CIPA.',
        },
        {
          item_ref: '5.8.6 e 5.8.7',
          codigo: '205146-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Exigir da empresa contratada a nomeação de representante para os fins da NR-05 e convidá-la a participar das reuniões da CIPA da contratante.',
        },
        {
          item_ref: '5.9.1',
          codigo: '205147-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Adotar medidas para que as empresas contratadas recebam informações sobre os riscos e as medidas de prevenção previstas no Programa de Gerenciamento de Riscos da contratante.',
        },
        {
          item_ref: '5.9.2',
          codigo: '205148-6',
          grau: 2,
          tipo: 'S',
          descricao: 'Manter a documentação da CIPA no estabelecimento por, no mínimo, 5 anos.',
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
        "nr_referencia = 'NR-05' && organizacao_id = ''",
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
