// Escopo padrão por modelo de proposta.
//
// Os itens inclusos e não inclusos se repetem em quase toda proposta, então
// passam a ficar gravados no modelo e a vir preenchidos no orçamento novo.
// Quem quiser muda item a item na proposta, sem alterar o modelo.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('modelos_proposta')

    if (!col.fields.getByName('itens_inclusos_padrao')) {
      col.fields.add(new JSONField({ name: 'itens_inclusos_padrao', maxSize: 50000 }))
    }
    if (!col.fields.getByName('itens_exclusos_padrao')) {
      col.fields.add(new JSONField({ name: 'itens_exclusos_padrao', maxSize: 50000 }))
    }
    app.save(col)

    const INCLUSOS = [
      'Visita técnica para levantamento e avaliação em campo',
      'Elaboração de laudo e relatório técnico conclusivo',
      'Emissão de ART/RRT junto ao respectivo conselho de classe',
      'Envio de via digital em formato PDF',
    ]

    const EXCLUSOS = [
      'Taxas e emolumentos de ART/RRT junto aos conselhos regionais',
      'Implementação de adequações estruturais, físicas ou de maquinários',
      'Realização de exames médicos ocupacionais e laboratoriais',
      'Despesas com deslocamento e hospedagem fora da região metropolitana',
    ]

    try {
      const modelos = app.findRecordsByFilter('modelos_proposta', "id != ''", '', 0, 0)
      for (const modelo of modelos) {
        const inclusos = modelo.get('itens_inclusos_padrao')
        if (!inclusos || !inclusos.length) modelo.set('itens_inclusos_padrao', INCLUSOS)
        const exclusos = modelo.get('itens_exclusos_padrao')
        if (!exclusos || !exclusos.length) modelo.set('itens_exclusos_padrao', EXCLUSOS)
        app.save(modelo)
      }
    } catch (_) {}
  },
  (app) => {
    const col = app.findCollectionByNameOrId('modelos_proposta')
    col.fields.removeByName('itens_inclusos_padrao')
    col.fields.removeByName('itens_exclusos_padrao')
    app.save(col)
  },
)
