// Numeração automática do orçamento, no formato NNN/AAAA.
// Sequencial por organização e por ano: cada organização recomeça do 001 a cada
// virada de ano, e uma organização nunca enxerga o número da outra.
//
// O número só é gerado quando o campo vem vazio — assim dá para importar
// orçamentos antigos com a numeração original preservada.
onRecordCreate((e) => {
  try {
    const record = e.record

    if (!record.getString('numero')) {
      const orgId = record.get('organizacao_id')

      // Ano de referência: o da data da proposta, quando informada; senão, o ano corrente.
      let ano = new Date().getFullYear()
      const dataProposta = record.getString('data_proposta')
      if (dataProposta && dataProposta.length >= 4) {
        const anoProposta = parseInt(dataProposta.substring(0, 4), 10)
        if (anoProposta > 2000) ano = anoProposta
      }

      const sufixo = '/' + ano
      let maior = 0
      try {
        const existentes = $app.findRecordsByFilter(
          'orcamentos',
          "organizacao_id = '" + orgId + "' && numero ~ '" + sufixo + "'",
          '',
          0,
          0,
        )
        for (const rec of existentes) {
          const num = rec.getString('numero')
          if (num.indexOf(sufixo) !== num.length - sufixo.length) continue
          const seq = parseInt(num.split('/')[0], 10)
          if (seq > maior) maior = seq
        }
      } catch (_) {}

      let seq = String(maior + 1)
      while (seq.length < 3) seq = '0' + seq
      record.set('numero', seq + sufixo)
    }

    // Autoria: quem criou fica registrado para o histórico das fases seguintes.
    if (!record.get('criado_por') && e.auth) {
      record.set('criado_por', e.auth.id)
    }
  } catch (err) {
    $app
      .logger()
      .error(
        'falha ao gerar numero do orcamento',
        'error',
        err && err.message ? err.message : String(err),
      )
  }

  e.next()
}, 'orcamentos')
