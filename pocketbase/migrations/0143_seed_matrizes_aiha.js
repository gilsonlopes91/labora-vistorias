// Seed das duas matrizes oficiais AIHA (3x3 e 5x5), adaptação usada no
// mercado brasileiro a partir de AIHA/BS 8800/Fundacentro/Revista da ENIT
// (ver plano "labora-vistoria-documentacao-sst-plano.md", seção 4).
// organizacao_id = '' => catálogo oficial; somente_leitura = true.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('matrizes_risco')

    const categorias = [
      { categoria: 'Trivial', cor: '#22c55e', acao: 'Nenhuma ação.', prazo_dias: null },
      {
        categoria: 'Tolerável',
        cor: '#84cc16',
        acao: 'Manter os controles existentes; reavaliar na próxima revisão do PGR.',
        prazo_dias: null,
      },
      {
        categoria: 'Moderado',
        cor: '#eab308',
        acao: 'Reduzir o risco dentro de prazo definido.',
        prazo_dias: 180,
      },
      {
        categoria: 'Substancial',
        cor: '#f97316',
        acao: 'Não iniciar ou retomar a atividade sem reduzir o risco; adotar medida provisória imediata.',
        prazo_dias: 30,
      },
      {
        categoria: 'Intolerável',
        cor: '#ef4444',
        acao: 'Não iniciar nem continuar a atividade até corrigir.',
        prazo_dias: 0,
      },
    ]

    // ---------------- 5x5 ----------------
    const criteriosProbabilidade5 = [
      {
        nivel: 1,
        nome: 'Rara',
        quantitativo: 'Abaixo de 10% do LEO (categoria AIHA 0–1).',
        qualitativo: 'Controle excelente, melhor prática/tecnologia disponível.',
      },
      {
        nivel: 2,
        nome: 'Improvável',
        quantitativo: '10% a 50% do LEO (categoria AIHA 2).',
        qualitativo: 'Controle em conformidade com a norma, com manutenção garantida.',
      },
      {
        nivel: 3,
        nome: 'Possível',
        quantitativo:
          '50% a 100% do LEO — acima do nível de ação (categoria AIHA 3, NR-09 9.6.1.2).',
        qualitativo: 'Controle adequado, com pequenas deficiências operacionais.',
      },
      {
        nivel: 4,
        nome: 'Provável',
        quantitativo: '100% a 500% do LEO (categoria AIHA 4).',
        qualitativo: 'Controle deficiente ou incompleto.',
      },
      {
        nivel: 5,
        nome: 'Muito provável',
        quantitativo: 'Acima de 500% do LEO (categoria AIHA 4).',
        qualitativo: 'Controle inexistente ou totalmente inadequado.',
      },
    ]
    const criteriosSeveridade5 = [
      {
        nivel: 1,
        nome: 'Leve',
        descricao: 'Desconforto ou lesão reversível, sem afastamento ou até 1 dia.',
        dias_afastamento: '0–1',
        aiha_efeito: 0,
      },
      {
        nivel: 2,
        nome: 'Moderada',
        descricao: 'Lesão ou doença reversível, até 15 dias de afastamento.',
        dias_afastamento: 'até 15',
        aiha_efeito: 1,
      },
      {
        nivel: 3,
        nome: 'Grave',
        descricao: 'Lesão ou doença reversível, mais de 15 dias de afastamento.',
        dias_afastamento: 'acima de 15',
        aiha_efeito: 2,
      },
      {
        nivel: 4,
        nome: 'Muito grave',
        descricao: 'Lesão ou doença irreversível, com limitação funcional parcial.',
        dias_afastamento: 'irreversível',
        aiha_efeito: 3,
      },
      {
        nivel: 5,
        nome: 'Crítica',
        descricao: 'Lesão ou doença incapacitante ou fatal.',
        dias_afastamento: 'incapacitante/fatal',
        aiha_efeito: 4,
      },
    ]
    const nomeCat5 = {
      1: { 1: 'Trivial', 2: 'Trivial', 3: 'Tolerável', 4: 'Tolerável', 5: 'Tolerável' },
      2: { 1: 'Trivial', 2: 'Tolerável', 3: 'Tolerável', 4: 'Tolerável', 5: 'Moderado' },
      3: { 1: 'Tolerável', 2: 'Tolerável', 3: 'Moderado', 4: 'Moderado', 5: 'Substancial' },
      4: { 1: 'Tolerável', 2: 'Tolerável', 3: 'Moderado', 4: 'Substancial', 5: 'Intolerável' },
      5: { 1: 'Tolerável', 2: 'Moderado', 3: 'Substancial', 4: 'Intolerável', 5: 'Intolerável' },
    }
    const celulas5 = []
    for (let p = 1; p <= 5; p++) {
      for (let s = 1; s <= 5; s++) {
        celulas5.push({ p, s, categoria: nomeCat5[p][s], pontuacao: p * s })
      }
    }

    const matriz5 = new Record(col)
    matriz5.set('organizacao_id', '')
    matriz5.set('nome', 'AIHA 5x5')
    matriz5.set('metodologia', 'AIHA')
    matriz5.set('dimensao', '5')
    matriz5.set('criterios_probabilidade', criteriosProbabilidade5)
    matriz5.set('criterios_severidade', criteriosSeveridade5)
    matriz5.set('categorias', categorias)
    matriz5.set('celulas', celulas5)
    matriz5.set('versao', '1.0')
    matriz5.set('somente_leitura', true)
    app.save(matriz5)

    // ---------------- 3x3 ----------------
    const criteriosProbabilidade3 = [
      {
        nivel: 1,
        nome: 'Altamente improvável',
        quantitativo: 'Abaixo de 50% do LEO (categoria AIHA 0–2).',
        qualitativo: 'Controle excelente ou conforme a norma, com manutenção garantida.',
      },
      {
        nivel: 2,
        nome: 'Improvável',
        quantitativo:
          '50% a 100% do LEO — acima do nível de ação (categoria AIHA 3, NR-09 9.6.1.2).',
        qualitativo: 'Controle adequado, com deficiências.',
      },
      {
        nivel: 3,
        nome: 'Provável',
        quantitativo: 'Acima de 100% do LEO (categoria AIHA 4).',
        qualitativo: 'Controle deficiente, incompleto ou inexistente.',
      },
    ]
    const criteriosSeveridade3 = [
      {
        nivel: 1,
        nome: 'Levemente prejudicial',
        descricao: 'Reversível, até 15 dias de afastamento.',
        dias_afastamento: 'até 15',
        aiha_efeito: '0–1',
      },
      {
        nivel: 2,
        nome: 'Prejudicial',
        descricao: 'Reversível, mais de 15 dias de afastamento.',
        dias_afastamento: 'acima de 15',
        aiha_efeito: '2',
      },
      {
        nivel: 3,
        nome: 'Extremamente prejudicial',
        descricao: 'Irreversível, incapacitante ou fatal.',
        dias_afastamento: 'irreversível/fatal',
        aiha_efeito: '3–4',
      },
    ]
    const nomeCat3 = {
      1: { 1: 'Trivial', 2: 'Tolerável', 3: 'Moderado' },
      2: { 1: 'Tolerável', 2: 'Moderado', 3: 'Substancial' },
      3: { 1: 'Moderado', 2: 'Substancial', 3: 'Intolerável' },
    }
    const celulas3 = []
    for (let p = 1; p <= 3; p++) {
      for (let s = 1; s <= 3; s++) {
        celulas3.push({ p, s, categoria: nomeCat3[p][s], pontuacao: p * s })
      }
    }

    const matriz3 = new Record(col)
    matriz3.set('organizacao_id', '')
    matriz3.set('nome', 'AIHA 3x3 (BS 8800)')
    matriz3.set('metodologia', 'AIHA')
    matriz3.set('dimensao', '3')
    matriz3.set('criterios_probabilidade', criteriosProbabilidade3)
    matriz3.set('criterios_severidade', criteriosSeveridade3)
    matriz3.set('categorias', categorias)
    matriz3.set('celulas', celulas3)
    matriz3.set('versao', '1.0')
    matriz3.set('somente_leitura', true)
    app.save(matriz3)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('matrizes_risco')
    const registros = app.findRecordsByFilter(col, "organizacao_id = ''", '', 0, 0)
    registros.forEach((r) => app.delete(r))
  },
)
