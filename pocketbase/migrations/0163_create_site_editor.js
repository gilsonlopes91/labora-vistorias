// Editor do site: páginas com rascunho e versão publicada, imagens enviadas
// pelo editor e histórico de versões publicadas.
//  - site_paginas: uma linha por página editável ('home', 'rodape'), com o
//    rascunho (só admin lê) e o conteúdo publicado. O site público NÃO lê esta
//    coleção: usa a rota /backend/v1/public/site/{chave}, que devolve só o
//    publicado.
//  - site_imagens: arquivos (públicos, como as capas do blog) usados nos blocos.
//  - site_versoes: cópia de cada publicação. Só os hooks escrevem.
migrate(
  (app) => {
    const admin =
      "@request.auth.id != '' && (@request.auth.papel = 'admin_plataforma' || (@request.auth.papel = 'staff_labora' && @request.auth.acesso_console = true))"

    const paginas = new Collection({
      name: 'site_paginas',
      type: 'base',
      listRule: admin,
      viewRule: admin,
      createRule: admin,
      updateRule: admin,
      deleteRule: admin,
      fields: [
        { name: 'chave', type: 'text', required: true, max: 60 },
        { name: 'rascunho', type: 'json', maxSize: 500000 },
        { name: 'publicado', type: 'json', maxSize: 500000 },
        { name: 'publicado_em', type: 'date' },
        { name: 'publicado_por', type: 'text', max: 200 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_site_paginas_chave ON site_paginas (chave)'],
    })
    app.save(paginas)

    const imagens = new Collection({
      name: 'site_imagens',
      type: 'base',
      listRule: admin,
      viewRule: admin,
      createRule: admin,
      updateRule: admin,
      deleteRule: admin,
      fields: [
        {
          name: 'arquivo',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        },
        { name: 'nome', type: 'text', max: 200 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      ],
    })
    app.save(imagens)

    const versoes = new Collection({
      name: 'site_versoes',
      type: 'base',
      listRule: admin,
      viewRule: admin,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'chave', type: 'text', required: true, max: 60 },
        { name: 'conteudo', type: 'json', maxSize: 500000 },
        { name: 'usuario_nome', type: 'text', max: 200 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      ],
      indexes: ['CREATE INDEX idx_site_versoes_chave ON site_versoes (chave, created)'],
    })
    app.save(versoes)
  },
  (app) => {
    for (const nome of ['site_versoes', 'site_imagens', 'site_paginas']) {
      try {
        app.delete(app.findCollectionByNameOrId(nome))
      } catch (_) {
        // já removida
      }
    }
  },
)
