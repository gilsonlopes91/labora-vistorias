// Vídeos e tutoriais da plataforma: só o administrador da plataforma envia,
// apaga e edita; qualquer usuário logado assiste.
migrate(
  (app) => {
    const soAdmin = "@request.auth.id != '' && @request.auth.papel = 'admin_plataforma'"
    const logado = "@request.auth.id != ''"

    const collection = new Collection({
      name: 'videos',
      type: 'base',
      listRule: logado,
      viewRule: logado,
      createRule: soAdmin,
      updateRule: soAdmin,
      deleteRule: soAdmin,
      fields: [
        { name: 'titulo', type: 'text', required: true, max: 200 },
        { name: 'descricao', type: 'text', max: 2000 },
        {
          name: 'arquivo',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 300 * 1024 * 1024,
          mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
          protected: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_videos_created ON videos (created)'],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('videos'))
  },
)
