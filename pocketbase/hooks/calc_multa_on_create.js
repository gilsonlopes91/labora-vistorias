// Calcula o valor da multa (mín/máx) de uma resposta de vistoria assim que ela
// é criada, usando a mesma lógica das planilhas: Anexo II da NR-28 (grau/tipo do
// item) x Anexo I da NR-28 (grade de UFIR por faixa de nº de funcionários) x
// valor de conversão do UFIR em reais. Só calcula quando situacao = "N/C".
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
