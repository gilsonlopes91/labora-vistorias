// Seed dos 4 modelos de formulário FIXOS do catálogo (organizacao_id vazio +
// fixo = true). Idempotente: só cria se ainda não existir pelo nome.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('modelos_formulario')

    const modelos = [
      {
        nome: 'Ruído Ocupacional',
        descricao:
          'Avaliação de exposição a ruído conforme NR-15 Anexo 1 — pontos de medição, nível em dB(A), dose e tempo de exposição.',
        icone: 'volume-2',
        campos: [
          { id: 'f1', tipo: 'secao', nome: 'Identificação' },
          { id: 'f2', tipo: 'texto', nome: 'Local / setor avaliado', obrigatorio: true },
          {
            id: 'f3',
            tipo: 'selecao',
            nome: 'Atividade do trabalhador',
            opcoes: ['Fixa', 'Itinerante'],
            obrigatorio: true,
          },
          { id: 'f4', tipo: 'secao', nome: 'Medição' },
          {
            id: 'f5',
            tipo: 'numero',
            nome: 'Nível de pressão sonora',
            unidade: 'dB(A)',
            obrigatorio: true,
          },
          {
            id: 'f6',
            tipo: 'numero',
            nome: 'Tempo de exposição',
            unidade: 'h/dia',
            obrigatorio: true,
          },
          { id: 'f7', tipo: 'numero', nome: 'Dose acumulada', unidade: '%' },
          {
            id: 'f8',
            tipo: 'selecao',
            nome: 'EPI auditivo fornecido',
            opcoes: ['Sim', 'Não'],
            obrigatorio: true,
          },
          {
            id: 'f9',
            tipo: 'condicao',
            nome: 'Tipo de protetor',
            condicao_campo: 'f8',
            condicao_valor: 'Sim',
          },
          { id: 'f10', tipo: 'foto', nome: 'Registro do ponto de medição' },
          { id: 'f11', tipo: 'texto_longo', nome: 'Observações' },
        ],
      },
      {
        nome: 'Vibração Ocupacional',
        descricao:
          'Avaliação de exposição a vibrações conforme NR-15 Anexo 8 — vibração de mãos e braços e de corpo inteiro.',
        icone: 'activity',
        campos: [
          { id: 'f1', tipo: 'secao', nome: 'Identificação' },
          { id: 'f2', tipo: 'texto', nome: 'Equipamento / ferramenta avaliada', obrigatorio: true },
          {
            id: 'f3',
            tipo: 'selecao',
            nome: 'Tipo de exposição',
            opcoes: ['Mãos e braços', 'Corpo inteiro'],
            obrigatorio: true,
          },
          { id: 'f4', tipo: 'secao', nome: 'Medição' },
          {
            id: 'f5',
            tipo: 'numero',
            nome: 'Nível de vibração',
            unidade: 'm/s²',
            obrigatorio: true,
          },
          {
            id: 'f6',
            tipo: 'numero',
            nome: 'Tempo de exposição',
            unidade: 'h/dia',
            obrigatorio: true,
          },
          { id: 'f7', tipo: 'numero', nome: 'Nível de ação', unidade: 'm/s²' },
          { id: 'f8', tipo: 'sim_nao', nome: 'Medição com calibração válida?', obrigatorio: true },
          { id: 'f9', tipo: 'foto', nome: 'Registro do equipamento' },
          { id: 'f10', tipo: 'texto_longo', nome: 'Observações' },
        ],
      },
      {
        nome: 'Máquinas e Equipamentos',
        descricao:
          'Inspeção de máquinas e equipamentos conforme NR-12 — proteções, dispositivos de segurança e sinalização.',
        icone: 'cog',
        campos: [
          { id: 'f1', tipo: 'secao', nome: 'Identificação' },
          { id: 'f2', tipo: 'texto', nome: 'Máquina / equipamento', obrigatorio: true },
          { id: 'f3', tipo: 'texto', nome: 'Fabricante / modelo' },
          { id: 'f4', tipo: 'secao', nome: 'Segurança da máquina' },
          {
            id: 'f5',
            tipo: 'sim_nao',
            nome: 'Proteções fixas e móveis íntegras?',
            obrigatorio: true,
          },
          {
            id: 'f6',
            tipo: 'sim_nao',
            nome: 'Comando de emergência acessível?',
            obrigatorio: true,
          },
          {
            id: 'f7',
            tipo: 'sim_nao',
            nome: 'Dispositivos de intertravamento funcionando?',
            obrigatorio: true,
          },
          { id: 'f8', tipo: 'sim_nao', nome: 'Aterramento elétrico presente?', obrigatorio: true },
          {
            id: 'f9',
            tipo: 'selecao',
            nome: 'Estado geral de conservação',
            opcoes: ['Bom', 'Regular', 'Crítico'],
            obrigatorio: true,
          },
          { id: 'f10', tipo: 'foto', nome: 'Fotos da máquina' },
          { id: 'f11', tipo: 'texto_longo', nome: 'Não conformidades observadas' },
        ],
      },
      {
        nome: 'Cabos e Instalações Elétricas',
        descricao:
          'Inspeção de cabos e instalações elétricas conforme NR-10 — estado dos condutores, aterramento e proteção contra choques.',
        icone: 'zap',
        campos: [
          { id: 'f1', tipo: 'secao', nome: 'Identificação' },
          { id: 'f2', tipo: 'texto', nome: 'Local / instalação avaliada', obrigatorio: true },
          {
            id: 'f3',
            tipo: 'selecao',
            nome: 'Tipo de instalação',
            opcoes: ['Quadro de distribuição', 'Linha de energia', 'Máquina conectada', 'Outro'],
            obrigatorio: true,
          },
          { id: 'f4', tipo: 'secao', nome: 'Condições dos cabos e instalações' },
          {
            id: 'f5',
            tipo: 'sim_nao',
            nome: 'Cabos sem emendas ou danos na isolação?',
            obrigatorio: true,
          },
          { id: 'f6', tipo: 'sim_nao', nome: 'Aterramento conforme NBR 5410?', obrigatorio: true },
          {
            id: 'f7',
            tipo: 'sim_nao',
            nome: 'Dispositivos DR presentes e funcionando?',
            obrigatorio: true,
          },
          {
            id: 'f8',
            tipo: 'sim_nao',
            nome: 'Quadro identificado e organizado?',
            obrigatorio: true,
          },
          { id: 'f9', tipo: 'numero', nome: 'Tensão medida', unidade: 'V' },
          { id: 'f10', tipo: 'foto', nome: 'Fotos da instalação' },
          { id: 'f11', tipo: 'texto_longo', nome: 'Não conformidades observadas' },
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
    // down: remove apenas os 4 modelos fixos
    for (const nome of [
      'Ruído Ocupacional',
      'Vibração Ocupacional',
      'Máquinas e Equipamentos',
      'Cabos e Instalações Elétricas',
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
