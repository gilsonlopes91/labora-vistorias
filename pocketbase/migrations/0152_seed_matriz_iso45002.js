// Terceira opção de matriz oficial (5x5), adaptada do modelo apresentado no
// Manual de Interpretação do capítulo 1.5 da NR-1 (MTE) para ilustrar a
// aplicação da ISO 45001/45002 ao GRO — nível de probabilidade x severidade,
// com faixas de risco e prazos de ação (Quadro 5 do manual). Convive com as
// duas matrizes AIHA (0143): o profissional escolhe qual usar por avaliação
// ou por documento, sem perder o dado bruto (ver src/lib/matrizRisco.ts).
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('matrizes_risco')

    const criteriosProbabilidade = [
      {
        nivel: 1,
        nome: 'Raro',
        quantitativo: 'Abaixo de 10% do LEO (categoria AIHA 0–1).',
        qualitativo: 'Praticamente impossível de ocorrer; controles robustos e testados.',
      },
      {
        nivel: 2,
        nome: 'Improvável',
        quantitativo: '10% a 50% do LEO (categoria AIHA 2).',
        qualitativo: 'Pode ocorrer em situações incomuns; controles em conformidade.',
      },
      {
        nivel: 3,
        nome: 'Possível',
        quantitativo:
          '50% a 100% do LEO — acima do nível de ação (categoria AIHA 3, NR-09 9.6.1.2).',
        qualitativo: 'Pode ocorrer em algum momento; controles com deficiências pontuais.',
      },
      {
        nivel: 4,
        nome: 'Provável',
        quantitativo: '100% a 500% do LEO (categoria AIHA 4).',
        qualitativo: 'Espera-se que ocorra na maioria das condições; controles deficientes.',
      },
      {
        nivel: 5,
        nome: 'Quase certo',
        quantitativo: 'Acima de 500% do LEO (categoria AIHA 4).',
        qualitativo: 'Ocorrência praticamente certa; controles inexistentes ou inadequados.',
      },
    ]
    const criteriosSeveridade = [
      {
        nivel: 1,
        nome: 'Insignificante',
        descricao: 'Sem lesão ou desconforto passageiro, sem afastamento.',
        dias_afastamento: '0',
        aiha_efeito: 0,
      },
      {
        nivel: 2,
        nome: 'Leve',
        descricao: 'Lesão ou doença reversível, com até 15 dias de afastamento.',
        dias_afastamento: 'até 15',
        aiha_efeito: 1,
      },
      {
        nivel: 3,
        nome: 'Moderada',
        descricao: 'Lesão ou doença reversível, com mais de 15 dias de afastamento.',
        dias_afastamento: 'acima de 15',
        aiha_efeito: 2,
      },
      {
        nivel: 4,
        nome: 'Grave',
        descricao: 'Lesão ou doença irreversível, com limitação funcional parcial.',
        dias_afastamento: 'irreversível',
        aiha_efeito: 3,
      },
      {
        nivel: 5,
        nome: 'Catastrófica',
        descricao: 'Lesão ou doença incapacitante ou fatal.',
        dias_afastamento: 'incapacitante/fatal',
        aiha_efeito: 4,
      },
    ]
    // Faixas de risco no estilo ISO 45001/31000 (Baixo/Moderado/Alto/Extremo),
    // com prazos alinhados ao Quadro 5 do manual do MTE.
    const categorias = [
      {
        categoria: 'Baixo',
        cor: '#22c55e',
        acao: 'Nenhuma ação adicional exigida.',
        prazo_dias: null,
      },
      {
        categoria: 'Moderado',
        cor: '#eab308',
        acao: 'Reduzir o risco dentro de prazo definido; monitorar.',
        prazo_dias: 180,
      },
      {
        categoria: 'Alto',
        cor: '#f97316',
        acao: 'Adotar medida provisória imediata e reduzir o risco em prazo curto.',
        prazo_dias: 30,
      },
      {
        categoria: 'Extremo',
        cor: '#ef4444',
        acao: 'Não iniciar nem continuar a atividade até corrigir.',
        prazo_dias: 0,
      },
    ]
    const nomeCat = {
      1: { 1: 'Baixo', 2: 'Baixo', 3: 'Moderado', 4: 'Moderado', 5: 'Alto' },
      2: { 1: 'Baixo', 2: 'Moderado', 3: 'Moderado', 4: 'Alto', 5: 'Alto' },
      3: { 1: 'Moderado', 2: 'Moderado', 3: 'Alto', 4: 'Alto', 5: 'Extremo' },
      4: { 1: 'Moderado', 2: 'Alto', 3: 'Alto', 4: 'Extremo', 5: 'Extremo' },
      5: { 1: 'Alto', 2: 'Alto', 3: 'Extremo', 4: 'Extremo', 5: 'Extremo' },
    }
    const celulas = []
    for (let p = 1; p <= 5; p++) {
      for (let s = 1; s <= 5; s++) {
        celulas.push({ p, s, categoria: nomeCat[p][s], pontuacao: p * s })
      }
    }

    const matriz = new Record(col)
    matriz.set('organizacao_id', '')
    matriz.set('nome', 'ISO 45002 5x5')
    matriz.set('metodologia', 'ISO45002')
    matriz.set('dimensao', '5')
    matriz.set('criterios_probabilidade', criteriosProbabilidade)
    matriz.set('criterios_severidade', criteriosSeveridade)
    matriz.set('categorias', categorias)
    matriz.set('celulas', celulas)
    matriz.set('versao', '1.0')
    matriz.set('somente_leitura', true)
    app.save(matriz)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('matrizes_risco')
    const registros = app.findRecordsByFilter(
      col,
      "organizacao_id = '' && metodologia = 'ISO45002'",
      '',
      0,
      0,
    )
    registros.forEach((r) => app.delete(r))
  },
)
