// Rota pública (sem login): grade completa do Anexo I da NR-28 para um tipo
// (S = Segurança, M = Medicina), já convertida de UFIR para reais. Usada pela
// calculadora pública para desenhar a tabela "versão Labora" com a célula do
// cálculo destacada. Somente leitura, dados públicos.
routerAdd('GET', '/backend/v1/public/tabela', (e) => {
  const tipo = String(e.requestInfo().query.tipo || 'S').toUpperCase()
  if (tipo !== 'S' && tipo !== 'M') return e.badRequestError('tipo deve ser S ou M')

  let ufirReais = 1.0641
  try {
    const paramRow = $app.findFirstRecordByFilter(
      'parametros_sistema',
      "chave = 'valor_ufir_reais'",
    )
    ufirReais = paramRow.getFloat('valor_numero') || 1.0641
  } catch (_) {}

  const rows = $app.findRecordsByFilter(
    'tabela_multas_nr28',
    "tipo = '" + tipo + "'",
    'faixa_ordem',
    0,
    0,
  )

  const grade = rows.map((r) => ({
    faixa_ordem: r.getInt('faixa_ordem'),
    grau: r.getInt('grau'),
    min: Math.round(r.getFloat('valor_min_ufir') * ufirReais * 100) / 100,
    max: Math.round(r.getFloat('valor_max_ufir') * ufirReais * 100) / 100,
  }))

  return e.json(200, { tipo: tipo, ufir: ufirReais, grade: grade })
})
