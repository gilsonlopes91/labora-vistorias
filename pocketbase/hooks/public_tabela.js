// Rota pública (sem login): grade completa de gradação de multas da NR-28 para
// um tipo (S = Segurança, M = Medicina), em reais. Usada pela calculadora
// pública e pela página "Multas e penalidades" para desenhar a tabela na
// identidade Labora, com a célula do cálculo destacada.
//
// Parâmetro anexo:
//   i  (padrão) → Anexo I, regra geral. Valores da norma em UFIR, convertidos
//                 para reais pelo parâmetro valor_ufir_reais.
//   ia          → Anexo I-A, trabalho portuário (NR-29, Portaria SIT 319/2012).
//                 Valores já fixados em reais na norma — sem conversão.
//
// Somente leitura, dados públicos.
routerAdd('GET', '/backend/v1/public/tabela', (e) => {
  const query = e.requestInfo().query
  const tipo = String(query.tipo || 'S').toUpperCase()
  if (tipo !== 'S' && tipo !== 'M') return e.badRequestError('tipo deve ser S ou M')

  const anexo = String(query.anexo || 'i').toLowerCase()
  if (anexo !== 'i' && anexo !== 'ia') return e.badRequestError('anexo deve ser i ou ia')

  const filtro = "tipo = '" + tipo + "'"

  if (anexo === 'ia') {
    const rows = $app.findRecordsByFilter('tabela_multas_portuario', filtro, 'faixa_ordem', 0, 0)
    const grade = rows.map((r) => ({
      faixa_ordem: r.getInt('faixa_ordem'),
      grau: r.getInt('grau'),
      min: Math.round(r.getFloat('valor_min_reais') * 100) / 100,
      max: Math.round(r.getFloat('valor_max_reais') * 100) / 100,
    }))
    return e.json(200, { tipo: tipo, anexo: 'ia', ufir: null, grade: grade })
  }

  let ufirReais = 1.0641
  try {
    const paramRow = $app.findFirstRecordByFilter(
      'parametros_sistema',
      "chave = 'valor_ufir_reais'",
    )
    ufirReais = paramRow.getFloat('valor_numero') || 1.0641
  } catch (_) {}

  const rows = $app.findRecordsByFilter('tabela_multas_nr28', filtro, 'faixa_ordem', 0, 0)

  const grade = rows.map((r) => ({
    faixa_ordem: r.getInt('faixa_ordem'),
    grau: r.getInt('grau'),
    min: Math.round(r.getFloat('valor_min_ufir') * ufirReais * 100) / 100,
    max: Math.round(r.getFloat('valor_max_ufir') * ufirReais * 100) / 100,
  }))

  return e.json(200, { tipo: tipo, anexo: 'i', ufir: ufirReais, grade: grade })
})
