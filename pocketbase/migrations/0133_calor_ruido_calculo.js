// Calor e Ruído com cálculo automático (itens 49 e 50).
// Atualiza os modelos fixos "Avaliação de Calor" e "Dosimetria de Ruído":
// - Calor: tipo de ambiente, vestimenta (Quadro 4 da NR-09), tempo em minutos,
//   taxa metabólica pelo Quadro 3 e carga solar por situação; o campo
//   "Resultado" (calculo_tecnico) calcula IBUTG médio, M médio, nível de ação
//   e limite de exposição.
// - Ruído: critério do dosímetro, jornada, calibração e tempo de amostragem;
//   o campo "Resultado" calcula dose na jornada, NE e NEN.
// Os textos das opções precisam bater com src/lib/higieneOcupacional.ts (o
// cálculo lê os watts de "(… W)" e o acréscimo de "(+… °C)").
// Os ids dos campos mantidos não mudam. Registros já feitos continuam abrindo
// com os campos antigos (campos_snapshot).
migrate(
  (app) => {
    // NR-09, Anexo III, Quadro 3 (igual ao Quadro 2 do Anexo 3 da NR-15).
    const TAXAS = [
      ['Sentado · em repouso', 100],
      ['Sentado · trabalho leve com as mãos', 126],
      ['Sentado · trabalho moderado com as mãos', 153],
      ['Sentado · trabalho pesado com as mãos', 171],
      ['Sentado · trabalho leve com um braço', 162],
      ['Sentado · trabalho moderado com um braço', 198],
      ['Sentado · trabalho pesado com um braço', 234],
      ['Sentado · trabalho leve com dois braços', 216],
      ['Sentado · trabalho moderado com dois braços', 252],
      ['Sentado · trabalho pesado com dois braços', 288],
      ['Sentado · trabalho leve com braços e pernas', 324],
      ['Sentado · trabalho moderado com braços e pernas', 441],
      ['Sentado · trabalho pesado com braços e pernas', 603],
      ['Em pé, agachado ou ajoelhado · em repouso', 126],
      ['Em pé, agachado ou ajoelhado · trabalho leve com as mãos', 153],
      ['Em pé, agachado ou ajoelhado · trabalho moderado com as mãos', 180],
      ['Em pé, agachado ou ajoelhado · trabalho pesado com as mãos', 198],
      ['Em pé, agachado ou ajoelhado · trabalho leve com um braço', 189],
      ['Em pé, agachado ou ajoelhado · trabalho moderado com um braço', 225],
      ['Em pé, agachado ou ajoelhado · trabalho pesado com um braço', 261],
      ['Em pé, agachado ou ajoelhado · trabalho leve com dois braços', 243],
      ['Em pé, agachado ou ajoelhado · trabalho moderado com dois braços', 279],
      ['Em pé, agachado ou ajoelhado · trabalho pesado com dois braços', 315],
      ['Em pé, agachado ou ajoelhado · trabalho leve com o corpo', 351],
      ['Em pé, agachado ou ajoelhado · trabalho moderado com o corpo', 468],
      ['Em pé, agachado ou ajoelhado · trabalho pesado com o corpo', 630],
      ['Andando no plano, sem carga, 2 km/h', 198],
      ['Andando no plano, sem carga, 3 km/h', 252],
      ['Andando no plano, sem carga, 4 km/h', 297],
      ['Andando no plano, sem carga, 5 km/h', 360],
      ['Andando no plano, com 10 kg, 4 km/h', 333],
      ['Andando no plano, com 30 kg, 4 km/h', 450],
      ['Correndo no plano, 9 km/h', 787],
      ['Correndo no plano, 12 km/h', 873],
      ['Correndo no plano, 15 km/h', 990],
      ['Subindo rampa sem carga, 5°, 4 km/h', 324],
      ['Subindo rampa sem carga, 15°, 3 km/h', 378],
      ['Subindo rampa sem carga, 25°, 3 km/h', 540],
      ['Subindo rampa com 20 kg, 15°, 4 km/h', 486],
      ['Subindo rampa com 20 kg, 25°, 4 km/h', 738],
      ['Descendo rampa sem carga, 5°, 5 km/h', 243],
      ['Descendo rampa sem carga, 15°, 5 km/h', 252],
      ['Descendo rampa sem carga, 25°, 5 km/h', 324],
      ['Subindo escada (80 degraus/min), sem carga', 522],
      ['Subindo escada (80 degraus/min), com 20 kg', 648],
      ['Descendo escada (80 degraus/min), sem carga', 279],
      ['Descendo escada (80 degraus/min), com 20 kg', 400],
      ['Trabalho moderado de braços (varrer, almoxarifado)', 320],
      ['Trabalho moderado de levantar ou empurrar', 349],
      ['Empurrar carrinho de mão no plano, com carga', 391],
      ['Carregar pesos ou movimentos vigorosos com os braços (foice)', 495],
      ['Trabalho pesado de levantar, empurrar ou arrastar pesos (pá, valas)', 524],
    ]
    const opcoesTaxa = TAXAS.map((t) => t[0] + ' (' + t[1] + ' W)')
    opcoesTaxa.push('Outra atividade (informar a taxa em W)')

    const NOVOS = {
      'Avaliação de Calor': [
        { id: 'f1', tipo: 'secao', nome: 'Dados da amostragem' },
        { id: 'f2', tipo: 'data', nome: 'Data', obrigatorio: true },
        { id: 'f3', tipo: 'hora', nome: 'Horário de início', obrigatorio: true },
        { id: 'f4', tipo: 'hora', nome: 'Horário de término', obrigatorio: true },
        { id: 'f5', tipo: 'secao', nome: 'Colaborador amostrado' },
        { id: 'f6', tipo: 'texto', nome: 'Nome do colaborador', obrigatorio: true },
        { id: 'f8', tipo: 'texto', nome: 'Função / GHE', obrigatorio: true },
        { id: 'f10', tipo: 'texto', nome: 'Setor' },
        { id: 'f11', tipo: 'secao', nome: 'Equipamento' },
        { id: 'f12', tipo: 'texto', nome: 'Medidor de IBUTG', obrigatorio: true },
        { id: 'f13', tipo: 'texto', nome: 'Modelo / nº de série' },
        { id: 'f17', tipo: 'secao', nome: 'Condições da exposição' },
        {
          id: 'f30',
          tipo: 'selecao',
          nome: 'Tipo de ambiente',
          obrigatorio: true,
          opcoes: [
            'Fechado ou com fonte artificial de calor',
            'Céu aberto sem fonte artificial de calor',
          ],
        },
        {
          id: 'f32',
          tipo: 'selecao',
          nome: 'Vestimenta (Quadro 4 do Anexo III da NR-09)',
          opcoes: [
            'Uniforme de trabalho, calça e camisa de manga comprida (+0 °C)',
            'Macacão de tecido (+0 °C)',
            'Macacão de polipropileno SMS (+0,5 °C)',
            'Macacão de poliolefina (+2 °C)',
            'Vestimenta ou macacão forrado, tecido duplo (+3 °C)',
            'Avental longo de manga comprida impermeável ao vapor (+4 °C)',
            'Macacão impermeável ao vapor (+10 °C)',
            'Macacão impermeável ao vapor sobre a roupa de trabalho (+12 °C)',
          ],
        },
        { id: 'f33', tipo: 'sim_nao', nome: 'A vestimenta tem capuz?' },
        { id: 'f34', tipo: 'secao', nome: 'Medições nos 60 minutos mais críticos' },
        {
          id: 'f18',
          tipo: 'repetivel',
          nome: 'Situações de exposição',
          subcampos: [
            { id: 's1', tipo: 'texto', nome: 'Ponto / situação' },
            { id: 's2', tipo: 'texto', nome: 'Atividade' },
            { id: 's3', tipo: 'numero', nome: 'Tempo nesta situação', unidade: 'min' },
            {
              id: 's11',
              tipo: 'selecao',
              nome: 'Taxa metabólica (Quadro 3 do Anexo III da NR-09)',
              opcoes: opcoesTaxa,
            },
            {
              id: 's12',
              tipo: 'numero',
              nome: 'Taxa metabólica, se escolheu outra atividade',
              unidade: 'W',
            },
            { id: 's10', tipo: 'sim_nao', nome: 'Há carga solar direta?' },
            { id: 's4', tipo: 'numero', nome: 'Bulbo úmido natural (tbn)', unidade: '°C' },
            { id: 's5', tipo: 'numero', nome: 'Bulbo seco (tbs)', unidade: '°C' },
            { id: 's6', tipo: 'numero', nome: 'Globo (tg)', unidade: '°C' },
            {
              id: 's7',
              tipo: 'numero',
              nome: 'IBUTG lido no medidor (se não anotar as temperaturas)',
              unidade: '°C',
            },
          ],
        },
        {
          id: 'f35',
          tipo: 'calculo_tecnico',
          calculo: 'calor',
          nome: 'Resultado',
          origem: {
            pontos: 'f18',
            tempo: 's3',
            tbn: 's4',
            tbs: 's5',
            tg: 's6',
            ibutg: 's7',
            solar: 's10',
            taxa: 's11',
            taxaW: 's12',
            vestimenta: 'f32',
            capuz: 'f33',
            ambiente: 'f30',
          },
        },
        { id: 'f36', tipo: 'secao', nome: 'Registro' },
        { id: 'f19', tipo: 'texto_longo', nome: 'Atividades executadas durante a avaliação' },
        { id: 'f20', tipo: 'foto', nome: 'Fotos da medição' },
        { id: 'f23', tipo: 'assinatura', nome: 'Assinatura do técnico' },
      ],
      'Dosimetria de Ruído': [
        { id: 'f1', tipo: 'secao', nome: 'Dados da amostragem' },
        { id: 'f2', tipo: 'data', nome: 'Data', obrigatorio: true },
        { id: 'f3', tipo: 'hora', nome: 'Horário de início', obrigatorio: true },
        { id: 'f4', tipo: 'hora', nome: 'Horário de término', obrigatorio: true },
        {
          id: 'f5',
          tipo: 'selecao',
          nome: 'Turno',
          opcoes: ['1º turno', '2º turno', '3º turno', 'Administrativo'],
        },
        { id: 'f6', tipo: 'secao', nome: 'Colaborador amostrado' },
        { id: 'f7', tipo: 'texto', nome: 'Nome do colaborador', obrigatorio: true },
        { id: 'f9', tipo: 'texto', nome: 'Função / GHE', obrigatorio: true },
        { id: 'f11', tipo: 'texto', nome: 'Setor' },
        {
          id: 'f27',
          tipo: 'numero',
          nome: 'Jornada de trabalho (tempo de exposição diária)',
          unidade: 'min',
        },
        { id: 'f12', tipo: 'secao', nome: 'Equipamento' },
        { id: 'f13', tipo: 'texto', nome: 'Dosímetro', obrigatorio: true },
        { id: 'f14', tipo: 'texto', nome: 'Modelo / nº de série' },
        {
          id: 'f25',
          tipo: 'selecao',
          nome: 'Critério configurado no dosímetro',
          obrigatorio: true,
          opcoes: ['NR-15 (q = 5)', 'NHO 01 (q = 3)'],
        },
        { id: 'f28', tipo: 'numero', nome: 'Calibração inicial', unidade: 'dB' },
        { id: 'f29', tipo: 'numero', nome: 'Calibração final', unidade: 'dB' },
        { id: 'f18', tipo: 'secao', nome: 'Atividades e resultado' },
        { id: 'f19', tipo: 'texto_longo', nome: 'Atividades executadas durante a avaliação' },
        {
          id: 'f26',
          tipo: 'numero',
          nome: 'Tempo de amostragem (se vazio, usa os horários)',
          unidade: 'min',
        },
        { id: 'f23', tipo: 'numero', nome: 'Dose', unidade: '%' },
        {
          id: 'f24',
          tipo: 'numero',
          nome: 'NEN informado pelo dosímetro (opcional)',
          unidade: 'dB(A)',
        },
        {
          id: 'f30',
          tipo: 'calculo_tecnico',
          calculo: 'ruido',
          nome: 'Resultado',
          origem: {
            criterio: 'f25',
            inicio: 'f3',
            fim: 'f4',
            amostragem: 'f26',
            jornada: 'f27',
            dose: 'f23',
            nen: 'f24',
            calIni: 'f28',
            calFim: 'f29',
          },
        },
        { id: 'f20', tipo: 'foto', nome: 'Fotos (calibração, dosímetro no colaborador)' },
        { id: 'f21', tipo: 'assinatura', nome: 'Assinatura do colaborador' },
        { id: 'f22', tipo: 'assinatura', nome: 'Assinatura do técnico' },
      ],
    }

    for (const nome of Object.keys(NOVOS)) {
      const achados = app.findRecordsByFilter(
        'modelos_formulario',
        "fixo = true && organizacao_id = '' && nome = {:n}",
        '',
        0,
        0,
        { n: nome },
      )
      for (const m of achados) {
        m.set('campos', NOVOS[nome])
        app.save(m)
      }
    }
  },
  () => {
    // Sem volta automática: os modelos anteriores estão na migração 0113.
  },
)
