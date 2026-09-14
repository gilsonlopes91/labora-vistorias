migrate(
  (app) => {
    // A NR-10 seedada anteriormente cobre apenas o corpo da norma (itens 10.2 a 10.14) — os dados
    // do Anexo II da NR-28 disponíveis para a NR-10 não trazem itens específicos de Anexo (só o
    // corpo é referenciado nos códigos de infração). Para manter o padrão "NR limpa + Anexos"
    // usado nas demais normas, apenas renomeamos o registro para deixar explícito que é o corpo.
    try {
      const tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-10' && organizacao_id = ''",
      )
      tipoRec.set(
        'nome',
        'NR-10 — Corpo da Norma (Segurança em Instalações e Serviços em Eletricidade)',
      )
      tipoRec.set(
        'descricao',
        'Checklist do corpo da NR-10, com itens e classificação (grau/tipo) extraídos do Anexo II da ' +
          'NR-28. Cálculo de multa pelo Anexo I da NR-28. Não há itens de Anexo específico da NR-10 no ' +
          'Anexo II da NR-28 disponível — se algum Anexo da NR-10 (ex.: Anexo IV) tiver itens próprios ' +
          'de fiscalização, eles devem ser adicionados como um tipo de vistoria separado.',
      )
      app.save(tipoRec)
    } catch (_) {}
  },
  (app) => {
    try {
      const tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nr_referencia = 'NR-10' && organizacao_id = ''",
      )
      tipoRec.set('nome', 'NR-10 — Segurança em Instalações e Serviços em Eletricidade')
      tipoRec.set(
        'descricao',
        'Checklist oficial da NR-10, com itens e classificação (grau/tipo) extraídos do Anexo II da ' +
          'NR-28. Cálculo de multa pelo Anexo I da NR-28. Alguns itens (marcados na observação) foram ' +
          'descritos a partir de conhecimento geral da norma, sem confirmação linha a linha do texto ' +
          'vigente — revisar com a fonte oficial (gov.br) antes de usar em laudo real.',
      )
      app.save(tipoRec)
    } catch (_) {}
  },
)
