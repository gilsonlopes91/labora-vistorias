// Mesmo cálculo do calc_multa_on_create.js, mas disparado quando uma resposta de
// vistoria já existente é atualizada (ex.: técnico muda a situação de C para N/C
// em campo, ou corrige o item depois). Lógica duplicada de propósito — hooks do
// Skip Cloud não compartilham helpers de nível de arquivo entre callbacks.
//
// NR-31 (trabalho rural): sanção pelo art. 18 da Lei 5.889/1973 — R$ 380,00 por
// empregado em situação irregular (dobrado na reincidência = R$ 760,00), via
// item 28.3.2 da NR-28 (Portaria MTE 104/2026). Usa o campo
// numero_funcionarios_irregulares da resposta.
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
        const vistoria = $app.findRecordById('vistorias', record.get('vistoria_id'))
        const nIrregulares = record.getInt('numero_funcionarios_irregulares')
        if (nIrregulares > 0) {
          vmin = Math.round(380 * nIrregulares * 100) / 100
          vmax = Math.round(760 * nIrregulares * 100) / 100
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
