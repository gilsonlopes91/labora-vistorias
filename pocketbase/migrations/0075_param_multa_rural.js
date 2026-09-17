// Parâmetro do cálculo de multa do trabalho rural (NR-31): valor por empregado
// em situação irregular, conforme o art. 18 da Lei nº 5.889/1973 (redação da
// MPV nº 2.164-41/2001), referenciado pelo item 28.3.2 da NR-28. Valor vigente
// fixado pela Portaria MTE nº 1.131/2025 (DOU 04/07/2025): R$ 392,89.
// Configurável em Configurações > parâmetros para acompanhar reajustes anuais.
migrate(
  (app) => {
    try {
      app.findFirstRecordByFilter('parametros_sistema', "chave = 'multa_rural_por_empregado'")
      return // já existe
    } catch (_) {}
    const col = app.findCollectionByNameOrId('parametros_sistema')
    const record = new Record(col)
    record.set('chave', 'multa_rural_por_empregado')
    record.set('valor_numero', 392.89)
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findFirstRecordByFilter(
        'parametros_sistema',
        "chave = 'multa_rural_por_empregado'",
      )
      app.delete(record)
    } catch (_) {}
  },
)
