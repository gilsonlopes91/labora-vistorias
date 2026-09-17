// Calcula o valor da multa (mín/máx) de uma resposta de vistoria assim que ela
// é criada. Duas regras, conforme a norma do item:
//
// 1. URBANA (demais NRs): Anexo II da NR-28 (grau/tipo do item) x Anexo I da
//    NR-28 (grade de UFIR por faixa de nº de funcionários do estabelecimento)
//    x valor de conversão do UFIR em reais. Só calcula quando situacao = "N/C".
//
// 2. RURAL (NR-31): o item 28.3.2 da NR-28 remete ao art. 18 da Lei nº
//    5.889/1973 — multa de valor fixo POR EMPREGADO EM SITUAÇÃO IRREGULAR
//    (Portaria MTE nº 1.131/2025: R$ 392,89; parâmetro configurável em
//    parametros_sistema). Usa o campo numero_funcionarios_irregulares da
//    resposta; sem esse número, a multa fica 0 (o auditor precisa informar
//    quantos empregados estão expostos à infração).
onRecordCreate((e) => {
  try {
    const record = e.record
    const situacao = record.get('situacao')
    let vmin = 0
    let vmax = 0

    if (situacao === 'N/C') {
      const item = $app.findRecordById('itens_checklist', record.get('item_checklist_id'))
      const grau = item.getInt('grau')
      const tipo = item.getString('tipo')

      if (grau && (tipo === 'S' || tipo === 'M')) {
        // Regra 1 — grade UFIR do Anexo I da NR-28 (NRs urbanas)
        const vistoria = $app.findRecordById('vistorias', record.get('vistoria_id'))
        const empresa = $app.findRecordById('empresas', vistoria.get('empresa_id'))
        const numFunc = empresa.getInt('numero_funcionarios')

        const limites = [10, 25, 50, 100, 250, 500, 1000]
        let ordem = 7
        for (let i = 0; i < limites.length; i++) {
          if (numFunc <= limites[i]) {
            ordem = i
            break
          }
        }

        const filtro = 'faixa_ordem = ' + ordem + ' && grau = ' + grau + " && tipo = '" + tipo + "'"
        const tabelaRow = $app.findFirstRecordByFilter('tabela_multas_nr28', filtro)
        let ufirReais = 1.0641
        try {
          const paramRow = $app.findFirstRecordByFilter(
            'parametros_sistema',
            "chave = 'valor_ufir_reais'",
          )
          ufirReais = paramRow.getFloat('valor_numero') || 1.0641
        } catch (_) {}

        vmin = Math.round(tabelaRow.getFloat('valor_min_ufir') * ufirReais * 100) / 100
        vmax = Math.round(tabelaRow.getFloat('valor_max_ufir') * ufirReais * 100) / 100
      } else {
        // Regra 2 — trabalho rural (NR-31): multa fixa por empregado irregular
        // (art. 18 da Lei 5.889/1973, via item 28.3.2 da NR-28)
        const tipoVistoria = $app.findRecordById(
          'tipos_vistoria',
          item.getString('tipo_vistoria_id'),
        )
        if (tipoVistoria.getString('nr_referencia') === 'NR-31') {
          const irregulares = record.getInt('numero_funcionarios_irregulares')
          if (irregulares > 0) {
            let valorPorEmpregado = 392.89
            try {
              const paramRow = $app.findFirstRecordByFilter(
                'parametros_sistema',
                "chave = 'multa_rural_por_empregado'",
              )
              valorPorEmpregado = paramRow.getFloat('valor_numero') || 392.89
            } catch (_) {}
            const total = Math.round(irregulares * valorPorEmpregado * 100) / 100
            vmin = total
            vmax = total
          }
        }
      }
    }

    record.set('valor_multa_min', vmin)
    record.set('valor_multa_max', vmax)
  } catch (err) {
    $app
      .logger()
      .error(
        'falha ao calcular multa da resposta (create)',
        'error',
        err && err.message ? err.message : String(err),
      )
  }

  e.next()
}, 'respostas_vistoria')
