// Calcula o valor da multa (mín/máx) de uma resposta de vistoria assim que ela
// é criada, usando a mesma lógica das planilhas: Anexo II da NR-28 (grau/tipo do
// item) x Anexo I da NR-28 (grade de UFIR por faixa de nº de funcionários) x
// valor de conversão do UFIR em reais. Só calcula quando situacao = "N/C".
//
// NR-31 (trabalho rural): a sanção NÃO usa a grade UFIR do Anexo I. O item
// 28.3.2 da NR-28 (Portaria MTE 104/2026) remete ao art. 18 da Lei 5.889/1973:
// R$ 380,00 por empregado em situação irregular, dobrada na reincidência
// (R$ 760,00). O campo numero_funcionarios_irregulares da resposta informa
// quantos empregados estão expostos à infração; sem esse valor, a multa fica
// zerada e o laudo explica o critério rural.
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
      } else if (codigo && codigo.startsWith('231')) {
        // NR-31 — trabalho rural (códigos 231xxx do Anexo II da NR-28).
        // Art. 18 da Lei 5.889/1973: R$ 392,89 por empregado irregular
        // (Portaria MTE 1.131/2025, vigente desde 04/07/2025 — parâmetro
        // multa_rural_por_empregado); dobrado na reincidência.
        // O campo numero_funcionarios_irregulares da resposta informa quantos
        // trabalhadores são afetados pelo item (contratados ou não); o default
        // na UI é o total de trabalhadores da empresa.
        let multaRural = 392.89
        try {
          const paramRow = $app.findFirstRecordByFilter(
            'parametros_sistema',
            "chave = 'multa_rural_por_empregado'",
          )
          multaRural = paramRow.getFloat('valor_numero') || 392.89
        } catch (_) {}
        // Critério do AFT (art. 18 da Lei 5.889/73, multa per capita): o auto de
        // infração traz a relação de empregados prejudicados. Infrações
        // coletivas (ex.: falta de PGRTR) alcançam TODOS os empregados do
        // estabelecimento; individuais (ex.: exame médico) listam só os
        // afetados. Campo vazio = coletiva → usa o total de trabalhadores da
        // empresa; preenchido = o nº de trabalhadores afetados pelo item.
        // Base de valor: o usuário escolhe na vistoria — nr31_base_legal =
        // "lei_380" (texto da lei, MP 2.164-41/2001) ou "portaria_392"
        // (Portaria MTE 1.131/2025, reajuste anual do item 28.3.3 da NR-28).
        // Sem escolha, usa o valor reajustado (392,89).
        const vistoria = $app.findRecordById('vistorias', record.get('vistoria_id'))
        const baseLegal = vistoria.getString('nr31_base_legal')
        if (baseLegal === 'lei_380') multaRural = 380.0
        // Campo numérico unset volta como 0 — 0 = sem nº informado = infração
        // coletiva → usa o total de trabalhadores do estabelecimento.
        let nAfetados = record.getInt('numero_funcionarios_irregulares')
        if (nAfetados <= 0) {
          const empresa = $app.findRecordById('empresas', vistoria.get('empresa_id'))
          nAfetados = empresa.getInt('numero_funcionarios')
        }
        if (nAfetados > 0) {
          vmin = Math.round(multaRural * nAfetados * 100) / 100
          vmax = Math.round(multaRural * 2 * nAfetados * 100) / 100
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
