// Catálogo de modelos de formulário v2 — substitui os 4 fixos originais pelos
// reais da Labora (fichas de campo de higiene ocupacional):
//   Dosimetria de Ruído, Avaliação de Calor, Avaliação de Vibração, Químicos.
// Estrutura fiel às fichas de campo em PDF: dados da amostragem → colaborador →
// equipamento de medição → atividades → registros fotográficos → assinaturas.
// Idempotente: remove os fixos antigos e semeia os novos (só se não existirem).
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('modelos_formulario')

    // 1) Remove TODOS os modelos fixos antigos (catálogo substituído; os
    //    registros de formulário já preenchidos não existem em produção).
    const antigos = app.findRecordsByFilter('modelos_formulario', 'fixo = true', '', 0, 0)
    antigos.forEach((rec) => app.delete(rec))

    // 2) Semeia o catálogo novo.
    const modelos = [
      {
        nome: 'Dosimetria de Ruído',
        descricao:
          'Ficha de campo de dosimetria de ruído (NR-15 Anexo 1) — amostragem com dosímetro no colaborador, turno completo.',
        icone: 'volume-2',
        campos: [
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
          { id: 'f8', tipo: 'texto', nome: 'Matrícula' },
          { id: 'f9', tipo: 'texto', nome: 'Função', obrigatorio: true },
          { id: 'f10', tipo: 'texto', nome: 'GHE/GSE' },
          { id: 'f11', tipo: 'texto', nome: 'Área / setor de trabalho' },
          { id: 'f12', tipo: 'secao', nome: 'Equipamento de medição' },
          { id: 'f13', tipo: 'texto', nome: 'Equipamento (dosímetro)', obrigatorio: true },
          { id: 'f14', tipo: 'texto', nome: 'Número de série' },
          { id: 'f15', tipo: 'texto', nome: 'Fabricante' },
          { id: 'f16', tipo: 'texto', nome: 'Modelo' },
          { id: 'f17', tipo: 'texto', nome: 'Patrimônio' },
          { id: 'f18', tipo: 'secao', nome: 'Atividades' },
          {
            id: 'f19',
            tipo: 'texto_longo',
            nome: 'Descrição das atividades executadas durante a avaliação',
          },
          {
            id: 'f20',
            tipo: 'foto',
            nome: 'Registros fotográficos (calibração, dosímetro no colaborador)',
          },
          { id: 'f21', tipo: 'assinatura', nome: 'Assinatura do funcionário' },
          { id: 'f22', tipo: 'assinatura', nome: 'Assinatura do técnico responsável' },
        ],
      },
      {
        nome: 'Avaliação de Calor',
        descricao:
          'Ficha de campo de avaliação de estresse térmico (NR-15 Anexo 3) — medições WBGT por ponto: úmido, seco, globo e IBUTG.',
        icone: 'thermometer',
        campos: [
          { id: 'f1', tipo: 'secao', nome: 'Dados da amostragem' },
          { id: 'f2', tipo: 'data', nome: 'Data', obrigatorio: true },
          { id: 'f3', tipo: 'hora', nome: 'Horário de início', obrigatorio: true },
          { id: 'f4', tipo: 'hora', nome: 'Horário de término', obrigatorio: true },
          { id: 'f5', tipo: 'secao', nome: 'Colaborador amostrado' },
          { id: 'f6', tipo: 'texto', nome: 'Nome do colaborador', obrigatorio: true },
          { id: 'f7', tipo: 'texto', nome: 'Matrícula' },
          { id: 'f8', tipo: 'texto', nome: 'Função', obrigatorio: true },
          { id: 'f9', tipo: 'texto', nome: 'GHE/GSE' },
          { id: 'f10', tipo: 'texto', nome: 'Área / setor de trabalho' },
          { id: 'f11', tipo: 'secao', nome: 'Equipamento (amostrador)' },
          { id: 'f12', tipo: 'texto', nome: 'Equipamento', obrigatorio: true },
          { id: 'f13', tipo: 'texto', nome: 'Número de série' },
          { id: 'f14', tipo: 'texto', nome: 'Fabricante' },
          { id: 'f15', tipo: 'texto', nome: 'Modelo' },
          { id: 'f16', tipo: 'texto', nome: 'Patrimônio' },
          { id: 'f17', tipo: 'secao', nome: 'Medições WBGT' },
          {
            id: 'f18',
            tipo: 'repetivel',
            nome: 'Pontos de medição',
            subcampos: [
              { id: 's1', tipo: 'texto', nome: 'Ponto' },
              { id: 's2', tipo: 'texto', nome: 'Atividade' },
              { id: 's3', tipo: 'texto', nome: 'Tempo' },
              { id: 's4', tipo: 'numero', nome: 'WET (úmido)', unidade: '°C' },
              { id: 's5', tipo: 'numero', nome: 'DRY (seco)', unidade: '°C' },
              { id: 's6', tipo: 'numero', nome: 'Globo', unidade: '°C' },
              { id: 's7', tipo: 'numero', nome: 'WBGTi (IBUTG i)', unidade: '°C' },
              { id: 's8', tipo: 'numero', nome: 'WBGTo (IBUTG e)', unidade: '°C' },
            ],
          },
          {
            id: 'f19',
            tipo: 'texto_longo',
            nome: 'Descrição das atividades executadas durante a avaliação',
          },
          { id: 'f20', tipo: 'foto', nome: 'Registros fotográficos da medição' },
          { id: 'f21', tipo: 'assinatura', nome: 'Assinatura do funcionário' },
          { id: 'f22', tipo: 'assinatura', nome: 'Assinatura do supervisor imediato' },
          { id: 'f23', tipo: 'assinatura', nome: 'Assinatura do técnico responsável' },
        ],
      },
      {
        nome: 'Avaliação de Vibração',
        descricao:
          'Ficha de campo de avaliação de vibração (NR-15 Anexo 8) — mãos e braços / corpo inteiro, condições do equipamento e tempo de exposição.',
        icone: 'activity',
        campos: [
          { id: 'f1', tipo: 'secao', nome: 'Dados da amostragem' },
          { id: 'f2', tipo: 'data', nome: 'Data', obrigatorio: true },
          { id: 'f3', tipo: 'hora', nome: 'Horário de início', obrigatorio: true },
          { id: 'f4', tipo: 'hora', nome: 'Horário de término', obrigatorio: true },
          { id: 'f5', tipo: 'secao', nome: 'Colaborador amostrado' },
          { id: 'f6', tipo: 'texto', nome: 'Nome do colaborador', obrigatorio: true },
          { id: 'f7', tipo: 'texto', nome: 'Matrícula' },
          { id: 'f8', tipo: 'texto', nome: 'Função', obrigatorio: true },
          { id: 'f9', tipo: 'texto', nome: 'GHE/GSE' },
          { id: 'f10', tipo: 'texto', nome: 'Área / setor de trabalho' },
          { id: 'f11', tipo: 'secao', nome: 'Equipamento de medição' },
          {
            id: 'f12',
            tipo: 'texto',
            nome: 'Equipamento (medidor de vibração humana)',
            obrigatorio: true,
          },
          { id: 'f13', tipo: 'texto', nome: 'Número de série' },
          { id: 'f14', tipo: 'texto', nome: 'Fabricante' },
          { id: 'f15', tipo: 'texto', nome: 'Modelo' },
          { id: 'f16', tipo: 'texto', nome: 'Patrimônio' },
          { id: 'f17', tipo: 'secao', nome: 'Equipamento avaliado' },
          { id: 'f18', tipo: 'texto', nome: 'Equipamento / máquina / veículo', obrigatorio: true },
          {
            id: 'f19',
            tipo: 'sim_nao',
            nome: 'Equipamento compatível com a via de circulação?',
            obrigatorio: true,
          },
          { id: 'f20', tipo: 'sim_nao', nome: 'Ciclo de operação rotineiro?', obrigatorio: true },
          {
            id: 'f21',
            tipo: 'sim_nao',
            nome: 'Existem queixas de colaboradores relacionadas à vibração?',
            obrigatorio: true,
          },
          {
            id: 'f22',
            tipo: 'texto',
            nome: 'Se sim, especificar',
            condicaoCampoId: 'f21',
            condicaoValor: 'Sim',
          },
          { id: 'f23', tipo: 'texto', nome: 'Condições do equipamento' },
          { id: 'f24', tipo: 'texto', nome: 'Duração do ciclo da exposição' },
          { id: 'f25', tipo: 'texto', nome: 'Estimativa de tempo efetivo da exposição diária' },
          { id: 'f26', tipo: 'secao', nome: 'Atividades' },
          {
            id: 'f27',
            tipo: 'texto_longo',
            nome: 'Descrição das atividades executadas durante a avaliação',
          },
          { id: 'f28', tipo: 'foto', nome: 'Registros fotográficos' },
          { id: 'f29', tipo: 'assinatura', nome: 'Assinatura do funcionário' },
          { id: 'f30', tipo: 'assinatura', nome: 'Assinatura do técnico responsável' },
        ],
      },
      {
        nome: 'Químicos',
        descricao:
          'Ficha de campo de amostragem de agentes químicos — pontos de amostragem com bomba, vazão, meio de coleta e método (ex.: NIOSH).',
        icone: 'flask-conical',
        campos: [
          { id: 'f1', tipo: 'secao', nome: 'Dados da campanha' },
          { id: 'f2', tipo: 'texto', nome: 'Empresa / cliente', obrigatorio: true },
          { id: 'f3', tipo: 'texto', nome: 'CNPJ' },
          { id: 'f4', tipo: 'texto', nome: 'Unidade / setor' },
          { id: 'f5', tipo: 'texto', nome: 'Nº da campanha' },
          { id: 'f6', tipo: 'data', nome: 'Data', obrigatorio: true },
          { id: 'f7', tipo: 'texto', nome: 'Técnico', obrigatorio: true },
          { id: 'f8', tipo: 'secao', nome: 'Pontos de amostragem' },
          {
            id: 'f9',
            tipo: 'repetivel',
            nome: 'Pontos de amostragem',
            subcampos: [
              { id: 's1', tipo: 'texto', nome: 'Identificação do ponto' },
              { id: 's2', tipo: 'texto', nome: 'GHE/Função' },
              { id: 's3', tipo: 'texto', nome: 'Setor / posto' },
              { id: 's4', tipo: 'texto', nome: 'Atividade' },
              { id: 's5', tipo: 'texto', nome: 'Agente(s)' },
              { id: 's6', tipo: 'texto', nome: 'Meio de coleta' },
              { id: 's7', tipo: 'texto', nome: 'Método' },
              { id: 's8', tipo: 'texto', nome: 'Bomba (nº série)' },
              { id: 's9', tipo: 'numero', nome: 'Vazão inicial', unidade: 'L/min' },
              { id: 's10', tipo: 'numero', nome: 'Vazão final', unidade: 'L/min' },
              { id: 's11', tipo: 'texto', nome: 'Início' },
              { id: 's12', tipo: 'texto', nome: 'Término' },
              {
                id: 's13',
                tipo: 'selecao',
                nome: 'Ventilação',
                opcoes: ['natural', 'artificial', 'nenhuma'],
              },
              { id: 's14', tipo: 'sim_nao', nome: 'EPC' },
              { id: 's15', tipo: 'sim_nao', nome: 'EPI' },
              { id: 's16', tipo: 'sim_nao', nome: 'Branco de campo' },
              { id: 's17', tipo: 'texto', nome: 'Observações' },
            ],
          },
          { id: 'f10', tipo: 'secao', nome: 'Relatório fotográfico' },
          {
            id: 'f11',
            tipo: 'foto',
            nome: 'Fotos (calibrações, bomba montada, amostrador no funcionário)',
          },
          { id: 'f12', tipo: 'assinatura', nome: 'Assinatura do técnico de campo' },
          { id: 'f13', tipo: 'texto', nome: 'Responsável técnico (ART)' },
        ],
      },
    ]

    for (const m of modelos) {
      let existente
      try {
        existente = app.findFirstRecordByFilter('modelos_formulario', "nome = '" + m.nome + "'")
      } catch (_) {
        existente = null
      }
      if (existente) continue
      const rec = new Record(col)
      rec.set('organizacao_id', '')
      rec.set('nome', m.nome)
      rec.set('descricao', m.descricao)
      rec.set('icone', m.icone)
      rec.set('fixo', true)
      rec.set('ativo', true)
      rec.set('campos', JSON.stringify(m.campos))
      app.save(rec)
    }
  },
  (app) => {
    // down: remove o catálogo v2 (a v2 não tem como restaurar a v1 aqui —
    // a v1 foi substituída; reexecutar 0035 recria a v1 original se preciso)
    for (const nome of [
      'Dosimetria de Ruído',
      'Avaliação de Calor',
      'Avaliação de Vibração',
      'Químicos',
    ]) {
      try {
        const rec = app.findFirstRecordByFilter(
          'modelos_formulario',
          "nome = '" + nome + "' && fixo = true",
        )
        app.delete(rec)
      } catch (_) {
        // já removido
      }
    }
  },
)
