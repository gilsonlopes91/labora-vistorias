migrate(
  (app) => {
    const collection = new Collection({
      name: 'parametros_sistema',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'chave', type: 'text', required: true, max: 100 },
        { name: 'valor_numero', type: 'number' },
        { name: 'descricao', type: 'text', max: 500 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_parametros_chave ON parametros_sistema (chave)'],
    })
    app.save(collection)

    try {
      app.findFirstRecordByData('parametros_sistema', 'chave', 'valor_ufir_reais')
    } catch (_) {
      const rec = new Record(collection)
      rec.set('chave', 'valor_ufir_reais')
      rec.set('valor_numero', 1.0641)
      rec.set(
        'descricao',
        'Valor de conversão da UFIR para reais, usado na Tabela de Multas (Anexo I da NR-28). ' +
          'A UFIR foi extinta e congelada em R$ 1,0641 desde janeiro/2000.',
      )
      app.save(rec)
    }
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('parametros_sistema'))
  },
)
