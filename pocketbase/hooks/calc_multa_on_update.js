// Mesmo cálculo do calc_multa_on_create.js, mas disparado quando uma resposta
// de vistoria já existente é atualizada (ex.: o técnico muda a situação de C
// para N/C em campo, ou corrige o item depois). Lógica duplicada de propósito —
// hooks do Skip Cloud não compartilham helpers de nível de arquivo entre
// callbacks. Qualquer mudança aqui precisa ser espelhada no outro arquivo.
//
// Os três regimes (campo regime_multa do checklist):
//   anexo_i            → Anexo I da NR-28, em UFIR (regra geral).
//   anexo_ia_portuario → Anexo I-A, já em reais (NR-29, Portaria SIT 319/2012).
//   rural_art18        → art. 18 da Lei 5.889/1973, por empregado irregular
//                        (NR-31, via item 28.3.2 da NR-28).
onRecordUpdate((e) => {
  try {
    const record = e.record
    const situacao = record.get('situacao')
    let vmin = 0
    let vmax = 0

    if (situacao === 'N/C') {
      const item = $app.findRecordById('itens_checklist', record.get('item_checklist_id'))
      const grau = item.getInt('grau')
      const tipo = item.getString('tipo')
      const codigo = item.getString('codigo')

      // Regime declarado no checklist. Fallback para bases antigas, anteriores
      // ao campo regime_multa: código 231xxx do Anexo II = NR-31 (rural).
      let regime = ''
      try {
        const tipoVistoria = $app.findRecordById('tipos_vistoria', item.get('tipo_vistoria_id'))
        regime = tipoVistoria.getString('regime_multa')
      } catch (_) {}
      if (!regime) regime = codigo && codigo.indexOf('231') === 0 ? 'rural_art18' : 'anexo_i'

      if (regime === 'rural_art18') {
        let multaRural = 392.89
        try {
          const paramRow = $app.findFirstRecordByFilter(
            'parametros_sistema',
            "chave = 'multa_rural_por_empregado'",
          )
          multaRural = paramRow.getFloat('valor_numero') || 392.89
        } catch (_) {}
        const vistoria = $app.findRecordById('vistorias', record.get('vistoria_id'))
        if (vistoria.getString('nr31_base_legal') === 'lei_380') multaRural = 380.0
        let nAfetados = record.getInt('numero_funcionarios_irregulares')
        if (nAfetados <= 0) {
          const empresa = $app.findRecordById('empresas', vistoria.get('empresa_id'))
          nAfetados = empresa.getInt('numero_funcionarios')
        }
        if (nAfetados > 0) {
          vmin = Math.round(multaRural * nAfetados * 100) / 100
          vmax = Math.round(multaRural * 2 * nAfetados * 100) / 100
        }
      } else if (grau && (tipo === 'S' || tipo === 'M')) {
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

        if (regime === 'anexo_ia_portuario') {
          // Anexo I-A — valores já em reais, sem conversão de UFIR.
          const tabelaRow = $app.findFirstRecordByFilter('tabela_multas_portuario', filtro)
          vmin = Math.round(tabelaRow.getFloat('valor_min_reais') * 100) / 100
          vmax = Math.round(tabelaRow.getFloat('valor_max_reais') * 100) / 100
        } else {
          // Anexo I — valores em UFIR, convertidos para reais.
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
        }
      }
    }

    record.set('valor_multa_min', vmin)
    record.set('valor_multa_max', vmax)
  } catch (err) {
    $app
      .logger()
      .error(
        'falha ao calcular multa da resposta (update)',
        'error',
        err && err.message ? err.message : String(err),
      )
  }

  e.next()
}, 'respostas_vistoria')
