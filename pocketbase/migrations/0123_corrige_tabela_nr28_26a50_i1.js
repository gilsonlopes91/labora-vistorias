// Migração 0123: corrige uma célula da grade do Anexo I da NR-28.
// Segurança do Trabalho, 26 a 50 empregados, infração I1: o valor máximo é
// 963 UFIR (texto oficial), e estava gravado 936 (troca de dígitos no seed
// da 0016). As outras 63 células foram conferidas e estão corretas.
// Também atualiza o valor máximo de multa das respostas N/C já gravadas com o
// valor errado, apenas em vistorias que ainda não foram concluídas (os
// relatórios já emitidos ficam como foram assinados).
migrate(
  (app) => {
    const row = app.findFirstRecordByFilter(
      'tabela_multas_nr28',
      "faixa_ordem = 2 && grau = 1 && tipo = 'S'",
    )
    row.set('valor_max_ufir', 963)
    app.save(row)

    let ufir = 1.0641
    try {
      const p = app.findFirstRecordByFilter('parametros_sistema', "chave = 'valor_ufir_reais'")
      ufir = p.getFloat('valor_numero') || 1.0641
    } catch (_) {}
    const errado = Math.round(936 * ufir * 100) / 100
    const certo = Math.round(963 * ufir * 100) / 100

    let respostas = []
    try {
      respostas = app.findRecordsByFilter(
        'respostas_vistoria',
        "situacao = 'N/C' && valor_multa_max >= {:a} && valor_multa_max <= {:b} && vistoria_id.status != 'concluida'",
        '',
        5000,
        0,
        { a: errado - 0.01, b: errado + 0.01 },
      )
    } catch (_) {
      respostas = []
    }
    for (const r of respostas) {
      r.set('valor_multa_max', certo)
      app.save(r)
    }
    console.log('0123: respostas corrigidas = ' + respostas.length)
  },
  (app) => {
    const row = app.findFirstRecordByFilter(
      'tabela_multas_nr28',
      "faixa_ordem = 2 && grau = 1 && tipo = 'S'",
    )
    row.set('valor_max_ufir', 936)
    app.save(row)
  },
)
