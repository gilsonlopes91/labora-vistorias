migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-13' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set(
        'nome',
        'NR-13 — Caldeiras, Vasos de Pressão, Tubulações e Tanques Metálicos de Armazenamento',
      )
      tipoRec.set('nr_referencia', 'NR-13')
      tipoRec.set(
        'descricao',
        'Checklist oficial da NR-13, com item/código/grau/tipo extraídos do Anexo II da NR-28. ' +
          'Cálculo de multa pelo Anexo I da NR-28. Dado o volume de itens (116) e a natureza técnica ' +
          'crítica da norma (equipamentos com risco de explosão), TODAS as descrições foram redigidas ' +
          'a partir de conhecimento geral da estrutura da NR-13, sem confirmação linha a linha do texto ' +
          'vigente — revisão obrigatória com a fonte oficial (gov.br) antes de qualquer uso em laudo real.',
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
      'Descrição escrita a partir de conhecimento geral da estrutura da NR-13, sem confirmação linha a linha do texto vigente — revisão obrigatória com a fonte oficial antes de usar em laudo real.'

    if (!jaTemItens) {
      const itens = [
        {
          item_ref: '13.1.4, alínea a',
          codigo: '113100-1',
          grau: 4,
          tipo: 'S',
          descricao:
            'Cumprir a obrigação do empregador quanto à segurança de caldeiras, vasos de pressão e tubulações prevista na alínea "a" do item 13.1.4.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.4, alínea b',
          codigo: '113101-0',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir a obrigação do empregador prevista na alínea "b" do item 13.1.4.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.4, alínea c',
          codigo: '113102-8',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir a obrigação do empregador prevista na alínea "c" do item 13.1.4.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.4, alínea d',
          codigo: '113103-6',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir a obrigação do empregador prevista na alínea "d" do item 13.1.4.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.4, alínea e',
          codigo: '113104-4',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir a obrigação do empregador prevista na alínea "e" do item 13.1.4.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.5',
          codigo: '113105-2',
          grau: 1,
          tipo: 'S',
          descricao:
            'Manter o Prontuário do equipamento (caldeira, vaso de pressão ou tubulação) atualizado e disponível.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.5.1',
          codigo: '113106-0',
          grau: 1,
          tipo: 'S',
          descricao:
            'Manter no Prontuário a documentação complementar exigida quando o equipamento não possuir código de projeto original.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.6, alínea a',
          codigo: '113002-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Incluir no Prontuário o código de projeto adotado na construção do equipamento.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.6, alínea b',
          codigo: '113107-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Incluir no Prontuário as características funcionais e os dados de projeto do equipamento.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.6, alínea c',
          codigo: '113108-7',
          grau: 3,
          tipo: 'S',
          descricao: 'Incluir no Prontuário os desenhos e especificações técnicas do equipamento.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.6, alínea d',
          codigo: '113109-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Incluir no Prontuário a documentação de dispositivos de segurança instalados no equipamento.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.6, alínea e',
          codigo: '113110-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Incluir no Prontuário os registros de intervenções (reparos, alterações, inspeções) realizados no equipamento.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.6.1',
          codigo: '113006-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Complementar o Prontuário com a documentação prevista para os casos de equipamentos usados ou sem código de projeto.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.6.3',
          codigo: '113111-7',
          grau: 1,
          tipo: 'S',
          descricao:
            'Manter disponíveis os demais documentos técnicos complementares exigidos para compor o Prontuário.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.7, alínea a',
          codigo: '113112-5',
          grau: 2,
          tipo: 'S',
          descricao:
            'Manter Registro de Segurança do equipamento contendo o histórico de inspeções.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.7, alínea b',
          codigo: '113113-3',
          grau: 2,
          tipo: 'S',
          descricao:
            'Manter no Registro de Segurança as intervenções e ocorrências relevantes do equipamento.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.7.1',
          codigo: '113114-1',
          grau: 2,
          tipo: 'S',
          descricao:
            'Manter o Registro de Segurança sempre atualizado e disponível no local do equipamento.',
          secao: '13.1 — Disposições gerais',
        },
        {
          item_ref: '13.1.8',
          codigo: '113115-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Disponibilizar o Registro de Segurança aos trabalhadores envolvidos na operação e ao órgão fiscalizador do trabalho.',
          secao: '13.1 — Disposições gerais',
        },

        {
          item_ref: '13.2.1',
          codigo: '113127-3',
          grau: 2,
          tipo: 'S',
          descricao:
            'Aplicar as disposições da NR-13 relativas a caldeiras a vapor conforme o campo de aplicação do item 13.2.',
          secao: '13.2 — Caldeiras a vapor',
        },
        {
          item_ref: '13.2.3, alínea a',
          codigo: '113128-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Classificar corretamente a caldeira quanto à categoria conforme os critérios da alínea "a" do item 13.2.3 (PMTA x volume).',
          secao: '13.2 — Caldeiras a vapor',
        },
        {
          item_ref: '13.2.3, alínea b',
          codigo: '113129-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Classificar corretamente a caldeira quanto à categoria conforme a alínea "b" do item 13.2.3.',
          secao: '13.2 — Caldeiras a vapor',
        },
        {
          item_ref: '13.2.3, alínea c',
          codigo: '113130-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Classificar corretamente a caldeira quanto à categoria conforme a alínea "c" do item 13.2.3.',
          secao: '13.2 — Caldeiras a vapor',
        },
        {
          item_ref: '13.2.3, alínea d',
          codigo: '113131-1',
          grau: 4,
          tipo: 'S',
          descricao:
            'Classificar corretamente a caldeira quanto à categoria conforme a alínea "d" do item 13.2.3.',
          secao: '13.2 — Caldeiras a vapor',
        },
        {
          item_ref: '13.2.3, alínea e',
          codigo: '113132-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Classificar corretamente a caldeira quanto à categoria conforme a alínea "e" do item 13.2.3.',
          secao: '13.2 — Caldeiras a vapor',
        },
        {
          item_ref: '13.2.3, alínea f',
          codigo: '113133-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Classificar corretamente a caldeira quanto à categoria conforme a alínea "f" do item 13.2.3.',
          secao: '13.2 — Caldeiras a vapor',
        },
        {
          item_ref: '13.2.4, alínea a',
          codigo: '113013-7',
          grau: 4,
          tipo: 'S',
          descricao:
            'Dotar a caldeira de válvula de segurança com capacidade de descarga adequada, conforme a alínea "a" do item 13.2.4.',
          secao: '13.2 — Caldeiras a vapor',
        },
        {
          item_ref: '13.2.4, alínea b',
          codigo: '113134-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Dotar a caldeira de manômetro em condições adequadas de uso, conforme a alínea "b" do item 13.2.4.',
          secao: '13.2 — Caldeiras a vapor',
        },
        {
          item_ref: '13.2.4, alínea c',
          codigo: '113135-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Dotar a caldeira de indicador de nível de água em condições adequadas, conforme a alínea "c" do item 13.2.4.',
          secao: '13.2 — Caldeiras a vapor',
        },
        {
          item_ref: '13.2.4, alínea d',
          codigo: '113136-2',
          grau: 4,
          tipo: 'S',
          descricao:
            'Dotar a caldeira de sistema de extração de fundo, conforme a alínea "d" do item 13.2.4.',
          secao: '13.2 — Caldeiras a vapor',
        },
        {
          item_ref: '13.2.4, alínea e',
          codigo: '113137-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Dotar a caldeira de dispositivo de controle de nível/alimentação de água, conforme a alínea "e" do item 13.2.4.',
          secao: '13.2 — Caldeiras a vapor',
        },
        {
          item_ref: '13.2.4, alínea f',
          codigo: '113014-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Dotar a caldeira de sistema de controle de chama/combustão, conforme a alínea "f" do item 13.2.4.',
          secao: '13.2 — Caldeiras a vapor',
        },
        {
          item_ref: '13.2.4, alínea g',
          codigo: '113138-9',
          grau: 4,
          tipo: 'S',
          descricao:
            'Dotar a caldeira dos demais dispositivos de segurança obrigatórios previstos na alínea "g" do item 13.2.4.',
          secao: '13.2 — Caldeiras a vapor',
        },
        {
          item_ref: '13.2.4, alínea h',
          codigo: '113139-7',
          grau: 4,
          tipo: 'S',
          descricao:
            'Dotar a caldeira dos demais dispositivos de segurança obrigatórios previstos na alínea "h" do item 13.2.4.',
          secao: '13.2 — Caldeiras a vapor',
        },
        {
          item_ref: '13.2.7',
          codigo: '113140-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Manter os dispositivos de segurança da caldeira calibrados, aferidos e em condições operacionais adequadas.',
          secao: '13.2 — Caldeiras a vapor',
        },

        {
          item_ref: '13.3.1',
          codigo: '113016-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Respeitar a distância mínima de segurança entre a caldeira e limites de propriedade, vias públicas e outras instalações.',
          secao: '13.3 — Instalação de caldeiras',
        },
        {
          item_ref: '13.3.2',
          codigo: '113145-1',
          grau: 4,
          tipo: 'S',
          descricao:
            'Construir a casa de caldeiras com materiais resistentes ao fogo, conforme exigido no item 13.3.2.',
          secao: '13.3 — Instalação de caldeiras',
        },
        {
          item_ref: '13.3.3',
          codigo: '113146-0',
          grau: 3,
          tipo: 'S',
          descricao: 'Prover a casa de caldeiras de saídas independentes e desobstruídas.',
          secao: '13.3 — Instalação de caldeiras',
        },
        {
          item_ref: '13.3.4',
          codigo: '113147-8',
          grau: 4,
          tipo: 'S',
          descricao: 'Prover ventilação permanente e adequada na casa de caldeiras.',
          secao: '13.3 — Instalação de caldeiras',
        },
        {
          item_ref: '13.3.7, alínea a',
          codigo: '113148-6',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir a exigência construtiva prevista na alínea "a" do item 13.3.7 para a casa de caldeiras.',
          secao: '13.3 — Instalação de caldeiras',
        },
        {
          item_ref: '13.3.7, alínea b',
          codigo: '113149-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir a exigência construtiva prevista na alínea "b" do item 13.3.7 para a casa de caldeiras.',
          secao: '13.3 — Instalação de caldeiras',
        },
        {
          item_ref: '13.3.7, alínea c',
          codigo: '113150-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir a exigência construtiva prevista na alínea "c" do item 13.3.7 para a casa de caldeiras.',
          secao: '13.3 — Instalação de caldeiras',
        },
        {
          item_ref: '13.3.9',
          codigo: '113151-6',
          grau: 3,
          tipo: 'S',
          descricao: 'Manter acesso e circulação livres e seguros ao redor da caldeira.',
          secao: '13.3 — Instalação de caldeiras',
        },
        {
          item_ref: '13.3.10',
          codigo: '113141-9',
          grau: 1,
          tipo: 'S',
          descricao:
            'Sinalizar adequadamente a área de instalação da caldeira quanto aos riscos existentes.',
          secao: '13.3 — Instalação de caldeiras',
        },
        {
          item_ref: '13.3.11',
          codigo: '113142-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Armazenar o combustível da caldeira em local seguro e distante conforme exigido pela norma.',
          secao: '13.3 — Instalação de caldeiras',
        },
        {
          item_ref: '13.3.12, alínea a',
          codigo: '113143-5',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir a exigência de instalação prevista na alínea "a" do item 13.3.12.',
          secao: '13.3 — Instalação de caldeiras',
        },
        {
          item_ref: '13.3.12, alínea b',
          codigo: '113144-3',
          grau: 4,
          tipo: 'S',
          descricao: 'Cumprir a exigência de instalação prevista na alínea "b" do item 13.3.12.',
          secao: '13.3 — Instalação de caldeiras',
        },

        {
          item_ref: '13.4.1',
          codigo: '113152-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Assegurar que a caldeira seja operada apenas por operador qualificado/habilitado conforme exigido na norma.',
          secao: '13.4 — Segurança na operação',
        },
        {
          item_ref: '13.4.2',
          codigo: '113023-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Manter Livro de Registro de Segurança com anotações diárias das ocorrências relevantes da caldeira.',
          secao: '13.4 — Segurança na operação',
        },
        {
          item_ref: '13.4.3, alínea a',
          codigo: '113153-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Testar periodicamente os dispositivos de segurança da caldeira, conforme a alínea "a" do item 13.4.3.',
          secao: '13.4 — Segurança na operação',
        },
        {
          item_ref: '13.4.3, alínea b',
          codigo: '113154-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Testar periodicamente os dispositivos de segurança da caldeira, conforme a alínea "b" do item 13.4.3.',
          secao: '13.4 — Segurança na operação',
        },
        {
          item_ref: '13.4.4',
          codigo: '113155-9',
          grau: 3,
          tipo: 'S',
          descricao: 'Manter instruções de operação da caldeira afixadas em local visível.',
          secao: '13.4 — Segurança na operação',
        },
        {
          item_ref: '13.4.5',
          codigo: '113156-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Paralisar a caldeira imediatamente diante de situação de risco grave e iminente.',
          secao: '13.4 — Segurança na operação',
        },

        {
          item_ref: '13.5.2',
          codigo: '113160-5',
          grau: 4,
          tipo: 'S',
          descricao:
            'Realizar a manutenção da caldeira somente por profissional habilitado/qualificado conforme exigido na norma.',
          secao: '13.5 — Manutenção',
        },
        {
          item_ref: '13.5.3',
          codigo: '113161-3',
          grau: 4,
          tipo: 'S',
          descricao:
            'Executar a manutenção conforme o código de projeto e as normas técnicas aplicáveis ao equipamento.',
          secao: '13.5 — Manutenção',
        },
        {
          item_ref: '13.5.6',
          codigo: '113027-7',
          grau: 4,
          tipo: 'S',
          descricao: 'Realizar manutenção preventiva periódica da caldeira, conforme item 13.5.6.',
          secao: '13.5 — Manutenção',
        },
        {
          item_ref: '13.5.7',
          codigo: '113028-5',
          grau: 4,
          tipo: 'S',
          descricao: 'Realizar manutenção corretiva adequada da caldeira, conforme item 13.5.7.',
          secao: '13.5 — Manutenção',
        },
        {
          item_ref: '13.5.8',
          codigo: '113029-3',
          grau: 4,
          tipo: 'S',
          descricao:
            'Registrar as intervenções de manutenção realizadas na caldeira, conforme item 13.5.8.',
          secao: '13.5 — Manutenção',
        },
        {
          item_ref: '13.5.9',
          codigo: '113162-1',
          grau: 4,
          tipo: 'S',
          descricao:
            'Realizar teste hidrostático após reparo ou alteração relevante na caldeira, quando exigido.',
          secao: '13.5 — Manutenção',
        },
        {
          item_ref: '13.5.11',
          codigo: '113157-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Utilizar peças e materiais de reposição compatíveis com as especificações do equipamento.',
          secao: '13.5 — Manutenção',
        },
        {
          item_ref: '13.5.12',
          codigo: '113158-3',
          grau: 1,
          tipo: 'S',
          descricao:
            'Registrar no Prontuário/Registro de Segurança as manutenções realizadas na caldeira.',
          secao: '13.5 — Manutenção',
        },
        {
          item_ref: '13.5.13',
          codigo: '113159-1',
          grau: 2,
          tipo: 'S',
          descricao:
            'Assegurar a qualificação/certificação dos soldadores responsáveis por reparos na caldeira.',
          secao: '13.5 — Manutenção',
        },
        {
          item_ref: '13.5.14',
          codigo: '113031-5',
          grau: 1,
          tipo: 'S',
          descricao:
            'Paralisar a caldeira durante a execução de serviços de manutenção, conforme exigido no item 13.5.14.',
          secao: '13.5 — Manutenção',
        },

        {
          item_ref: '13.6.2, alínea a',
          codigo: '113163-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Realizar a inspeção de segurança inicial da caldeira, conforme a alínea "a" do item 13.6.2.',
          secao: '13.6 — Inspeção de segurança de caldeiras',
        },
        {
          item_ref: '13.6.2, alínea b',
          codigo: '113164-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Realizar a inspeção de segurança periódica da caldeira, conforme a alínea "b" do item 13.6.2.',
          secao: '13.6 — Inspeção de segurança de caldeiras',
        },
        {
          item_ref: '13.6.2, alínea c',
          codigo: '113165-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Realizar a inspeção de segurança extraordinária da caldeira, conforme a alínea "c" do item 13.6.2.',
          secao: '13.6 — Inspeção de segurança de caldeiras',
        },
        {
          item_ref: '13.6.3',
          codigo: '113166-4',
          grau: 1,
          tipo: 'S',
          descricao:
            'Respeitar o prazo máximo entre inspeções internas da caldeira, conforme a categoria do equipamento.',
          secao: '13.6 — Inspeção de segurança de caldeiras',
        },
        {
          item_ref: '13.6.3.1',
          codigo: '113167-2',
          grau: 1,
          tipo: 'S',
          descricao:
            'Respeitar o prazo máximo entre inspeções externas da caldeira, conforme a categoria do equipamento.',
          secao: '13.6 — Inspeção de segurança de caldeiras',
        },
        {
          item_ref: '13.6.4, alínea a',
          codigo: '113168-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Incluir no relatório de inspeção da caldeira o conteúdo mínimo previsto na alínea "a" do item 13.6.4.',
          secao: '13.6 — Inspeção de segurança de caldeiras',
        },
        {
          item_ref: '13.6.4, alínea b',
          codigo: '113169-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Incluir no relatório de inspeção o conteúdo mínimo previsto na alínea "b" do item 13.6.4.',
          secao: '13.6 — Inspeção de segurança de caldeiras',
        },
        {
          item_ref: '13.6.4, alínea c',
          codigo: '113170-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Incluir no relatório de inspeção o conteúdo mínimo previsto na alínea "c" do item 13.6.4.',
          secao: '13.6 — Inspeção de segurança de caldeiras',
        },
        {
          item_ref: '13.6.4, alínea d',
          codigo: '113171-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Incluir no relatório de inspeção o conteúdo mínimo previsto na alínea "d" do item 13.6.4.',
          secao: '13.6 — Inspeção de segurança de caldeiras',
        },
        {
          item_ref: '13.6.4, alínea e',
          codigo: '113172-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Incluir no relatório de inspeção o conteúdo mínimo previsto na alínea "e" do item 13.6.4.',
          secao: '13.6 — Inspeção de segurança de caldeiras',
        },
        {
          item_ref: '13.6.4.1',
          codigo: '113173-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Assinar o relatório de inspeção por Profissional Habilitado (PH) responsável.',
          secao: '13.6 — Inspeção de segurança de caldeiras',
        },
        {
          item_ref: '13.6.4.2',
          codigo: '113174-5',
          grau: 1,
          tipo: 'S',
          descricao:
            'Manter os relatórios de inspeção arquivados junto ao Prontuário do equipamento.',
          secao: '13.6 — Inspeção de segurança de caldeiras',
        },
        {
          item_ref: '13.6.5, alínea a',
          codigo: '113175-3',
          grau: 2,
          tipo: 'S',
          descricao:
            'Adotar as providências exigidas diante de não conformidade identificada na inspeção, conforme a alínea "a" do item 13.6.5.',
          secao: '13.6 — Inspeção de segurança de caldeiras',
        },
        {
          item_ref: '13.6.5, alínea b',
          codigo: '113176-1',
          grau: 2,
          tipo: 'S',
          descricao:
            'Adotar as providências exigidas diante de não conformidade identificada na inspeção, conforme a alínea "b" do item 13.6.5.',
          secao: '13.6 — Inspeção de segurança de caldeiras',
        },
        {
          item_ref: '13.6.6',
          codigo: '113177-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Assegurar a responsabilidade técnica de Profissional Habilitado (PH) pela inspeção de segurança da caldeira.',
          secao: '13.6 — Inspeção de segurança de caldeiras',
        },

        {
          item_ref: '13.7.1',
          codigo: '113042-0',
          grau: 2,
          tipo: 'S',
          descricao:
            'Aplicar as disposições da NR-13 relativas a vasos de pressão conforme o campo de aplicação do item 13.7.',
          secao: '13.7 — Vasos de pressão',
        },
        {
          item_ref: '13.7.2, alínea a',
          codigo: '113178-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Classificar corretamente o vaso de pressão quanto à categoria, conforme a alínea "a" do item 13.7.2 (grupo de fluido x PMTA x volume).',
          secao: '13.7 — Vasos de pressão',
        },
        {
          item_ref: '13.7.2, alínea b',
          codigo: '113043-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Classificar corretamente o vaso de pressão quanto à categoria, conforme a alínea "b" do item 13.7.2.',
          secao: '13.7 — Vasos de pressão',
        },
        {
          item_ref: '13.7.2, alínea c',
          codigo: '113179-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Classificar corretamente o vaso de pressão quanto à categoria, conforme a alínea "c" do item 13.7.2.',
          secao: '13.7 — Vasos de pressão',
        },
        {
          item_ref: '13.7.2, alínea d',
          codigo: '113180-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Classificar corretamente o vaso de pressão quanto à categoria, conforme a alínea "d" do item 13.7.2.',
          secao: '13.7 — Vasos de pressão',
        },
        {
          item_ref: '13.7.2, alínea e',
          codigo: '113181-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Classificar corretamente o vaso de pressão quanto à categoria, conforme a alínea "e" do item 13.7.2.',
          secao: '13.7 — Vasos de pressão',
        },
        {
          item_ref: '13.7.3',
          codigo: '113182-6',
          grau: 4,
          tipo: 'S',
          descricao:
            'Manter a placa de identificação do vaso de pressão afixada e legível, com os dados exigidos.',
          secao: '13.7 — Vasos de pressão',
        },
        {
          item_ref: '13.7.6',
          codigo: '113183-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Dotar o vaso de pressão de válvula de segurança calibrada e em condições adequadas de uso.',
          secao: '13.7 — Vasos de pressão',
        },
        {
          item_ref: '13.7.7',
          codigo: '113184-2',
          grau: 2,
          tipo: 'S',
          descricao:
            'Dotar o vaso de pressão dos demais dispositivos de segurança exigidos (manômetro, disco de ruptura etc.).',
          secao: '13.7 — Vasos de pressão',
        },

        {
          item_ref: '13.8.1',
          codigo: '113046-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Realizar a inspeção de segurança inicial do vaso de pressão antes de sua entrada em operação.',
          secao: '13.8 — Inspeção de segurança de vasos de pressão',
        },
        {
          item_ref: '13.8.2',
          codigo: '113047-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Respeitar o prazo máximo entre inspeções periódicas do vaso de pressão, conforme sua categoria.',
          secao: '13.8 — Inspeção de segurança de vasos de pressão',
        },
        {
          item_ref: '13.8.2.1',
          codigo: '113188-5',
          grau: 4,
          tipo: 'S',
          descricao:
            'Respeitar o prazo específico de inspeção periódica previsto no item 13.8.2.1 para vasos enquadrados nesse critério.',
          secao: '13.8 — Inspeção de segurança de vasos de pressão',
        },
        {
          item_ref: '13.8.3',
          codigo: '113048-0',
          grau: 4,
          tipo: 'S',
          descricao:
            'Realizar inspeção de segurança extraordinária do vaso de pressão nas situações previstas no item 13.8.3.',
          secao: '13.8 — Inspeção de segurança de vasos de pressão',
        },
        {
          item_ref: '13.8.6, alínea a',
          codigo: '113189-3',
          grau: 2,
          tipo: 'S',
          descricao:
            'Realizar o exame interno do vaso de pressão na inspeção, conforme a alínea "a" do item 13.8.6.',
          secao: '13.8 — Inspeção de segurança de vasos de pressão',
        },
        {
          item_ref: '13.8.6, alínea b',
          codigo: '113190-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Realizar o exame externo do vaso de pressão na inspeção, conforme a alínea "b" do item 13.8.6.',
          secao: '13.8 — Inspeção de segurança de vasos de pressão',
        },
        {
          item_ref: '13.8.6, alínea c',
          codigo: '113191-5',
          grau: 3,
          tipo: 'S',
          descricao:
            'Realizar o teste hidrostático do vaso de pressão na inspeção, conforme a alínea "c" do item 13.8.6.',
          secao: '13.8 — Inspeção de segurança de vasos de pressão',
        },
        {
          item_ref: '13.8.8',
          codigo: '113192-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Emitir relatório de inspeção do vaso de pressão com o conteúdo mínimo exigido pela norma.',
          secao: '13.8 — Inspeção de segurança de vasos de pressão',
        },
        {
          item_ref: '13.8.9',
          codigo: '113193-1',
          grau: 1,
          tipo: 'S',
          descricao:
            'Assegurar que o relatório de inspeção do vaso de pressão seja assinado por Profissional Habilitado (PH).',
          secao: '13.8 — Inspeção de segurança de vasos de pressão',
        },
        {
          item_ref: '13.8.10',
          codigo: '113185-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Adotar as providências exigidas quando a inspeção reprovar o vaso de pressão para operação.',
          secao: '13.8 — Inspeção de segurança de vasos de pressão',
        },
        {
          item_ref: '13.8.11, alínea a',
          codigo: '113186-9',
          grau: 4,
          tipo: 'S',
          descricao:
            'Cumprir as condições para dispensa/prorrogação do prazo de inspeção do vaso de pressão, conforme a alínea "a" do item 13.8.11.',
          secao: '13.8 — Inspeção de segurança de vasos de pressão',
        },
        {
          item_ref: '13.8.11, alínea b',
          codigo: '113187-7',
          grau: 4,
          tipo: 'S',
          descricao:
            'Cumprir as condições para dispensa/prorrogação do prazo de inspeção do vaso de pressão, conforme a alínea "b" do item 13.8.11.',
          secao: '13.8 — Inspeção de segurança de vasos de pressão',
        },

        {
          item_ref: '13.9.1',
          codigo: '113194-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Aplicar as disposições da NR-13 às tubulações interligadas a caldeiras e vasos de pressão, conforme o campo de aplicação do item 13.9.',
          secao: '13.9 — Tubulações',
        },
        {
          item_ref: '13.9.2',
          codigo: '113053-6',
          grau: 3,
          tipo: 'S',
          descricao: 'Classificar corretamente a tubulação quanto à classe de fluido conduzido.',
          secao: '13.9 — Tubulações',
        },
        {
          item_ref: '13.9.3, alínea a',
          codigo: '113195-8',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir as exigências de projeto/inspeção da tubulação previstas na alínea "a" do item 13.9.3.',
          secao: '13.9 — Tubulações',
        },
        {
          item_ref: '13.9.3, alínea b',
          codigo: '113196-6',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir as exigências de projeto/inspeção da tubulação previstas na alínea "b" do item 13.9.3.',
          secao: '13.9 — Tubulações',
        },
        {
          item_ref: '13.9.3, alínea c',
          codigo: '113197-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Cumprir as exigências de projeto/inspeção da tubulação previstas na alínea "c" do item 13.9.3.',
          secao: '13.9 — Tubulações',
        },
        {
          item_ref: '13.9.4',
          codigo: '113198-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Manter a identificação da tubulação (classe, fluido, sentido de fluxo) visível e legível.',
          secao: '13.9 — Tubulações',
        },
        {
          item_ref: '13.9.5',
          codigo: '113199-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Realizar a manutenção e a inspeção periódica da tubulação conforme sua classe de risco.',
          secao: '13.9 — Tubulações',
        },

        {
          item_ref: '13.10.2',
          codigo: '113116-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Aplicar as disposições da NR-13 aos tanques metálicos de armazenamento conforme o campo de aplicação do item 13.10.',
          secao: '13.10 — Tanques metálicos de armazenamento',
        },
        {
          item_ref: '13.10.3',
          codigo: '113200-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Manter a documentação de projeto do tanque metálico de armazenamento conforme exigido no item 13.10.3.',
          secao: '13.10 — Tanques metálicos de armazenamento',
        },
        {
          item_ref: '13.10.3.1',
          codigo: '113117-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir a exigência complementar de projeto/documentação prevista no item 13.10.3.1.',
          secao: '13.10 — Tanques metálicos de armazenamento',
        },
        {
          item_ref: '13.10.3.2',
          codigo: '113118-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir a exigência complementar de projeto/documentação prevista no item 13.10.3.2.',
          secao: '13.10 — Tanques metálicos de armazenamento',
        },
        {
          item_ref: '13.10.3.3',
          codigo: '113119-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir a exigência complementar de projeto/documentação prevista no item 13.10.3.3.',
          secao: '13.10 — Tanques metálicos de armazenamento',
        },
        {
          item_ref: '13.10.3.4',
          codigo: '113120-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir a exigência complementar de projeto/documentação prevista no item 13.10.3.4.',
          secao: '13.10 — Tanques metálicos de armazenamento',
        },
        {
          item_ref: '13.10.3.6',
          codigo: '113121-4',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir a exigência complementar de projeto/documentação prevista no item 13.10.3.6.',
          secao: '13.10 — Tanques metálicos de armazenamento',
        },
        {
          item_ref: '13.10.3.7',
          codigo: '113122-2',
          grau: 3,
          tipo: 'S',
          descricao:
            'Cumprir a exigência complementar de projeto/documentação prevista no item 13.10.3.7.',
          secao: '13.10 — Tanques metálicos de armazenamento',
        },
        {
          item_ref: '13.10.4',
          codigo: '113123-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Realizar a inspeção de segurança do tanque metálico de armazenamento conforme exigido no item 13.10.4.',
          secao: '13.10 — Tanques metálicos de armazenamento',
        },
        {
          item_ref: '13.10.5',
          codigo: '113124-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Respeitar os prazos máximos entre inspeções do tanque metálico de armazenamento.',
          secao: '13.10 — Tanques metálicos de armazenamento',
        },
        {
          item_ref: '13.10.7',
          codigo: '113125-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Emitir relatório de inspeção do tanque metálico de armazenamento com o conteúdo mínimo exigido.',
          secao: '13.10 — Tanques metálicos de armazenamento',
        },
        {
          item_ref: '13.10.8',
          codigo: '113126-5',
          grau: 2,
          tipo: 'S',
          descricao:
            'Assegurar a responsabilidade técnica de Profissional Habilitado (PH) pela inspeção do tanque metálico de armazenamento.',
          secao: '13.10 — Tanques metálicos de armazenamento',
        },
        {
          item_ref: '13.10.9',
          codigo: '113070-6',
          grau: 1,
          tipo: 'S',
          descricao:
            'Cumprir as demais disposições complementares relativas aos tanques metálicos de armazenamento previstas no item 13.10.9.',
          secao: '13.10 — Tanques metálicos de armazenamento',
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
        "nr_referencia = 'NR-13' && organizacao_id = ''",
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
