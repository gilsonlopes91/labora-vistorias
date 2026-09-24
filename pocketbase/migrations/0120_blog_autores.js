// Migração 0120: Coleção blog_autores e campo autor_id (ou autor_relacao) em artigos
// Requisitos:
// 1. Coleção blog_autores (nome, bio opcional, ativo bool, created, updated)
// 2. Seed idempotente do autor "Gilson Lopes de Souza Junior"
// 3. Atualizar coleção artigos: relacionar com blog_autores (ou criar autor_blog_id)
//    Como autor_id anterior apontava para _pb_users_auth_ (e PB não permite trocar collectionId de campo Relation),
//    adicionamos autor_blog_id relation -> blog_autores.
//    Também backfill em artigos existentes para associar ao autor Gilson Lopes de Souza Junior.
// 4. Regras de acesso para blog_autores:
//    listRule: "" (público pode ver nomes dos autores)
//    viewRule: ""
//    createRule: "@request.auth.id != ''" (usuários autenticados no admin podem cadastrar novos autores)
//    updateRule: "@request.auth.id != ''"
//    deleteRule: "@request.auth.id != ''"

migrate(
  (app) => {
    let colAutores = null
    try {
      colAutores = app.findCollectionByNameOrId('blog_autores')
    } catch (_) {
      colAutores = null
    }

    if (!colAutores) {
      colAutores = new Collection({
        name: 'blog_autores',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'nome', type: 'text', required: true, min: 2, max: 200 },
          { name: 'bio', type: 'text', max: 500 },
          { name: 'ativo', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_blog_autores_nome ON blog_autores (nome)'],
      })
      app.save(colAutores)
    }

    // 2. Garantir o autor padrão "Gilson Lopes de Souza Junior"
    let autorPadrao = null
    try {
      autorPadrao = app.findFirstRecordByData(
        'blog_autores',
        'nome',
        'Gilson Lopes de Souza Junior',
      )
    } catch (_) {
      autorPadrao = new Record(colAutores)
      autorPadrao.set('nome', 'Gilson Lopes de Souza Junior')
      autorPadrao.set('bio', 'Especialista em Segurança e Saúde no Trabalho')
      autorPadrao.set('ativo', true)
      app.save(autorPadrao)
    }

    // 3. Atualizar coleção artigos adicionando o campo autor_blog_id se ainda não existir
    const colArtigos = app.findCollectionByNameOrId('artigos')
    if (!colArtigos.fields.getByName('autor_blog_id')) {
      colArtigos.fields.add(
        new RelationField({
          name: 'autor_blog_id',
          collectionId: colAutores.id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
      app.save(colArtigos)
    }

    // 4. Backfill: associar todos os artigos existentes que não tenham autor_blog_id ao autor padrão
    if (autorPadrao && autorPadrao.id) {
      try {
        const artigos = app.findRecordsByFilter(
          'artigos',
          'autor_blog_id = null || autor_blog_id = ""',
          '',
          500,
          0,
        )
        for (const art of artigos) {
          art.set('autor_blog_id', autorPadrao.id)
          app.save(art)
        }
      } catch (err) {
        console.log('Aviso no backfill de artigos com autor_blog_id:', err)
      }
    }
  },
  (app) => {
    try {
      const colArtigos = app.findCollectionByNameOrId('artigos')
      const campo = colArtigos.fields.getByName('autor_blog_id')
      if (campo) {
        colArtigos.fields.removeByName('autor_blog_id')
        app.save(colArtigos)
      }
    } catch (_) {}

    try {
      const colAutores = app.findCollectionByNameOrId('blog_autores')
      app.delete(colAutores)
    } catch (_) {}
  },
)
