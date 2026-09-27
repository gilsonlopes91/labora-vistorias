// Corrige o índice único de link_publico_chave em documentos_sst: como o
// campo só é preenchido na emissão, todo rascunho novo nasce com o valor
// vazio (''), e o índice único original barrava a criação de qualquer
// segundo rascunho/documento com esse erro: "Já existe um cadastro com esse
// valor." Recriamos o índice como parcial, único apenas quando a chave
// pública já foi definida (documento emitido).
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('documentos_sst')
    collection.indexes = collection.indexes.filter(
      (idx) => !idx.includes('idx_documentos_sst_link_publico'),
    )
    collection.indexes.push(
      "CREATE UNIQUE INDEX idx_documentos_sst_link_publico ON documentos_sst (link_publico_chave) WHERE link_publico_chave != ''",
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('documentos_sst')
    collection.indexes = collection.indexes.filter(
      (idx) => !idx.includes('idx_documentos_sst_link_publico'),
    )
    collection.indexes.push(
      'CREATE UNIQUE INDEX idx_documentos_sst_link_publico ON documentos_sst (link_publico_chave)',
    )
    app.save(collection)
  },
)
