// Calcula o valor da multa (mín/máx) de uma resposta de vistoria assim que ela
// é criada. Só calcula quando situacao = "N/C".
//
// Existem três regimes de cálculo na NR-28, e quem decide qual vale é o campo
// regime_multa do checklist (tipos_vistoria):
//
//   anexo_i            → regra geral. Anexo II dá grau (1-4) e tipo (S/M) do
//                        item; Anexo I cruza isso com a faixa de nº de
//                        empregados e devolve mín/máx em UFIR; converte-se para
//                        reais pelo parâmetro valor_ufir_reais (1,0641).
//
//   anexo_ia_portuario → NR-29, trabalho portuário. Anexo I-A (Portaria SIT
//                        319/2012). Mesma estrutura de grau/tipo/faixa, mas os
//                        valores da norma JÁ ESTÃO EM REAIS — não se aplica o
//                        fator UFIR. Aplicar a grade do Anexo I aqui
//                        superestima a multa.
//
//   rural_art18        → NR-31. O item 28.3.2 da NR-28 (Portaria MTE 104/2026)
//                        manda usar o art. 18 da Lei 5.889/1973: valor fixo por
//                        empregado em situação irregular, dobrado na
//                        reincidência. Não usa grau, tipo nem faixa de porte.
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
        // Art. 18 da Lei 5.889/1973: R$ 392,89 por empregado irregular
        // (Portaria MTE 1.131/2025, parâmetro multa_rural_por_empregado);
        // dobrado na reincidência, embaraço ou resistência à fiscalização.
        let multaRural = 392.89
        try {
          const paramRow = $app.findFirstRecordByFilter(
            'parametros_sistema',
            "chave = 'multa_rural_por_empregado'",
          )
          multaRural = paramRow.getFloat('valor_numero') || 392.89
        } catch (_) {}
        // Critério do AFT (multa per capita): o auto de infração traz a relação
        // de empregados prejudicados. Infrações coletivas (ex.: falta de PGRTR)
        // alcançam TODOS os empregados do estabelecimento; individuais (ex.:
        // exame médico) listam só os afetados. Campo vazio = coletiva.
        // Base de valor: nr31_base_legal = "lei_380" (texto da lei, MP
        // 2.164-41/2001) ou "portaria_392" (valor reajustado). Sem escolha, usa
        // o reajustado.
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
        'falha ao calcular multa da resposta (create)',
        'error',
        err && err.message ? err.message : String(err),
      )
  }

  e.next()
}, 'respostas_vistoria')
