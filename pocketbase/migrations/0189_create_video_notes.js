// Anotações e marcações PRIVADAS de cada usuário sobre um vídeo da plataforma.
// Cada registro pertence a um único usuário: listar, ver, editar e apagar só o dono.
migrate(
  (app) => {
    const videos = app.findCollectionByNameOrId('videos')
    const collection = new Collection({
      name: 'video_notes',
      type: 'base',
      listRule: 'usuario = @request.auth.id',
      viewRule: 'usuario = @request.auth.id',
      createRule: "@request.auth.id != '' && usuario = @request.auth.id",
      updateRule:
        'usuario = @request.auth.id && @request.body.usuario:changed = false && @request.body.video:changed = false',
      deleteRule: 'usuario = @request.auth.id',
      fields: [
        {
          name: 'usuario',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'video',
          type: 'relation',
          required: true,
          collectionId: videos.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'texto', type: 'text', max: 2000 },
        { name: 'segundos', type: 'number', required: false, min: 0 },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['nota', 'marcacao'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_video_notes_usuario_video ON video_notes (usuario, video)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('video_notes')
    app.delete(collection)
  },
)
