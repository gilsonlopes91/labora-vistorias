// Ajusta a nomenclatura do primeiro post do blog para a da própria NR-28.
//
// O que muda: a escala 1 a 4 é a "infração" (I1 a I4 na grade do Anexo I), e
// não o "grau" — palavra que em SST já significa grau de risco da NR-4, que
// também vai de 1 a 4 e é outra coisa. E "auditor-fiscal" vira "agente da
// inspeção do trabalho", que é o termo usado no item 28.1.3 da NR-28.
//
// Feito por substituição de trechos em vez de reescrever o conteúdo inteiro,
// para não sobrescrever edições que já tenham sido feitas pelo editor de
// artigos.
migrate(
  (app) => {
    let rec
    try {
      rec = app.findFirstRecordByData('artigos', 'slug', 'como-a-multa-da-nr-28-e-calculada')
    } catch (_) {
      return // artigo não existe nesta base
    }

    const TROCAS = [
      [
        'um <strong>grau</strong>, de 1 a 4, conforme a gravidade, e um <strong>tipo</strong>: S para segurança do trabalho, M para medicina do trabalho.',
        'uma <strong>infração</strong>, de 1 a 4, conforme a gravidade, e um <strong>tipo</strong>: S para Segurança do Trabalho, M para Medicina do Trabalho. Na grade do Anexo I essa escala aparece como I1, I2, I3 e I4. Não confunda com o grau de risco da NR-4, que também vai de 1 a 4 e é outra coisa.',
      ],
      ['Faixa, grau e tipo apontam', 'Faixa, infração e tipo apontam'],
      ['Não entra grau, não entra tipo', 'Não entra infração, não entra tipo'],
      [
        'grau 1, segurança, empresa de 1 a 10 empregados',
        'infração I1, tipo Segurança do Trabalho, empresa de 1 a 10 empregados',
      ],
      ['Isso anula porte e grau', 'Isso anula porte e infração'],
      ['é o auditor-fiscal, seguindo', 'é o agente da inspeção do trabalho, seguindo'],
      [
        'Um item grau 4 numa empresa de 500 empregados pesa muito mais que três itens grau 1',
        'Um item de infração I4 numa empresa de 500 empregados pesa muito mais que três itens I1',
      ],
      ['sem grade, não há grau a atribuir', 'sem grade, não há infração a atribuir'],
    ]

    let conteudo = rec.getString('conteudo')
    for (const troca of TROCAS) {
      conteudo = conteudo.split(troca[0]).join(troca[1])
    }
    rec.set('conteudo', conteudo)
    app.save(rec)
  },
  (app) => {
    // Rollback no-op: o texto anterior não é restaurado.
  },
)
